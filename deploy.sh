#!/bin/bash
echo "🚀 Starting Deployment with Self-Healing Go Backend Gateway..."

# 1. Pull latest code
cd ~/trgmix.online && git pull origin main

# 2. Kill any old background processes
pkill -9 -u $(whoami) -f "node|go|pkwl|main" 2>/dev/null || true
sleep 2

# 3. Ensure .env exists and MIDTRANS_IS_PRODUCTION is set to true
if [ -f ~/trgmix.online/.env ]; then
    sed -i 's/MIDTRANS_IS_PRODUCTION=false/MIDTRANS_IS_PRODUCTION=true/g' ~/trgmix.online/.env 2>/dev/null || true
    cp ~/trgmix.online/.env ~/trgmix.online/backend/.env 2>/dev/null || true
fi

# 4. Extract Static HTML/CSS/JS export directly into ~/trgmix.online/
cd ~/trgmix.online
tar xzf frontend/deploy/out.tar.gz 2>/dev/null || true

# 5. Start Go Backend on Port 9095 (Single-thread mode for cPanel safety)
cd ~/trgmix.online/backend
tar xzf deploy/backend_linux.tar.gz 2>/dev/null || true
chmod +x pkwl-backend-linux

export GOMAXPROCS=1
export GODEBUG=asyncpreempt=0

echo "Starting Go Backend on Port 9095..." > ~/trgmix.online/backend.log
PORT=9095 nohup ./pkwl-backend-linux >> ~/trgmix.online/backend.log 2>&1 &
sleep 2

# 6. Overwrite index.php with Self-Healing Proxy Gateway
cat << 'EOF' > ~/trgmix.online/index.php
<?php
// PT. Putra Kawan Lama - High Performance Gateway
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

function proxy_backend($target, $headers) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $target,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CUSTOMREQUEST => $_SERVER['REQUEST_METHOD']
    ]);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
    }
    $res = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);
    return [$res, $err];
}

$headers = [];
foreach (getallheaders() as $k => $v) {
    if (strtolower($k) !== 'host') $headers[] = "$k: $v";
}

// A. Proxy API and Uploads to Go Backend on Port 9095 (With Auto-Revive)
if (strpos($path, '/api/') === 0 || strpos($path, '/uploads/') === 0) {
    $target = 'http://127.0.0.1:9095' . $uri;
    list($res, $err) = proxy_backend($target, $headers);
    if ($res === false) {
        @shell_exec('cd /home/pitiagic/trgmix.online/backend && export GOMAXPROCS=1 && PORT=9095 nohup ./pkwl-backend-linux >> /home/pitiagic/trgmix.online/backend.log 2>&1 &');
        sleep(2);
        list($res, $err) = proxy_backend($target, $headers);
    }
    if ($res !== false) {
        $parts = explode("\r\n\r\n", $res, 2);
        $hlines = explode("\r\n", $parts[0]);
        foreach ($hlines as $h) {
            if (!empty($h) && !preg_match('/^(Transfer-Encoding|Content-Length):/i', $h)) header($h);
        }
        echo isset($parts[1]) ? $parts[1] : '';
        exit;
    } else {
        http_response_code(502);
        echo json_encode(["error" => "Backend Go Service Offline"]);
        exit;
    }
}

// B. Serve static files directly if file exists
$file_path = __DIR__ . $path;
if ($path !== '/' && file_exists($file_path) && !is_dir($file_path)) {
    $ext = pathinfo($file_path, PATHINFO_EXTENSION);
    $mimeTypes = [
        'css' => 'text/css', 'js' => 'application/javascript',
        'json' => 'application/json', 'png' => 'image/png',
        'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'svg' => 'image/svg+xml',
        'woff2' => 'font/woff2', 'woff' => 'font/woff', 'ico' => 'image/x-icon',
        'html' => 'text/html; charset=utf-8'
    ];
    if (isset($mimeTypes[$ext])) header("Content-Type: " . $mimeTypes[$ext]);
    readfile($file_path);
    exit;
}

// C. Match HTML routes (.html extension)
$clean_path = rtrim($path, '/');
if ($clean_path === '') $clean_path = '/index';

$html_file = __DIR__ . $clean_path . '.html';
if (file_exists($html_file)) {
    header("Content-Type: text/html; charset=utf-8");
    readfile($html_file);
    exit;
}

// D. Handle dynamic property detail route /properties/:id -> /properties/[id].html
if (preg_match('#^/properties/[^/]+$#', $clean_path)) {
    $detail_html = __DIR__ . '/properties/[id].html';
    if (file_exists($detail_html)) {
        header("Content-Type: text/html; charset=utf-8");
        readfile($detail_html);
        exit;
    }
}

// E. Fallback to index.html
if (file_exists(__DIR__ . '/index.html')) {
    header("Content-Type: text/html; charset=utf-8");
    readfile(__DIR__ . '/index.html');
    exit;
}
EOF

echo "=== BACKEND LOG ==="
cat ~/trgmix.online/backend.log | tail -n 5
echo "✅ STATIC EXPORT & GO BACKEND DEPLOYMENT COMPLETED SUCCESSFULLY!"
