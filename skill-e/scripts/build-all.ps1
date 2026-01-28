# Skill-E Build Script (Windows)
# Builds the frontend and Tauri application for Windows

param(
    [switch]$Debug,
    [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Skill-E Build Script (Windows)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if pnpm is installed
try {
    $pnpmVersion = pnpm --version
    Write-Host "✓ pnpm version: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: pnpm is not installed" -ForegroundColor Red
    Write-Host "  Please install pnpm: npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

# Check if Rust is installed
try {
    $rustVersion = rustc --version
    Write-Host "✓ Rust: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Rust is not installed" -ForegroundColor Red
    Write-Host "  Please install Rust: https://rustup.rs/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 1: Build Frontend
if (-not $SkipFrontend) {
    Write-Host "[1/2] Building frontend..." -ForegroundColor Cyan
    Write-Host "--------------------------------------" -ForegroundColor Gray
    
    try {
        pnpm build
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend build failed"
        }
        Write-Host ""
        Write-Host "✓ Frontend build complete" -ForegroundColor Green
    } catch {
        Write-Host ""
        Write-Host "✗ Frontend build failed: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[1/2] Skipping frontend build (--SkipFrontend)" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Build Tauri
Write-Host "[2/2] Building Tauri application..." -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Gray

$buildArgs = @()
if ($Debug) {
    $buildArgs += "--debug"
    Write-Host "Building in DEBUG mode" -ForegroundColor Yellow
} else {
    Write-Host "Building in RELEASE mode" -ForegroundColor Green
}

try {
    pnpm tauri build @buildArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Tauri build failed"
    }
    Write-Host ""
    Write-Host "✓ Tauri build complete" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "✗ Tauri build failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Display output location
$buildMode = if ($Debug) { "debug" } else { "release" }
$bundlePath = "src-tauri\target\$buildMode\bundle"

if (Test-Path $bundlePath) {
    Write-Host "Output location:" -ForegroundColor Cyan
    Write-Host "  $bundlePath" -ForegroundColor White
    Write-Host ""
    
    # List MSI files if they exist
    $msiFiles = Get-ChildItem -Path "$bundlePath\msi" -Filter "*.msi" -ErrorAction SilentlyContinue
    if ($msiFiles) {
        Write-Host "Installers created:" -ForegroundColor Cyan
        foreach ($file in $msiFiles) {
            $size = [math]::Round($file.Length / 1MB, 2)
            Write-Host "  • $($file.Name) ($size MB)" -ForegroundColor White
        }
    }
    
    # List NSIS installers if they exist
    $nsisFiles = Get-ChildItem -Path "$bundlePath\nsis" -Filter "*.exe" -ErrorAction SilentlyContinue
    if ($nsisFiles) {
        Write-Host ""
        Write-Host "NSIS Installers:" -ForegroundColor Cyan
        foreach ($file in $nsisFiles) {
            $size = [math]::Round($file.Length / 1MB, 2)
            Write-Host "  • $($file.Name) ($size MB)" -ForegroundColor White
        }
    }
} else {
    Write-Host "Warning: Bundle directory not found at $bundlePath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "To install, run the MSI file from the bundle directory." -ForegroundColor Gray
Write-Host ""
