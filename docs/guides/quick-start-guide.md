# Quick Start Guide

## Getting Started in 5 Minutes

### Prerequisites

Before you begin, ensure you have:
- ✅ Java 17 or higher
- ✅ Node.js 20.18.3 (via nvm recommended)
- ✅ Maven 3.9+
- ✅ Git

### Quick Start (Development Mode)

**1. Start the Application:**
```bash
cd /path/to/DM-web-conf
./START_APP.sh
```

This automatically:
- Starts the backend on `http://localhost:8080`
- Starts the frontend on `http://localhost:3000`
- Uses development data (no `/opt/dm/` setup needed)

**2. Access the UI:**

Open your browser to: **http://localhost:3000**

**3. Try It Out:**
- Make changes in "DM Details"
- Switch to "Server Connection" and modify
- Notice orange dots on modified tabs
- Click "Save Changes"
- Confirm to save all changes

**4. Stop the Application:**
```bash
./STOP_APP.sh
```

---

## UI Overview

### Sidebar Navigation

**Main Section:**
- **DM Details** - Configure device manager key and name
- **Network Config** - Set static IP or DHCP
- **Server Connection** - Configure MQTT broker settings

**Device Settings:**
- **IBAC2** 🧬 - Biological detection (serial)
- **S900** ☢️ - Radiation detection (network)
- **GTD Module-B** 🧪 - Chemical detection (network)
- **WXT53X** ☁️ - Weather station (serial)

### Working with Configurations

**Making Changes:**
1. Click any tab in the sidebar
2. Modify the configuration fields
3. Notice the 🟠 orange dot appears on the tab
4. Continue to other tabs if needed

**Saving Changes:**
1. Click "Save Changes" in the header (enabled when changes exist)
2. Review the confirmation dialog showing all tabs to be saved
3. Click "Confirm" to save all configurations
4. System will reboot automatically

**Change Indicators:**
- 🟠 Orange dot = Unsaved changes
- ✅ Green highlight = Active page
- No dot = No changes

---

## Key Features

### Save All Changes at Once

**Previously**: Had to save each tab individually  
**Now**: One "Save Changes" button saves everything

- Modify multiple tabs
- Single save operation
- One reboot for all changes
- Clear confirmation of what's being saved

### Real-Time Validation

**Input Validation:**
- Instant feedback as you type
- Red borders on invalid fields
- Error messages below fields
- Can't save until all valid

**Multi-Tab Validation:**
- Validates all modified tabs before save
- Shows which tabs have errors
- Fix all errors before saving

### Network Configuration

**Static IP Setup:**
1. Go to "Network Config"
2. Select interface (e.g., `eth0`)
3. Choose "Static IP"
4. Enter IP address, netmask, gateway
5. Save (triggers immediate reboot)

**DHCP Setup:**
1. Go to "Network Config"
2. Select "DHCP"
3. Save (no IP fields needed)

⚠️ **Warning**: Changing network settings causes system reboot. Ensure you can access the device on the new IP.

---

## Configuration Guide

### DM Details

**Device Manager Key:**
- Used as MQTT topic identifier
- Max 20 characters
- Alphanumeric, spaces, `-`, `_`, `.` only
- Example: `DM-1`, `station_01`

**Device Manager Name:**
- Human-readable name
- Max 50 characters
- Any characters allowed
- Example: `Detection Station 1`

### Server Connection

**MQTT Broker IP:**
- IPv4 address of MQTT server
- Example: `192.168.1.100`

**MQTT Port:**
- Default: `1883` (unencrypted)
- TLS: `8883` (encrypted)
- Range: 1-65535

### Device Configurations

#### IBAC2 (Biological Sensor)

**Serial Configuration:**
- Port: `ttyS0` or `ttyS1`
- Baud Rate: `9600` to `115200`
- Data Bits: `7` or `8`
- Stop Bits: `1` or `2`
- Parity: `None`, `Even`, `Odd`
- Port Type: `RS232` or `RS485`

**Common Settings:**
- Port: `ttyS0`
- Baud: `9600`
- Bits: `8`
- Stop: `1`
- Parity: `None`
- Type: `RS232`

