#!/bin/bash
# Download yt-dlp binary for the current platform (or all platforms with --all)

set -e

BINARIES_DIR="src-tauri/binaries"
mkdir -p "$BINARIES_DIR"

download_linux() {
    echo "Downloading yt-dlp for Linux x64..."
    curl -L -s https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
        -o "$BINARIES_DIR/yt-dlp-x86_64-unknown-linux-gnu"
    chmod +x "$BINARIES_DIR/yt-dlp-x86_64-unknown-linux-gnu"
}

download_macos_x64() {
    echo "Downloading yt-dlp for macOS x64..."
    curl -L -s https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos \
        -o "$BINARIES_DIR/yt-dlp-x86_64-apple-darwin"
    chmod +x "$BINARIES_DIR/yt-dlp-x86_64-apple-darwin"
}

download_macos_arm() {
    echo "Downloading yt-dlp for macOS ARM64..."
    curl -L -s https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos \
        -o "$BINARIES_DIR/yt-dlp-aarch64-apple-darwin"
    chmod +x "$BINARIES_DIR/yt-dlp-aarch64-apple-darwin"
}

download_windows() {
    echo "Downloading yt-dlp for Windows x64..."
    curl -L -s https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe \
        -o "$BINARIES_DIR/yt-dlp-x86_64-pc-windows-msvc.exe"
}

download_all() {
    echo "Downloading yt-dlp binaries for all platforms..."
    download_linux
    download_macos_x64
    download_macos_arm
    download_windows
    echo "Done! Binaries downloaded to $BINARIES_DIR"
    ls -la "$BINARIES_DIR"
}

download_current() {
    OS="$(uname -s)"
    ARCH="$(uname -m)"

    case "$OS" in
        Linux*)
            download_linux
            ;;
        Darwin*)
            if [ "$ARCH" = "arm64" ]; then
                download_macos_arm
            else
                download_macos_x64
            fi
            ;;
        MINGW*|MSYS*|CYGWIN*)
            download_windows
            ;;
        *)
            echo "Unknown OS: $OS"
            echo "Please download yt-dlp manually from https://github.com/yt-dlp/yt-dlp/releases"
            exit 1
            ;;
    esac

    echo "Done! Binary downloaded to $BINARIES_DIR"
}

# Parse arguments
if [ "$1" = "--all" ]; then
    download_all
else
    download_current
fi
