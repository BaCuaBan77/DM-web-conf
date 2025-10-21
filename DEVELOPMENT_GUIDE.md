# Development Guide

## Running the Backend in Development Mode

The backend has been configured with **Spring Profiles** to support both development and production environments.

### Development Mode (Default)

Development mode uses local sample data files from `backend/src/main/resources/dev-data/`:
- `devices.json`
- `config.properties`
- `IBAC.json`
- `S900.json`
- `oritestgtdb.json`
- `wxt53x.json`

**To run in development mode:**

```bash
cd backend
mvn spring-boot:run -s settings.xml
```

The application will:
- ✅ Use sample data files from resources
- ✅ Run in test mode (reboot simulated)
- ✅ Listen on `http://localhost:8080`
- ✅ Enable DEBUG logging for easier debugging

### Production Mode

Production mode uses real configuration files from `/opt/dm/`:

**To run in production mode:**

```bash
cd backend
mvn spring-boot:run -s settings.xml -Dspring.profiles.active=prod
```

Or in Docker (automatically uses prod profile):

```bash
docker-compose up
```

The application will:
- ✅ Use files from `/opt/dm/devices.json`, `/opt/dm/config.properties`, etc.
- ✅ Execute real reboot script at `/opt/dm/scripts/reboot.sh`
- ✅ Use production logging levels

## Configuration Files

### Development Data Location

```
backend/src/main/resources/dev-data/
├── devices.json          # Sample device manager config
├── config.properties     # Sample MQTT config
├── IBAC.json            # Sample IBAC device
├── S900.json            # Sample S900 device
├── oritestgtdb.json     # Sample oritestgtdb device
└── wxt53x.json          # Sample WXT53X device
```

### Production Data Location

```
/opt/dm/
├── devices.json
├── config.properties
└── devices.d/
    ├── IBAC.json
    ├── S900.json
    ├── oritestgtdb.json
    └── wxt53x.json
```

## Testing the API

Once the backend is running, you can test the endpoints:

```bash
# Get devices configuration
curl http://localhost:8080/api/devices

# Get config properties
curl http://localhost:8080/api/config/properties

# Get device-specific config
curl http://localhost:8080/api/device/IBAC
curl http://localhost:8080/api/device/S900
curl http://localhost:8080/api/device/oritestgtdb
curl http://localhost:8080/api/device/wxt53x

# Save devices configuration
curl -X POST http://localhost:8080/api/save \
  -H "Content-Type: application/json" \
  -d '{
    "configType": "devices",
    "data": {
      "deviceManagerKey": "new_key",
      "deviceManagerName": "Updated Manager"
    }
  }'

# Trigger reboot (simulated in dev mode)
curl -X POST http://localhost:8080/api/reboot
```

## Frontend Development

Run the frontend separately:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3000` and proxy API calls to `http://localhost:8080`.

## Full Stack Development

To run both backend and frontend together:

**Terminal 1 - Backend:**
```bash
cd backend
mvn spring-boot:run -s settings.xml
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Then open `http://localhost:3000` in your browser.

## Common Issues

### Issue: "File not found" errors

**Solution:** Make sure you're running in development mode (without `-Dspring.profiles.active=prod`). The default profile uses local resource files.

### Issue: Port 8080 already in use

**Solution:** Stop any existing Spring Boot process:
```bash
pkill -f spring-boot
# or
lsof -ti:8080 | xargs kill -9
```

### Issue: Cannot connect to Maven repository

**Solution:** Make sure to use the settings.xml file:
```bash
mvn spring-boot:run -s settings.xml
```

## Running Tests

```bash
cd backend
mvn test -s settings.xml
```

Tests use their own configuration from `src/test/resources/application-test.properties`.

## Docker Deployment

The Docker setup automatically uses production profile:

```bash
docker-compose up --build
```

This will:
1. Build the backend with production settings
2. Build the frontend
3. Mount `/opt/dm/` from the host
4. Expose the application on port 80

## Environment Variables

You can override configuration using environment variables:

```bash
# Override file paths
export DM_CONFIG_DEVICES_PATH=/custom/path/devices.json

# Override server port
export SERVER_PORT=9090

# Then run
mvn spring-boot:run -s settings.xml
```

## Summary

- **Development:** `mvn spring-boot:run -s settings.xml` (uses local files)
- **Production:** `mvn spring-boot:run -s settings.xml -Dspring.profiles.active=prod` (uses `/opt/dm/`)
- **Docker:** `docker-compose up` (automatically production mode)
- **Tests:** `mvn test -s settings.xml` (uses test resources)