#### S900 (Radiation Detector)

**Network Configuration:**
- IP Address: Device's network address
- Port: Default `21012`
- Range: 1-65535

**Example:**
- IP: `192.168.1.50`
- Port: `21012`

#### GTD Module-B (Chemical Detection)

**Network Configuration:**
- IP Address: Network device address
- Port: Default `80`
- Range: 1-65535

**Example:**
- IP: `192.168.1.10`
- Port: `80`

#### WXT53X (Weather Station)

**Serial Configuration:**
- Same as IBAC2
- Usually on different serial port

---

## Common Tasks

### Task: Change Device Manager Name

1. Open sidebar → **DM Details**
2. Edit "Device Manager Name" field
3. Click **Save Changes**
4. Confirm to reboot

### Task: Update MQTT Broker

1. Open sidebar → **Server Connection**
2. Change "MQTT Broker IP"
3. Change "MQTT Port" if needed
4. Click **Save Changes**
5. Confirm to reboot

### Task: Configure Multiple Devices

1. Open **IBAC2**, configure serial settings
2. Open **S900**, configure network settings
3. Open **GTD Module-B**, configure network settings
4. Notice 🟠 dots on all three tabs
5. Click **Save Changes** (saves all three)
6. Review confirmation showing all three devices
7. Confirm to save and reboot

### Task: Set Static IP Address

1. Open sidebar → **Network Config**
2. Select interface: `eth0`
3. Choose "Static IP"
4. Enter:
   - Address: `192.168.1.100`
   - Netmask: `255.255.255.0`
   - Gateway: `192.168.1.1`
5. Click **Save Changes**
6. Confirm (system reboots immediately)
7. Access UI on new IP: `http://192.168.1.100`

---

## Troubleshooting

### Issue: UI Not Loading

**Check Backend:**
```bash
curl http://localhost:8080/api/devices
```

**Expected:** JSON response  
**If fails:** Backend not running

**Solution:**
```bash
cd backend
mvn spring-boot:run -s settings.xml
```

### Issue: Can't Connect to Backend

**Check Frontend Proxy:**
```bash
# frontend/vite.config.ts should have:
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true
  }
}
```

### Issue: "Port Already in Use"

**Backend (port 8080):**
```bash
lsof -ti:8080 | xargs kill -9
```

**Frontend (port 3000):**
```bash
lsof -ti:3000 | xargs kill -9
```

### Issue: Save Button Always Disabled

**Cause:** No changes detected

**Solution:**
1. Make a change in any field
2. Wait for validation (1-2 seconds)
3. Button should enable
4. If still disabled, check browser console (F12)

### Issue: Validation Errors

**Invalid MQTT Topic Key:**
- ❌ `my/topic` (no slashes)
- ❌ `topic#123` (no hash)
- ✅ `my-topic` (use hyphens)

**Invalid IP Address:**
- ❌ `192.168.1` (incomplete)
- ❌ `192.168.1.999` (out of range)
- ✅ `192.168.1.100` (valid)

**Invalid Port:**
- ❌ `0` (too low)
- ❌ `99999` (too high)
- ✅ `1883` (valid)

### Issue: Changes Not Persisting

**Development Mode:**
- Changes save to `backend/src/main/resources/dev-data/`
- Check files are being updated there

**Production Mode:**
- Changes save to `/opt/dm/` on host
- Ensure Docker volumes mounted correctly

### Issue: Network Config Not Working

**Check Interface Name:**
```bash
ip link show
# or
ifconfig
```

**Common Names:**
- Debian 10+: `enp0s3`, `enp0s8`
- Older: `eth0`, `eth1`
- Use exact name from system

### Issue: System Not Rebooting

