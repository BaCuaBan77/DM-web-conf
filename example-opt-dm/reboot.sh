#!/bin/bash
#
# Device Manager Restart Script
# 
# This script restarts network services and Docker containers
# when configuration changes are saved via the web UI.
#
# Location: /opt/dm/reboot.sh
# Permissions: Must be executable (chmod +x /opt/dm/reboot.sh)
# Called by: systemd dm-reboot-watcher.service (runs as root)
#

# Log file for restart operations
LOG_FILE="/opt/dm/reboot.log"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE" 2>/dev/null
}

log_message "========================================="
log_message "DM Restart Script Initiated"
log_message "Triggered by: DM Web Configuration Tool"
log_message "Executed by: systemd dm-reboot-watcher.service"
log_message "User: $(whoami)"
log_message "========================================="

# Wait for web response to complete
log_message "Waiting 3 seconds for web response to complete..."
sleep 3

# Sync filesystem to ensure all data is written
log_message "Syncing filesystem..."
sync

# Restart networking to apply network configuration changes
log_message "Restarting network service..."
if systemctl restart networking 2>&1 | tee -a "$LOG_FILE"; then
    log_message "✓ Network service restarted successfully"
else
    log_message "✗ Network service restart failed (may not be critical)"
fi

# Small delay to allow network to stabilize
sleep 2

# Restart Docker service to apply configuration changes
# This will restart all Docker containers automatically
log_message "Restarting Docker service..."

if systemctl restart docker 2>&1 | tee -a "$LOG_FILE"; then
    log_message "✓ Docker service restarted successfully"
    log_message "  All containers will restart automatically"
    
    # Wait for Docker to come back up
    sleep 5
    
    # Verify Docker is running
    if systemctl is-active --quiet docker; then
        log_message "✓ Docker service is active"
    else
        log_message "✗ Docker service failed to start"
    fi
else
    log_message "✗ Docker service restart failed"
fi

log_message "========================================="
log_message "DM Restart Script Completed Successfully"
log_message "========================================="

exit 0

