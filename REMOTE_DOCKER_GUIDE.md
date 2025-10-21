# Remote Docker Troubleshooting Guide

This guide helps you troubleshoot Docker containers running on a **remote server**.

## 🌐 Accessing the Website

Since Docker is running on remote server `192.169.0.177`, access it at:

```
http://192.169.0.177
```

**NOT** `http://localhost` (that would only work on the server itself)

---

## 📋 Diagnostic Steps (Run on Remote Server)

### 1. Check if containers are running

```bash
docker ps
```

Expected output:
```
CONTAINER ID   IMAGE                    STATUS       PORTS
xxxxx          dm-config-frontend       Up X min     0.0.0.0:80->80/tcp
xxxxx          dm-config-backend        Up X min     0.0.0.0:8080->8080/tcp
```

If containers are not running:
```bash
docker-compose ps
docker-compose logs
```

---

### 2. Check if frontend has website files

```bash
docker exec dm-config-frontend ls -la /usr/share/nginx/html/
```

Expected output should include:
- `index.html`
- `assets/` directory
- `vite.svg`

If these files are **missing**, the frontend wasn't built correctly:
```bash
# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

---

### 3. Test backend from the server

```bash
curl http://localhost:8080/api/devices
```

Expected: JSON response with `deviceManagerKey`

If error "File not found", check `/opt/dm/`:
```bash
ls -la /opt/dm/
```

If `/opt/dm/` is empty:
```bash
sudo mkdir -p /opt/dm/devices.d
sudo cp -r example-opt-dm/* /opt/dm/
docker-compose restart backend
```

---

### 4. Test frontend from the server

```bash
curl http://localhost/
```

Expected: HTML content starting with `<!DOCTYPE html>`

If you get "502 Bad Gateway":
- Backend is not running or not accessible
- Check backend logs: `docker logs dm-config-backend`

If you get nothing:
- Frontend container is not running
- Check frontend logs: `docker logs dm-config-frontend`

---

### 5. Check firewall (if can't access from your computer)

```bash
# Check if port 80 is listening
sudo netstat -tlnp | grep :80

# Allow ports in firewall
sudo ufw allow 80/tcp
sudo ufw allow 8080/tcp
sudo ufw status
```

---

### 6. View detailed logs

**Backend logs:**
```bash
docker logs dm-config-backend --tail 50
```

Look for:
- ✅ "Started DmConfigApplication in X seconds"
- ❌ "FileNotFoundException" 
- ❌ "ConnectException"

**Frontend logs:**
```bash
docker logs dm-config-frontend --tail 50
```

Look for:
- ✅ "start worker processes"
- ❌ "cannot bind to 0.0.0.0:80"

---

## 🔧 Common Fixes

### Frontend shows blank page

**Check browser console (F12 → Console):**

If you see `404` errors for `/assets/...`:
```bash
# Frontend wasn't built, rebuild it
docker-compose build frontend
docker-compose up -d
```

If you see `ERR_CONNECTION_REFUSED`:
- Check if nginx is running: `docker ps | grep frontend`
- Check firewall: `sudo ufw allow 80/tcp`

---

### Backend errors: "File not found"

```bash
# Ensure /opt/dm/ has all required files
ls -la /opt/dm/
ls -la /opt/dm/devices.d/

# If missing, copy from example
sudo cp -r example-opt-dm/* /opt/dm/

# Restart backend
docker-compose restart backend
```

---

### "Cannot connect to backend"

The frontend can't reach the backend container.

**Check Docker network:**
```bash
docker network ls
docker network inspect dm-web-conf_dm-network
```

Both containers should be in the same network.

**Test connectivity:**
```bash
docker exec dm-config-frontend ping backend
docker exec dm-config-frontend wget -O- http://backend:8080/api/devices
```

---

## 🚀 Complete Restart Procedure

If nothing works, try a complete restart:

```bash
# Stop everything
docker-compose down

# Ensure /opt/dm/ exists with config files
sudo mkdir -p /opt/dm/devices.d
sudo cp -r example-opt-dm/* /opt/dm/

# Rebuild everything
docker-compose build --no-cache

# Start containers
docker-compose up -d

# Wait 30 seconds for backend to start
sleep 30

# Check status
docker ps

# Check if backend is ready
curl http://localhost:8080/api/devices

# Check if frontend is ready
curl http://localhost/

# View logs
docker-compose logs
```

---

## 📞 Still Not Working?

Provide these details:

1. **Container status:**
   ```bash
   docker ps -a
   ```

2. **Backend logs:**
   ```bash
   docker logs dm-config-backend --tail 100
   ```

3. **/opt/dm/ contents:**
   ```bash
   ls -laR /opt/dm/
   ```

4. **Network test:**
   ```bash
   curl -v http://localhost/
   curl -v http://localhost:8080/api/devices
   ```

5. **Browser error (if accessing from your computer):**
   - Open browser console (F12)
   - Try accessing http://192.169.0.177
   - Screenshot any errors

6. **Firewall status:**
   ```bash
   sudo ufw status
   sudo netstat -tlnp | grep -E '80|8080'
   ```
