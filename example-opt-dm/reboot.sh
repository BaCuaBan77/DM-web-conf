#!/bin/bash
#
# Device Manager Reboot Script
# 
# This script is executed when the DM-web-conf application
# needs to reboot the system (e.g., after network configuration changes).
#
# Location: /opt/dm/reboot.sh
# Permissions: Must be executable (chmod +x /opt/dm/reboot.sh)
#

# Log file for reboot operations
LOG_FILE="/var/log/dm-reboot.log"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

log_message "========================================="
log_message "DM Reboot Script Initiated"
log_message "Triggered by: DM Web Configuration Tool"
log_message "========================================="

# Optional: Add delay to allow web response to complete
log_message "Waiting 3 seconds for web response to complete..."
sleep 3

# Optional: Stop any critical services gracefully before reboot
# log_message "Stopping DM services..."
# systemctl stop dm-backend.service || true
# systemctl stop dm-frontend.service || true

# Optional: Sync filesystem to ensure all data is written
log_message "Syncing filesystem..."
sync

# Log the reboot command
log_message "Executing system reboot..."

# Execute the actual reboot command
# Use 'sudo reboot' if the script runs as non-root user
# Or just 'reboot' if the script runs as root
/sbin/reboot

# This line will never be reached (system will reboot)
log_message "ERROR: Reboot command failed!"
exit 1

