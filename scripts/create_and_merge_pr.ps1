param(
  [Parameter(Mandatory=$true)][string]$RepoOwner,
  [Parameter(Mandatory=$true)][string]$RepoName,
  [string]$HeadBranch = "fresh-start",
  [string]$BaseBranch = "main",
  [string]$Title = "Fresh start: Merge clean foundation into main",
  [string]$BodyFile = "PR_FRESH_START_MERGE.md",
  [switch]$AutoMerge
)

# Requires: Environment variable GITHUB_TOKEN with repo scope
if (-not $env:GITHUB_TOKEN) {
  Write-Error "GITHUB_TOKEN environment variable is not set. Please set a GitHub Personal Access Token with 'repo' scope."; exit 1
}

$Headers = @{ Authorization = "Bearer $($env:GITHUB_TOKEN)"; "User-Agent" = "DojoPool-PR-Automation"; Accept = "application/vnd.github+json" }

$Body = ""
if (Test-Path $BodyFile) { $Body = Get-Content -Raw -Path $BodyFile }

$ApiBase = "https://api.github.com/repos/$RepoOwner/$RepoName"

# 1) Create PR
$prPayload = @{ title = $Title; head = $HeadBranch; base = $BaseBranch; body = $Body } | ConvertTo-Json
$response = Invoke-RestMethod -Method Post -Uri "$ApiBase/pulls" -Headers $Headers -Body $prPayload

if (-not $response.number) { Write-Error "Failed to create PR. Response: $($response | ConvertTo-Json -Depth 5)"; exit 1 }

$prNumber = $response.number
Write-Host "Created PR #$prNumber: $($response.html_url)"

# 2) Enable auto-merge (optional)
if ($AutoMerge) {
  # Attempt squash merge via REST (GraphQL is typically needed for auto-merge; we do direct merge when allowed)
  try {
    $mergePayload = @{ merge_method = "squash" } | ConvertTo-Json
    $mergeResponse = Invoke-RestMethod -Method Put -Uri "$ApiBase/pulls/$prNumber/merge" -Headers $Headers -Body $mergePayload -ErrorAction Stop
    if ($mergeResponse.merged -eq $true) {
      Write-Host "PR #$prNumber merged successfully: $($mergeResponse.sha)"
    } else {
      Write-Warning "PR #$prNumber not merged automatically. Status: $($mergeResponse.message)"
    }
  } catch {
    Write-Warning "Automatic merge failed (likely required checks or conflicts). You can merge manually at: $($response.html_url)"
  }
}
