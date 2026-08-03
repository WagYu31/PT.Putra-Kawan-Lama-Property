#!/bin/bash
echo "🚀 Starting Deployment with Process Slot Buffer..."

# 1. Kill old hanging processes to free CPU/thread slots
pkill -9 -u $(whoami) -f "node|pkwl|main" 2>/dev/null || true
sleep 3

# 2. Extract & Prepare Next.js Standalone Frontend files
cd ~/trgmix.online/frontend
rm -rf .next/standalone .next/static
mkdir -p .next
tar xzf deploy/standalone.tar.gz -C .next/
tar xzf deploy/next_static.tar.gz -C .next/

cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
cp -r public .next/standalone/ 2>/dev/null || true
mkdir -p ~/trgmix.online/_next
cp -r .next/static/* ~/trgmix.online/_next/ 2>/dev/null || true

# CRITICAL PAUSE: Wait 4s for OS kernel to reclaim process slots used by tar and cp
echo "Reclaiming OS process slots..."
sleep 4

# 3. Detect Node.js Binary
NODE_BIN="node"
for path in \
    /opt/alt/alt-nodejs18/root/usr/bin/node \
    /opt/cpanel/ea-nodejs18/bin/node \
    /opt/alt/alt-nodejs20/root/usr/bin/node \
    /opt/cpanel/ea-nodejs20/bin/node \
    /usr/local/bin/node \
    /usr/bin/node
do
    if [ -x "$path" ]; then
        NODE_BIN="$path"
        break
    fi
done

echo "Found Node Binary: $NODE_BIN ($($NODE_BIN -v 2>&1))"

# 4. Launch Next.js Standalone Frontend on Port 4000
cd ~/trgmix.online/frontend/.next/standalone
echo "Starting Node Frontend on Port 4000 with Node $NODE_BIN..." > ~/trgmix.online/node_frontend.log
HOSTNAME=0.0.0.0 PORT=4000 NEXT_PUBLIC_API_URL=https://trgmix.online nohup $NODE_BIN --max-old-space-size=256 server.js >> ~/trgmix.online/node_frontend.log 2>&1 &
sleep 4

# 5. Launch Go Backend on Port 9095 (Single-thread mode for cPanel safety)
cd ~/trgmix.online/backend
tar xzf deploy/backend_linux.tar.gz 2>/dev/null || true
chmod +x pkwl-backend-linux

export GOMAXPROCS=1
export GODEBUG=asyncpreempt=0
echo "Starting Go Backend on Port 9095..." > ~/trgmix.online/backend.log
PORT=9095 nohup ./pkwl-backend-linux >> ~/trgmix.online/backend.log 2>&1 &
sleep 2

# 6. Overwrite index.php with self-healing reverse proxy
cat << 'EOF' > ~/trgmix.online/index.php
<?php
$uri = $_SERVER['REQUEST_URI'];
$target = (strpos($uri, '/api/') === 0 || strpos($uri, '/uploads/') === 0) ? 'http://127.0.0.1:9095' . $uri : 'http://127.0.0.1:4000' . $uri;

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
    echo "<h2 style='color:#e11d48;'>🔍 Diagnosa Server (Port 4000 / 9095)</h2>";
    echo "<p>cURL Error: <code>$err</code></p>";
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

echo "=== FRONTEND NODE LOG ==="
cat ~/trgmix.online/node_frontend.log | tail -n 5
echo "=== BACKEND LOG ==="
cat ~/trgmix.online/backend.log | tail -n 5
echo "✅ DEPLOYMENT COMPLETED SUCCESSFULLY!"
