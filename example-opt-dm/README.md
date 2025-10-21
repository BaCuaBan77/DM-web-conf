# Production Configuration Directory Example

This directory structure represents the **production configuration layout** for the DM-Web-Conf application.

## Directory Structure

```
/opt/dm/
├── devices.json           # Device Manager configuration
├── config.properties      # MQTT broker settings
├── reboot.sh             # System reboot script
└── devices.d/             # Device-specific configurations
    ├── IBAC.json         # IBAC2 device (Serial)
    ├── S900.json         # S900 device (Network)
    ├── oritestgtdb.json  # GTD Module-B (Network)
    └── wxt53x.json       # WXT53X weather station (Serial)
```

## Installation to Production

### Option 1: Manual Copy (Recommended for first-time setup)

```bash
# Copy the entire directory structure to /opt/dm
sudo cp -r example-opt-dm/* /opt/dm/

# Set proper permissions
sudo chown -R root:root /opt/dm
sudo chmod 755 /opt/dm
sudo chmod 755 /opt/dm/devices.d
sudo chmod 644 /opt/dm/*.json
sudo chmod 644 /opt/dm/*.properties
sudo chmod 644 /opt/dm/devices.d/*.json
sudo chmod +x /opt/dm/reboot.sh  # Make reboot script executable
```

### Option 2: Using the Installation Script

```bash
# Make the script executable
chmod +x install-opt-dm.sh

# Run with sudo
sudo ./install-opt-dm.sh
```

## Configuration Files

### 1. `devices.json`
Main device manager configuration:
- `deviceManagerKey`: MQTT topic key (alphanumeric, -, _, .)
- `deviceManagerName`: Human-readable name

**Example:**
```json
{
  "deviceManagerKey": "DM-1",
  "deviceManagerName": "Detection Station 1"
}
```

### 2. `config.properties`
MQTT broker connection settings:
- `mqtt.broker`: IPv4 address of MQTT broker
- `mqtt.port`: MQTT broker port (default: 1883)

**Example:**
```properties
mqtt.broker=192.168.1.100
mqtt.port=1883
```

### 3. Device-Specific Files (`devices.d/*.json`)

#### Serial Devices (IBAC2, WXT53X)
Configuration for devices connected via serial port:

```json
{
  "address": "ttyS0",
  "speed": "9600",
  "bits": "8",
  "stopBits": "1",
  "parity": "None",
  "serialPortType": "RS232",
  "name": "My IBAC Device",
  "enabled": true
}
```

**Fields:**
- `address`: Serial port (ttyS0, ttyS1)
- `speed`: Baud rate (9600, 19200, 38400, 57600, 115200)
- `bits`: Data bits (7, 8)
- `stopBits`: Stop bits (1, 2)
- `parity`: Parity (None, Even, Odd)
- `serialPortType`: Port type (RS232, RS485)
- `name`: Device name (max 50 characters)
- `enabled`: Enable/disable device

#### Network Devices (S900, GTD Module-B)

**S900 Device:**
```json
{
  "address": "192.168.1.50",
  "portNumber": 21012,
  "name": "My S900 Device",
  "enabled": true
}
```

**GTD Module-B (oritestgtdb):**
```json
{
  "address": "192.168.1.60",
  "portNumber": 80,
  "name": "GTD Module-B",
  "enabled": true
}
```

**Fields:**
- `address`: IPv4 address
- `portNumber`: TCP port number (1-65535)
  - S900: Default 21012
  - GTD Module-B: Default 80
- `name`: Device name (max 50 characters)
- `enabled`: Enable/disable device

### 4. `reboot.sh`
System reboot script executed when the application needs to restart the system (e.g., after network configuration changes).

**Key Features:**
- Logs all reboot operations to `/var/log/dm-reboot.log`
- Adds delay to allow web responses to complete
- Syncs filesystem before rebooting
- Optional service graceful shutdown

**Requirements:**
- Must be executable: `chmod +x /opt/dm/reboot.sh`
- Should be owned by root or a user with reboot privileges
- Backend must have permission to execute it

**Usage:**
The backend automatically calls this script when:
- Network configuration is changed via the UI
- User clicks "Save & Reboot" for network settings

**Testing:**
```bash
# Test the script (will actually reboot the system!)
sudo /opt/dm/reboot.sh

# Or test in simulation mode by commenting out the /sbin/reboot line
```

## Validation Rules

