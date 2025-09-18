#!/bin/bash

# 🔍 FRONTEND CRASH DIAGNOSTIC
# The frontend container is restarting - let's find out why

echo "🔍 FRONTEND CONTAINER CRASH DIAGNOSTIC"
echo "======================================"

echo "📋 CURRENT STATUS:"
docker ps | grep ems-frontend

echo ""
echo "📋 RECENT LOGS (Last 50 lines):"
docker logs ems-frontend-prod --tail 50

echo ""
echo "📋 NGINX ERROR LOGS:"
docker exec ems-frontend-prod cat /var/log/nginx/error.log 2>/dev/null || echo "❌ Cannot access nginx error log"

echo ""
echo "📋 NGINX CONFIG TEST:"
docker exec ems-frontend-prod nginx -t 2>/dev/null || echo "❌ Nginx config test failed"

echo ""
echo "📋 CHECK FILES IN CONTAINER:"
docker exec ems-frontend-prod ls -la /usr/share/nginx/html/ 2>/dev/null || echo "❌ Cannot list files"

echo ""
echo "📋 CHECK NGINX PROCESS:"
docker exec ems-frontend-prod ps aux 2>/dev/null || echo "❌ Cannot check processes"

echo ""
echo "🎯 POSSIBLE FIXES:"
echo "1. If nginx config error: Fix nginx.conf"
echo "2. If missing files: Rebuild frontend image"
echo "3. If permission issue: Fix file permissions"
echo "4. If port conflict: Check port mapping"
echo ""
echo "======================================"