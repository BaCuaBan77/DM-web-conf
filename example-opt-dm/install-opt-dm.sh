#!/bin/bash

##############################################################################
# Installation Script for DM-Web-Conf Production Configuration
# 
# This script copies the example configuration files to /opt/dm/
# and sets the proper permissions for production use.
#
# Usage: sudo ./install-opt-dm.sh
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: This script must be run as root${NC}"
    echo "Please run: sudo ./install-opt-dm.sh"
    exit 1
fi

echo "═══════════════════════════════════════════════════════════"
echo "  DM-Web-Conf Production Configuration Installer"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST_DIR="/opt/dm"

echo "Source: $SCRIPT_DIR"
echo "Destination: $DEST_DIR"
echo ""

# Check if /opt/dm already exists
if [ -d "$DEST_DIR" ]; then
    echo -e "${YELLOW}Warning: $DEST_DIR already exists${NC}"
    echo ""
    echo "Options:"
    echo "  1) Backup and replace (recommended)"
    echo "  2) Merge (keep existing, add new)"
    echo "  3) Cancel"
    echo ""
    read -p "Choose option [1-3]: " choice
    
    case $choice in
        1)
            BACKUP_DIR="${DEST_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
            echo -e "${GREEN}Creating backup: $BACKUP_DIR${NC}"
            cp -r "$DEST_DIR" "$BACKUP_DIR"
            rm -rf "$DEST_DIR"
            ;;
        2)
            echo -e "${YELLOW}Merging configurations...${NC}"
            ;;
        3)
            echo "Installation cancelled."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Installation cancelled.${NC}"
            exit 1
            ;;
    esac
fi

# Create destination directory
echo -e "${GREEN}Creating directory structure...${NC}"
mkdir -p "$DEST_DIR/devices.d"

# Copy configuration files
echo -e "${GREEN}Copying configuration files...${NC}"
cp "$SCRIPT_DIR/devices.json" "$DEST_DIR/" 2>/dev/null || true
cp "$SCRIPT_DIR/config.properties" "$DEST_DIR/" 2>/dev/null || true
cp "$SCRIPT_DIR/devices.d/"*.json "$DEST_DIR/devices.d/" 2>/dev/null || true

# Set ownership
echo -e "${GREEN}Setting ownership...${NC}"
chown -R root:root "$DEST_DIR"

# Set permissions
echo -e "${GREEN}Setting permissions...${NC}"
chmod 755 "$DEST_DIR"
chmod 755 "$DEST_DIR/devices.d"
find "$DEST_DIR" -type f -exec chmod 644 {} \;

# Verify installation
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Installation Summary"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check files
EXPECTED_FILES=(
    "devices.json"
    "config.properties"
    "devices.d/IBAC.json"
    "devices.d/S900.json"
    "devices.d/oritestgtdb.json"
    "devices.d/wxt53x.json"
)

MISSING_FILES=0
for file in "${EXPECTED_FILES[@]}"; do
    if [ -f "$DEST_DIR/$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (missing)"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

echo ""
echo "Directory structure:"
ls -lAh "$DEST_DIR"
echo ""
echo "Device configurations:"
ls -lAh "$DEST_DIR/devices.d"
echo ""

if [ $MISSING_FILES -eq 0 ]; then
    # Make reboot.sh executable
    if [ -f "$DEST_DIR/reboot.sh" ]; then
        echo "Making reboot.sh executable..."
        chmod +x "$DEST_DIR/reboot.sh"
        echo -e "${GREEN}✓ reboot.sh is now executable${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✓ Installation completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review and customize configuration files in $DEST_DIR"
    echo "  2. Start the backend with SPRING_PROFILES_ACTIVE=prod"
    echo "  3. Access the web UI at http://<device-ip>:3000"
    echo ""
else
    echo -e "${YELLOW}⚠ Installation completed with $MISSING_FILES missing file(s)${NC}"
    echo "Please check the source directory for missing files."
    exit 1
fi

echo "═══════════════════════════════════════════════════════════"

