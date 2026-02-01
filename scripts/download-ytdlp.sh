#!/bin/bash
# Download yt-dlp binaries for all platforms

set -e

BINARIES_DIR="src-tauri/binaries"
mkdir -p "$BINARIES_DIR"

echo "Downloading yt-dlp binaries..."

# Linux x64
echo "  - Linux x64..."
curl -L -s https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o "$BINARIES_DIR/yt-dlp-x86_64-unknown-linux-gnu"
chmod +x "$BINARIES_DIR/yt-dlp-x86_64-unknown-linux-gnu"

# macOS x64 (Intel)
echo "  - macOS x64..."
curl -L -s https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos \
  -o "$BINARIES_DIR/yt-dlp-x86_64-apple-darwin"
chmod +x "$BINARIES_DIR/yt-dlp-x86_64-apple-darwin"

# macOS ARM64 (Apple Silicon)
echo "  - macOS ARM64..."
curl -L -s https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos \
  -o "$BINARIES_DIR/yt-dlp-aarch64-apple-darwin"
chmod +x "$BINARIES_DIR/yt-dlp-aarch64-apple-darwin"

# Windows x64
echo "  - Windows x64..."
curl -L -s https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe \
  -o "$BINARIES_DIR/yt-dlp-x86_64-pc-windows-msvc.exe"

echo "Done! Binaries downloaded to $BINARIES_DIR"
ls -la "$BINARIES_DIR"
