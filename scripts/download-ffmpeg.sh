#!/bin/bash
# Download ffmpeg binary for the current platform (or all platforms with --all)

set -e

BINARIES_DIR="src-tauri/binaries"
mkdir -p "$BINARIES_DIR"

# Using BtbN FFmpeg builds - lightweight GPL builds
# https://github.com/BtbN/FFmpeg-Builds/releases

download_linux() {
    echo "Downloading ffmpeg for Linux x64..."
    TEMP_DIR=$(mktemp -d)
    curl -L -s "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz" \
        -o "$TEMP_DIR/ffmpeg.tar.xz"
    tar -xf "$TEMP_DIR/ffmpeg.tar.xz" -C "$TEMP_DIR"
    cp "$TEMP_DIR"/ffmpeg-master-latest-linux64-gpl/bin/ffmpeg "$BINARIES_DIR/ffmpeg-x86_64-unknown-linux-gnu"
    chmod +x "$BINARIES_DIR/ffmpeg-x86_64-unknown-linux-gnu"
    rm -rf "$TEMP_DIR"
}

download_macos_x64() {
    echo "Downloading ffmpeg for macOS x64..."
    TEMP_DIR=$(mktemp -d)
    # evermeet.cx provides macOS builds
    curl -L -s "https://evermeet.cx/ffmpeg/getrelease/zip" \
        -o "$TEMP_DIR/ffmpeg.zip"
    unzip -q "$TEMP_DIR/ffmpeg.zip" -d "$TEMP_DIR"
    cp "$TEMP_DIR/ffmpeg" "$BINARIES_DIR/ffmpeg-x86_64-apple-darwin"
    chmod +x "$BINARIES_DIR/ffmpeg-x86_64-apple-darwin"
    rm -rf "$TEMP_DIR"
}

download_macos_arm() {
    echo "Downloading ffmpeg for macOS ARM64..."
    TEMP_DIR=$(mktemp -d)
    # evermeet.cx provides universal/ARM builds
    curl -L -s "https://evermeet.cx/ffmpeg/getrelease/zip" \
        -o "$TEMP_DIR/ffmpeg.zip"
    unzip -q "$TEMP_DIR/ffmpeg.zip" -d "$TEMP_DIR"
    cp "$TEMP_DIR/ffmpeg" "$BINARIES_DIR/ffmpeg-aarch64-apple-darwin"
    chmod +x "$BINARIES_DIR/ffmpeg-aarch64-apple-darwin"
    rm -rf "$TEMP_DIR"
}

download_windows() {
    echo "Downloading ffmpeg for Windows x64..."
    TEMP_DIR=$(mktemp -d)
    curl -L -s "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip" \
        -o "$TEMP_DIR/ffmpeg.zip"
    unzip -q "$TEMP_DIR/ffmpeg.zip" -d "$TEMP_DIR"
    cp "$TEMP_DIR"/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe "$BINARIES_DIR/ffmpeg-x86_64-pc-windows-msvc.exe"
    rm -rf "$TEMP_DIR"
}

download_all() {
    echo "Downloading ffmpeg binaries for all platforms..."
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
            echo "Please download ffmpeg manually"
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