### Device Manager Key (MQTT Topic)
- Allowed: alphanumeric, spaces, hyphens (-), underscores (_), periods (.)
- Not allowed: slashes (/), wildcards (+, #)
- Example: `DM-1`, `Station_Alpha`, `Site.01`

### IPv4 Addresses
- Valid format: `xxx.xxx.xxx.xxx`
- Each octet: 0-255
- Example: `192.168.1.100`

### Port Numbers
- Range: 1-65535
- Common MQTT: 1883 (unencrypted), 8883 (TLS)
- S900 default: 21012
- GTD Module-B default: 80

### Device Names
- Maximum: 50 characters
- Human-readable identifier

## Using with Docker

When running with Docker Compose, the `/opt/dm` directory is mounted as a volume:

```yaml
services:
  backend:
    volumes:
      - /opt/dm:/opt/dm
    environment:
      - SPRING_PROFILES_ACTIVE=prod
```

The backend automatically uses these files when running in production mode.

## Development vs Production

| Environment | Configuration Location | Profile |
|-------------|----------------------|---------|
| **Development** | `backend/src/main/resources/dev-data/` | `default` |
| **Production** | `/opt/dm/` | `prod` |

- Development uses files in the project for easy testing
- Production uses system directory `/opt/dm/` for persistence

## System Restart Configuration

The DM Web Configuration Tool can trigger system restarts when network or device configurations change. This is implemented using a **systemd service** that monitors for restart requests and executes the appropriate commands.

### How It Works

1. **User clicks "Save & Reboot"** in the web UI
2. **Backend creates trigger file**: `/opt/dm/.reboot-trigger`
3. **Systemd service detects trigger**: `dm-reboot-watcher.service`
4. **Restart script executes**: `/opt/dm/reboot.sh`
   - Restarts networking service (applies network config changes)
   - Restarts Docker service (restarts all containers with new device configs)

### Installation

#### Option 1: Automated Installation (Recommended)

Run the installation script from the project root:

```bash
# Copy script to server
scp install-reboot-watcher.sh root@your-server:/tmp/

# SSH to server and run installer
ssh root@your-server
sudo bash /tmp/install-reboot-watcher.sh
```

This installs:
- `/opt/dm/reboot.sh` - Restart script
- `/etc/sudoers.d/dm-reboot` - Passwordless sudo permissions
- `/etc/systemd/system/dm-reboot-watcher.service` - Monitoring service

#### Option 2: Manual Installation

```bash
# 1. Install reboot script
sudo cp example-opt-dm/reboot.sh /opt/dm/reboot.sh
sudo chmod +x /opt/dm/reboot.sh

# 2. Install sudoers configuration
sudo cp example-opt-dm/dm-reboot-sudoers /etc/sudoers.d/dm-reboot
sudo chmod 0440 /etc/sudoers.d/dm-reboot
sudo visudo -c -f /etc/sudoers.d/dm-reboot

# 3. Install systemd service
sudo cp example-opt-dm/dm-reboot-watcher.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable dm-reboot-watcher.service
sudo systemctl start dm-reboot-watcher.service

# 4. Verify service is running
sudo systemctl status dm-reboot-watcher.service
```

### Verification

Check that the service is running:

```bash
systemctl status dm-reboot-watcher.service
```

Expected output:
```
● dm-reboot-watcher.service - DM Configuration Restart Watcher
   Loaded: loaded (/etc/systemd/system/dm-reboot-watcher.service; enabled)
   Active: active (running) since ...
```

### Testing

**Test without actually restarting services:**

```bash
# Create trigger file manually
echo "TEST" > /opt/dm/.reboot-trigger

# Wait 2-3 seconds, then check log
cat /opt/dm/reboot.log
```

You should see log entries showing the restart process.

**Test from the Web UI:**

1. Access the web UI: `http://your-server-ip`
2. Make a configuration change
3. Click "Save & Reboot"
4. Check logs:
   ```bash
   cat /opt/dm/reboot.log
   journalctl -u dm-reboot-watcher.service -f
   ```

### Troubleshooting

**Service not running:**
```bash
# Check service status
systemctl status dm-reboot-watcher.service

# View service logs
journalctl -u dm-reboot-watcher.service -n 50

# Restart service
sudo systemctl restart dm-reboot-watcher.service
```

**Trigger file not being detected:**
```bash
# Check if trigger file exists
ls -la /opt/dm/.reboot-trigger

# Check service logs
journalctl -u dm-reboot-watcher.service -f

# Manually trigger restart
echo "MANUAL_TEST" > /opt/dm/.reboot-trigger
```

**Restart script fails:**
```bash
# Check script permissions
ls -la /opt/dm/reboot.sh

# Check sudoers configuration
sudo cat /etc/sudoers.d/dm-reboot

# Test script manually
sudo /opt/dm/reboot.sh

# Check restart log
cat /opt/dm/reboot.log
```

**Docker containers not restarting:**
```bash
# Check Docker service status
systemctl status docker

# Manually restart Docker
sudo systemctl restart docker

# Check Docker logs
journalctl -u docker -n 50
```

### What Gets Restarted

When you click "Save & Reboot":

| Configuration Type | Action Taken |
|-------------------|--------------|
| **Network Config** | `systemctl restart networking` |
| **Device Config** | `systemctl restart docker` (restarts all containers) |
| **MQTT Config** | `systemctl restart docker` (restarts backend container) |

**Note:** The script does NOT perform a full system reboot. It only restarts necessary services.

## Backup Recommendations

1. **Regular Backups:**
   ```bash
   sudo tar -czf dm-config-backup-$(date +%Y%m%d).tar.gz /opt/dm
   ```

2. **Before Updates:**
   ```bash
   sudo cp -r /opt/dm /opt/dm.backup
   ```

3. **Version Control:**
   Consider keeping configurations in git (excluding sensitive data)

## Troubleshooting

### Permission Issues
```bash
# Fix ownership
sudo chown -R root:root /opt/dm

# Fix permissions
sudo find /opt/dm -type d -exec chmod 755 {} \;
sudo find /opt/dm -type f -exec chmod 644 {} \;
```

### Configuration Not Loading
1. Check file exists: `ls -la /opt/dm/`
2. Check permissions: `ls -la /opt/dm/`
3. Check backend logs: `docker logs dm-backend`
4. Verify profile: Should show `spring.profiles.active=prod`

### Invalid Configuration
- Use the web UI at `http://<device-ip>:3000` to validate and edit
- Check validation rules above
- Review backend logs for specific errors

## Security Notes

- **File Permissions**: Configuration files should be readable by the application user
- **MQTT Credentials**: If using authentication, consider environment variables or secrets
- **Network Security**: Ensure firewall rules allow only necessary connections
- **Backup Security**: Encrypt backups if they contain sensitive data

## Additional Resources

- **Application README**: `../README.md`
- **API Documentation**: `../docs/API.md`
- **Quick Start Guide**: `../docs/guides/quick-start-guide.md`
- **Development Guide**: `../docs/guides/development-guide.md`

