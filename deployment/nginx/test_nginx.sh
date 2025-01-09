#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counter
TESTS_TOTAL=0
TESTS_PASSED=0

# Base URL
BASE_URL="https://dojopool.com.au"

# Function to print test results
print_result() {
    local test_name=$1
    local result=$2
    local message=$3
    ((TESTS_TOTAL++))
    
    if [ $result -eq 0 ]; then
        echo -e "${GREEN}✓ $test_name${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ $test_name${NC}"
        echo -e "${RED}  Error: $message${NC}"
    fi
}

# Function to test HTTP response
test_endpoint() {
    local endpoint=$1
    local expected_code=$2
    local test_name=$3
    local method=${4:-GET}
    local data=${5:-""}
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    if [ "$response" = "$expected_code" ]; then
        print_result "$test_name" 0
    else
        print_result "$test_name" 1 "Expected $expected_code, got $response"
    fi
}

# Function to test security headers
test_security_headers() {
    local endpoint=$1
    local test_name="Security Headers Check for $endpoint"
    local headers=$(curl -s -I "$BASE_URL$endpoint")
    local result=0
    local error_msg=""
    
    # Required security headers
    declare -A required_headers=(
        ["Strict-Transport-Security"]="max-age=31536000; includeSubDomains; preload"
        ["X-Frame-Options"]="SAMEORIGIN"
        ["X-XSS-Protection"]="1; mode=block"
        ["X-Content-Type-Options"]="nosniff"
        ["Referrer-Policy"]="strict-origin-when-cross-origin"
    )
    
    for header in "${!required_headers[@]}"; do
        if ! echo "$headers" | grep -q "^$header: ${required_headers[$header]}"; then
            result=1
            error_msg="$error_msg\n  Missing or incorrect $header"
        fi
    done
    
    print_result "$test_name" $result "$error_msg"
}

# Function to test WebSocket connection
test_websocket() {
    local test_name="WebSocket Connection Test"
    local ws_url="wss://dojopool.com.au/ws/"
    
    # Using wscat if available, otherwise just check headers
    if command -v wscat &> /dev/null; then
        if echo "test" | wscat -c "$ws_url" --execute "echo test" &> /dev/null; then
            print_result "$test_name" 0
        else
            print_result "$test_name" 1 "Failed to establish WebSocket connection"
        fi
    else
        local headers=$(curl -s -I --header "Connection: Upgrade" --header "Upgrade: websocket" --header "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" --header "Sec-WebSocket-Version: 13" "$ws_url")
        if echo "$headers" | grep -q "HTTP/1.1 101"; then
            print_result "$test_name" 0
        else
            print_result "$test_name" 1 "WebSocket upgrade failed"
        fi
    fi
}

# Function to test rate limiting
test_rate_limit() {
    local endpoint=$1
    local limit=$2
    local test_name="Rate Limiting Test for $endpoint"
    local result=0
    local error_msg=""
    
    # Make rapid requests
    for i in $(seq 1 $((limit + 1))); do
        response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
        if [ $i -gt $limit ] && [ "$response" != "429" ]; then
            result=1
            error_msg="Rate limiting not working. Expected 429, got $response after $limit requests"
            break
        fi
    done
    
    print_result "$test_name" $result "$error_msg"
}

# Function to test SSL configuration
test_ssl() {
    local test_name="SSL Configuration Test"
    local result=0
    local error_msg=""
    
    # Test SSL using openssl
    ssl_info=$(openssl s_client -connect dojopool.com.au:443 -tls1_2 </dev/null 2>/dev/null)
    
    # Check TLS version
    if ! echo "$ssl_info" | grep -q "Protocol  : TLSv1.2"; then
        result=1
        error_msg="$error_msg\n  Incorrect TLS version"
    fi
    
    # Check cipher
    if ! echo "$ssl_info" | grep -q "ECDHE-RSA-AES256-GCM-SHA384\|ECDHE-RSA-AES128-GCM-SHA256"; then
        result=1
        error_msg="$error_msg\n  Weak cipher in use"
    fi
    
    print_result "$test_name" $result "$error_msg"
}

# Function to test NGINX configuration
test_nginx_config() {
    local test_name="NGINX Configuration Syntax Test"
    if nginx -t &>/dev/null; then
        print_result "$test_name" 0
    else
        print_result "$test_name" 1 "Configuration syntax error"
    fi
}

echo -e "${YELLOW}Starting NGINX Configuration Tests${NC}"
echo "----------------------------------------"

# Test NGINX configuration syntax
test_nginx_config

# Test SSL configuration
test_ssl

# Test HTTP to HTTPS redirect
test_endpoint "" 301 "HTTP to HTTPS Redirect" "GET"

# Test security headers
test_security_headers "/"
test_security_headers "/api/"
test_security_headers "/static/"

# Test static file serving
test_endpoint "/static/css/main.css" 200 "Static CSS File"
test_endpoint "/static/js/main.js" 200 "Static JS File"
test_endpoint "/static/img/logo.png" 200 "Static Image File"

# Test API endpoints
test_endpoint "/api/health" 200 "Health Check Endpoint"
test_endpoint "/api/metrics" 403 "Metrics Endpoint (Should be forbidden from external)"
test_endpoint "/api/auth/login" 405 "Auth Endpoint (GET should be denied)" "GET"
test_endpoint "/api/auth/login" 200 "Auth Endpoint (POST)" "POST" '{"username":"test","password":"test"}'

# Test WebSocket connection
test_websocket

# Test rate limiting
test_rate_limit "/api/auth/login" 10
test_rate_limit "/api/" 100

# Test error pages
test_endpoint "/nonexistent" 404 "404 Error Page"

# Print summary
echo "----------------------------------------"
echo -e "${YELLOW}Test Summary${NC}"
echo "Total tests: $TESTS_TOTAL"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $((TESTS_TOTAL - TESTS_PASSED))"

# Exit with status code based on test results
[ $TESTS_PASSED -eq $TESTS_TOTAL ] 