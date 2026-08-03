#!/bin/bash
echo "🚀 Starting Deployment with Full Browser Diagnostics..."

# 1. Kill old processes
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

NODE_BIN="node"
if [ -f "/opt/cpanel/ea-nodejs20/bin/node" ]; then
    NODE_BIN="/opt/cpanel/ea-nodejs20/bin/node"
elif [ -f "/opt/cpanel/ea-nodejs18/bin/node" ]; then
    NODE_BIN="/opt/cpanel/ea-nodejs18/bin/node"
elif [ -f "/usr/local/bin/node" ]; then
    NODE_BIN="/usr/local/bin/node"
fi

echo "Using Node Binary: $NODE_BIN ($($NODE_BIN -v 2>&1))"

cd ~/trgmix.online/frontend/.next/standalone
HOSTNAME=0.0.0.0 PORT=3080 NEXT_PUBLIC_API_URL=https://trgmix.online nohup $NODE_BIN server.js > ~/trgmix.online/node_frontend.log 2>&1 &
sleep 3

# 4. Overwrite index.php with self-healing reverse proxy & full error output
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
    CURLOPT_TIMEOUT => 5,
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
    $err = curl_error($ch);
    $log = @file_get_contents('/home/pitiagic/trgmix.online/node_frontend.log');
    $blog = @file_get_contents('/home/pitiagic/trgmix.online/backend.log');
    echo "<div style='font-family:sans-serif;padding:30px;max-width:800px;margin:auto;'>";
    echo "<h2 style='color:#e11d48;'>🔍 Diagnosa Koneksi Server (Port 3080 / 9095)</h2>";
    echo "<p>Error cURL: <code>$err</code></p>";
    echo "<h3>Frontend Node Log (/home/pitiagic/trgmix.online/node_frontend.log):</h3>";
    echo "<pre style='background:#0f172a;color:#f8fafc;padding:16px;border-radius:8px;overflow-x:auto;'>";
    echo htmlspecialchars(substr($log ?: "File log frontend belum ada / kosong", -1500));
    echo "</pre>";
    echo "<h3>Backend Go Log (/home/pitiagic/trgmix.online/backend.log):</h3>";
    echo "<pre style='background:#0f172a;color:#f8fafc;padding:16px;border-radius:8px;overflow-x:auto;'>";
    echo htmlspecialchars(substr($blog ?: "File log backend belum ada / kosong", -1000));
    echo "</pre>";
    echo "</div>";
    exit;
}

$hsize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
http_response_code(curl_getinfo($ch, CURLINFO_HTTP_CODE));

foreach (explode("\r\n", substr($res, 0, $hsize)) as $h) {
    if (!empty($h) && !preg_match('/^(Transfer-Encoding|Content-Length):/i', $h)) header($h);
}

echo substr($res, $hsize);
EOF

echo "=== BACKEND LOG ==="
cat ~/trgmix.online/backend.log | tail -n 5
echo "=== FRONTEND NODE LOG ==="
cat ~/trgmix.online/node_frontend.log | tail -n 5
echo "✅ DEPLOYMENT COMPLETED SUCCESSFULLY!"
