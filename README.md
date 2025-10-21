# Device Manager Web Configuration Interface

A web-based configuration interface for Device Manager running in Docker on a Debian PC.

## Overview

This project provides a user-friendly web interface to edit configuration files for the Device Manager system. It consists of:
- **Backend**: Spring Boot REST API
- **Frontend**: React + TypeScript + Vite + Material UI
- **Deployment**: Docker containers

## Features

### Core Features
- Edit device manager configuration (`devices.json`)
- Edit system properties (`config.properties`)
- Configure device-specific settings (IBAC, S900, oritestgtdb, WXT53X)
- Configure Debian static IP network settings
- Real-time validation with instant feedback
- System reboot trigger
- Tabbed interface for easy navigation

### Material UI Enhancements
- Professional, modern UI with green Observis theme
- Unsaved changes tracking with visual indicators (pulsing dots on tabs)
- Save & Reboot workflow with confirmation dialog
- Toast notifications for user feedback
- Responsive design for various screen sizes
- Real-time form validation with helpful error messages

## Project Structure

```
DM-web-conf/
├── backend/                    # Spring Boot API
│   ├── src/
│   │   ├── main/java/
│   │   │   └── com/observis/dmconfig/
│   │   │       ├── controller/    # REST controllers
│   │   │       ├── service/       # Business logic
│   │   │       └── validation/    # Input validation
│   │   └── test/java/             # Backend tests
│   │       └── com/observis/dmconfig/
│   │           ├── controller/    # Controller tests
│   │           ├── service/       # Service tests
│   │           ├── validation/    # Validation tests
│   │           └── integration/   # Integration tests
│   ├── pom.xml
│   └── Dockerfile
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/           # React components
│   │   │   └── __tests__/        # Component tests
│   │   ├── utils/                # Utilities
│   │   │   └── __tests__/        # Utility tests
│   │   ├── api/                  # API client
│   │   └── __tests__/            # Integration tests
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── Architecture/               # System architecture diagrams
├── TDD_plan.md                # Test-driven development plan
├── Requirement Specs.md       # Requirements specification
└── docker-compose.yml         # Docker orchestration

```

## Testing

### Unit Tests

**Backend (Spring Boot + JUnit):**
```bash
cd backend
mvn test
```

**Frontend (Vitest + React Testing Library):**
```bash
cd frontend
npm test
```

### E2E Tests

**Frontend E2E (Playwright):**
```bash
cd frontend
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Interactive mode
npm run test:e2e:headed    # See browser
```

**Backend E2E (JUnit):**
```bash
cd backend
mvn test -Dtest="*EndToEnd*"
```

**For complete E2E testing guide, see:** [`E2E_TEST_GUIDE.md`](E2E_TEST_GUIDE.md)

### Test Coverage

**Backend:**
```bash
cd backend
mvn test jacoco:report
# Coverage report in target/site/jacoco/index.html
```

**Frontend:**
```bash
cd frontend
npm run test:coverage
# Coverage report in coverage/index.html
```

Test coverage includes:
- File I/O operations (JSON and properties files)
- Input validation (MQTT topics, IPv4 addresses, ports, serial settings)
- REST API endpoints
- Component rendering and user interactions
- Complete workflows (save, reboot, network configuration)
- Error handling and edge cases

## Quick Start

### Prerequisites

- Java 17+
- Node.js 20.18.3 (via nvm recommended)
- Maven 3.9+
- Docker & Docker Compose

### Development Mode (Recommended for Local Development)

**Quick Start:**
```bash
./START_APP.sh
```

This script will:
1. Start the backend on `http://localhost:8080`
2. Start the frontend on `http://localhost:3001`
3. Use development data from `backend/src/main/resources/dev-data/`

**Stop:**
```bash
./STOP_APP.sh
```

### Manual Development Setup

**Backend:**
```bash
cd backend
mvn spring-boot:run -s settings.xml
```
- API available at `http://localhost:8080`
- Uses local resource files (dev mode)

**Frontend:**
```bash
# Load nvm and use Node 20.18.3
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20.18.3

cd frontend
npm install
npm run dev
```
- UI available at `http://localhost:3001`

**Note:** Development mode uses sample data files from `src/main/resources/dev-data/` so you don't need to create `/opt/dm/` directories during development.

## Production Deployment

