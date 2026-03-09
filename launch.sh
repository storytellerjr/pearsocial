#!/bin/bash

echo "🍐 PearSocial Launcher"
echo "======================="

# Check if pear is installed
if ! command -v pear &> /dev/null; then
    echo "❌ Pear not found. Please install: npm install -g pear"
    exit 1
fi

# Check if gateway is running
if curl -s http://localhost:7777/health > /dev/null 2>&1; then
    echo "✅ Gateway is running"
else
    echo "⚠️  Gateway not detected. Starting gateway in background..."
    nohup npm run gateway > gateway.log 2>&1 &
    echo "🌐 Gateway starting... (check gateway.log for details)"
    sleep 2
fi

echo "🚀 Launching PearSocial desktop app..."
pear run --dev .