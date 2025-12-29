#!/bin/bash
# Test script for PII encryption

echo "=== Testing PII Encryption ==="

# Get token
echo "1. Getting authentication token..."
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

if [ -z "$TOKEN" ]; then
  echo "Failed to get token!"
  exit 1
fi
echo "   Token obtained"

# Create household
echo "2. Creating household..."
HH_RESPONSE=$(curl -s -X POST http://localhost:3001/api/households \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"PII Encryption Test Household"}')
HOUSEHOLD_ID=$(echo "$HH_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "   Household ID: $HOUSEHOLD_ID"

# Create person with PII
echo "3. Creating person with PII..."
PERSON_RESPONSE=$(curl -s -X POST http://localhost:3001/api/persons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"householdId\": \"$HOUSEHOLD_ID\",
    \"firstName\": \"Jane\",
    \"lastName\": \"SecretDoe\",
    \"email\": \"jane.secret@private.com\",
    \"phonePrimary\": \"555-999-8888\",
    \"address\": \"456 Secret Lane, Private City, CA 90210\",
    \"ssn\": \"987-65-4321\"
  }")
PERSON_ID=$(echo "$PERSON_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "   Person ID: $PERSON_ID"

# Check what's stored in database
echo ""
echo "=== Checking Database (should be ENCRYPTED) ==="
docker exec crm_postgres psql -U postgres -d crm_db -c "SELECT first_name, last_name, email, phone_primary, address, ssn FROM persons WHERE last_name='SecretDoe' LIMIT 1;" 2>/dev/null

# Retrieve via API (should be DECRYPTED)
echo ""
echo "=== Retrieving via API (should be DECRYPTED) ==="
curl -s -X GET "http://localhost:3001/api/persons/$PERSON_ID" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null || echo "API response failed"

echo ""
echo "=== Test Complete ==="
