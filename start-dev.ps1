# Skill-E Development Starter
# This script starts the Tauri development server

$ErrorActionPreference = "Stop"

# Colors
$Cyan = "Cyan"
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              🚀 Skill-E Development Mode                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor $Cyan

Write-Host ""

# Check prerequisites
Write-Host "🔍 Verificando pré-requisitos..." -ForegroundColor $Cyan

function Test-Command($Command) {
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

$hasRust = Test-Command "rustc"
$hasCargo = Test-Command "cargo"
$hasNode = Test-Command "node"
$hasPnpm = Test-Command "pnpm"

if (-not $hasRust) {
    Write-Host "❌ Rust não encontrado!" -ForegroundColor $Red
    Write-Host "   Execute primeiro: .\setup-and-build.ps1" -ForegroundColor $Yellow
    exit 1
}

if (-not $hasCargo) {
    Write-Host "❌ Cargo não encontrado!" -ForegroundColor $Red
    Write-Host "   Rust está instalado mas Cargo não está no PATH" -ForegroundColor $Yellow
    Write-Host "   Reinicie o terminal ou execute: .\setup-and-build.ps1" -ForegroundColor $Yellow
    exit 1
}

if (-not $hasNode) {
    Write-Host "❌ Node.js não encontrado!" -ForegroundColor $Red
    Write-Host "   Execute primeiro: .\setup-and-build.ps1" -ForegroundColor $Yellow
    exit 1
}

if (-not $hasPnpm) {
    Write-Host "📦 Instalando pnpm..." -ForegroundColor $Yellow
    npm install -g pnpm
}

Write-Host "  ✅ Rust: $(rustc --version)" -ForegroundColor $Green
Write-Host "  ✅ Cargo: $(cargo --version)" -ForegroundColor $Green
Write-Host "  ✅ Node: $(node --version)" -ForegroundColor $Green
Write-Host "  ✅ pnpm: $(pnpm --version)" -ForegroundColor $Green
Write-Host ""

# Navigate to project
$skillEPath = Join-Path $PSScriptRoot "skill-e"

if (-not (Test-Path $skillEPath)) {
    Write-Host "❌ Pasta skill-e não encontrada!" -ForegroundColor $Red
    exit 1
}

Set-Location $skillEPath

# Check node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor $Yellow
    pnpm install
    Write-Host ""
}

# Check if first build
$hasBuild = Test-Path "src-tauri\target"

if (-not $hasBuild) {
    Write-Host @"
⚠️  PRIMEIRA EXECUÇÃO DETECTADA

   A primeira compilação do Rust pode demorar 5-10 minutos.
   Isso é normal - está baixando e compilando dependências.

   Por favor, seja paciente...

"@ -ForegroundColor $Yellow
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $Cyan
Write-Host ""
Write-Host "  🚀 Iniciando Skill-E em modo desenvolvimento..." -ForegroundColor $Green
Write-Host ""
Write-Host "  ⌨️  Atalhos durante gravação:" -ForegroundColor $Cyan
Write-Host "     Ctrl+Shift+R - Iniciar/Parar gravação" -ForegroundColor White
Write-Host "     Esc - Parar gravação" -ForegroundColor White
Write-Host ""
Write-Host "  🛑 Para parar: Ctrl+C" -ForegroundColor $Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $Cyan
Write-Host ""

# Start Tauri dev
pnpm tauri dev
