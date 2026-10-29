@echo off
setlocal
cd /d "%~dp0"
title Atlas da Seguranca Publica - Brasil

echo.
echo ==============================================
echo        ATLAS DA SEGURANCA PUBLICA
echo ==============================================
echo.
echo Este programa abre o painel somente neste computador.
echo Nenhuma instalacao da aplicacao e necessaria.
echo.

where py >nul 2>nul
if %errorlevel%==0 goto PY_LAUNCHER
where python >nul 2>nul
if %errorlevel%==0 goto PY_COMMAND

echo ERRO: Python nao foi encontrado neste computador.
echo Instale o Python 3 em https://www.python.org/downloads/
echo Depois, clique novamente neste arquivo.
echo.
pause
exit /b 1

:PY_LAUNCHER
set "ATLAS_PYTHON=py -3"
goto START_SERVER

:PY_COMMAND
set "ATLAS_PYTHON=python"

:START_SERVER
echo O Atlas vai abrir no navegador em instantes.
echo Endereco local: http://127.0.0.1:8765/
echo.
echo IMPORTANTE: deixe esta janela aberta enquanto usa o Atlas.
echo Para encerrar, pressione Ctrl+C e confirme.
echo.
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:8765/"
%ATLAS_PYTHON% -m http.server 8765 --bind 127.0.0.1 --directory dist

echo.
echo O servidor local foi encerrado.
pause
