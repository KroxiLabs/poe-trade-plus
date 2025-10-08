#!/bin/bash

# Build script for POE Trade Pack Kroximatuz extension
# This script creates a ZIP package ready for OperaGX addon submission

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== POE Trade Pack Build Script ===${NC}"

# Get version from manifest.json
VERSION=$(grep -Po '"version":\s*"\K[^"]+' manifest.json)
echo -e "${BLUE}Version: ${VERSION}${NC}"

# Create build directory
BUILD_DIR="build"
DIST_DIR="dist"

echo -e "${BLUE}Cleaning previous build...${NC}"
rm -rf "$BUILD_DIR" "$DIST_DIR"
mkdir -p "$BUILD_DIR"
mkdir -p "$DIST_DIR"

# Validate manifest.json
echo -e "${BLUE}Validating manifest.json...${NC}"
if command -v jq &> /dev/null; then
    if ! jq empty manifest.json 2>/dev/null; then
        echo -e "${RED}Error: manifest.json is not valid JSON${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ manifest.json is valid${NC}"
else
    echo -e "${BLUE}Warning: jq not installed, skipping JSON validation${NC}"
fi

# Copy extension files
echo -e "${BLUE}Copying extension files...${NC}"
cp manifest.json "$BUILD_DIR/"
cp cs.js "$BUILD_DIR/"
cp bg.js "$BUILD_DIR/"
cp Logo16x16.png "$BUILD_DIR/"
cp Logo48x48.png "$BUILD_DIR/"
cp Logo128x128.png "$BUILD_DIR/"

echo -e "${GREEN}✓ Files copied${NC}"

# Create ZIP package
ZIP_NAME="poe-trade-pack-v${VERSION}.zip"
echo -e "${BLUE}Creating ZIP package: ${ZIP_NAME}${NC}"

cd "$BUILD_DIR"
zip -r "../$DIST_DIR/$ZIP_NAME" . -q
cd ..

echo -e "${GREEN}✓ ZIP package created${NC}"

# Show contents
echo -e "${BLUE}Package contents:${NC}"
unzip -l "$DIST_DIR/$ZIP_NAME"

# Get file size
FILE_SIZE=$(du -h "$DIST_DIR/$ZIP_NAME" | cut -f1)
echo -e "${GREEN}=== Build Complete ===${NC}"
echo -e "${GREEN}Package: ${DIST_DIR}/${ZIP_NAME}${NC}"
echo -e "${GREEN}Size: ${FILE_SIZE}${NC}"
echo -e "${BLUE}Ready to upload to OperaGX addon store!${NC}"
