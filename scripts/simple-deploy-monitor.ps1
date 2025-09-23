# Simple Auto-Deploy Monitor Script
param(
    [int]$MaxAttempts = 10,
    [int]$CheckInterval = 20
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
    
    if ($deployment.state -eq "READY") {
        Write-Host "🎉 Deployment successful!" -ForegroundColor Green
        Write-Host "✅ Your DojoPool application is now live at: $($deployment.url)" -ForegroundColor Green
        exit 0
    }
    elseif ($deployment.state -eq "ERROR") {
        Write-Host "❌ Deployment failed. Triggering new deployment..." -ForegroundColor Red
        
        # Get build logs
        try {
            Write-Host "📋 Fetching build logs..." -ForegroundColor Yellow
            $logs = vercel logs $deployment.uid
            Write-Host "📋 Build logs:" -ForegroundColor White
            Write-Host $logs -ForegroundColor Gray
        }
        catch {
            Write-Host "❌ Error fetching logs: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Trigger new deployment
        $deploymentTriggered = Trigger-NewDeployment
        if (-not $deploymentTriggered) {
            Write-Host "❌ Failed to trigger new deployment" -ForegroundColor Red
            exit 1
        }
    }
    elseif ($deployment.state -eq "BUILDING") {
        Write-Host "⏳ Deployment is building. Waiting $CheckInterval seconds..." -ForegroundColor Yellow
        Start-Sleep $CheckInterval
        continue
    }
    elseif ($deployment.state -eq "QUEUED") {
        Write-Host "⏳ Deployment is queued. Waiting $CheckInterval seconds..." -ForegroundColor Yellow
        Start-Sleep $CheckInterval
        continue
    }
    else {
        Write-Host "❓ Unknown deployment state: $($deployment.state)" -ForegroundColor Yellow
        Start-Sleep $CheckInterval
        continue
    }
}

Write-Host "`n❌ Maximum attempts reached ($MaxAttempts). Deployment monitoring stopped." -ForegroundColor Red
Write-Host "🔍 Please check your Vercel dashboard for manual intervention." -ForegroundColor Yellow
exit 1
