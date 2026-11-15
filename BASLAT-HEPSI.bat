@echo off
cd /d "%~dp0"
title TikTok LIVE Dugun, Halay, Sira Gecesi ve Horon Oyunlari

:MENU
cls
echo ====================================================================
echo   TikTok LIVE Geleneksel Eglence, Dugun ve Halay Oyunlari
echo ====================================================================
echo.
echo   [1] Canli Dugun (2B)            - Port 3000  (canli-dugun)
echo   [2] Sira Gecesi (3B Orijinal)   - Port 3100  (sira-gecesi)
echo   [3] Sira Gecesi v2 (3B Yeni)    - Port 3200  (sira-gecesi-v2)
echo   [4] Kina Gecesi (3B Varyant)    - Port 3300  (kina-gecesi)
echo   [5] Koy Dugunu (3B Varyant)     - Port 3400  (koy-dugunu)
echo   [6] Karadeniz Horonu (3B)       - Port 3500  (horon)
echo   [7] 3B Karakter Onizleme        - Port 3100  (karakter.html)
echo   [0] Cikis
echo.
echo ====================================================================
set "SECIM="
set /p SECIM="Baslatmak istediginiz oyunun numarasini yazip ENTER'a basin (0-7): "

if "%SECIM%"=="1" (
  pushd "canli-dugun"
  call BASLAT.bat
  popd
  goto MENU
)
if "%SECIM%"=="2" (
  pushd "sira-gecesi"
  call BASLAT.bat
  popd
  goto MENU
)
if "%SECIM%"=="3" (
  pushd "sira-gecesi-v2"
  call BASLAT.bat
  popd
  goto MENU
)
if "%SECIM%"=="4" (
  pushd "kina-gecesi"
  call BASLAT.bat
  popd
  goto MENU
)
if "%SECIM%"=="5" (
  pushd "koy-dugunu"
  call BASLAT.bat
  popd
  goto MENU
)
if "%SECIM%"=="6" (
  pushd "horon"
  call BASLAT.bat
  popd
  goto MENU
)
if "%SECIM%"=="7" (
  pushd "sira-gecesi"
  start "Sira Gecesi - SUNUCU" cmd /k node server.js
  timeout /t 2 /nobreak >nul
  start "" "http://localhost:3100/karakter.html"
  popd
  goto MENU
)
if "%SECIM%"=="0" exit /b 0

echo.
echo Gecersiz secim, lutfen 0 ile 7 arasinda bir numara girin.
timeout /t 2 >nul
goto MENU
