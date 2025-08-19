param(
  [string]$Token,
  [switch]$ShowReport,
  [string[]]$AdditionalArgs
)

$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host "[QODANA] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[QODANA] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[QODANA] $msg" -ForegroundColor Red }

# 1) Ensure Qodana CLI is installed
$qodanaCmd = Get-Command qodana -ErrorAction SilentlyContinue
if (-not $qodanaCmd) {
  Write-Warn "Qodana CLI not found. Attempting to install via Scoop..."
  $scoopCmd = Get-Command scoop -ErrorAction SilentlyContinue
  if ($scoopCmd) {
    try {
      # Add JetBrains bucket if missing
      $bucketList = scoop bucket list 2>$null
      if (-not ($bucketList -match 'jetbrains')) {
        Write-Info "Adding JetBrains Scoop bucket..."
        scoop bucket add jetbrains https://github.com/JetBrains/scoop-utils | Out-Host
      }
      Write-Info "Installing Qodana via Scoop..."
      scoop install qodana | Out-Host
      $qodanaCmd = Get-Command qodana -ErrorAction SilentlyContinue
    } catch {
      Write-Warn "Scoop install failed: $($_.Exception.Message)"
    }
  } else {
    Write-Warn "Scoop is not installed. You can install Scoop from https://scoop.sh/ or install Qodana via Go:"
    Write-Host "    go install github.com/JetBrains/qodana-cli@latest"
  }
}

if (-not $qodanaCmd) {
  Write-Warn "Qodana CLI is still not available. Attempting Docker-based scan..."
  $dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
  if (-not $dockerCmd) {
    Write-Err "Neither Qodana CLI nor Docker is available. Please install Qodana CLI (via Scoop or Go) or Docker and re-run."
    exit 1
  }

  # Prepare Docker arguments
  $projectPath = (Get-Location).Path
  $resultsPath = Join-Path $projectPath ".qodana"
  if (-not (Test-Path $resultsPath)) { New-Item -ItemType Directory -Path $resultsPath | Out-Null }

  # Determine if caller passed a custom results-dir or project-dir; for Docker we standardize results dir mount
  $passArgs = @()
  if ($AdditionalArgs -and $AdditionalArgs.Length -gt 0) {
    foreach ($a in $AdditionalArgs) {
      if ($a -notlike '--results-dir*' -and $a -notlike '--project-dir*' -and $a -ne '--show-report') { $passArgs += $a }
    }
  }

  # Target apps/web specifically inside the container
  $containerProjectDir = '/data/project/apps/web'
  $containerResultsDir = '/data/results'

  $dockerArgs = @(
    'run','--rm','-t',
    '-v',"$projectPath:/data/project",
    '-v',"$resultsPath:/data/results"
  )

  if ($env:QODANA_TOKEN) {
    $dockerArgs += @('-e',"QODANA_TOKEN=$($env:QODANA_TOKEN)")
  }

  # Linter image must match qodana.yaml; using js linter
  $dockerImage = 'jetbrains/qodana-js:2025.1'

  $qodanaArgs = @(
    '--project-dir', $containerProjectDir,
    '--results-dir', $containerResultsDir
  )

  if ($passArgs.Length -gt 0) { $qodanaArgs += $passArgs }

  Write-Info ("Running via Docker: docker " + ($dockerArgs + $dockerImage + $qodanaArgs -join ' '))
  docker @dockerArgs $dockerImage @qodanaArgs
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    Write-Err "Qodana (Docker) scan finished with exit code $exitCode"
    exit $exitCode
  }
  Write-Info "Docker-based scan completed successfully. Reports are under $resultsPath"
  exit 0
}

# 2) Handle QODANA_TOKEN
if ($Token) {
  $env:QODANA_TOKEN = $Token
}

if (-not $env:QODANA_TOKEN) {
  Write-Warn "Environment variable QODANA_TOKEN is not set. Some features may require it."
  $inputToken = Read-Host "Enter QODANA_TOKEN (leave empty to continue without)"
  if ($inputToken) { $env:QODANA_TOKEN = $inputToken }
}

# 3) Run qodana scan
$cmd = @('scan')
if ($ShowReport) { $cmd += '--show-report' }
if ($AdditionalArgs -and $AdditionalArgs.Length -gt 0) { $cmd += $AdditionalArgs }

Write-Info ("Running: qodana " + ($cmd -join ' '))
qodana @cmd

$exitCode = $LASTEXITCODE
if ($exitCode -ne 0) {
  Write-Err "Qodana scan finished with exit code $exitCode"
  exit $exitCode
}

Write-Info "Scan completed successfully."
Write-Info "Reports (HTML/JSON) are stored under the .qodana directory. Use --show-report to open in browser."
