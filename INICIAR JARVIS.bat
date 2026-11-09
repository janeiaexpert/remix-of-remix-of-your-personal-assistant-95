@echo off
title Iniciando Jarvis...
color 0A

echo ========================================
echo INICIANDO JARVIS LOCAL
echo ========================================
echo.

echo Abrindo bridge (controle do PC)...
start cmd /k "cd /d ""C:\Users\Administrador\Projeto Lovable\remix-of-remix-of-your-personal-assistant-95"" && python agent/jarvis_agent.py"

timeout 5

echo Abrindo servidor do Jarvis...
start cmd /k "powershell -NoProfile -ExecutionPolicy Bypass -File ""C:\Users\Administrador\jarvis_scripts\iniciar_jarvis.ps1"""

echo.
echo ========================================
echo Pronto! Dois terminais abriram.
echo Aguarde aparecer algo como:
echo http://localhost:5173
echo Cole esse endereço no navegador.
echo ========================================
pause
