#!/bin/bash

echo "=== Monero Hunter v2 - Intel Mac Setup ==="
echo ""

# Step 1: Check for Node
echo "Step 1: Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing via Homebrew..."
    
    # Remove any corrupted Node installations
    sudo rm -rf /usr/local/bin/node /usr/local/bin/npm /usr/local/bin/npx 2>/dev/null
    sudo rm -rf /usr/local/Cellar/node* 2>/dev/null
    sudo rm -rf /usr/local/lib/node_modules 2>/dev/null
    
    # Install Node via Homebrew
    brew update
    brew install node
fi

# Step 2: Verify installation
echo ""
echo "Step 2: Verifying installation..."
node --version
npm --version

# Step 3: Clean project
echo ""
echo "Step 3: Cleaning project..."
cd "$(dirname "$0")"
rm -rf node_modules package-lock.json dist .vite
npm cache clean --force

# Step 4: Install project dependencies
echo ""
echo "Step 4: Installing project dependencies..."
npm install

# Step 5: Verify build
echo ""
echo "Step 5: Testing build..."
npm run build:renderer

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "To start the app in development mode, run:"
echo "  npm run dev"
echo ""
echo "To build for production:"
echo "  npm run electron:build"
echo ""
