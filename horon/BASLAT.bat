@echo off
chcp 65001 >nul
title TikTok Karadeniz Horonu (Port 3500)
cd /d "%~dp0"

set URL=http://localhost:3500/?clean

start "" cmd /c "timeout /t 2 >nul & if exist ""%ProgramFiles%\Google\Chrome\Application\chrome.exe"" (start """" ""%ProgramFiles%\Google\Chrome\Application\chrome.exe"" --app=%URL% --window-size=540,960) else if exist ""%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"" (start """" ""%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"" --app=%URL% --window-size=540,960) else if exist ""%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"" (start """" ""%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"" --app=%URL% --window-size=540,960) else if exist ""%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"" (start """" ""%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"" --app=%URL% --window-size=540,960) else (start """" %URL%)"

node server.js
pause
