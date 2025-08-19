# Direct merge approach for automated dependency and security update branches
Write-Host "Starting direct merge of automated PR branches..." -ForegroundColor Green

# Ensure we're on main branch
git checkout main

# Get branches that need merging
$branchesToMerge = @(
    "origin/dependabot/npm_and_yarn/npm_and_yarn-1c007eb283",
    "origin/dependabot/npm_and_yarn/npm_and_yarn-2c631a4876", 
    "origin/dependabot/npm_and_yarn/npm_and_yarn-6f406c18d0",
    "origin/dependabot/npm_and_yarn/npm_and_yarn-f03e39912e",
    "origin/dependabot/npm_and_yarn/src/dojopool/frontend/axios-1.8.2",
    "origin/snyk-fix-0b1a752af41cbaba275bf212593613a1",
    "origin/snyk-fix-6e69c4ba3d8ee4128a0ccbe790b8b3c3",
    "origin/snyk-fix-f331a6fbb67c1c93d2bae2e2e15c3253",
    "origin/snyk-upgrade-3a8df34dbe0d4b8dac1384e1d744dab0",
    "origin/snyk-upgrade-9f432ffb6f4d4c4a33c87ddbc4c960e5",
    "origin/snyk-upgrade-a439f1c0e97158f1a5ae8f6a430cf141",
    "origin/snyk-upgrade-c71f0e910fa51d2e422423e027bf8c5e",
    "origin/snyk-upgrade-d188128d9794f160c0aa2d400593c375"
)

$successCount = 0
$failCount = 0

foreach ($branch in $branchesToMerge) {
    Write-Host "Merging $branch..." -ForegroundColor Yellow
    
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

Write-Host "`n=== MERGE SUMMARY ===" -ForegroundColor Magenta
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

Write-Host "`nDirect merge process completed!" -ForegroundColor Green