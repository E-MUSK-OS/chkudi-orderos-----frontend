@echo off
title LabelCraft Helper Installer
color 0A

:: Force the script to execute in its current folder
cd /d "%~dp0"

echo ==========================================
echo LabelCraft Print Helper - Worker PC Install
echo ==========================================
echo.

:: 1. Check if exe exists
if not exist "printer-helper.exe" (
    color 0C
    echo [ERROR] printer-helper.exe is MISSING!
    echo Put 'printer-helper.exe' in this exact folder before running.
    echo.
    pause
    exit /b
)
if not exist "watchdog.vbs" (
    color 0C
    echo [ERROR] watchdog.vbs is MISSING!
    echo Put 'watchdog.vbs' in this exact folder before running.
    echo.
    pause
    exit /b
)

echo [1/5] Stopping existing tasks and cleaning up...
taskkill /F /IM printer-helper.exe /T >nul 2>&1
:: Remove old Startup script if it exists
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\LabelCraftLauncher.vbs" (
    del /F /Q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\LabelCraftLauncher.vbs"
)
:: Delete old tasks if they exist
schtasks /Delete /TN "LabelCraftWatchdog" /F >nul 2>&1
schtasks /Delete /TN "LabelCraftLogon" /F >nul 2>&1

:: 2. Create Directory
set "INSTALL_DIR=%LOCALAPPDATA%\LabelCraftHelper"
echo [2/5] Preparing folder at %INSTALL_DIR%...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%INSTALL_DIR%\logs" mkdir "%INSTALL_DIR%\logs"

:: 3. Copy Files
echo [3/5] Copying engine and watchdog...
copy /Y "printer-helper.exe" "%INSTALL_DIR%\printer-helper.exe" >nul
copy /Y "watchdog.vbs" "%INSTALL_DIR%\watchdog.vbs" >nul

:: Verify the copy
if not exist "%INSTALL_DIR%\printer-helper.exe" (
    color 0C
    echo.
    echo [FATAL ERROR] The copy failed! 
    echo Windows Defender blocked the file. Unblock it in Windows Security.
    echo.
    pause
    exit /b
)

:: 4. Create Scheduled Tasks
echo [4/5] Registering background services...
:: Run watchdog every 2 minutes
schtasks /Create /TN "LabelCraftWatchdog" /SC MINUTE /MO 2 /TR "wscript.exe \"%INSTALL_DIR%\watchdog.vbs\"" /F >nul 2>&1
:: Run watchdog at logon
schtasks /Create /TN "LabelCraftLogon" /SC ONLOGON /TR "wscript.exe \"%INSTALL_DIR%\watchdog.vbs\"" /F >nul 2>&1

echo.
echo ==========================================
echo [SUCCESS] Installed on Worker PC!
echo ==========================================
echo [5/5] Waking up the background helper now...

:: Launch it right now using the watchdog script
wscript.exe "%INSTALL_DIR%\watchdog.vbs"

echo.
echo The helper is now running invisibly. You can close this window.