# PowerShell script for testing NGINX functionality

# Error handling
$ErrorActionPreference = "Stop"

function Test-Endpoint {
    param (
        [string]$Uri,
        [string]$Method = "GET",
        [string]$ExpectedStatus = "200",
        [string]$TestName,
        [switch]$SkipBody,
        [string]$Body,
        [hashtable]$Headers
    )
    
    Write-Host "Testing $TestName... " -NoNewline
    
    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            UseBasicParsing = $true
            ErrorAction = "Stop"
            SkipCertificateCheck = $true
        }
        
        if ($Headers) {
            $params.Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body
            if (-not $Headers -or -not $Headers.ContainsKey("Content-Type")) {
                $params.ContentType = "application/json"
            }
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "OK" -ForegroundColor Green
            if (-not $SkipBody) {
                Write-Host "Response: $($response.Content)" -ForegroundColor Gray
            }
            return $true
        } else {
            Write-Host "Failed (Expected $ExpectedStatus, got $($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "OK" -ForegroundColor Green
            return $true
        } else {
            Write-Host "Failed (Expected $ExpectedStatus, got $statusCode)" -ForegroundColor Red
            Write-Host "Error: $_" -ForegroundColor Red
            return $false
        }
    }
}

function Test-StaticFile {
    param (
        [string]$Path,
        [string]$ContentType,
        [string]$TestName
    )
    
    Write-Host "Testing $TestName... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($env:TEST_PORT)$Path" -UseBasicParsing -SkipCertificateCheck
        if ($response.StatusCode -eq 200 -and $response.Headers["Content-Type"] -like "$ContentType*") {
            Write-Host "OK" -ForegroundColor Green
            return $true
        } else {
            Write-Host "Failed (Wrong status code or content type)" -ForegroundColor Red
            Write-Host "Status: $($response.StatusCode)" -ForegroundColor Red
            Write-Host "Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "Failed" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        return $false
    }
}

# Initialize test results
$testsFailed = 0

# Test HTTP endpoints
$tests = @(
    @{
        Uri = "http://localhost:$($env:TEST_PORT)/health"
        TestName = "HTTP Health Check"
        SkipBody = $true
    },
    @{
        Uri = "http://localhost:$($env:TEST_PORT)/api/auth/login"
        Method = "POST"
        TestName = "HTTP Login API"
        Body = '{"username":"test","password":"test"}'
    },
    @{
        Uri = "http://localhost:$($env:TEST_PORT)/api/auth/login"
        Method = "GET"
        ExpectedStatus = "405"
        TestName = "HTTP Login API Method Not Allowed"
    }
)

foreach ($test in $tests) {
    if (-not (Test-Endpoint @test)) {
        $testsFailed++
    }
}

# Test static files
$staticTests = @(
    @{
        Path = "/static/css/main.css"
        ContentType = "text/css"
        TestName = "CSS Static File"
    },
    @{
        Path = "/static/js/main.js"
        ContentType = "application/javascript"
        TestName = "JavaScript Static File"
    },
    @{
        Path = "/static/img/test.png"
        ContentType = "image/png"
        TestName = "Image Static File"
    }
)

foreach ($test in $staticTests) {
    if (-not (Test-StaticFile @test)) {
        $testsFailed++
    }
}

# Test HTTPS endpoints
$httpsTests = @(
    @{
        Uri = "https://localhost:$($env:TEST_SSL_PORT)/health"
        TestName = "HTTPS Health Check"
        SkipBody = $true
    },
    @{
        Uri = "https://localhost:$($env:TEST_SSL_PORT)/api/auth/login"
        Method = "POST"
        TestName = "HTTPS Login API"
        Body = '{"username":"test","password":"test"}'
    }
)

foreach ($test in $httpsTests) {
    if (-not (Test-Endpoint @test)) {
        $testsFailed++
    }
}

# Test WebSocket upgrade
$wsTest = @{
    Uri = "http://localhost:$($env:TEST_PORT)/ws/"
    Method = "GET"
    ExpectedStatus = "101"
    TestName = "WebSocket Upgrade"
    Headers = @{
        "Connection" = "Upgrade"
        "Upgrade" = "websocket"
        "Sec-WebSocket-Key" = "dGhlIHNhbXBsZSBub25jZQ=="
        "Sec-WebSocket-Version" = "13"
    }
}

if (-not (Test-Endpoint @wsTest)) {
    $testsFailed++
}

# Test error pages
$errorTests = @(
    @{
        Uri = "http://localhost:$($env:TEST_PORT)/nonexistent"
        ExpectedStatus = "404"
        TestName = "404 Error Page"
    },
    @{
        Uri = "http://localhost:$($env:TEST_PORT)/api/error"
        ExpectedStatus = "404"
        TestName = "API 404 Error"
    }
)

foreach ($test in $errorTests) {
    if (-not (Test-Endpoint @test)) {
        $testsFailed++
    }
}

# Final results
if ($testsFailed -eq 0) {
    Write-Host "`nAll tests passed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n$testsFailed test(s) failed!" -ForegroundColor Red
    exit 1
} 