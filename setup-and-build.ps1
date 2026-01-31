# Setup Completo + Build - Skill-E
# Instala tudo e gera o instalador Windows

$ErrorActionPreference = "Stop"

Write-Host "=============================================="
Write-Host "     Skill-E - Setup Completo + Build"
Write-Host "=============================================="
Write-Host ""
Write-Host "Este script vai:"
Write-Host "  1. Verificar/Instalar Rust"
Write-Host "  2. Verificar/Instalar LLVM (libclang)"
Write-Host "  3. Instalar dependencias Node"
Write-Host "  4. Buildar o projeto"
Write-Host "  5. Gerar instalador Windows"
Write-Host ""

# ============================================
# ETAPA 1: VERIFICAR RUST
# ============================================
Write-Host "=============================================="
Write-Host "ETAPA 1: Verificando Rust..."
Write-Host "=============================================="

$cargoBin = "$env:USERPROFILE\.cargo\bin"
$cargoExe = "$cargoBin\cargo.exe"

# Verificar se Rust esta instalado
$rustInstalled = Test-Path $cargoExe

if ($rustInstalled) {
    Write-Host "OK Rust encontrado!" -ForegroundColor Green
    $env:PATH = "$cargoBin;$env:PATH"
    
    # Verificar se funciona
    try {
        $version = rustc --version 2>$null
        Write-Host "   $version" -ForegroundColor Gray
    } catch {
        Write-Host "Adicionando ao PATH..." -ForegroundColor Yellow
        $env:PATH = "$cargoBin;$env:PATH"
    }
} else {
    Write-Host "ERRO Rust nao encontrado" -ForegroundColor Red
    Write-Host "Instalando Rust..." -ForegroundColor Yellow
    Write-Host ""
    
    # Baixar e instalar rustup
    $rustupUrl = "https://win.rustup.rs/x86_64"
    $rustupInstaller = "$env:TEMP\rustup-init.exe"
    
    try {
        Invoke-WebRequest -Uri $rustupUrl -OutFile $rustupInstaller -UseBasicParsing
        Write-Host "Executando instalador Rust..." -ForegroundColor Cyan
        Write-Host "(Selecione a opcao 1 - Default Installation)" -ForegroundColor Yellow
        Write-Host ""
        
        & $rustupInstaller -y
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK Rust instalado!" -ForegroundColor Green
            $env:PATH = "$cargoBin;$env:PATH"
        } else {
            throw "Instalacao falhou"
        }
    } catch {
        Write-Host "ERRO Falha ao instalar Rust" -ForegroundColor Red
        Write-Host ""
        Write-Host "Instale manualmente:" -ForegroundColor Yellow
        Write-Host "1. Baixe: https://win.rustup.rs/" -ForegroundColor White
        Write-Host "2. Execute como Administrador" -ForegroundColor White
        Write-Host "3. Selecione opcao 1 (Default)" -ForegroundColor White
        Write-Host "4. Reinicie o computador" -ForegroundColor White
        Write-Host "5. Execute este script novamente" -ForegroundColor White
        exit 1
    }
}

# ============================================
# ETAPA 2: VERIFICAR LLVM
# ============================================
Write-Host ""
Write-Host "=============================================="
Write-Host "ETAPA 2: Verificando LLVM (libclang)..."
Write-Host "=============================================="

$llvmPath = "C:\Program Files\LLVM\bin"
$clangExe = "$llvmPath\clang.exe"

$llvmInstalled = Test-Path $clangExe

if ($llvmInstalled) {
    Write-Host "OK LLVM encontrado!" -ForegroundColor Green
    if ($env:PATH -notlike "*$llvmPath*") {
        $env:PATH = "$llvmPath;$env:PATH"
        [Environment]::SetEnvironmentVariable("LIBCLANG_PATH", $llvmPath, "User")
    }
} else {
    Write-Host "ATENCAO LLVM nao encontrado (necessario para Whisper)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Deseja instalar LLVM agora? (S/N)" -ForegroundColor Cyan
    $response = Read-Host
    
    if ($response -eq 'S' -or $response -eq 's') {
        Write-Host "Baixando LLVM..." -ForegroundColor Cyan
        $llvmUrl = "https://github.com/llvm/llvm-project/releases/download/llvmorg-17.0.6/LLVM-17.0.6-win64.exe"
        $llvmInstaller = "$env:TEMP\LLVM-17.0.6-win64.exe"
        
        try {
            Invoke-WebRequest -Uri $llvmUrl -OutFile $llvmInstaller -UseBasicParsing
            Write-Host "Executando instalador LLVM..." -ForegroundColor Cyan
            Write-Host "   Marque 'Add to PATH' durante a instalacao!" -ForegroundColor Yellow
            
            & $llvmInstaller
            
            Write-Host ""
            Write-Host "IMPORTANTE: Apos instalar o LLVM:" -ForegroundColor Red -BackgroundColor Yellow
            Write-Host "   1. Complete a instalacao do LLVM" -ForegroundColor Yellow
            Write-Host "   2. FECHE este PowerShell" -ForegroundColor Yellow
            Write-Host "   3. Abra um NOVO PowerShell como Administrador" -ForegroundColor Yellow
            Write-Host "   4. Execute novamente: .\setup-and-build.ps1" -ForegroundColor Yellow
            Write-Host ""
            Read-Host "Pressione Enter para sair"
            exit 0
        } catch {
            Write-Host "ERRO Falha ao baixar LLVM" -ForegroundColor Red
            Write-Host "Baixe manualmente: https://github.com/llvm/llvm-project/releases" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Continuando sem LLVM..." -ForegroundColor Yellow
        Write-Host "   O build pode falhar se usar Whisper local." -ForegroundColor Yellow
    }
}

# ============================================
# ETAPA 3: DEPENDENCIAS NODE
# ============================================
Write-Host ""
Write-Host "=============================================="
Write-Host "ETAPA 3: Instalando dependencias Node..."
Write-Host "=============================================="

Set-Location "$PSScriptRoot\skill-e"

if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Cyan
    
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm install
    } elseif (Get-Command npm -ErrorAction SilentlyContinue) {
        npm install
    } else {
        Write-Host "ERRO npm/pnpm nao encontrado" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "OK Dependencias instaladas!" -ForegroundColor Green
} else {
    Write-Host "OK node_modules ja existe" -ForegroundColor Green
}

