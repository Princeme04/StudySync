@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
title StudySync Launcher

echo.
echo ========================================
echo            StudySync Launcher
echo ========================================
echo.

where node.exe >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js was not found.
  echo Install Node.js 24 or newer, then run this file again.
  goto :failed
)

for /f "tokens=1 delims=." %%V in ('node -p "process.versions.node"') do set "NODE_MAJOR=%%V"
if !NODE_MAJOR! LSS 24 (
  echo [ERROR] StudySync requires Node.js 24 or newer.
  echo Current version:
  node --version
  goto :failed
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm was not found.
  echo Reinstall Node.js with npm included, then run this file again.
  goto :failed
)

if not exist "package.json" (
  echo [ERROR] package.json was not found in:
  echo %CD%
  goto :failed
)

if not exist "node_modules\" (
  echo [SETUP] Installing dependencies...
  call npm.cmd install
  if errorlevel 1 (
    echo [ERROR] Dependency installation failed.
    goto :failed
  )
)

call :port_open 3000
set "WEB_READY=!errorlevel!"
call :port_open 3001
set "API_READY=!errorlevel!"

if "!WEB_READY!"=="0" if "!API_READY!"=="0" (
  echo [READY] StudySync is already running.
  start "" "http://localhost:3000"
  exit /b 0
)

if "!WEB_READY!"=="0" if not "!API_READY!"=="0" (
  echo [ERROR] Port 3000 is already in use, but the StudySync API is not running.
  echo Close the application using port 3000, then try again.
  goto :failed
)

if "!API_READY!"=="0" if not "!WEB_READY!"=="0" (
  echo [ERROR] Port 3001 is already in use, but the StudySync frontend is not running.
  echo Close the application using port 3001, then try again.
  goto :failed
)

echo [START] Starting frontend and API...
start "StudySync Dev Server - close this window to stop" cmd /k "cd /d ""%~dp0"" && npm.cmd run dev"

for /l %%A in (1,1,45) do (
  call :port_open 3000
  set "WEB_READY=!errorlevel!"
  call :port_open 3001
  set "API_READY=!errorlevel!"
  if "!WEB_READY!"=="0" if "!API_READY!"=="0" goto :ready
  timeout /t 1 /nobreak >nul
)

echo [ERROR] StudySync did not become ready within 45 seconds.
echo Review the "StudySync Dev Server" window for the startup error.
goto :failed

:ready
echo [READY] Frontend: http://localhost:3000
echo [READY] API:      http://localhost:3001
start "" "http://localhost:3000"
endlocal
exit /b 0

:port_open
powershell.exe -NoProfile -Command "$client = New-Object Net.Sockets.TcpClient; try { $client.Connect('127.0.0.1', %~1); exit 0 } catch { exit 1 } finally { $client.Dispose() }" >nul 2>&1
exit /b %errorlevel%

:failed
echo.
pause
endlocal
exit /b 1