### Using Docker Compose

```bash
docker-compose up -d
```

This will:
1. Build and start the backend container (port 8080)
2. Build and start the frontend container (port 80)
3. Mount `/opt/dm/` from the host for configuration files
4. Create a network for container communication

Access the web interface at `http://<debian-ip>/`

### File Mounts

The following host paths are mounted:
- `/opt/dm/devices.json` - Device manager configuration
- `/opt/dm/config.properties` - System properties
- `/opt/dm/devices.d/` - Device-specific configurations
- `/opt/dm/scripts/reboot.sh` - Reboot script

## API Endpoints

### Configuration Endpoints

- `GET /api/devices` - Get devices.json configuration
- `GET /api/config/properties` - Get config.properties
- `GET /api/device/{deviceName}` - Get device-specific config (IBAC, S900, etc.)
- `GET /api/network` - Get network configuration
- `POST /api/save` - Save configuration (devices or config.properties)
- `POST /api/device/{deviceName}` - Save device-specific config
- `POST /api/network` - Save network config and trigger reboot
- `POST /api/reboot` - Trigger system reboot

### Quick API Test

```bash
# Get device manager config
curl http://localhost:8080/api/devices

# Get network config
curl http://localhost:8080/api/network

# Save configuration
curl -X POST http://localhost:8080/api/save \
  -H "Content-Type: application/json" \
  -d '{"configType":"devices","data":{"deviceManagerKey":"test","deviceManagerName":"Test"}}'
```

## Validation Rules

### devices.json
- `deviceManagerKey`: Max 20 chars, valid MQTT topic (no /, #, +)
- `deviceManagerName`: Max 50 chars, spaces allowed

### config.properties
- `fi.observis.sas.karafrest`: Valid IPv4 address
- `fi.observis.sas.mqtt.url`: Valid IPv4 address

### Device Configurations
- **IBAC/WXT53X**: Serial port settings with dropdown validation
  - Serial ports: ttyS0, ttyS1
  - Baud rates: 9600, 19200, 38400, 57600, 115200
  - Parity: None, Even, Odd
  - Data bits: 7, 8
  - Stop bits: 1, 2
  - Serial port type: RS232, RS485
- **S900**: IPv4 address + port number (1-65535)
- **oritestgtdb**: IPv4 address
- All devices: name field (max 50 chars)

### Network Configuration
- **Interface**: Any valid interface name (eth0, enp0s3, etc.)
- **Method**: DHCP or Static
- **IP Address**: Valid IPv4 (required for static)
- **Netmask**: Valid IPv4 (required for static)
- **Gateway**: Valid IPv4 (optional)

## Test-Driven Development

This project follows TDD principles. See `TDD_plan.md` for:
- Detailed test cases
- Development order
- Validation rules
- Priority assignments

## Architecture

See the `Architecture/` directory for:
- `context.mermaid` - System context diagram
- `container.mermaid` - Container diagram
- `component.mermaid` - Component diagram

## Documentation

- **[QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)** - Quick start, features, and troubleshooting
- **[E2E_TEST_GUIDE.md](E2E_TEST_GUIDE.md)** - Complete E2E testing guide
- **[TDD_plan.md](TDD_plan.md)** - Test-driven development plan
- **[Requirement Specs.md](Requirement%20Specs.md)** - Requirements specification
- **Architecture/** - System architecture diagrams (Mermaid)

## Troubleshooting

### Port Already in Use
```bash
# Check and kill process on port 8080 (backend)
kill $(lsof -ti:8080)

# Check and kill process on port 3001 (frontend)
kill $(lsof -ti:3001)
```

### Node Version Issues
```bash
# Verify Node version
node --version  # Should be v20.18.3

# Switch to correct version
nvm use 20.18.3
```

### Backend Not Finding Config Files
- Make sure you're running from the `backend/` directory
- Development mode uses `src/main/resources/dev-data/`
- Production mode uses `/opt/dm/` (requires actual files)

### Frontend Build Issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

For more troubleshooting, see [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)

## Contributing

1. Write tests first (following `TDD_plan.md`)
2. Implement features to pass tests
3. Run all tests (unit + E2E) before committing
4. Maintain test coverage above 80%
5. Follow Material UI design patterns

## License

Copyright © 2025 Observis. All rights reserved.

