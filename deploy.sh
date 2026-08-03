#!/bin/bash
echo "🚀 Starting Full Automatic Deployment..."

# 1. Pull latest code
cd ~/trgmix.online && git pull origin main

# 2. Kill old hanging processes to free CPU/memory
pkill -9 -f "node" 2>/dev/null || true
pkill -9 -f "pkwl" 2>/dev/null || true
kill -9 $(lsof -t -i:9095) 2>/dev/null || true
kill -9 $(lsof -t -i:3080) 2>/dev/null || true
sleep 1

# 3. Start Go Backend on Port 9095
cd ~/trgmix.online/backend
tar xzf deploy/backend_linux.tar.gz 2>/dev/null || true
chmod +x pkwl-backend-linux
PORT=9095 nohup ./pkwl-backend-linux > ~/trgmix.online/backend.log 2>&1 &
sleep 2

# 4. Deploy Next.js Standalone Frontend on Port 3080
cd ~/trgmix.online/frontend
rm -rf .next/standalone .next/static
mkdir -p .next
tar xzf deploy/standalone.tar.gz -C .next/
tar xzf deploy/next_static.tar.gz -C .next/

cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
mkdir -p ~/trgmix.online/_next
cp -r .next/static/* ~/trgmix.online/_next/ 2>/dev/null || true

HOSTNAME=0.0.0.0 PORT=3080 NEXT_PUBLIC_API_URL=https://trgmix.online nohup node .next/standalone/server.js > ~/trgmix.online/node_frontend.log 2>&1 &
sleep 3

# 5. Overwrite index.php with robust, fail-safe reverse proxy
cat << 'EOF' > ~/trgmix.online/index.php
<?php
// PT. Putra Kawan Lama - Production Reverse Proxy
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
    http_response_code(502);
    echo "<h1>⏳ Server Sedang Inisialisasi...</h1><p>Silakan tunggu 3 detik lalu refresh halaman.</p>";
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
cat ~/trgmix.online/node_frontend.log | tail -n 6
echo "✅ DEPLOYMENT COMPLETED SUCCESSFULLY!"
