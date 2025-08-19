# DojoPool App Icon Generator
# This script requires ImageMagick to be installed
# Install with: winget install ImageMagick

$sourceIcon = "app-store-assets/icons/source/icon-1024.png"
$outputDir = "app-store-assets/icons"

# Check if source icon exists
if (-not (Test-Path $sourceIcon)) {
    Write-Host "Error: Source icon not found at $sourceIcon"
    Write-Host "Please place a 1024x1024 PNG icon at $sourceIcon"
    exit 1
}

# Create output directories if they don't exist
$sizes = @(
    @{size=1024; name="app-store"},
    @{size=180; name="iphone"},
    @{size=167; name="ipad-pro"},
    @{size=152; name="ipad"},
    @{size=120; name="iphone"},
    @{size=87; name="iphone-spotlight"},
    @{size=80; name="iphone-spotlight"},
    @{size=60; name="iphone-settings"},
    @{size=58; name="settings"},
    @{size=40; name="spotlight"},
    @{size=29; name="settings"}
)

foreach ($icon in $sizes) {
    $outputPath = "$outputDir/icon-{0}x{0}.png" -f $icon.size
    Write-Host "Generating $($icon.name) icon ($($icon.size)x$($icon.size))..."
    
    # Use ImageMagick to resize the icon
    magick convert $sourceIcon -resize "$($icon.size)x$($icon.size)" $outputPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Created $outputPath"
    } else {
        Write-Host "✗ Failed to create $outputPath"
    }
}

Write-Host "`nIcon generation complete!"
Write-Host "Please verify all icons in $outputDir" 