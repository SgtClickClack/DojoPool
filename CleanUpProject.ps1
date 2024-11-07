# CleanUpProject.ps1

# Define the root directory of your project
$rootDir = "C:\Users\JR\Documents\DojoPool\DojoPoolCombined"

# Change to the root directory
Set-Location -Path $rootDir

# Logging function
function Log-Message {
    param (
        [string]$Message,
        [string]$Type = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "$timestamp [$Type] - $Message"
}

# Step 1: Create Necessary Directories
$directories = @(
    "src\backend",
    "src\frontend",
    "assets\images",
    "assets\icons",
    "api",
    "components",
    "styles",
    "assets\audio"      # For audio files like .mp3
)

foreach ($dir in $directories) {
    $fullPath = Join-Path -Path $rootDir -ChildPath $dir
    if (-not (Test-Path -Path $fullPath)) {
        New-Item -Path $fullPath -ItemType Directory | Out-Null
        Log-Message "Created directory: $dir"
    } else {
        Log-Message "Directory already exists: $dir" "DEBUG"
    }
}

# Step 2: Define File Extension Mappings
$extensionMapping = @{
    ".js"   = "src\frontend"
    ".jsx"  = "src\frontend"
    ".ts"   = "src\frontend"
    ".tsx"  = "src\frontend"
    ".py"   = "src\backend"
    ".mp3"  = "assets\audio"
    ".jpg"  = "assets\images"
    ".jpeg" = "assets\images"
    ".png"  = "assets\images"
    ".svg"  = "assets\icons"
    ".css"  = "styles"
    ".scss" = "styles"
    ".less" = "styles"
    ".json" = "src"          # Adjust as needed
    ".docx" = "docs"         # Optional: Create a 'docs' directory if you want to organize documents
    ".txt"  = "docs"         # Adjust as needed
    ".rar"  = "archives"     # Optional: Create an 'archives' directory
    ".ini"  = "config"       # Optional: Create a 'config' directory
}

# Optional: Create additional directories for mapped types
$additionalDirs = @("docs", "archives", "config")
foreach ($dir in $additionalDirs) {
    $fullPath = Join-Path -Path $rootDir -ChildPath $dir
    if (-not (Test-Path -Path $fullPath)) {
        New-Item -Path $fullPath -ItemType Directory | Out-Null
        Log-Message "Created directory: $dir"
    } else {
        Log-Message "Directory already exists: $dir" "DEBUG"
    }
}

# Step 3: Move Files Based on Extension
# Get all files in the root directory (non-recursive)
$files = Get-ChildItem -Path $rootDir -File

foreach ($file in $files) {
    $extension = $file.Extension.ToLower()

    if ($extensionMapping.ContainsKey($extension)) {
        $targetRelativeDir = $extensionMapping[$extension]
        $targetDir = Join-Path -Path $rootDir -ChildPath $targetRelativeDir

        # Ensure the target directory exists
        if (-not (Test-Path -Path $targetDir)) {
            New-Item -Path $targetDir -ItemType Directory | Out-Null
            Log-Message "Created directory: $targetRelativeDir"
        }

        # Define the destination path
        $destination = Join-Path -Path $targetDir -ChildPath $file.Name

        try {
            Move-Item -Path $file.FullName -Destination $destination -Force
            Log-Message "Moved file '$($file.Name)' to '$targetRelativeDir'"
        }
        catch {
            Log-Message "Failed to move '$($file.Name)': $_" "ERROR"
        }
    }
    else {
        Log-Message "No mapping for file '$($file.Name)'. Skipping." "DEBUG"
    }
}

# Step 4: Move Files from Subdirectories (Optional)
# If you have files within subdirectories that need to be moved, uncomment and adjust the following section.

<# 
$subFiles = Get-ChildItem -Path $rootDir -Recurse -File

foreach ($file in $subFiles) {
    $relativePath = $file.FullName.Substring($rootDir.Length).TrimStart('\')
    $extension = $file.Extension.ToLower()

    if ($extensionMapping.ContainsKey($extension)) {
        $targetRelativeDir = $extensionMapping[$extension]
        $targetDir = Join-Path -Path $rootDir -ChildPath $targetRelativeDir

        # Ensure the target directory exists
        if (-not (Test-Path -Path $targetDir)) {
            New-Item -Path $targetDir -ItemType Directory | Out-Null
            Log-Message "Created directory: $targetRelativeDir"
        }

        # Define the destination path
        $destination = Join-Path -Path $targetDir -ChildPath $file.Name

        try {
            Move-Item -Path $file.FullName -Destination $destination -Force
            Log-Message "Moved file '$($file.Name)' to '$targetRelativeDir'"
        }
        catch {
            Log-Message "Failed to move '$($file.Name)': $_" "ERROR"
        }
    }
}
#>

Log-Message "Project clean-up completed."