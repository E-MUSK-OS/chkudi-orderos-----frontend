@echo off
title LabelCraft Helper Uninstaller
color 0C

echo ==========================================
echo LabelCraft Print Helper - Uninstall
echo ==========================================
echo.

echo [1/3] Stopping background services...
taskkill /F /IM printer-helper.exe /T >nul 2>&1

echo [2/3] Removing scheduled tasks and startup entries...
schtasks /Delete /TN "LabelCraftWatchdog" /F >nul 2>&1
schtasks /Delete /TN "LabelCraftLogon" /F >nul 2>&1
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\LabelCraftLauncher.vbs" (
    del /F /Q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\LabelCraftLauncher.vbs" >nul 2>&1
)

echo [3/3] Deleting files...
set "INSTALL_DIR=%LOCALAPPDATA%\LabelCraftHelper"
if exist "%INSTALL_DIR%" (
    rmdir /S /Q "%INSTALL_DIR%" >nul 2>&1
)

echo.
echo ==========================================
echo [SUCCESS] Uninstalled successfully!
echo ==========================================
pause
