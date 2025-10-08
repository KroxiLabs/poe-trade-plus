# Build script for POE Trade Pack Kroximatuz extension (PowerShell version)
# This script creates a ZIP package ready for OperaGX addon submission

$ErrorActionPreference = "Stop"

Write-Host "=== POE Trade Pack Build Script ===" -ForegroundColor Blue

# Get version from manifest.json
$manifest = Get-Content -Path "manifest.json" | ConvertFrom-Json
$version = $manifest.version
Write-Host "Version: $version" -ForegroundColor Blue

# Create build directories
$buildDir = "build"
$distDir = "dist"

Write-Host "Cleaning previous build..." -ForegroundColor Blue
if (Test-Path $buildDir) {
    Remove-Item -Path $buildDir -Recurse -Force
}
if (Test-Path $distDir) {
    Remove-Item -Path $distDir -Recurse -Force
}
New-Item -Path $buildDir -ItemType Directory | Out-Null
New-Item -Path $distDir -ItemType Directory | Out-Null

# Validate manifest.json
Write-Host "Validating manifest.json..." -ForegroundColor Blue
try {
    $null = Get-Content -Path "manifest.json" | ConvertFrom-Json
    Write-Host "Valid manifest.json" -ForegroundColor Green
} catch {
    Write-Host "Error: manifest.json is not valid JSON" -ForegroundColor Red
    exit 1
}

# Copy extension files
Write-Host "Copying extension files..." -ForegroundColor Blue
$filesToCopy = @(
    "manifest.json",
    "cs.js",
    "bg.js",
    "Logo16x16.png",
    "Logo48x48.png",
    "Logo128x128.png"
)

foreach ($file in $filesToCopy) {
    Copy-Item -Path $file -Destination $buildDir
}

Write-Host "Files copied" -ForegroundColor Green

# Create ZIP package
$zipName = "poe-trade-pack-v$version.zip"
$zipPath = Join-Path $distDir $zipName
Write-Host "Creating ZIP package: $zipName" -ForegroundColor Blue

# Use .NET compression to create ZIP
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($buildDir, $zipPath)

Write-Host "ZIP package created" -ForegroundColor Green

# Show file size
$fileSize = (Get-Item $zipPath).Length
$fileSizeKB = [math]::Round($fileSize / 1KB, 2)

Write-Host "=== Build Complete ===" -ForegroundColor Green
Write-Host "Package: $zipPath" -ForegroundColor Green
Write-Host "Size: $fileSizeKB KB" -ForegroundColor Green
Write-Host "Ready to upload to OperaGX addon store!" -ForegroundColor Blue
