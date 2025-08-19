# Retry merging the branches that failed due to local changes
Write-Host "Retrying failed automated PR merges..." -ForegroundColor Green

# Branches that failed due to local changes
$failedBranches = @(
    "origin/dependabot/npm_and_yarn/npm_and_yarn-1c007eb283",
    "origin/dependabot/npm_and_yarn/npm_and_yarn-2c631a4876", 
    "origin/dependabot/npm_and_yarn/npm_and_yarn-6f406c18d0",
    "origin/dependabot/npm_and_yarn/npm_and_yarn-f03e39912e",
    "origin/snyk-fix-6e69c4ba3d8ee4128a0ccbe790b8b3c3",
    "origin/snyk-fix-f331a6fbb67c1c93d2bae2e2e15c3253"
)

$successCount = 0
$failCount = 0

foreach ($branch in $failedBranches) {
    Write-Host "Retrying merge of $branch..." -ForegroundColor Yellow
    
    # Try direct merge
    git merge $branch --no-ff -m "Merge automated update: $branch"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Merged $branch" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "[FAILED] Could not merge $branch" -ForegroundColor Red
        $failCount++
        # Reset any partial merge
        git merge --abort 2>$null
    }
}

Write-Host "`n=== RETRY MERGE SUMMARY ===" -ForegroundColor Magenta
Write-Host "Successful merges: $successCount" -ForegroundColor Green
Write-Host "Failed merges: $failCount" -ForegroundColor Red

if ($successCount -gt 0) {
    Write-Host "`nPushing merged changes..." -ForegroundColor Yellow
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Pushed merged changes to origin" -ForegroundColor Green
    } else {
        Write-Host "[FAILED] Could not push changes" -ForegroundColor Red
    }
}

Write-Host "`nRetry merge process completed!" -ForegroundColor Green