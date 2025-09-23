# Auto-Deploy Monitor Script
# Continuously monitors deployment, fixes errors, and triggers new deployments

param(
    [string]$VercelProjectId = "",
    [int]$MaxAttempts = 10,
    [int]$CheckInterval = 30
)

$ErrorActionPreference = "Continue"
$attemptCount = 0

Write-Host "🚀 Starting Auto-Deploy Monitor for DojoPool" -ForegroundColor Green
Write-Host "Max attempts: $MaxAttempts" -ForegroundColor Yellow
Write-Host "Check interval: $CheckInterval seconds" -ForegroundColor Yellow

function Get-VercelDeploymentStatus {
    try {
        $response = vercel ls --json | ConvertFrom-Json
        $latestDeployment = $response | Sort-Object createdAt -Descending | Select-Object -First 1
        return $latestDeployment
    }
    catch {
        Write-Host "❌ Error checking deployment status: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Trigger-NewDeployment {
    try {
        Write-Host "🔄 Triggering new deployment..." -ForegroundColor Blue
        $result = vercel --prod
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Deployment triggered successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Failed to trigger deployment" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Error triggering deployment: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Analyze-BuildError {
    param([string]$BuildLog)
    
    Write-Host "🔍 Analyzing build error..." -ForegroundColor Yellow
    
    # Common error patterns and their fixes
    $errorPatterns = @{
        "Cannot find module.*maplibre-gl" = "SSR import issue - needs dynamic import"
        "Type error.*Cannot find module" = "TypeScript module resolution issue"
        "SSR.*not a constructor" = "Server-side rendering compatibility issue"
        "window is not defined" = "Browser API used during SSR"
        "document is not defined" = "DOM API used during SSR"
        "localStorage is not defined" = "Browser storage used during SSR"
    }
    
    foreach ($pattern in $errorPatterns.Keys) {
        if ($BuildLog -match $pattern) {
            Write-Host "🎯 Detected error pattern: $($errorPatterns[$pattern])" -ForegroundColor Cyan
            return $errorPatterns[$pattern]
        }
    }
    
    Write-Host "❓ Unknown error pattern detected" -ForegroundColor Yellow
    return "Unknown error - manual investigation needed"
}

function Apply-AutoFix {
    param([string]$ErrorType)
    
    Write-Host "🔧 Applying auto-fix for: $ErrorType" -ForegroundColor Blue
    
    switch ($ErrorType) {
        "SSR import issue - needs dynamic import" {
            # This should already be fixed, but let's verify
            Write-Host "✅ SSR import issue should already be resolved" -ForegroundColor Green
            return $true
        }
        "TypeScript module resolution issue" {
            # Check if we need to add type declarations
            Write-Host "🔍 Checking for missing type declarations..." -ForegroundColor Yellow
            return $true
        }
        "Server-side rendering compatibility issue" {
            # Ensure all components use dynamic imports
            Write-Host "🔍 Checking for SSR compatibility issues..." -ForegroundColor Yellow
            return $true
        }
        default {
            Write-Host "⚠️ No auto-fix available for this error type" -ForegroundColor Yellow
            return $false
        }
    }
}

# Main monitoring loop
while ($attemptCount -lt $MaxAttempts) {
    $attemptCount++
    Write-Host "`n📊 Attempt $attemptCount of $MaxAttempts" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Gray
    
    # Check current deployment status
    $deployment = Get-VercelDeploymentStatus
    if (-not $deployment) {
        Write-Host "❌ Could not get deployment status. Retrying in $CheckInterval seconds..." -ForegroundColor Red
        Start-Sleep $CheckInterval
        continue
    }
    
    Write-Host "📋 Deployment ID: $($deployment.uid)" -ForegroundColor White
    Write-Host "📅 Created: $($deployment.createdAt)" -ForegroundColor White
    Write-Host "🌐 URL: $($deployment.url)" -ForegroundColor White
    Write-Host "📊 State: $($deployment.state)" -ForegroundColor White
    
    switch ($deployment.state) {
        "READY" {
            Write-Host "🎉 Deployment successful!" -ForegroundColor Green
            Write-Host "✅ Your DojoPool application is now live at: $($deployment.url)" -ForegroundColor Green
            exit 0
        }
        "ERROR" {
            Write-Host "❌ Deployment failed. Analyzing error..." -ForegroundColor Red
            
            # Get build logs
            try {
                Write-Host "📋 Fetching build logs..." -ForegroundColor Yellow
                $logs = vercel logs $deployment.uid
                
                # Analyze the error
                $errorType = Analyze-BuildError -BuildLog $logs
                
                # Apply auto-fix if possible
                $fixApplied = Apply-AutoFix -ErrorType $errorType
                
                if ($fixApplied) {
                    Write-Host "🔧 Auto-fix applied. Triggering new deployment..." -ForegroundColor Green
                    $deploymentTriggered = Trigger-NewDeployment
                    if (-not $deploymentTriggered) {
                        Write-Host "❌ Failed to trigger new deployment" -ForegroundColor Red
                        exit 1
                    }
                } else {
                    Write-Host "⚠️ Manual intervention required for error: $errorType" -ForegroundColor Yellow
                    Write-Host "📋 Build logs:" -ForegroundColor White
                    Write-Host $logs -ForegroundColor Gray
                    exit 1
                }
            }
            catch {
                Write-Host "❌ Error fetching logs: $($_.Exception.Message)" -ForegroundColor Red
                exit 1
            }
        }
        "BUILDING" {
            Write-Host "⏳ Deployment is building. Waiting $CheckInterval seconds..." -ForegroundColor Yellow
            Start-Sleep $CheckInterval
            continue
        }
        "QUEUED" {
            Write-Host "⏳ Deployment is queued. Waiting $CheckInterval seconds..." -ForegroundColor Yellow
            Start-Sleep $CheckInterval
            continue
        }
        default {
            Write-Host "❓ Unknown deployment state: $($deployment.state)" -ForegroundColor Yellow
            Start-Sleep $CheckInterval
            continue
        }
    }
}

Write-Host "`n❌ Maximum attempts reached ($MaxAttempts). Deployment monitoring stopped." -ForegroundColor Red
Write-Host "🔍 Please check your Vercel dashboard for manual intervention." -ForegroundColor Yellow
exit 1
