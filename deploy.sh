#!/bin/bash
echo "🚀 Starting Ultra-Clean Production Deploy..."

# 1. Kill old hanging processes to free CPU/thread slots
pkill -9 -u $(whoami) -f "node|pkwl|main" 2>/dev/null || true
sleep 3

# 2. Start Go Backend on Port 9095 (Single-thread mode for cPanel safety)
cd ~/trgmix.online/backend
tar xzf deploy/backend_linux.tar.gz 2>/dev/null || true
chmod +x pkwl-backend-linux

export GOMAXPROCS=1
export GODEBUG=asyncpreempt=0
PORT=9095 nohup ./pkwl-backend-linux > ~/trgmix.online/backend.log 2>&1 &
sleep 2

# 3. Extract & Launch Next.js Standalone Frontend on Port 3080
cd ~/trgmix.online/frontend
rm -rf .next/standalone .next/static
mkdir -p .next
tar xzf deploy/standalone.tar.gz -C .next/
tar xzf deploy/next_static.tar.gz -C .next/

cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
cp -r public .next/standalone/ 2>/dev/null || true
mkdir -p ~/trgmix.online/_next
cp -r .next/static/* ~/trgmix.online/_next/ 2>/dev/null || true

NODE_BIN=$(which node 2>/dev/null || echo "node")
[ -f "/opt/cpanel/ea-nodejs20/bin/node" ] && NODE_BIN="/opt/cpanel/ea-nodejs20/bin/node"
[ -f "/opt/cpanel/ea-nodejs18/bin/node" ] && NODE_BIN="/opt/cpanel/ea-nodejs18/bin/node"

echo "Using Node Binary: $NODE_BIN ($($NODE_BIN -v 2>&1))"

cd ~/trgmix.online/frontend/.next/standalone
HOSTNAME=0.0.0.0 PORT=3080 NEXT_PUBLIC_API_URL=https://trgmix.online nohup $NODE_BIN server.js > ~/trgmix.online/node_frontend.log 2>&1 &
sleep 4

# 4. Overwrite index.php with ultra-fast reverse proxy
cat << 'EOF' > ~/trgmix.online/index.php
<?php
$uri = $_SERVER['REQUEST_URI'];
$target = (strpos($uri, '/api/') === 0 || strpos($uri, '/uploads/') === 0) ? 'http://127.0.0.1:9095' . $uri : 'http://127.0.0.1:3080' . $uri;

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $target,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_CUSTOMREQUEST => $_SERVER['REQUEST_METHOD']
]);

$headers = [];
foreach (getallheaders() as $k => $v) {
    if (strtolower($k) !== 'host') $headers[] = "$k: $v";
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

$res = curl_exec($ch);
if ($res === false) {
    echo "<div style='font-family:sans-serif;padding:30px;text-align:center;'>";
    echo "<h2>⏳ Server Sedang Inisialisasi...</h2>";
    echo "<p>Silakan tunggu 3 detik lalu refresh halaman.</p><div>";
    exit;
}

$hsize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
http_response_code(curl_getinfo($ch, CURLINFO_HTTP_CODE));

foreach (explode("\r\n", substr($res, 0, $hsize)) as $h) {
    if (!empty($h) && !preg_match('/^(Transfer-Encoding|Content-Length):/i', $h)) {
        header($h);
    }
}

echo substr($res, $hsize);
EOF

echo "=== BACKEND LOG ==="
cat ~/trgmix.online/backend.log | tail -n 5
echo "=== FRONTEND NODE LOG ==="
cat ~/trgmix.online/node_frontend.log | tail -n 5
echo "✅ DEPLOYMENT COMPLETED SUCCESSFULLY!"
