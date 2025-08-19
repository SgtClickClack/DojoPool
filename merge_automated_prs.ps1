# Script to merge automated dependency and security update branches
# This script handles the "remaining pull requests" by merging safe automated updates

Write-Host "Starting automated PR merge process..." -ForegroundColor Green

# Get all remote branches
$remoteBranches = git branch -r | Where-Object { $_ -notmatch "HEAD|main|master" }

# Define patterns for safe automated branches
$safePatterns = @(
    "origin/dependabot/",
    "origin/snyk-fix-",
    "origin/snyk-upgrade-"
)

# Track successful and failed merges
$successfulMerges = @()
$failedMerges = @()

foreach ($branch in $remoteBranches) {
    $branchName = $branch.Trim()
    
    # Check if this is a safe automated branch
    $isSafe = $false
    foreach ($pattern in $safePatterns) {
        if ($branchName -like "*$pattern*") {
            $isSafe = $true
            break
        }
    }
    
    if ($isSafe) {
        Write-Host "Processing branch: $branchName" -ForegroundColor Yellow
        
        try {
            # Check if branch is ahead of main
            $ahead = git rev-list --count main..$branchName 2>$null
            
            if ($ahead -gt 0) {
                Write-Host "  Branch is $ahead commits ahead of main" -ForegroundColor Cyan
                
                # Create a local branch and merge
                $localBranchName = $branchName -replace "origin/", ""
                
                # Checkout the branch
                git checkout -b $localBranchName $branchName 2>$null
                
                if ($LASTEXITCODE -eq 0) {
                    # Switch back to main and merge
                    git checkout main
                    git merge $localBranchName --no-ff -m "Merge automated update: $localBranchName"
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "  [SUCCESS] Successfully merged $branchName" -ForegroundColor Green
                        $successfulMerges += $branchName
                        
                        # Clean up local branch
                        git branch -d $localBranchName 2>$null
                    } else {
                        Write-Host "  [FAILED] Failed to merge $branchName" -ForegroundColor Red
                        $failedMerges += $branchName
                        git checkout main
                        git branch -D $localBranchName 2>$null
                    }
                } else {
                    Write-Host "  [FAILED] Failed to checkout $branchName" -ForegroundColor Red
                    $failedMerges += $branchName
                }
            } else {
                Write-Host "  -> Branch is up to date, skipping" -ForegroundColor Gray
            }
        } catch {
            Write-Host "  [ERROR] Error processing $branchName : $_" -ForegroundColor Red
            $failedMerges += $branchName
        }
    }
}

# Summary
Write-Host "`n=== MERGE SUMMARY ===" -ForegroundColor Magenta
Write-Host "Successful merges: $($successfulMerges.Count)" -ForegroundColor Green
foreach ($branch in $successfulMerges) {
    Write-Host "  [SUCCESS] $branch" -ForegroundColor Green
}

Write-Host "`nFailed merges: $($failedMerges.Count)" -ForegroundColor Red
foreach ($branch in $failedMerges) {
    Write-Host "  [FAILED] $branch" -ForegroundColor Red
}

if ($successfulMerges.Count -gt 0) {
    Write-Host "`nPushing merged changes to origin..." -ForegroundColor Yellow
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Successfully pushed merged changes" -ForegroundColor Green
    } else {
        Write-Host "[FAILED] Failed to push changes" -ForegroundColor Red
    }
}

Write-Host "`nAutomated PR merge process completed!" -ForegroundColor Green