# PowerShell script to reorganize the codebase

# Create directory structure
$directories = @(
    "api/v1",
    "auth",
    "core/game",
    "core/tournament",
    "core/ranking",
    "core/realtime",
    "frontend/src",
    "frontend/public",
    "models",
    "services/email",
    "services/notification",
    "static/css",
    "static/js",
    "static/images",
    "templates",
    "utils"
)

Write-Host "Creating directory structure..."
foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path "../src/$dir" | Out-Null
    New-Item -ItemType File -Force -Path "../src/$dir/__init__.py" | Out-Null
}

# Move frontend files
Write-Host "Moving frontend files..."
if (Test-Path "../src/setupTests.ts") {
    Move-Item -Force "../src/setupTests.ts" "../src/frontend/src/tests/"
}
if (Test-Path "../src/constants.ts") {
    Move-Item -Force "../src/constants.ts" "../src/frontend/src/"
}

# Move email services
Write-Host "Moving email services..."
$emailDirs = @("email", "mail_service")
foreach ($dir in $emailDirs) {
    if (Test-Path "../src/$dir") {
        Get-ChildItem "../src/$dir" -File | ForEach-Object {
            Move-Item -Force $_.FullName "../src/services/email/"
        }
        Remove-Item -Force -Recurse "../src/$dir"
    }
}

# Move socket files
Write-Host "Moving socket files..."
$socketDirs = @("websockets", "sockets")
foreach ($dir in $socketDirs) {
    if (Test-Path "../src/$dir") {
        Get-ChildItem "../src/$dir" -File | ForEach-Object {
            Move-Item -Force $_.FullName "../src/core/realtime/"
        }
        Remove-Item -Force -Recurse "../src/$dir"
    }
}

# Move blueprint files
Write-Host "Moving blueprint files..."
if (Test-Path "../src/blueprints") {
    Get-ChildItem "../src/blueprints" -File | ForEach-Object {
        $file = $_.Name
        if ($file -match "auth_") {
            Move-Item -Force $_.FullName "../src/auth/"
        }
        elseif ($file -match "game_") {
            Move-Item -Force $_.FullName "../src/core/game/"
        }
        elseif ($file -match "tournament_") {
            Move-Item -Force $_.FullName "../src/core/tournament/"
        }
    }
    Remove-Item -Force -Recurse "../src/blueprints"
}

# Clean up redundant files
Write-Host "Cleaning up redundant files..."
$redundantItems = @(
    ".gitignore",
    "dojopool.egg-info",
    "dojopool",
    "__pycache__"
)

foreach ($item in $redundantItems) {
    if (Test-Path "../src/$item") {
        Remove-Item -Force -Recurse "../src/$item"
    }
}

Write-Host "Done! Codebase reorganized successfully." 