#!/bin/bash
echo "🚀 Starting Automated Deployment..."

# 1. Pull latest git code
cd ~/trgmix.online && git pull origin main

# 2. Restart Go Backend
cd ~/trgmix.online/backend
kill -9 $(lsof -t -i:9090) 2>/dev/null || true
kill -9 $(lsof -t -i:9095) 2>/dev/null || true
pkill -9 -f pkwl-backend 2>/dev/null || true
pkill -9 -f pkwl-backend-linux 2>/dev/null || true
sleep 1

tar xzf deploy/backend_linux.tar.gz 2>/dev/null || true
chmod +x pkwl-backend-linux
PORT=9095 nohup ./pkwl-backend-linux > ~/trgmix.online/backend.log 2>&1 &
sleep 2

# 3. Restart Next.js Frontend
cd ~/trgmix.online/frontend
rm -rf .next/standalone .next/static
mkdir -p .next
tar xzf deploy/standalone.tar.gz -C .next/
tar xzf deploy/next_static.tar.gz -C .next/

cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
mkdir -p ~/trgmix.online/_next
cp -r .next/static/* ~/trgmix.online/_next/ 2>/dev/null || true

kill -9 $(ps aux | grep node | grep -v grep | awk '{print $2}') 2>/dev/null || true
sleep 2

HOSTNAME=0.0.0.0 PORT=3080 NEXT_PUBLIC_API_URL=https://trgmix.online nohup node .next/standalone/server.js > ~/trgmix.online/node_frontend.log 2>&1 &
sleep 2

# 4. Update index.php proxies
sed -i 's/9090/9095/g' ~/trgmix.online/index.php 2>/dev/null || true
sed -i 's/3075/3080/g' ~/trgmix.online/index.php 2>/dev/null || true
sed -i 's/3070/3080/g' ~/trgmix.online/index.php 2>/dev/null || true
sed -i 's/3065/3080/g' ~/trgmix.online/index.php 2>/dev/null || true

echo "=== BACKEND LOG ==="
cat ~/trgmix.online/backend.log | tail -n 6
echo "=== FRONTEND LOG ==="
cat ~/trgmix.online/node_frontend.log | tail -n 6
echo "✅ DEPLOYMENT COMPLETED SUCCESSFULLY!"
