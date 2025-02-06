# PowerShell script to fix GitHub workflow files
$workflowsDir = ".github/workflows"

# Check if this is an automated fix commit - more robust check
$lastCommitMessage = git log -1 --pretty=%B
$lastCommitAuthor = git log -1 --pretty=%an
if ($lastCommitMessage -match "fix: Optimize GitHub workflow" -or 
    $lastCommitMessage -match "chore: optimize workflow" -or 
    $lastCommitAuthor -match "github-actions") {
    Write-Host "Skipping workflow fixes as this appears to be an automated commit"
    exit 0
}

# Add a lock file check to prevent concurrent runs
$lockFile = ".workflow-fix.lock"
if (Test-Path $lockFile) {
    $lockAge = (Get-Item $lockFile).LastWriteTime
    $timeSinceLock = (Get-Date) - $lockAge
    
    if ($timeSinceLock.TotalMinutes -lt 5) {
        Write-Host "Another workflow fix process is running. Exiting."
        exit 0
    } else {
        Remove-Item $lockFile -Force
    }
}

# Create lock file
New-Item -ItemType File -Path $lockFile -Force

try {
    # Function to fix workflow file
    function Fix-WorkflowFile {
        param (
            [string]$filePath
        )
        
        try {
            Write-Host "Processing $filePath..."
            
            # Read the file content
            $content = Get-Content $filePath -Raw
            $originalContent = $content
            
            # Add concurrency settings if not present
            if ($content -notmatch 'concurrency:') {
                $concurrencyBlock = @"
concurrency:
  group: `${{ github.workflow }}-`${{ github.ref }}
  cancel-in-progress: true

"@
                # Add concurrency block right after the 'on:' section
                $content = $content -replace "(on:(?:(?!jobs:)[\s\S])*)", "`$1$concurrencyBlock"
            }
            
            # Fix common issues
            $content = $content -replace '^\s*<<:\s*.*$\n?', '' # Remove invalid merge lines
            $content = $content -replace '\t', '  ' # Replace tabs with spaces
            $content = $content -replace '^true:', 'on:' # Fix mistaken true: key
            $content = $content -replace '>\n\s+', '>\n' # Fix multiline string issues
            
            # Fix environment variable syntax
            $content = $content -replace '\$\{\{\s+', '${{' # Remove spaces after ${{
            $content = $content -replace '\s+\}\}', '}}' # Remove spaces before }}
            
            # Update common action versions
            $content = $content -replace 'actions/checkout@v[1-3]', 'actions/checkout@v4'
            $content = $content -replace 'actions/setup-node@v[1-3]', 'actions/setup-node@v4'
            $content = $content -replace 'actions/setup-python@v[1-3]', 'actions/setup-python@v4'
            $content = $content -replace 'actions/cache@v[1-2]', 'actions/cache@v3'
            $content = $content -replace 'actions/upload-artifact@v[1-2]', 'actions/upload-artifact@v3'
            $content = $content -replace 'actions/download-artifact@v[1-2]', 'actions/download-artifact@v3'
            $content = $content -replace 'codecov/codecov-action@v[1-3]', 'codecov/codecov-action@v3'
            $content = $content -replace 'github/codeql-action/[^@]+@v[1-2]', '$0@v2'
            
            # Add timeout-minutes to jobs if not present
            $content = $content -replace '(?m)^(\s+\w+:\s*\n\s+runs-on:)', '  timeout-minutes: 60\n$1'
            
            # Add paths-ignore to push events if not present
            if ($content -match 'on:\s*\n\s*push:' -and $content -notmatch 'paths-ignore:') {
                $pathsIgnore = @"
    paths-ignore:
      - '**.md'
      - 'docs/**'
      - '.gitignore'
      - 'LICENSE'
      - '**.txt'
      - '.github/workflows/**'  # Ignore workflow files themselves
"@
                $content = $content -replace '(on:\s*\n\s*push:\s*\n)', "`$1$pathsIgnore`n"
            }
            
            # Ensure basic structure
            if ($content -notmatch 'name:') {
                $fileName = [System.IO.Path]::GetFileNameWithoutExtension($filePath)
                $content = "name: $fileName`n$content"
            }
            
            # Only write if content changed
            if ($content -ne $originalContent) {
                $content | Set-Content $filePath -NoNewline
                Write-Host "Fixed $filePath"
                return $true
            } else {
                Write-Host "No changes needed for $filePath"
                return $false
            }
        }
        catch {
            Write-Host "Error fixing $filePath : $_"
            return $false
        }
    }

    # Track if any changes were made
    $changesCount = 0

    # Process all workflow files
    Get-ChildItem -Path $workflowsDir -Filter *.yml -Recurse | ForEach-Object {
        if (Fix-WorkflowFile $_.FullName) {
            $changesCount++
        }
    }

    Get-ChildItem -Path $workflowsDir -Filter *.yaml -Recurse | ForEach-Object {
        if (Fix-WorkflowFile $_.FullName) {
            $changesCount++
        }
    }

    if ($changesCount -eq 0) {
        Write-Host "No changes were needed in any workflow files."
        exit 0
    }

    Write-Host "Fixed $changesCount workflow files."
}
finally {
    # Always remove the lock file
    if (Test-Path $lockFile) {
        Remove-Item $lockFile -Force
    }
} 