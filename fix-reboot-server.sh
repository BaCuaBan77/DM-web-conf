#!/bin/bash
##############################################################################
# Quick Fix for Reboot Script on Server
# Run this ON THE SERVER: sudo bash fix-reboot-server.sh
##############################################################################

echo "════════════════════════════════════════════════════════════"
echo "  Fixing Reboot Script on Debian Server"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "ERROR: This script must be run as root"
    echo "Please run: sudo bash fix-reboot-server.sh"
    exit 1
fi

# Step 1: Update reboot.sh with fixed version
echo "Step 1: Updating /opt/dm/reboot.sh..."
cat > /opt/dm/reboot.sh << 'REBOOT_SCRIPT'
#!/bin/bash
# DM Reboot Script (Fixed Version)

# Log file (in /opt/dm/ instead of /var/log/)
LOG_FILE="/opt/dm/reboot.log"

# Create log file if it doesn't exist
touch "$LOG_FILE" 2>/dev/null || LOG_FILE="/tmp/dm-reboot.log"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_message "========================================="
log_message "DM Reboot Script Initiated"
log_message "Triggered by: DM Web Configuration Tool"
log_message "User: $(whoami)"
log_message "========================================="

# Add delay to allow web response to complete
log_message "Waiting 3 seconds for web response to complete..."
sleep 3

# Sync filesystem
log_message "Syncing filesystem..."
sync

# Log the reboot command
log_message "Executing system reboot..."

# Execute reboot with sudo
sudo /sbin/reboot

# If sudo reboot fails, try without sudo
if [ $? -ne 0 ]; then
    log_message "sudo reboot failed, trying direct reboot..."
    /sbin/reboot
fi

# This line will only be reached if reboot fails
log_message "ERROR: Reboot command failed!"
exit 1
REBOOT_SCRIPT

chmod +x /opt/dm/reboot.sh
echo "✓ Updated /opt/dm/reboot.sh"
echo ""

# Step 2: Create sudoers configuration
echo "Step 2: Installing sudoers configuration..."
cat > /etc/sudoers.d/dm-reboot << 'SUDOERS'
# Allow all users to execute reboot without password
# Required for DM Web Configuration Tool
ALL ALL=(ALL) NOPASSWD: /sbin/reboot
SUDOERS

chmod 0440 /etc/sudoers.d/dm-reboot
echo "✓ Created /etc/sudoers.d/dm-reboot"
echo ""

# Step 3: Validate sudoers file
echo "Step 3: Validating sudoers configuration..."
if visudo -c -f /etc/sudoers.d/dm-reboot >/dev/null 2>&1; then
    echo "✓ Sudoers configuration is valid"
else
    echo "✗ Sudoers configuration is INVALID - removing it"
    rm -f /etc/sudoers.d/dm-reboot
    exit 1
fi
echo ""

# Step 4: Test (optional - will show what would happen)
echo "Step 4: Testing configuration..."
echo "  → Script location: $(ls -la /opt/dm/reboot.sh)"
echo "  → Sudoers file: $(ls -la /etc/sudoers.d/dm-reboot)"
echo "  → Can execute sudo reboot: $(sudo -n /sbin/reboot --help 2>&1 | head -1)"
echo ""

echo "════════════════════════════════════════════════════════════"
echo "  ✓ Reboot Script Fixed Successfully!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "To test (WARNING: WILL REBOOT THE SYSTEM):"
echo "  sudo /opt/dm/reboot.sh"
echo ""
echo "After reboot, check the log:"
echo "  cat /opt/dm/reboot.log"
echo ""

