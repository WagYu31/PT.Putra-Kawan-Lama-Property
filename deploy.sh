#!/bin/bash
echo "🚀 Starting High-Performance Native Apache/Go Deployment..."

# 1. Pull latest code
cd ~/trgmix.online && git pull origin main

# 2. Kill all hanging Node/Go processes to free OS process slots
pkill -9 -u $(whoami) -f "node|pkwl|main" 2>/dev/null || true
sleep 2

# 3. Start Go Backend on Port 9095 (Single-thread mode for cPanel safety)
cd ~/trgmix.online/backend
tar xzf deploy/backend_linux.tar.gz 2>/dev/null || true
chmod +x pkwl-backend-linux

export GOMAXPROCS=1
export GODEBUG=asyncpreempt=0
echo "Starting Go Backend on Port 9095..." > ~/trgmix.online/backend.log
PORT=9095 nohup ./pkwl-backend-linux >> ~/trgmix.online/backend.log 2>&1 &
sleep 2

# 4. Extract Next.js static assets into public directory
cd ~/trgmix.online/frontend
rm -rf .next/standalone .next/static
mkdir -p .next
tar xzf deploy/standalone.tar.gz -C .next/ 2>/dev/null || true
tar xzf deploy/next_static.tar.gz -C .next/ 2>/dev/null || true

# Sync static assets to ~/trgmix.online/_next
mkdir -p ~/trgmix.online/_next
cp -r .next/static/* ~/trgmix.online/_next/ 2>/dev/null || true

# 5. Overwrite index.php with Native PHP Gateway (Zero Node Process Dependency!)
cat << 'EOF' > ~/trgmix.online/index.php
<?php
// PT. Putra Kawan Lama - Production Native Gateway
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// A. Proxy API and Uploads to Go Backend on Port 9095
if (strpos($path, '/api/') === 0 || strpos($path, '/uploads/') === 0) {
    $target = 'http://127.0.0.1:9095' . $uri;
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $target,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 15,
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
    if ($res !== false) {
        $hsize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        http_response_code(curl_getinfo($ch, CURLINFO_HTTP_CODE));
        foreach (explode("\r\n", substr($res, 0, $hsize)) as $h) {
            if (!empty($h) && !preg_match('/^(Transfer-Encoding|Content-Length):/i', $h)) header($h);
        }
        echo substr($res, $hsize);
        exit;
    } else {
        http_response_code(502);
        echo json_encode(["error" => "Backend Go Service Offline"]);
        exit;
    }
}

// B. Serve static files directly (_next, static assets)
$file_path = __DIR__ . $path;
if ($path !== '/' && file_exists($file_path) && !is_dir($file_path)) {
    $ext = pathinfo($file_path, PATHINFO_EXTENSION);
    $mimeTypes = [
        'css' => 'text/css', 'js' => 'application/javascript',
        'json' => 'application/json', 'png' => 'image/png',
        'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'svg' => 'image/svg+xml',
        'woff2' => 'font/woff2', 'woff' => 'font/woff', 'ico' => 'image/x-icon'
    ];
    if (isset($mimeTypes[$ext])) header("Content-Type: " . $mimeTypes[$ext]);
    readfile($file_path);
    exit;
}

// C. Serve pre-rendered Next.js HTML pages
$base_app = __DIR__ . '/frontend/.next/server/app';

$routes = [
    '/' => "$base_app/index.html",
    '/dashboard' => "$base_app/dashboard.html",
    '/about' => "$base_app/about.html",
    '/contact' => "$base_app/contact.html",
    '/properties' => "$base_app/properties.html",
    '/auth/login' => "$base_app/auth/login.html",
    '/auth/register' => "$base_app/auth/register.html",
];

if (isset($routes[$path]) && file_exists($routes[$path])) {
    header("Content-Type: text/html; charset=utf-8");
    readfile($routes[$path]);
    exit;
}

// D. Handle dynamic property detail routes /properties/:id
$clean_path = rtrim($path, '/');
if (preg_match('#^/properties/[^/]+$#', $clean_path)) {
    $detail_html = "$base_app/properties/[id].html";
    if (file_exists($detail_html)) {
        header("Content-Type: text/html; charset=utf-8");
        readfile($detail_html);
        exit;
    }
}

// E. Default fallback to index.html or dashboard.html
if (file_exists("$base_app/index.html")) {
    header("Content-Type: text/html; charset=utf-8");
    readfile("$base_app/index.html");
    exit;
}

echo "<h1>PT. Putra Kawan Lama</h1>";
EOF

echo "=== BACKEND LOG ==="
cat ~/trgmix.online/backend.log | tail -n 6
echo "✅ NATIVE APACHE/GO DEPLOYMENT COMPLETED SUCCESSFULLY!"
