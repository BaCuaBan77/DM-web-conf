# System Restart Solution Summary

## Problem
Docker containers cannot reboot the host system. The original `reboot.sh` script failed because it was executed inside a Docker container, which doesn't have host system privileges.

## Solution
Implemented a **systemd-based monitoring service** that runs on the host system and watches for restart triggers from the containerized application.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Web UI (Browser)                                       │
│    ↓ User clicks "Save & Reboot"                        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Backend Container                                      │
│    ↓ Creates trigger file: /opt/dm/.reboot-trigger     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Host System (Debian)                                   │
│    ↓ dm-reboot-watcher.service detects trigger         │
│    ↓ Executes /opt/dm/reboot.sh (as root)              │
│    ├─ Restarts networking service                      │
│    └─ Restarts Docker service (all containers restart) │
└─────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Backend Service
**File:** `backend/src/main/java/com/observis/dmconfig/service/RebootService.java`

- Creates trigger file `/opt/dm/.reboot-trigger` when "Save & Reboot" is clicked
- No longer attempts to execute scripts directly (which would fail in container)

### 2. Systemd Watcher Service
**File:** `example-opt-dm/dm-reboot-watcher.service`

- Runs on host system as root
- Polls for `/opt/dm/.reboot-trigger` file every 2 seconds
- When detected, deletes trigger and executes restart script

### 3. Restart Script
**File:** `example-opt-dm/reboot.sh`

- Restarts networking service: `systemctl restart networking`
- Restarts Docker service: `systemctl restart docker` (all containers restart automatically)
- Logs all actions to `/opt/dm/reboot.log`

### 4. Sudoers Configuration
**File:** `example-opt-dm/dm-reboot-sudoers`

- Allows passwordless execution of:
  - `systemctl restart networking`
  - `systemctl restart docker`
  - `systemctl is-active docker`
  - `sbin/reboot` (for future full reboot option)

### 5. Installation Script
**File:** `install-reboot-watcher.sh`

- Automated installer for all components
- Validates configuration before enabling service

---

## Installation

### On Server

```bash
# 1. Copy installer to server
scp install-reboot-watcher.sh root@192.169.0.177:/tmp/

# 2. SSH to server
ssh root@192.169.0.177

# 3. Run installer
sudo bash /tmp/install-reboot-watcher.sh

# 4. Verify service is running
systemctl status dm-reboot-watcher.service
```

---

## Testing

### Manual Test (without UI)

```bash
# Create trigger file
echo "TEST" > /opt/dm/.reboot-trigger

# Wait 2-3 seconds

# Check log
cat /opt/dm/reboot.log
```

### Web UI Test

1. Access web UI: `http://192.169.0.177`
2. Make configuration change
3. Click "Save & Reboot"
4. Monitor logs:
   ```bash
   tail -f /opt/dm/reboot.log
   journalctl -u dm-reboot-watcher.service -f
   ```

---

## What Gets Restarted

| Trigger | Service Restart | Effect |
|---------|----------------|--------|
| Save & Reboot (any config) | `systemctl restart networking` | Applies network config changes |
| Save & Reboot (any config) | `systemctl restart docker` | Restarts all Docker containers with new configs |

**Note:** This does **NOT** perform a full system reboot. Only restarts necessary services.

---

## Logs

- **Restart script log:** `/opt/dm/reboot.log`
- **Systemd service log:** `journalctl -u dm-reboot-watcher.service`
- **Docker service log:** `journalctl -u docker`

---

## Benefits

✅ **Works from inside Docker container** - No host privileges needed
✅ **Fast** - Only restarts necessary services (~10 seconds)
✅ **Safe** - No full system reboot required
✅ **Logged** - All actions logged for troubleshooting
✅ **Automatic** - Systemd ensures service always runs

---

## Files Changed

### New Files
- `install-reboot-watcher.sh` - Installation script
- `example-opt-dm/dm-reboot-watcher.service` - Systemd service
- `example-opt-dm/dm-reboot-sudoers` - Sudo permissions

### Modified Files
- `example-opt-dm/reboot.sh` - Updated to restart Docker service
- `backend/src/main/java/com/observis/dmconfig/service/RebootService.java` - Creates trigger file
- `docker-compose.yml` - Mounts `/opt/dm` for trigger file
- `example-opt-dm/README.md` - Updated documentation

---

## Next Steps for User

1. **Copy installer to server**
   ```bash
   scp install-reboot-watcher.sh root@192.169.0.177:/tmp/
   ```

2. **Run installer on server**
   ```bash
   ssh root@192.169.0.177
   sudo bash /tmp/install-reboot-watcher.sh
   ```

3. **Test the functionality**
   - Create manual trigger: `echo "TEST" > /opt/dm/.reboot-trigger`
   - Check log: `cat /opt/dm/reboot.log`

4. **Test from Web UI**
   - Click "Save & Reboot"
   - Verify network and Docker restart

---

## Troubleshooting

**Service not running:**
```bash
systemctl status dm-reboot-watcher.service
journalctl -u dm-reboot-watcher.service -n 50
```

**Trigger not detected:**
```bash
ls -la /opt/dm/.reboot-trigger
journalctl -u dm-reboot-watcher.service -f
```

**Docker not restarting:**
```bash
systemctl status docker
sudo systemctl restart docker
```

