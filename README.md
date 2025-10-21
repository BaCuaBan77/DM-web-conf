# Device Manager Web Configuration Interface

A web-based configuration interface for Device Manager running in Docker on a Debian PC.

## Overview

This project provides a user-friendly web interface to edit configuration files for the Device Manager system. It consists of:
- **Backend**: Spring Boot REST API
- **Frontend**: React + TypeScript + Vite
- **Deployment**: Docker containers

## Features

- Edit device manager configuration (`devices.json`)
- Edit system properties (`config.properties`)
- Configure device-specific settings (IBAC, S900, oritestgtdb, WXT53X)
- Real-time validation
- System reboot trigger
- Tabbed interface for easy navigation

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

## Running Tests

### Backend Tests (Spring Boot + JUnit)

```bash
cd backend
mvn test
```

Test coverage includes:
- File I/O operations (JSON and properties files)
- Input validation (MQTT topics, IPv4 addresses, ports, serial settings)
- REST API endpoints
- Reboot script execution
- Integration tests for full save workflow

### Frontend Tests (Vitest + React Testing Library)

```bash
cd frontend
npm test
```

Test coverage includes:
- Component rendering and data loading
- Real-time validation
- User interactions (form editing, tab switching)
- Save workflow
- Error handling

### Run Tests with Coverage

Backend:
```bash
cd backend
mvn test jacoco:report
# Coverage report in target/site/jacoco/index.html
```

Frontend:
```bash
cd frontend
npm run test:coverage
# Coverage report in coverage/index.html
```

## Development Setup

### Prerequisites

- Java 17+
- Node.js 20+
- Maven 3.9+
- Docker & Docker Compose

### Backend Development

**Development Mode** (uses local resource files):
```bash
cd backend
mvn spring-boot:run -s settings.xml
```

**Production Mode** (uses `/opt/dm/` paths):
```bash
cd backend
mvn spring-boot:run -s settings.xml -Dspring.profiles.active=prod
```

API will be available at `http://localhost:8080`

**Note:** Development mode uses sample data files from `src/main/resources/dev-data/` so you don't need to create `/opt/dm/` directories during development.

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`

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
- `GET /api/device/{deviceName}` - Get device-specific config
- `POST /api/save` - Save configuration
- `POST /api/device/{deviceName}` - Save device-specific config
- `POST /api/reboot` - Trigger system reboot

## Validation Rules

### devices.json
- `deviceManagerKey`: Max 20 chars, valid MQTT topic characters only (no spaces, #, +)
- `deviceManagerName`: Max 50 chars, spaces allowed

### config.properties
- `fi.observis.sas.karafrest`: Valid IPv4 address
- `fi.observis.sas.mqtt.url`: Valid IPv4 address

### Device Configurations
- **IBAC/WXT53X**: Serial port settings with dropdown validation
- **S900**: IPv4 address + port number (1-65535)
- **oritestgtdb**: IPv4 address
- All devices: name field (max 50 chars)

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

## Contributing

1. Write tests first (following `TDD_plan.md`)
2. Implement features to pass tests
3. Ensure all tests pass before committing
4. Maintain test coverage above 80%

## License

Copyright © 2025 Observis. All rights reserved.

