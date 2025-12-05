@echo off
color 0A
title INSTALADOR DO PAULINHO

echo ==========================================
echo      1. VERIFICANDO BIBLIOTECAS PYTHON...
echo ==========================================

:: Tenta instalar as dependencias (flask, yt-dlp, etc)
pip install flask flask-cors yt-dlp

echo.
echo ==========================================
echo      2. VERIFICANDO FFMPEG (AUDIO/VIDEO)...
echo ==========================================

:: Chama o script Python que baixa o FFmpeg se nao tiver
python instalar_ffmpeg.py

cls
echo ==========================================
echo    TUDO PRONTO! INICIANDO SERVIDOR...
echo ==========================================
echo.
echo    Lembre-se: O servidor esta na porta 5001.
echo.

:: Inicia o servidor Python
python servidor.py

:: Se der erro e o servidor fechar, isso mantem a janela aberta
echo.
echo ==========================================
echo    O SERVIDOR FECHOU OU DEU ERRO!
echo ==========================================
pause