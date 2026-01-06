#!/bin/bash
# Smoke Tests for CRM - Magic Pass v2 - Run: bash smoke-tests.sh
BASE_URL="${BASE_URL:-http://localhost:3001}"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
PASS=0; FAIL=0
pass() { echo -e "${GREEN}✓${NC} $1"; ((PASS++)); }
fail() { echo -e "${RED}✗${NC} $1"; ((FAIL++)); }

echo -e "${YELLOW}━━━ Health ━━━${NC}"
H=$(curl -s "$BASE_URL/api/health" 2>/dev/null)
if echo "$H" | grep -q '"status":"ok"'; then pass "Backend health"; else fail "Backend: $H"; fi

echo -e "\n${YELLOW}━━━ Auth ━━━${NC}"
L=$(curl -s -X POST "$BASE_URL/api/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"Admin123!"}')
TOKEN=$(echo "$L" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ ${#TOKEN} -gt 50 ]; then pass "Login OK"; else fail "Login: $L"; exit 1; fi

ME=$(curl -s "$BASE_URL/api/auth/me" -H "Authorization: Bearer $TOKEN")
if echo "$ME" | grep -q 'admin@example.com'; then pass "/me OK"; else fail "/me: $ME"; fi

echo -e "\n${YELLOW}━━━ Households ━━━${NC}"
HH=$(curl -s "$BASE_URL/api/households" -H "Authorization: Bearer $TOKEN")
if echo "$HH" | grep -q '^\['; then pass "GET households"; else fail "households: $HH"; fi

CREATE=$(curl -s -X POST "$BASE_URL/api/households" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"SmokeTest","status":"prospect"}')
ID=$(echo "$CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$ID" ]; then pass "CREATE household"; else fail "CREATE: $CREATE"; fi
[ -n "$ID" ] && curl -s -X DELETE "$BASE_URL/api/households/$ID" -H "Authorization: Bearer $TOKEN" >/dev/null && pass "DELETE household"

echo -e "\n${YELLOW}━━━ Tasks ━━━${NC}"
T=$(curl -s "$BASE_URL/api/api/tasks" -H "Authorization: Bearer $TOKEN")
if echo "$T" | grep -q '^\['; then pass "GET tasks"; else fail "tasks: $T"; fi

CT=$(curl -s -X POST "$BASE_URL/api/api/tasks" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"title":"SmokeTask","priority":"medium","category":"other"}')
TID=$(echo "$CT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$TID" ]; then pass "CREATE task"; else fail "CREATE task: $CT"; fi
[ -n "$TID" ] && curl -s -X DELETE "$BASE_URL/api/api/tasks/$TID" -H "Authorization: Bearer $TOKEN" >/dev/null && pass "DELETE task"

echo -e "\n${YELLOW}━━━ Pipeline ━━━${NC}"
P=$(curl -s "$BASE_URL/api/api/pipeline/prospects" -H "Authorization: Bearer $TOKEN")
if echo "$P" | grep -q '^\['; then pass "GET prospects"; else fail "prospects: $P"; fi

PS=$(curl -s "$BASE_URL/api/api/pipeline/stats" -H "Authorization: Bearer $TOKEN")
if echo "$PS" | grep -q '"byStage"'; then pass "GET pipeline stats"; else fail "stats: $PS"; fi

echo -e "\n${YELLOW}━━━ Analytics ━━━${NC}"
D=$(curl -s "$BASE_URL/api/analytics/dashboard?startDate=2024-01-01&endDate=2024-12-31" -H "Authorization: Bearer $TOKEN")
if echo "$D" | grep -q '"overview"'; then pass "GET dashboard"; else fail "dashboard: $D"; fi

echo -e "\n${YELLOW}━━━ Summary ━━━${NC}"
echo -e "Pass: ${GREEN}$PASS${NC} | Fail: ${RED}$FAIL${NC}"
[ $FAIL -eq 0 ] && exit 0 || exit 1
