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

