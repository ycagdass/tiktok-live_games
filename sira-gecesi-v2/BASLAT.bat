@echo off
cd /d "%~dp0"
title Sira Gecesi v2 (Port 3200)

start "Sira Gecesi v2 - SUNUCU" cmd /k node server.js
timeout /t 2 /nobreak >nul

set "SAHNE=http://localhost:3200/?clean"
set "PROFIL=%~dp0.sahne-tarayici"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%CHROME%" (
  start "" "%CHROME%" --app="%SAHNE%" --user-data-dir="%PROFIL%" --window-size=608,1080 --window-position=0,0 --autoplay-policy=no-user-gesture-required --no-first-run --no-default-browser-check
) else (
  start "" "%SAHNE%"
)

start "" "http://localhost:3200/"
