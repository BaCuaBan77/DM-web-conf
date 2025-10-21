# API Documentation

## Base URL

- **Development**: `http://localhost:8080`
- **Production**: `http://<debian-ip>:8080`

## Endpoints

### Device Manager Configuration

#### Get Device Manager Config
```http
GET /api/devices
```

**Response:**
```json
{
  "deviceManagerKey": "DM-1",
  "deviceManagerName": "Detection Station 1"
}
```

#### Save Device Manager Config
```http
POST /api/save
Content-Type: application/json
```

**Request:**
```json
{
  "configType": "devices",
  "data": {
    "deviceManagerKey": "DM-1",
    "deviceManagerName": "Detection Station 1"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration saved successfully"
}
```

---

### Server Connection Properties

#### Get Config Properties
```http
GET /api/config/properties
```

**Response:**
```json
{
  "mqtt.broker": "192.168.1.100",
  "mqtt.port": "1883"
}
```

#### Save Config Properties
```http
POST /api/save
Content-Type: application/json
```

**Request:**
```json
{
  "configType": "config",
  "data": {
    "mqtt.broker": "192.168.1.100",
    "mqtt.port": "1883"
  }
}
```

---

### Device-Specific Configuration

#### Get Device Config
```http
GET /api/device/{deviceName}
```

**Device Names:**
- `IBAC` - IBAC2 Biological Detection
- `S900` - S900 Radiation Detection
- `oritestgtdb` - GTD Module-B Chemical Detection
- `wxt53x` - WXT53X Weather Station

**Response Examples:**

**IBAC2 (Serial Device):**
```json
{
  "deviceType": "IBAC",
  "name": "IBAC Sensor 1",
  "address": "ttyS0",
  "speed": "9600",
  "bits": "8",
  "stopBits": "1",
  "parity": "N",
  "serialPortType": "RS232"
}
```

**S900 (Network Device):**
```json
{
  "deviceType": "S900",
  "name": "S900 Detector",
  "address": "192.168.1.50",
  "portNumber": 21012
}
```

**GTD Module-B:**
```json
{
  "deviceType": "oritestgtdb",
  "name": "GTD Module-B",
  "address": "192.168.1.10",
  "portNumber": 80
}
```

#### Save Device Config
```http
POST /api/device/{deviceName}
Content-Type: application/json
```

**Request:**
```json
{
  "deviceType": "IBAC",
  "name": "IBAC Sensor 1",
  "address": "ttyS0",
  "speed": "9600",
  "bits": "8",
  "stopBits": "1",
  "parity": "N",
  "serialPortType": "RS232"
}
```

---

### Network Configuration

#### Get Network Config
```http
GET /api/network
```

**Response:**
```json
{
  "interface": "eth0",
  "method": "static",
  "address": "192.168.1.100",
  "netmask": "255.255.255.0",
  "gateway": "192.168.1.1"
}
```

#### Save Network Config (Triggers Reboot)
```http
POST /api/network
Content-Type: application/json
```

**Request:**
```json
{
  "interface": "eth0",
  "method": "static",
  "address": "192.168.1.100",
  "netmask": "255.255.255.0",
  "gateway": "192.168.1.1"
}
```

**Note:** This endpoint automatically triggers a system reboot after saving.

---

### System Control

#### Trigger Reboot
```http
POST /api/reboot
```

**Response:**
```json
{
  "success": true,
  "message": "Reboot initiated"
}
```

---

## Validation Rules

### Device Manager (devices.json)
- **deviceManagerKey**: 
  - Max 20 characters
  - Valid MQTT topic characters: alphanumeric, spaces, hyphens, underscores, dots
  - No forward slashes, hash symbols, or plus signs
- **deviceManagerName**: 
  - Max 50 characters
  - Any characters allowed

### Server Connection (config.properties)
- **mqtt.broker**: Valid IPv4 address (e.g., `192.168.1.100`)
- **mqtt.port**: Valid port number (1-65535)

### Device Configurations

#### Serial Devices (IBAC2, WXT53X)
- **address**: `ttyS0` or `ttyS1` (or `/dev/ttyS0`, `/dev/ttyS1`)
- **speed**: `9600`, `19200`, `38400`, `57600`, or `115200`
- **bits**: `7` or `8`
- **stopBits**: `1` or `2`
- **parity**: `N` (None), `E` (Even), or `O` (Odd) - *Note: UI displays full names, backend stores single letters*
- **serialPortType**: `RS232` or `RS485`
- **name**: Max 50 characters

#### Network Devices (S900)
- **address**: Valid IPv4 address
- **portNumber**: Valid port (1-65535)
- **name**: Max 50 characters

#### Network Devices (GTD Module-B)
- **address**: Valid IPv4 address
- **portNumber**: Valid port (1-65535), default 80
- **name**: Max 50 characters

### Network Configuration
- **interface**: Any valid interface name (e.g., `eth0`, `enp0s3`)
- **method**: `static` or `dhcp`
- **address**: Valid IPv4 (required for static)
- **netmask**: Valid IPv4 (required for static)
- **gateway**: Valid IPv4 (optional)

---

## Error Responses

All endpoints return standard error responses:

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Invalid IP address"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "error": "Failed to save configuration file"
}
```

---

## Testing Examples

### Using cURL

**Get device config:**
```bash
curl http://localhost:8080/api/devices
```

**Save device config:**
```bash
curl -X POST http://localhost:8080/api/save \
  -H "Content-Type: application/json" \
  -d '{
    "configType": "devices",
    "data": {
      "deviceManagerKey": "DM-1",
      "deviceManagerName": "Test Station"
    }
  }'
```

**Get network config:**
```bash
curl http://localhost:8080/api/network
```

**Save and reboot:**
```bash
curl -X POST http://localhost:8080/api/network \
  -H "Content-Type: application/json" \
  -d '{
    "interface": "eth0",
    "method": "static",
    "address": "192.168.1.100",
    "netmask": "255.255.255.0",
    "gateway": "192.168.1.1"
  }'
```

### Using httpie

```bash
# Get config
http GET localhost:8080/api/devices

# Save config
http POST localhost:8080/api/save \
  configType=devices \
  data:='{"deviceManagerKey":"DM-1","deviceManagerName":"Test"}'
```

---

## CORS

All endpoints support CORS with `Access-Control-Allow-Origin: *` for development.

For production, configure CORS in `ConfigController.java` as needed.

