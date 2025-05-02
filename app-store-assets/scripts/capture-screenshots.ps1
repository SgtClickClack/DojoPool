# DojoPool Screenshot Capture Helper
# This script helps organize and name screenshots for App Store submission

$screenshotDir = "app-store-assets/screenshots"
$screenshots = @(
    @{name="home-screen"; description="Home Screen"},
    @{name="game-play"; description="Game Play"},
    @{name="tournament-view"; description="Tournament View"},
    @{name="profile-social"; description="Profile & Social"},
    @{name="venue-map"; description="Venue Map"},
    @{name="wallet-marketplace"; description="Wallet & Marketplace"}
)

$devices = @(
    @{name="iphone-6.7"; width=1290; height=2796},
    @{name="iphone-5.5"; width=1242; height=2208}
)

# Create directories if they don't exist
foreach ($device in $devices) {
    $deviceDir = "$screenshotDir/$($device.name)"
    if (-not (Test-Path $deviceDir)) {
        New-Item -ItemType Directory -Path $deviceDir -Force
    }
}

# Generate screenshot naming guide
$guide = "Screenshot Naming Guide`n`n"

# Add iPhone 6.7" section
$guide += "iPhone 6.7 Display (1290 x 2796)`n"
foreach ($screenshot in $screenshots) {
    $guide += "- $($screenshot.name).png - $($screenshot.description)`n"
}

# Add iPhone 5.5" section
$guide += "`niPhone 5.5 Display (1242 x 2208)`n"
foreach ($screenshot in $screenshots) {
    $guide += "- $($screenshot.name).png - $($screenshot.description)`n"
}

# Add guidelines
$guide += @"

Screenshot Guidelines:
1. Use high-quality screenshots
2. Ensure text is readable
3. Show key features clearly
4. Maintain consistent branding
5. Follow Apple's design guidelines

Required Screenshots:
- Home Screen: Show main dashboard
- Game Play: Show active game with AI tracking
- Tournament View: Show tournament brackets
- Profile & Social: Show user profile and social features
- Venue Map: Show map with nearby venues
- Wallet & Marketplace: Show wallet and marketplace features
"@

# Save the guide
$guide | Out-File "$screenshotDir/README.md" -Encoding UTF8

Write-Host "Screenshot guide generated at $screenshotDir/README.md"
Write-Host "Please follow the guide to capture and organize your screenshots" 