@echo off
chcp 65001 >nul
title TikTok LIVE Düğün, Halay, Sıra Gecesi & Horon Oyunları Başlatıcı
cd /d "%~dp0"

:MENU
cls
echo ====================================================================
echo   🎉 TikTok LIVE Geleneksel Eğlence, Düğün ve Halay Oyunları 🎉
echo ====================================================================
echo.
echo   [1] 💍 Canlı Düğün (2B)            - Port 3000  (canli-dugun)
echo   [2] 🌶️ Sıra Gecesi (3B Orijinal)   - Port 3100  (sira-gecesi)
echo   [3] 🪔 Sıra Gecesi v2 (3B Yeni)    - Port 3200  (sira-gecesi-v2)
echo   [4] 🕯️ Kına Gecesi (3B Varyant)    - Port 3300  (kina-gecesi)
echo   [5] 🥁 Köy Düğünü (3B Varyant)     - Port 3400  (koy-dugunu)
echo   [6] 🎻 Karadeniz Horonu (3B)       - Port 3500  (horon)
echo   [7] 🎭 3B Karakter Önizleme        - Port 3100  (karakter.html)
echo   [0] Çıkış
echo.
echo ====================================================================
set /p SECIM="Başlatmak istediğiniz oyunun numarasını yazıp ENTER'a basın (0-7): "

if "%SECIM%"=="1" (
  cd /d "%~dp0canli-dugun"
  call BASLAT.bat
  goto MENU
)
if "%SECIM%"=="2" (
  cd /d "%~dp0sira-gecesi"
  call BASLAT.bat
  goto MENU
)
if "%SECIM%"=="3" (
  cd /d "%~dp0sira-gecesi-v2"
  call BASLAT.bat
  goto MENU
)
if "%SECIM%"=="4" (
  cd /d "%~dp0kina-gecesi"
  call BASLAT.bat
  goto MENU
)
if "%SECIM%"=="5" (
  cd /d "%~dp0koy-dugunu"
  call BASLAT.bat
  goto MENU
)
if "%SECIM%"=="6" (
  cd /d "%~dp0horon"
  call BASLAT.bat
  goto MENU
)
if "%SECIM%"=="7" (
  cd /d "%~dp0sira-gecesi"
  start "" "http://localhost:3100/karakter.html"
  node server.js
  goto MENU
)
if "%SECIM%"=="0" exit /b 0

echo Geçersiz seçim, lütfen 0 ile 7 arasında bir numara girin.
timeout /t 2 >nul
goto MENU
