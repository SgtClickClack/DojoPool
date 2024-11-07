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
       "assets\audio",
       "docs",
       "archives",
       "config"
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
       ".json" = "src"
       ".docx" = "docs"
       ".txt"  = "docs"
       ".rar"  = "archives"
       ".ini"  = "config"
       ".coverage" = "docs"  # New mapping for coverage files
       ".gitignore" = "config"  # New mapping for gitignore files
       ".gitmodules" = "config"  # New mapping for gitmodules files
       ".code-workspace" = "docs"  # New mapping for workspace files
       ".toml" = "config"  # New mapping for toml files
   }

   # Step 3: Move Files Based on Extension
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

   Log-Message "Project clean-up completed."