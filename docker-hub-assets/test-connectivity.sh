#!/bin/bash

echo "🌐 Testing Docker Hub Connectivity"
echo "================================="

# Test basic connectivity
echo "Testing internet connectivity..."
if ping -c 3 google.com > /dev/null 2>&1; then
    echo "✅ Internet connectivity: OK"
else
    echo "❌ Internet connectivity: FAILED"
    exit 1
fi

# Test Docker registry
echo "Testing Docker registry..."
if ping -c 3 registry-1.docker.io > /dev/null 2>&1; then
    echo "✅ Docker registry connectivity: OK"
else
    echo "❌ Docker registry connectivity: FAILED"
    echo "💡 Try:"
    echo "   - Restart Docker Desktop"
    echo "   - Check VPN/Proxy settings"
    echo "   - Flush DNS cache: sudo dscacheutil -flushcache"
    exit 1
fi

# Test Docker daemon
echo "Testing Docker daemon..."
if docker info > /dev/null 2>&1; then
    echo "✅ Docker daemon: OK"
else
    echo "❌ Docker daemon: FAILED"
    echo "💡 Start Docker Desktop and try again"
    exit 1
fi

# Test Docker pull
echo "Testing Docker Hub access..."
if docker pull alpine:latest > /dev/null 2>&1; then
    echo "✅ Docker Hub access: OK"
    docker rmi alpine:latest > /dev/null 2>&1
else
    echo "❌ Docker Hub access: FAILED"
    echo "💡 Check Docker Hub status or network settings"
    exit 1
fi

echo ""
echo "🎉 All connectivity tests passed!"
echo "You can now proceed with building and pushing images."
