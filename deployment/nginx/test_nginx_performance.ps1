# PowerShell script for NGINX performance and security testing

# Error handling
$ErrorActionPreference = "Stop"

# Test configuration
$config = @{
    BaseUrl         = "https://localhost"
    Endpoints       = @(
        "/",
        "/api/health",
        "/static/css/main.css",
        "/static/js/main.js"
    )
    ConcurrentUsers = 10
    RequestsPerUser = 100
    TimeoutSeconds  = 30
}

function Test-Performance {
    param (
        [string]$Endpoint,
        [int]$Concurrent,
        [int]$Requests
    )
    
    Write-Host "Testing performance for $Endpoint with $Concurrent concurrent users..."
    
    $results = @{
        TotalRequests      = 0
        SuccessfulRequests = 0
        FailedRequests     = 0
        TotalTime          = 0
        MinTime            = [double]::MaxValue
        MaxTime            = 0
        ResponseTimes      = @()
    }
    
    $jobs = 1..$Concurrent | ForEach-Object {
        Start-Job -ScriptBlock {
            param($url, $requests)
            
            $results = @{
                Successful = 0
                Failed     = 0
                Times      = @()
            }
            
            1..$requests | ForEach-Object {
                try {
                    $start = Get-Date
                    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -SkipCertificateCheck
                    $end = Get-Date
                    $time = ($end - $start).TotalMilliseconds
                    
                    if ($response.StatusCode -eq 200) {
                        $results.Successful++
                        $results.Times += $time
                    }
                    else {
                        $results.Failed++
                    }
                }
                catch {
                    $results.Failed++
                }
            }
            
            return $results
        } -ArgumentList "$($config.BaseUrl)$Endpoint", ($Requests / $Concurrent)
    }
    
    $results = $jobs | Wait-Job | Receive-Job
    
    # Aggregate results
    $totalTime = ($results.Times | Measure-Object -Sum).Sum
    $avgTime = $totalTime / ($results.Times.Count)
    $minTime = ($results.Times | Measure-Object -Minimum).Minimum
    $maxTime = ($results.Times | Measure-Object -Maximum).Maximum
    
    Write-Host "Results for $Endpoint:"
    Write-Host "  Successful requests: $(($results.Successful | Measure-Object -Sum).Sum)"
    Write-Host "  Failed requests: $(($results.Failed | Measure-Object -Sum).Sum)"
    Write-Host "  Average response time: $($avgTime.ToString('F2'))ms"
    Write-Host "  Min response time: $($minTime.ToString('F2'))ms"
    Write-Host "  Max response time: $($maxTime.ToString('F2'))ms"
    Write-Host ""
}

function Test-SecurityHeaders {
    param (
        [string]$Endpoint
    )
    
    Write-Host "Testing security headers for $Endpoint..."
    
    $requiredHeaders = @{
        'Strict-Transport-Security' = 'max-age=\d+.+includeSubDomains.+preload'
        'X-Frame-Options'           = 'SAMEORIGIN'
        'X-Content-Type-Options'    = 'nosniff'
        'X-XSS-Protection'          = '1; mode=block'
        'Content-Security-Policy'   = '.+'
        'Referrer-Policy'           = 'strict-origin-when-cross-origin'
    }
    
    try {
        $response = Invoke-WebRequest -Uri "$($config.BaseUrl)$Endpoint" -Method Head -UseBasicParsing -SkipCertificateCheck
        
        foreach ($header in $requiredHeaders.Keys) {
            $value = $response.Headers[$header]
            $pattern = $requiredHeaders[$header]
            
            if ($value -match $pattern) {
                Write-Host "  $header : OK" -ForegroundColor Green
            }
            else {
                Write-Host "  $header : Missing or invalid" -ForegroundColor Red
                if ($value) {
                    Write-Host "    Got: $value" -ForegroundColor Red
                }
            }
        }
    }
    catch {
        Write-Host "Error testing $Endpoint : $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

function Test-SSLConfiguration {
    Write-Host "Testing SSL configuration..."
    
    $sslTests = @(
        @{
            Name           = "TLS 1.2 Support"
            Command        = "openssl s_client -connect localhost:443 -tls1_2"
            ExpectedOutput = "Protocol  : TLSv1.2"
        },
        @{
            Name           = "TLS 1.3 Support"
            Command        = "openssl s_client -connect localhost:443 -tls1_3"
            ExpectedOutput = "Protocol  : TLSv1.3"
        },
        @{
            Name           = "Strong Cipher Support"
            Command        = "openssl s_client -connect localhost:443 -cipher 'ECDHE-RSA-AES256-GCM-SHA384'"
            ExpectedOutput = "New, TLSv1"
        }
    )
    
    foreach ($test in $sslTests) {
        Write-Host "  $($test.Name)... " -NoNewline
        try {
            $result = Invoke-Expression $test.Command
            if ($result -match $test.ExpectedOutput) {
                Write-Host "OK" -ForegroundColor Green
            }
            else {
                Write-Host "Failed" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "Error: $_" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

function Test-RateLimiting {
    param (
        [string]$Endpoint,
        [int]$RateLimit,
        [int]$Burst
    )
    
    Write-Host "Testing rate limiting for $Endpoint (limit: $RateLimit/s, burst: $Burst)..."
    
    $results = @{
        Requests   = 0
        Limited    = 0
        NotLimited = 0
    }
    
    # Test burst
    1..($Burst + 5) | ForEach-Object {
        try {
            $response = Invoke-WebRequest -Uri "$($config.BaseUrl)$Endpoint" -UseBasicParsing -SkipCertificateCheck
            $results.NotLimited++
        }
        catch {
            if ($_.Exception.Response.StatusCode.value__ -eq 429) {
                $results.Limited++
            }
        }
        $results.Requests++
    }
    
    Write-Host "  Total requests: $($results.Requests)"
    Write-Host "  Not limited: $($results.NotLimited)"
    Write-Host "  Limited: $($results.Limited)"
    Write-Host ""
}

# Run tests
Write-Host "Starting NGINX Performance and Security Tests`n"

# Performance tests
foreach ($endpoint in $config.Endpoints) {
    Test-Performance -Endpoint $endpoint -Concurrent $config.ConcurrentUsers -Requests $config.RequestsPerUser
}

# Security header tests
foreach ($endpoint in $config.Endpoints) {
    Test-SecurityHeaders -Endpoint $endpoint
}

# SSL configuration tests
Test-SSLConfiguration

# Rate limiting tests
Test-RateLimiting -Endpoint "/api/" -RateLimit 10 -Burst 5
Test-RateLimiting -Endpoint "/api/auth/" -RateLimit 5 -Burst 3
Test-RateLimiting -Endpoint "/ws" -RateLimit 5 -Burst 2 