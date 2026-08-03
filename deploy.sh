#!/bin/bash
echo "🚀 Starting Deployment inside Standalone Directory..."

# 1. Pull latest code
cd ~/trgmix.online && git pull origin main

# 2. Kill old hanging processes to free CPU/thread slots
pkill -9 -f "node" 2>/dev/null || true
pkill -9 -f "pkwl" 2>/dev/null || true
pkill -9 -f "main" 2>/dev/null || true
kill -9 $(lsof -t -i:9095) 2>/dev/null || true
kill -9 $(lsof -t -i:3080) 2>/dev/null || true
sleep 1

# 3. Detect Node.js binary (v18/v20)
NODE_BIN="node"
if [ -f "/opt/cpanel/ea-nodejs20/bin/node" ]; then
    NODE_BIN="/opt/cpanel/ea-nodejs20/bin/node"
elif [ -f "/opt/cpanel/ea-nodejs18/bin/node" ]; then
    NODE_BIN="/opt/cpanel/ea-nodejs18/bin/node"
elif [ -f "/usr/local/bin/node" ]; then
    NODE_BIN="/usr/local/bin/node"
fi

echo "Using Node Binary: $NODE_BIN ($($NODE_BIN -v 2>&1))"

# 4. Start Go Backend on Port 9095 (GOMAXPROCS=1 for cPanel thread safety)
cd ~/trgmix.online/backend
tar xzf deploy/backend_linux.tar.gz 2>/dev/null || true
chmod +x pkwl-backend-linux

export GOMAXPROCS=1
export GODEBUG=asyncpreempt=0
PORT=9095 nohup ./pkwl-backend-linux > ~/trgmix.online/backend.log 2>&1 &
sleep 2

# 5. Extract & Prepare Next.js Standalone Frontend
cd ~/trgmix.online/frontend
rm -rf .next/standalone .next/static
mkdir -p .next
tar xzf deploy/standalone.tar.gz -C .next/
tar xzf deploy/next_static.tar.gz -C .next/

# Copy static assets & public into standalone directory
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
cp -r public .next/standalone/ 2>/dev/null || true
mkdir -p ~/trgmix.online/_next
cp -r .next/static/* ~/trgmix.online/_next/ 2>/dev/null || true

# CRITICAL FIX: Run server.js FROM INSIDE .next/standalone directory
cd ~/trgmix.online/frontend/.next/standalone
HOSTNAME=0.0.0.0 PORT=3080 NEXT_PUBLIC_API_URL=https://trgmix.online nohup $NODE_BIN server.js > ~/trgmix.online/node_frontend.log 2>&1 &
sleep 3

# 6. Overwrite index.php with reverse proxy
cat << 'EOF' > ~/trgmix.online/index.php
<?php
// PT. Putra Kawan Lama - Self-Healing Reverse Proxy
$uri = $_SERVER['REQUEST_URI'];
if (strpos($uri, '/api/') === 0 || strpos($uri, '/uploads/') === 0) {
    $target = 'http://127.0.0.1:9095' . $uri;
} else {
    $target = 'http://127.0.0.1:3080' . $uri;
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $target);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

$headers = [];
foreach (getallheaders() as $key => $value) {
    if (strtolower($key) !== 'host') {
        $headers[] = "$key: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

$response = curl_exec($ch);
if ($response === false) {
    $err = curl_error($ch);
    $log = @file_get_contents('/home/pitiagic/trgmix.online/node_frontend.log');
    echo "<div style='font-family:sans-serif;padding:30px;max-width:800px;margin:auto;'>";
    echo "<h2 style='color:#e11d48;'>⚠️ Server Starting...</h2>";
    echo "<p>cURL Error: <code>$err</code></p>";
    echo "<h3>Diagnostic Log:</h3>";
    echo "<pre style='background:#0f172a;color:#f8fafc;padding:16px;border-radius:8px;overflow-x:auto;'>";
    echo htmlspecialchars(substr($log ?: "Initializing...", -1000));
    echo "</pre></div>";
    exit;
}

$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$header_text = substr($response, 0, $header_size);
$body = substr($response, $header_size);

http_response_code(curl_getinfo($ch, CURLINFO_HTTP_CODE));

foreach (explode("\r\n", $header_text) as $header) {
    if (!empty($header) && !preg_match('/^(Transfer-Encoding|Content-Length):/i', $header)) {
        header($header);
    }
}

echo $body;
EOF

echo "=== BACKEND LOG ==="
cat ~/trgmix.online/backend.log | tail -n 6
echo "=== FRONTEND NODE LOG ==="
cat ~/trgmix.online/node_frontend.log | tail -n 10
echo "✅ DEPLOYMENT COMPLETED SUCCESSFULLY!"
