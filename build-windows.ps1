# Build Script para Windows - Skill-E
# Gera instalador MSI/NSIS completo

$ErrorActionPreference = "Stop"

$ProductName = "Skill-E"
$Version = "0.1.0"

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              🚀 Skill-E - Build para Windows                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host ""
Write-Host "Versão: $Version" -ForegroundColor Gray
Write-Host ""

# Verificar se Rust está instalado (mesmo que não esteja no PATH)
$cargoPath = "$env:USERPROFILE\.cargo\bin\cargo.exe"
if (Test-Path $cargoPath) {
    Write-Host "🔧 Rust encontrado! Configurando PATH..." -ForegroundColor Cyan
    $env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
}

# Verificar pré-requisitos
Write-Host "🔍 Verificando pré-requisitos..." -ForegroundColor Cyan

function Test-Command($Command) {
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

$checks = @{
    "Node.js" = { Test-Command "node" }
    "pnpm" = { Test-Command "pnpm" }
    "Rust" = { Test-Command "rustc" }
    "Cargo" = { Test-Command "cargo" }
}

$allOk = $true
foreach ($check in $checks.GetEnumerator()) {
    $name = $check.Key
    $test = $check.Value
    
    if (& $test) {
        Write-Host "  ✅ $name" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $name - NÃO ENCONTRADO" -ForegroundColor Red
        $allOk = $false
    }
}

if (-not $allOk) {
    Write-Host ""
    Write-Host "❌ Pré-requisitos faltando!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instale:" -ForegroundColor Yellow
    Write-Host "  1. Node.js: winget install OpenJS.NodeJS.LTS" -ForegroundColor White
    Write-Host "  2. Rust: https://rustup.rs/" -ForegroundColor White
    Write-Host "  3. pnpm: npm install -g pnpm" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "📦 Etapa 1: Instalando dependências Node..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot\skill-e"

if (-not (Test-Path "node_modules")) {
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Falha ao instalar dependências Node" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✅ node_modules já existe" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔨 Etapa 2: Build TypeScript..." -ForegroundColor Cyan

pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha no build TypeScript" -ForegroundColor Red
    exit 1
}

Write-Host "  ✅ Build TypeScript completo" -ForegroundColor Green

Write-Host ""
Write-Host "⚙️  Etapa 3: Build Rust + Tauri..." -ForegroundColor Cyan
Write-Host "   Isso pode levar 5-15 minutos na primeira vez..." -ForegroundColor Yellow
Write-Host ""

# Build do Tauri
pnpm tauri build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Falha no build Tauri" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possíveis causas:" -ForegroundColor Yellow
    Write-Host "  - Visual Studio Build Tools não instalado" -ForegroundColor White
    Write-Host "  - LLVM (libclang) não instalado" -ForegroundColor White
    Write-Host ""
    Write-Host "Solução:" -ForegroundColor Yellow
    Write-Host "  1. Instale VS Build Tools:" -ForegroundColor White
    Write-Host "     https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor White
    Write-Host "  2. Instale LLVM:" -ForegroundColor White
    Write-Host "     https://github.com/llvm/llvm-project/releases" -ForegroundColor White
Write-Host "     Baixe: LLVM-17.0.6-win64.exe" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "✅ Build completo!" -ForegroundColor Green

# Verificar instaladores gerados
$msiPath = "src-tauri\target\release\bundle\msi\Skill-E_$Version`_x64_en-US.msi"
$nsisPath = "src-tauri\target\release\bundle\nsis\Skill-E_$Version`_x64-setup.exe"
$exePath = "src-tauri\target\release\Skill-E.exe"

Write-Host ""
Write-Host "📁 Instaladores gerados:" -ForegroundColor Cyan

if (Test-Path $msiPath) {
    Write-Host "  ✅ MSI: $msiPath" -ForegroundColor Green
    $msiFullPath = Resolve-Path $msiPath
}

if (Test-Path $nsisPath) {
    Write-Host "  ✅ NSIS: $nsisPath" -ForegroundColor Green
    $nsisFullPath = Resolve-Path $nsisPath
}

if (Test-Path $exePath) {
    Write-Host "  ✅ EXE: $exePath" -ForegroundColor Green
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  🎉 BUILD CONCLUÍDO!" -ForegroundColor Green
Write-Host ""

if ($msiFullPath) {
    Write-Host "  Instalador MSI: $msiFullPath" -ForegroundColor White
}
if ($nsisFullPath) {
    Write-Host "  Instalador NSIS: $nsisFullPath" -ForegroundColor White
}

Write-Host ""
Write-Host "  Para instalar nos jurados, copie o arquivo .msi ou .exe" -ForegroundColor Yellow
Write-Host "  e execute para instalar o Skill-E." -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Set-Location $PSScriptRoot
