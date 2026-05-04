@echo off
chcp 65001 >nul
title 课堂电子宠物系统

echo ====================================
echo    课堂电子宠物系统 启动器
echo ====================================
echo.

:: 获取当前目录
set "CURRENT_DIR=%~dp0"

:: 启动 HTTP 服务器
echo [1/2] 启动本地服务器...
start "PetServer" cmd /c "cd /d "%CURRENT_DIR%" && python -m http.server 5500"

:: 等待服务器启动
timeout /t 2 /nobreak >nul

:: 打开浏览器
echo [2/2] 打开浏览器...
start http://localhost:5500/

echo.
echo ====================================
echo    系统已启动！
echo    访问地址: http://localhost:5500/
echo.
echo    关闭窗口即可关闭服务器
echo ====================================
echo.

:: 保持窗口打开
pause
