@echo off
echo ==========================================
echo  Corrigindo permissoes do Rust
echo ==========================================
echo.

:: Verificar se esta rodando como administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Execute este script como Administrador!
    echo.
    echo Clique direito no arquivo -
    echo "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo Etapa 1: Encerrando processos do Rust...
taskkill /F /IM rustup.exe 2>nul
taskkill /F /IM cargo.exe 2>nul
taskkill /F /IM rustc.exe 2>nul
taskkill /F /IM rust-analyzer.exe 2>nul
echo OK
echo.

echo Etapa 2: Corrigindo permissoes da pasta .cargo...
if exist "%USERPROFILE%\.cargo" (
    takeown /F "%USERPROFILE%\.cargo" /R /D Y >nul 2>&1
    icacls "%USERPROFILE%\.cargo" /grant "%USERNAME%:(OI)(CI)F" /T >nul 2>&1
    echo OK
) else (
    echo Pasta .cargo nao existe - ignorando
)
echo.

echo Etapa 3: Renomeando instalacao parcial (se existir)...
if exist "%USERPROFILE%\.cargo" (
    rename "%USERPROFILE%\.cargo" ".cargo.old.%random%"
    echo Pasta renomeada para .cargo.old
) else (
    echo OK - pasta nao existe
)
echo.

echo ==========================================
echo  LIMPEZA CONCLUIDA!
echo ==========================================
echo.
echo Agora voce pode instalar o Rust novamente.
echo.
echo Opcoes:
echo 1. Execute setup-and-build.ps1 no PowerShell
echo 2. Ou baixe manualmente: https://win.rustup.rs/
echo.
pause
