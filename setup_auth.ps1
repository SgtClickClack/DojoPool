Write-Host "=== GitHub Authentication Setup ===" -ForegroundColor Green
Write-Host ""

# Show current Git configuration
Write-Host "Current Git configuration:" -ForegroundColor Yellow
$userName = git config --global user.name
$userEmail = git config --global user.email
Write-Host "Username: $userName"
Write-Host "Email: $userEmail"
Write-Host ""

# Test authentication
Write-Host "Testing connection to GitHub repository..." -ForegroundColor Yellow
try {
    $result = git ls-remote https://github.com/SgtClickClack/DojoPool.git --heads 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Authentication successful!" -ForegroundColor Green
        Write-Host "You can now run: git pull" -ForegroundColor Green
    } else {
        Write-Host "❌ Authentication failed" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error testing authentication: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Authentication Instructions ===" -ForegroundColor Cyan
Write-Host "If authentication failed, follow these steps:"
Write-Host "1. Go to GitHub.com and sign in"
Write-Host "2. Go to Settings → Developer settings → Personal access tokens"
Write-Host "3. Click 'Generate new token (classic)'"
Write-Host "4. Give it a name like 'DojoPool Development'"
Write-Host "5. Select scopes: repo, workflow, write:packages"
Write-Host "6. Copy the generated token"
Write-Host "7. When Git prompts for credentials:"
Write-Host "   - Username: your GitHub username"
Write-Host "   - Password: use the token instead of your password"
Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "After setting up authentication, run: git pull" 