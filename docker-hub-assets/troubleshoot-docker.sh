#!/bin/bash

echo "🔍 Docker Troubleshooting Diagnostics"
echo "===================================="

echo "Docker Version:"
docker --version
echo ""

echo "Docker Info:"
docker info
echo ""

echo "Docker Images:"
docker images
echo ""

echo "Network Connectivity:"
echo "Google: $(curl -s -o /dev/null -w "%{http_code}" https://google.com)"
echo "Docker Hub: $(curl -s -o /dev/null -w "%{http_code}" https://hub.docker.com)"
echo ""

echo "DNS Resolution:"
nslookup registry-1.docker.io
echo ""

echo "Docker Daemon Logs:"
echo "Check: ~/Library/Containers/com.docker.docker/Data/log/"
echo ""

echo "Potential Solutions:"
echo "1. Restart Docker Desktop"
echo "2. Clear DNS cache: sudo dscacheutil -flushcache"
echo "3. Check VPN/Proxy settings"
echo "4. Try different DNS servers (8.8.8.8, 1.1.1.1)"
echo "5. Check Docker Desktop preferences → Proxies"
