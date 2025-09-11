@echo off
echo 🚀 Starting DojoPool servers...

echo Starting backend API server...
start cmd /k "cd services\api && npm run start:dev"

timeout /t 3 /nobreak > nul

echo Starting frontend web server...
start cmd /k "cd apps\web && npm run dev"

echo ⏳ Servers are starting up...
echo Backend API: http://localhost:3002
echo Frontend Web: http://localhost:3000

echo 📊 Checking server status in 10 seconds...
timeout /t 10 /nobreak > nul

echo Testing backend connection...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3002/health' -Method GET -TimeoutSec 5; echo '✅ Backend API server is running' } catch { echo '❌ Backend API server not responding' }"

echo Testing frontend connection...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -Method GET -TimeoutSec 5; echo '✅ Frontend web server is running' } catch { echo '❌ Frontend web server not responding' }"

echo 🎉 Setup complete! Check the opened command windows for server output.
echo 🌐 Access your DojoPool app at: http://localhost:3000
echo Press any key to close this window...
pause > nul