# ============================================
# ETAPA 4: BUILD
# ============================================
Write-Host ""
Write-Host "=============================================="
Write-Host "ETAPA 4: Buildando Skill-E..."
Write-Host "=============================================="
Write-Host ""
Write-Host "Isso pode levar 10-30 minutos na primeira vez..." -ForegroundColor Yellow
Write-Host ""

try {
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm tauri build
    } else {
        npm run tauri build
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "OK BUILD CONCLUIDO!" -ForegroundColor Green
    } else {
        throw "Build falhou"
    }
} catch {
    Write-Host ""
    Write-Host "ERRO BUILD FALHOU" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possiveis causas:" -ForegroundColor Yellow
    Write-Host "  - Visual Studio Build Tools nao instalado" -ForegroundColor White
    Write-Host "  - LLVM nao instalado corretamente" -ForegroundColor White
    Write-Host ""
    Write-Host "Solucao:" -ForegroundColor Yellow
    Write-Host "  1. Instale VS Build Tools:" -ForegroundColor White
    Write-Host "     https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor White
    Write-Host "     Selecione: Desktop development with C++" -ForegroundColor White
    Write-Host ""
    Write-Host "  2. Instale LLVM:" -ForegroundColor White
    Write-Host "     https://github.com/llvm/llvm-project/releases" -ForegroundColor White
    Write-Host "     Baixe: LLVM-17.0.6-win64.exe" -ForegroundColor White
    exit 1
}

# ============================================
# ETAPA 5: VERIFICAR OUTPUT
# ============================================
Write-Host ""
Write-Host "=============================================="
Write-Host "ETAPA 5: Verificando instaladores gerados..."
Write-Host "=============================================="

$msiPath = "src-tauri\target\release\bundle\msi\Skill-E_0.1.0_x64_en-US.msi"
$exePath = "src-tauri\target\release\bundle\nsis\Skill-E_0.1.0_x64-setup.exe"
$portablePath = "src-tauri\target\release\Skill-E.exe"

Write-Host ""
$foundAny = $false

if (Test-Path $msiPath) {
    $fullPath = Resolve-Path $msiPath
    Write-Host "OK MSI: $fullPath" -ForegroundColor Green
    $foundAny = $true
}

if (Test-Path $exePath) {
    $fullPath = Resolve-Path $exePath
    Write-Host "OK EXE: $fullPath" -ForegroundColor Green
    $foundAny = $true
}

if (Test-Path $portablePath) {
    Write-Host "OK Portable: $portablePath" -ForegroundColor Green
}

if (-not $foundAny) {
    Write-Host "ATENCAO Nenhum instalador encontrado no caminho esperado" -ForegroundColor Yellow
    Write-Host "   Verifique: src-tauri\target\release\bundle\" -ForegroundColor Yellow
}

# ============================================
# FIM
# ============================================
Write-Host ""
Write-Host "=============================================="
Write-Host ""
Write-Host "  SUCESSO PROCESSO CONCLUIDO!" -ForegroundColor Green
Write-Host ""
Write-Host "  O Skill-E foi buildado com sucesso!" -ForegroundColor White
Write-Host ""
Write-Host "  Proximos passos:" -ForegroundColor Cyan
Write-Host "  1. Copie o arquivo .msi ou .exe gerado" -ForegroundColor White
Write-Host "  2. Distribua para teste" -ForegroundColor White
Write-Host "  3. Ou execute diretamente o .exe portable" -ForegroundColor White
Write-Host ""
Write-Host "=============================================="
Write-Host ""

Set-Location $PSScriptRoot
Read-Host "Pressione Enter para sair"
