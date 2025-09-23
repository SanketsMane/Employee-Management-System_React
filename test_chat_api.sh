#!/bin/bash

echo "Testing Chat System API Endpoints"
echo "================================="

# Login as admin
echo "1. Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@formonex.com",
    "password": "admin123456"
  }')

echo "Login response: $LOGIN_RESPONSE"

# Extract token from response
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | grep -o '[^"]*"$' | sed 's/"$//')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  exit 1
fi

echo "✅ Got authentication token: ${TOKEN:0:20}..."

# Test getAvailableUsers endpoint
echo ""
echo "2. Testing getAvailableUsers endpoint..."
USERS_RESPONSE=$(curl -s -X GET http://localhost:8000/api/messages/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Users response: $USERS_RESPONSE"

# Parse and count users
USER_COUNT=$(echo $USERS_RESPONSE | grep -o '"users":\[' | wc -l)
echo ""
echo "✅ API endpoint test completed"
echo "Users available: $USER_COUNT users returned"