**Development Mode:**
- Reboot is simulated (doesn't actually reboot)
- Check backend logs for "Simulated reboot"

**Production Mode:**
- Requires `reboot.sh` script
- Check script exists and is executable:
```bash
ls -la /opt/dm/scripts/reboot.sh
chmod +x /opt/dm/scripts/reboot.sh
```

---

## Development Tips

### Hot Reload

**Frontend:**
- Vite auto-reloads on file save
- Changes appear instantly in browser

**Backend:**
- Restart required for Java changes
- Use `mvn spring-boot:run` for faster restarts

### Testing Your Changes

**Backend:**
```bash
cd backend
mvn test -s settings.xml
```

**Frontend:**
```bash
cd frontend
npm test
```

**E2E:**
```bash
cd frontend
npm run test:e2e
```

### Viewing Logs

**Backend:**
```bash
# Running in terminal - logs appear in console
# Or check Spring Boot logs
tail -f backend/logs/spring.log
```

**Frontend:**
```bash
# Browser console (F12 → Console)
# Or Vite terminal output
```

### API Testing

**Using cURL:**
```bash
# Get config
curl http://localhost:8080/api/devices

# Save config
curl -X POST http://localhost:8080/api/save \
  -H "Content-Type: application/json" \
  -d '{"configType":"devices","data":{"deviceManagerKey":"test","deviceManagerName":"Test"}}'
```

**Using Browser:**
```
http://localhost:8080/api/devices
http://localhost:8080/api/config/properties
http://localhost:8080/api/network
```

---

## Production Deployment

### Using Docker Compose

**1. Prepare Host:**
```bash
# Create directories
sudo mkdir -p /opt/dm/devices.d
sudo mkdir -p /opt/dm/scripts

# Create configuration files
sudo touch /opt/dm/devices.json
sudo touch /opt/dm/config.properties
sudo touch /opt/dm/devices.d/{IBAC,S900,oritestgtdb,wxt53x}.json

# Create reboot script
sudo nano /opt/dm/scripts/reboot.sh
```

**reboot.sh:**
```bash
#!/bin/bash
sudo reboot
```

```bash
sudo chmod +x /opt/dm/scripts/reboot.sh
```

**2. Start Containers:**
```bash
docker-compose up -d
```

**3. Access UI:**
```
http://<debian-ip>:80
```

**4. View Logs:**
```bash
docker-compose logs -f
```

**5. Stop Containers:**
```bash
docker-compose down
```

### Updating Production

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

---

## Best Practices

### Configuration Management

✅ **Do:**
- Test changes in development first
- Save related changes together
- Verify network settings before saving
- Document your configuration values

❌ **Don't:**
- Save invalid data (blocked by validation)
- Change network without console access
- Forget to check which tabs have changes

### Network Changes

✅ **Do:**
- Have physical access or KVM
- Verify new IP is available
- Test connectivity before saving
- Plan for brief downtime

❌ **Don't:**
- Change IP without backup access
- Use conflicting IP addresses
- Forget about DHCP conflicts

### Device Configuration

✅ **Do:**
- Match device manufacturer specs
- Verify serial connections
- Test network connectivity
- Use descriptive names

❌ **Don't:**
- Guess baud rates or parity
- Use wrong serial port type
- Skip validation warnings

---

## Getting Help

### Documentation

- **API Reference**: `docs/API.md`
- **Features**: `docs/FEATURES.md`
- **Testing**: `docs/testing/e2e-test-guide.md`
- **Development**: `docs/guides/development-guide.md`

### Common Questions

**Q: Can I save just one tab?**  
A: No, "Save Changes" saves all modified tabs together. This ensures atomic configuration updates and single reboot.

**Q: How do I know what will be saved?**  
A: The confirmation dialog lists all tabs that will be saved.

**Q: Can I undo changes?**  
A: Refresh the page to discard all unsaved changes. Orange dots will disappear.

**Q: Why does network config reboot immediately?**  
A: Network changes require a system reboot to take effect.

**Q: What happens if save fails?**  
A: An error message shows which tab failed. No changes are applied, no reboot occurs.

---

## Next Steps

- 📖 Read the [Features](../FEATURES.md) documentation
- 🧪 Run the [E2E Tests](../testing/e2e-test-guide.md)
- 🏗️ See [Architecture](../architecture/) diagrams
- 🔧 Read [Development Guide](development-guide.md) for contributing

---

**Need More Help?**

Contact the Observis development team or check the project's issue tracker.
