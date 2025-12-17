#!/bin/bash

################################################################################
#                                                                              #
#  AIDA Installation Script - Mac/Linux                                       #
#                                                                              #
################################################################################
#
# PURPOSE:
#   First-time installation script for AIDA on macOS and Linux systems.
#   Installs dependencies and sets up the AIDA folder structure and database.
#
# USAGE:
#   ./install.sh
#
# REQUIREMENTS:
#   - Bun runtime (https://bun.sh)
#
# STEPS:
#   1. Check if Bun is installed
#   2. Install npm dependencies (in .system/ directory)
#   3. Configure paths (PKM data location and local system files)
#   4. Run the TypeScript setup script to create folders and initialize database
#
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Header
echo -e "${BLUE}"
echo "╔═════════════════════════════════════════════════════════════════════════════╗"
echo "║                   AIDA INSTALLATION - Mac/Linux                            ║"
echo "╚═════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Bun is installed
echo -e "${BLUE}[1/4] Checking for Bun runtime...${NC}"
if ! command -v bun &> /dev/null; then
    echo -e "${RED}✗ Bun is not installed${NC}"
    echo ""
    echo "Please install Bun first:"
    echo "  curl -fsSL https://bun.sh/install | bash"
    echo ""
    echo "Or visit: https://bun.sh"
    exit 1
fi

BUN_VERSION=$(bun --version)
echo -e "${GREEN}✓ Bun found (version ${BUN_VERSION})${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}[2/4] Installing dependencies...${NC}"
cd .system
if bun install; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi
cd ..
echo ""

# Create configuration
echo -e "${BLUE}[3/4] Configuring AIDA paths...${NC}"
if [ ! -f ".system/config/aida-paths.json" ]; then
    echo "AIDA uses separated folder structure:"
    echo "  • System files: This directory (Git repo)"
    echo "  • PKM data: External folder (e.g., OneDrive)"
    echo ""
    read -p "Enter PKM data path (e.g., ~/OneDrive/AIDA-PKM): " PKM_PATH

    # Expand tilde to home directory
    PKM_PATH="${PKM_PATH/#\~/$HOME}"

    # Create config directory
    mkdir -p .system/config

    # Create config file
    cat > .system/config/aida-paths.json << EOF
{
  "_meta": {
    "version": "1.0"
  },
  "paths": {
    "pkm_root": "$PKM_PATH",
    "local_root": "$(pwd)"
  }
}
EOF

    echo -e "${GREEN}✓ Config created${NC}"
    echo "  PKM data will be stored in: $PKM_PATH"
    echo "  System files remain in: $(pwd)"
else
    echo -e "${GREEN}✓ Configuration already exists${NC}"
fi
echo ""

# Run setup script
echo -e "${BLUE}[4/4] Running setup script...${NC}"
if bun run .system/tools/setup.ts; then
    echo -e "${GREEN}✓ Setup completed successfully${NC}"
else
    echo -e "${RED}✗ Setup failed${NC}"
    exit 1
fi

# Success
echo ""
echo -e "${GREEN}"
echo "╔═════════════════════════════════════════════════════════════════════════════╗"
echo "║                    INSTALLATION COMPLETE                                    ║"
echo "╚═════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo "AIDA is now installed and ready to use!"
echo ""
