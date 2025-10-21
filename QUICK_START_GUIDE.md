# Quick Start Guide - Material UI Application

## 🎯 Current Status

✅ **Backend**: Running on http://localhost:8080  
✅ **Frontend**: Running on http://localhost:3001  
✅ **Node Version**: 20.18.3 (nvm)

## 🚀 Starting the Application

### Option 1: Quick Start Script (Recommended)
```bash
./START_APP.sh
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
mvn spring-boot:run -s settings.xml
```

**Terminal 2 - Frontend:**
```bash
# Load nvm and use Node 20.18.3
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20.18.3

# Start frontend
cd frontend
npm run dev
```

## 🛑 Stopping the Application

### Option 1: Quick Stop Script
```bash
./STOP_APP.sh
```

### Option 2: Manual Stop
```bash
# Stop backend
kill $(lsof -ti:8080)

# Stop frontend
kill $(lsof -ti:3001)
```

## 🌐 Accessing the Application

Open your browser and navigate to:
```
http://localhost:3001
```

## 🎨 Material UI Features to Explore

### 1. **Observis Logo**
- Look at the top-left of the green header bar
- To replace with actual logo: Put your image at `frontend/public/observis-logo.png`

### 2. **Unsaved Changes Indicator**
- Edit any field in any tab
- Notice the small orange pulsing dot that appears next to the tab name
- This indicates unsaved changes in that tab

### 3. **Save & Reboot**
- Make changes in any tab
- Click the "Save & Reboot" button (top-right)
- Confirm in the dialog
- System saves and triggers reboot

### 4. **Network Configuration Tab**
- Click on "Network Config" tab
- Configure Debian static IP settings
- Choose between DHCP or Static
- If Static, enter IP address, netmask, and gateway
- Save & Reboot to apply

### 5. **Material UI Components**
- Professional text fields with labels
- Dropdown selects with smooth animations
- Radio buttons for options
- Loading spinners
- Toast notifications (bottom center)
- Validation messages

## 📋 Available Tabs

1. **Devices** - Device Manager Key and Name (MQTT configuration)
2. **Config Properties** - MQTT Broker IP and Port
3. **IBAC** - Serial device configuration
4. **S900** - IP-based device configuration
5. **OriTestGTDB** - Database IP configuration
6. **WXT53X** - Weather sensor serial configuration
7. **Network Config** - Static IP configuration for Debian

## 🔧 Development

### Check Logs
```bash
# Backend logs
tail -f /tmp/dm-backend.log

# Frontend logs
tail -f /tmp/dm-frontend.log
```

### Rebuild Frontend
```bash
cd frontend
npm run build
```

### Backend Only
```bash
cd backend
mvn spring-boot:run -s settings.xml
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 8080
lsof -ti:8080

# Kill the process
kill $(lsof -ti:8080)
```

### Node Version Issues
```bash
# Verify Node version
node --version  # Should be v20.18.3

# If not, switch to Node 20
nvm use 20.18.3
```

### Frontend Not Loading
```bash
# Check if Vite dev server is running
curl http://localhost:3001

# Check frontend logs
tail -f /tmp/dm-frontend.log
```

### Backend Not Responding
```bash
# Check if Spring Boot is running
curl http://localhost:8080/api/devices

# Check backend logs
tail -f /tmp/dm-backend.log
```

## 📝 API Endpoints

All backend endpoints are available at `http://localhost:8080/api`:

- `GET /api/devices` - Get device manager configuration
- `POST /api/save` - Save configuration (devices or config)
- `GET /api/config/properties` - Get config.properties
- `GET /api/device/{name}` - Get device-specific config (IBAC, S900, etc.)
- `POST /api/device/{name}` - Save device-specific config
- `GET /api/network` - Get network configuration
- `POST /api/network` - Save network config and reboot
- `POST /api/reboot` - Trigger system reboot

## 🎯 Quick Test Commands

```bash
# Test backend
curl http://localhost:8080/api/devices

# Test network endpoint
curl http://localhost:8080/api/network

# Test save (example)
curl -X POST http://localhost:8080/api/save \
  -H "Content-Type: application/json" \
  -d '{"configType":"devices","data":{"deviceManagerKey":"test","deviceManagerName":"Test Device"}}'
```

## 📱 Browser Testing

1. Open http://localhost:3001
2. Click through each tab
3. Make a change in any field
4. Watch for the unsaved changes indicator (pulsing dot)
5. Click "Save & Reboot"
6. Confirm in the dialog
7. Check the toast notification

## 🎉 Success Checklist

- [ ] Backend running on port 8080
- [ ] Frontend running on port 3001
- [ ] Can open UI in browser
- [ ] Can see Material UI components
- [ ] Tabs work correctly
- [ ] Unsaved changes indicators appear
- [ ] Save & Reboot button works
- [ ] Network Config tab loads
- [ ] Validation works in real-time

## 📚 More Documentation

- `MATERIAL_UI_FEATURES.md` - Detailed feature documentation
- `IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- `DEVELOPMENT_GUIDE.md` - Development workflow
- `README.md` - Project overview

---

**Note**: The application is currently running in development mode with test data in `backend/src/main/resources/dev-data/`. For production deployment, see `README.md` and `docker-compose.yml`.

