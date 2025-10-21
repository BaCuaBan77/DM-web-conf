# Quick Start Guide

## ✅ Backend is Ready!

The backend now works perfectly in development mode using local sample files.

## Running the Backend

### Start the Server

```bash
cd backend
mvn spring-boot:run -s settings.xml
```

The server will start on **http://localhost:8080** and use development data files from `src/main/resources/dev-data/`.

### Test the API

```bash
# Get devices configuration
curl http://localhost:8080/api/devices

# Get config properties
curl http://localhost:8080/api/config/properties

# Get device-specific configs
curl http://localhost:8080/api/device/IBAC
curl http://localhost:8080/api/device/S900
curl http://localhost:8080/api/device/oritestgtdb
curl http://localhost:8080/api/device/wxt53x
```

### Save Configuration

```bash
curl -X POST http://localhost:8080/api/save \
  -H "Content-Type: application/json" \
  -d '{
    "configType": "devices",
    "data": {
      "deviceManagerKey": "my_new_key",
      "deviceManagerName": "My Device Manager"
    }
  }'
```

### Trigger Reboot (Simulated in Dev Mode)

```bash
curl -X POST http://localhost:8080/api/reboot
```

## Running the Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser.

The frontend will automatically proxy API requests to the backend at http://localhost:8080.

## Development Data Files

Located in `backend/src/main/resources/dev-data/`:

- ✅ `devices.json` - Device Manager configuration
- ✅ `config.properties` - MQTT server settings
- ✅ `IBAC.json` - IBAC device configuration
- ✅ `S900.json` - S900 device configuration
- ✅ `oritestgtdb.json` - Oritestgtdb device configuration
- ✅ `wxt53x.json` - WXT53X weather station configuration

You can edit these files directly or use the API to update them.

## Switching to Production Mode

When deploying to production, run with the production profile:

```bash
mvn spring-boot:run -s settings.xml -Dspring.profiles.active=prod
```

This will use files from `/opt/dm/` instead of the development files.

## Common Commands

### Stop the Backend

```bash
pkill -f "spring-boot:run"
# or press Ctrl+C in the terminal running the server
```

### Check if Backend is Running

```bash
curl http://localhost:8080/api/devices
```

### View Backend Logs

The logs will appear in the terminal where you ran `mvn spring-boot:run`.

For DEBUG level logging (default in dev mode), you'll see detailed information about:
- Configuration loading
- API requests
- File operations
- Validation

## Troubleshooting

### Port 8080 Already in Use

```bash
# Kill the process using port 8080
lsof -ti:8080 | xargs kill -9
```

### Files Not Found

Make sure you're in the `backend` directory when running `mvn spring-boot:run`.

### Want to Reset Development Data?

Just restore the original files from git:

```bash
git checkout backend/src/main/resources/dev-data/
```

## Next Steps

1. ✅ Backend is running - **DONE**
2. Start the frontend: `cd frontend && npm run dev`
3. Open http://localhost:3000
4. Edit configurations through the web interface
5. Test validation rules
6. Test save functionality

Enjoy developing! 🚀

