@echo off
echo === GitHub Authentication Setup ===
echo.
echo Current Git configuration:
git config --global user.name
git config --global user.email
echo.
echo === Testing Authentication ===
echo Testing connection to GitHub repository...
git ls-remote https://github.com/SgtClickClack/DojoPool.git --heads
echo.
echo === Authentication Instructions ===
echo If authentication failed, follow these steps:
echo 1. Go to GitHub.com and sign in
echo 2. Go to Settings ^> Developer settings ^> Personal access tokens
echo 3. Click "Generate new token (classic)"
echo 4. Give it a name like "DojoPool Development"
echo 5. Select scopes: repo, workflow, write:packages
echo 6. Copy the generated token
echo 7. When Git prompts for credentials:
echo    - Username: your GitHub username
echo    - Password: use the token instead of your password
echo.
echo === Next Steps ===
echo After setting up authentication, run: git pull
pause 