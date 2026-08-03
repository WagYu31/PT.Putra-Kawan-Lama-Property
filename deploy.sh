#!/bin/bash
echo "🚀 Starting Deployment with Self-Healing Proxy Gateway..."

# 1. Pull latest code
cd ~/trgmix.online && git pull origin main

# 2. Kill old hanging processes to free process slots
pkill -9 -u $(whoami) -f "node|pkwl|main" 2>/dev/null || true
sleep 2

# 3. Detect Node Binary
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

# 4. Extract Standalone Frontend
cd ~/trgmix.online/frontend
rm -rf .next/standalone .next/static
tar xzf deploy/standalone.tar.gz 2>/dev/null || true
tar xzf deploy/next_static.tar.gz -C .next/ 2>/dev/null || true

cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
cp -r public .next/standalone/ 2>/dev/null || true
mkdir -p ~/trgmix.online/_next
cp -r .next/static/* ~/trgmix.online/_next/ 2>/dev/null || true

# 5. Start Go Backend on Port 9095 (Single-thread mode for cPanel safety)
cd ~/trgmix.online/backend
tar xzf deploy/backend_linux.tar.gz 2>/dev/null || true
chmod +x pkwl-backend-linux

export GOMAXPROCS=1
export GODEBUG=asyncpreempt=0
echo "Starting Go Backend on Port 9095..." > ~/trgmix.online/backend.log
PORT=9095 nohup ./pkwl-backend-linux >> ~/trgmix.online/backend.log 2>&1 &
sleep 2

# 6. Start Node Frontend on Port 3080
cd ~/trgmix.online/frontend/.next/standalone
echo "Starting Node Frontend on Port 3080 with $NODE_BIN..." > ~/trgmix.online/node_frontend.log
HOSTNAME=0.0.0.0 PORT=3080 NEXT_PUBLIC_API_URL=https://trgmix.online nohup $NODE_BIN --max-old-space-size=256 server.js >> ~/trgmix.online/node_frontend.log 2>&1 &
sleep 3

# 7. Overwrite index.php with Self-Healing Reverse Proxy
cat << EOF > ~/trgmix.online/index.php
<?php
// PT. Putra Kawan Lama - Self-Healing Reverse Proxy Gateway
\$uri = \$_SERVER['REQUEST_URI'];
\$path = parse_url(\$uri, PHP_URL_PATH);

// A. Proxy API and Uploads to Go Backend on Port 9095
if (strpos(\$path, '/api/') === 0 || strpos(\$path, '/uploads/') === 0) {
    \$target = 'http://127.0.0.1:9095' . \$uri;
    \$ch = curl_init();
    curl_setopt_array(\$ch, [
        CURLOPT_URL => \$target,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CUSTOMREQUEST => \$_SERVER['REQUEST_METHOD']
    ]);
    \$headers = [];
    foreach (getallheaders() as \$k => \$v) {
        if (strtolower(\$k) !== 'host') \$headers[] = "\$k: \$v";
    }
    curl_setopt(\$ch, CURLOPT_HTTPHEADER, \$headers);
    if (in_array(\$_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
        curl_setopt(\$ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
    }
    \$res = curl_exec(\$ch);
    if (\$res !== false) {
        \$hsize = curl_getinfo(\$ch, CURLINFO_HEADER_SIZE);
        http_response_code(curl_getinfo(\$ch, CURLINFO_HTTP_CODE));
        foreach (explode("\r\n", substr(\$res, 0, \$hsize)) as \$h) {
            if (!empty(\$h) && !preg_match('/^(Transfer-Encoding|Content-Length):/i', \$h)) header(\$h);
        }
        echo substr(\$res, \$hsize);
        exit;
    }
}

// B. Proxy Frontend requests to Next.js on Port 3080 with Self-Healing Auto-Restart
function proxy_frontend(\$target, \$headers) {
    \$ch = curl_init();
    curl_setopt_array(\$ch, [
        CURLOPT_URL => \$target,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_CUSTOMREQUEST => \$_SERVER['REQUEST_METHOD']
    ]);
    curl_setopt(\$ch, CURLOPT_HTTPHEADER, \$headers);
    if (in_array(\$_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
        curl_setopt(\$ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
    }
    \$res = curl_exec(\$ch);
    \$err = curl_error(\$ch);
    curl_close(\$ch);
    return [\$res, \$err];
}

\$headers = [];
foreach (getallheaders() as \$k => \$v) {
    if (strtolower(\$k) !== 'host') \$headers[] = "\$k: \$v";
}

\$target = 'http://127.0.0.1:3080' . \$uri;
list(\$res, \$err) = proxy_frontend(\$target, \$headers);

// Self-Healing: If port 3080 is offline, attempt auto-restart
if (\$res === false) {
    @shell_exec('cd /home/pitiagic/trgmix.online/frontend/.next/standalone && HOSTNAME=0.0.0.0 PORT=3080 NEXT_PUBLIC_API_URL=https://trgmix.online nohup ' . '$NODE_BIN' . ' --max-old-space-size=256 server.js >> /home/pitiagic/trgmix.online/node_frontend.log 2>&1 &');
    sleep(2);
    list(\$res, \$err) = proxy_frontend(\$target, \$headers);
}

if (\$res !== false) {
    \$parts = explode("\r\n\r\n", \$res, 2);
    \$hlines = explode("\r\n", \$parts[0]);
    foreach (\$hlines as \$h) {
        if (!empty(\$h) && !preg_match('/^(Transfer-Encoding|Content-Length):/i', \$h)) header(\$h);
    }
    echo isset(\$parts[1]) ? \$parts[1] : '';
    exit;
}

echo "⏳ Server sedang inisialisasi... Silakan refresh halaman (Cmd+Shift+R).";
EOF

echo "=== BACKEND LOG ==="
cat ~/trgmix.online/backend.log | tail -n 5
echo "=== FRONTEND LOG ==="
cat ~/trgmix.online/node_frontend.log | tail -n 5
echo "✅ DEPLOYMENT COMPLETED SUCCESSFULLY!"
