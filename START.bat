@echo off
chcp 65001 >nul
echo ==========================================
echo  🚀 Skill-E - Iniciar Aplicação
echo ==========================================
echo.

:: Configurar PATH do Rust se existir
if exist "%USERPROFILE%\.cargo\bin\cargo.exe" (
    set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"
    echo ✅ Rust PATH configurado
)

:: Configurar PATH do LLVM se existir
if exist "C:\Program Files\LLVM\bin\clang.exe" (
    set "PATH=C:\Program Files\LLVM\bin;%PATH%"
    echo ✅ LLVM PATH configurado
)

:: Verificar se node existe
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo.
    echo Por favor, instale o Node.js:
    echo https://nodejs.org/
    echo.
    echo Ou execute: winget install OpenJS.NodeJS.LTS
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
node --version
echo.

:: Navegar para pasta do projeto
cd /d "%~dp0skill-e"

:: Verificar se node_modules existe
if not exist "node_modules" (
    echo 📦 Instalando dependências...
    echo Isso pode levar alguns minutos...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Falha ao instalar dependências
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas!
    echo.
)

:: Iniciar aplicação
echo ==========================================
echo  🌐 Iniciando Skill-E...
echo ==========================================
echo.
echo Acesse: http://localhost:5173
echo.
echo Pressione Ctrl+C para parar
echo.

npm run dev

echo.
pause
