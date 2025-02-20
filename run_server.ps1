# PowerShell script to run DojoPool server
$env:PYTHONPATH = "."
$env:FLASK_APP = "src/dojopool/app.py"
$env:FLASK_ENV = "development"
$env:DOJOPOOL_HOST = "0.0.0.0"
$env:DOJOPOOL_PORT = "8080"

Write-Host "Starting DojoPool server..."
Write-Host "Press Ctrl+C to stop the server"

python src/dojopool/server.py 