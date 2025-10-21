#!/bin/bash
##############################################################################
# DM Restart Watcher Installation Script
# 
# This script installs and configures the systemd service that monitors
# for restart requests from the DM Web Configuration Tool.
#
# Usage: sudo ./install-reboot-watcher.sh
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: This script must be run as root${NC}"
    echo "Please run: sudo ./install-reboot-watcher.sh"
    exit 1
fi

echo "═══════════════════════════════════════════════════════════"
echo "  DM Restart Watcher Installation"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}Step 1: Installing reboot script${NC}"
echo "─────────────────────────────────────────────────────────"

# Ensure /opt/dm exists
mkdir -p /opt/dm

# Copy reboot script
if [ -f "$SCRIPT_DIR/example-opt-dm/reboot.sh" ]; then
    cp "$SCRIPT_DIR/example-opt-dm/reboot.sh" /opt/dm/reboot.sh
    chmod +x /opt/dm/reboot.sh
    echo -e "${GREEN}✓${NC} Installed /opt/dm/reboot.sh"
else
    echo -e "${RED}✗${NC} reboot.sh not found in $SCRIPT_DIR/example-opt-dm/"
    exit 1
fi
echo ""

echo -e "${BLUE}Step 2: Installing sudoers configuration${NC}"
echo "─────────────────────────────────────────────────────────"

# Copy sudoers configuration
if [ -f "$SCRIPT_DIR/example-opt-dm/dm-reboot-sudoers" ]; then
    cp "$SCRIPT_DIR/example-opt-dm/dm-reboot-sudoers" /etc/sudoers.d/dm-reboot
    chmod 0440 /etc/sudoers.d/dm-reboot
    
    # Validate sudoers file
    if visudo -c -f /etc/sudoers.d/dm-reboot >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Installed /etc/sudoers.d/dm-reboot"
    else
        echo -e "${RED}✗${NC} Sudoers configuration is invalid, removing..."
        rm -f /etc/sudoers.d/dm-reboot
        exit 1
    fi
else
    echo -e "${RED}✗${NC} dm-reboot-sudoers not found in $SCRIPT_DIR/example-opt-dm/"
    exit 1
fi
echo ""

echo -e "${BLUE}Step 3: Installing systemd service${NC}"
echo "─────────────────────────────────────────────────────────"

# Copy systemd service file
if [ -f "$SCRIPT_DIR/example-opt-dm/dm-reboot-watcher.service" ]; then
    cp "$SCRIPT_DIR/example-opt-dm/dm-reboot-watcher.service" /etc/systemd/system/
    echo -e "${GREEN}✓${NC} Installed /etc/systemd/system/dm-reboot-watcher.service"
else
    echo -e "${RED}✗${NC} dm-reboot-watcher.service not found in $SCRIPT_DIR/example-opt-dm/"
    exit 1
fi
echo ""

echo -e "${BLUE}Step 4: Enabling and starting service${NC}"
echo "─────────────────────────────────────────────────────────"

# Reload systemd
systemctl daemon-reload
echo -e "${GREEN}✓${NC} Reloaded systemd daemon"

# Enable service
systemctl enable dm-reboot-watcher.service
echo -e "${GREEN}✓${NC} Enabled dm-reboot-watcher.service"

# Start service
systemctl start dm-reboot-watcher.service
echo -e "${GREEN}✓${NC} Started dm-reboot-watcher.service"

# Check service status
sleep 1
if systemctl is-active --quiet dm-reboot-watcher.service; then
    echo -e "${GREEN}✓${NC} Service is running"
else
    echo -e "${RED}✗${NC} Service failed to start"
    echo ""
    echo "Service status:"
    systemctl status dm-reboot-watcher.service --no-pager
    exit 1
fi
echo ""

echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}  ✓ Installation Completed Successfully!${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Installed components:"
echo "  • /opt/dm/reboot.sh"
echo "  • /etc/sudoers.d/dm-reboot"
echo "  • /etc/systemd/system/dm-reboot-watcher.service"
echo ""
echo "Service status:"
systemctl status dm-reboot-watcher.service --no-pager | head -5
echo ""
echo "Next steps:"
echo "  1. Start your Docker containers"
echo "  2. Access the web UI"
echo "  3. Click 'Save & Reboot' - it will restart network + Docker"
echo ""
echo "To check logs:"
echo "  journalctl -u dm-reboot-watcher.service -f"
echo "  cat /opt/dm/reboot.log"
echo ""


