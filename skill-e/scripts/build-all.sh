#!/bin/bash
# Skill-E Build Script (Unix: macOS/Linux)
# Builds the frontend and Tauri application

set -e

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
GRAY='\033[0;90m'
WHITE='\033[0;37m'
NC='\033[0m' # No Color

# Parse arguments
DEBUG=false
SKIP_FRONTEND=false
TARGET=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --debug)
            DEBUG=true
            shift
            ;;
        --skip-frontend)
            SKIP_FRONTEND=true
            shift
            ;;
        --target)
            TARGET="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 [--debug] [--skip-frontend] [--target TARGET]"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Skill-E Build Script (Unix)${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}✗ Error: pnpm is not installed${NC}"
    echo -e "${YELLOW}  Please install pnpm: npm install -g pnpm${NC}"
    exit 1
fi

PNPM_VERSION=$(pnpm --version)
echo -e "${GREEN}✓ pnpm version: $PNPM_VERSION${NC}"

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo -e "${RED}✗ Error: Rust is not installed${NC}"
    echo -e "${YELLOW}  Please install Rust: https://rustup.rs/${NC}"
    exit 1
fi

RUST_VERSION=$(rustc --version)
echo -e "${GREEN}✓ Rust: $RUST_VERSION${NC}"

echo ""

# Step 1: Build Frontend
if [ "$SKIP_FRONTEND" = false ]; then
    echo -e "${CYAN}[1/2] Building frontend...${NC}"
    echo -e "${GRAY}--------------------------------------${NC}"
    
    if pnpm build; then
        echo ""
        echo -e "${GREEN}✓ Frontend build complete${NC}"
    else
        echo ""
        echo -e "${RED}✗ Frontend build failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}[1/2] Skipping frontend build (--skip-frontend)${NC}"
fi

echo ""

# Step 2: Build Tauri
echo -e "${CYAN}[2/2] Building Tauri application...${NC}"
echo -e "${GRAY}--------------------------------------${NC}"

BUILD_ARGS=()
if [ "$DEBUG" = true ]; then
    BUILD_ARGS+=("--debug")
    echo -e "${YELLOW}Building in DEBUG mode${NC}"
else
    echo -e "${GREEN}Building in RELEASE mode${NC}"
fi

if [ -n "$TARGET" ]; then
    BUILD_ARGS+=("--target" "$TARGET")
    echo -e "${CYAN}Target: $TARGET${NC}"
fi

if pnpm tauri build "${BUILD_ARGS[@]}"; then
    echo ""
    echo -e "${GREEN}✓ Tauri build complete${NC}"
else
    echo ""
    echo -e "${RED}✗ Tauri build failed${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}  Build Complete!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Display output location
if [ "$DEBUG" = true ]; then
    BUILD_MODE="debug"
else
    BUILD_MODE="release"
fi

BUNDLE_PATH="src-tauri/target/$BUILD_MODE/bundle"

if [ -d "$BUNDLE_PATH" ]; then
    echo -e "${CYAN}Output location:${NC}"
    echo -e "${WHITE}  $BUNDLE_PATH${NC}"
    echo ""
    
    # Detect platform and show relevant files
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if [ -d "$BUNDLE_PATH/dmg" ]; then
            echo -e "${CYAN}DMG files created:${NC}"
            for file in "$BUNDLE_PATH/dmg"/*.dmg; do
                if [ -f "$file" ]; then
                    SIZE=$(du -h "$file" | cut -f1)
                    echo -e "${WHITE}  • $(basename "$file") ($SIZE)${NC}"
                fi
            done
        fi
        
        if [ -d "$BUNDLE_PATH/macos" ]; then
            echo ""
            echo -e "${CYAN}App bundles:${NC}"
            for file in "$BUNDLE_PATH/macos"/*.app; do
                if [ -d "$file" ]; then
                    SIZE=$(du -sh "$file" | cut -f1)
                    echo -e "${WHITE}  • $(basename "$file") ($SIZE)${NC}"
                fi
            done
        fi
    else
        # Linux
        if [ -d "$BUNDLE_PATH/appimage" ]; then
            echo -e "${CYAN}AppImage files created:${NC}"
            for file in "$BUNDLE_PATH/appimage"/*.AppImage; do
                if [ -f "$file" ]; then
                    SIZE=$(du -h "$file" | cut -f1)
                    echo -e "${WHITE}  • $(basename "$file") ($SIZE)${NC}"
                fi
            done
        fi
        
        if [ -d "$BUNDLE_PATH/deb" ]; then
            echo ""
            echo -e "${CYAN}Debian packages:${NC}"
            for file in "$BUNDLE_PATH/deb"/*.deb; do
                if [ -f "$file" ]; then
                    SIZE=$(du -h "$file" | cut -f1)
                    echo -e "${WHITE}  • $(basename "$file") ($SIZE)${NC}"
                fi
            done
        fi
    fi
else
    echo -e "${YELLOW}Warning: Bundle directory not found at $BUNDLE_PATH${NC}"
fi

echo ""

# Platform-specific installation instructions
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${GRAY}To install, open the DMG file and drag Skill-E to Applications.${NC}"
else
    echo -e "${GRAY}To install, run the AppImage or install the .deb package.${NC}"
fi

echo ""
