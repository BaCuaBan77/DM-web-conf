# Development Guide

## Development Environment Setup

### Prerequisites

**Required Tools:**
- **Java**: JDK 17 or higher
- **Node.js**: v20.18.3 (use nvm for version management)
- **Maven**: 3.9+ 
- **Git**: Latest version
- **IDE**: VS Code, IntelliJ IDEA, or similar

**Recommended Tools:**
- **nvm**: Node Version Manager
- **Docker**: For testing production builds
- **Postman**: For API testing
- **Chrome DevTools**: For frontend debugging

### Initial Setup

**1. Clone the Repository:**
```bash
git clone <repository-url>
cd DM-web-conf
```

**2. Setup Node Version:**
```bash
# Install nvm if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node 20.18.3
nvm install 20.18.3
nvm use 20.18.3
```

**3. Install Dependencies:**

**Backend:**
```bash
cd backend
mvn clean install -s settings.xml -DskipTests
```

**Frontend:**
```bash
cd frontend
npm install
```

---

## Running in Development Mode

### Backend

**Start the Backend:**
```bash
cd backend
mvn spring-boot:run -s settings.xml
```

**What This Does:**
- Starts Spring Boot on port `8080`
- Uses `dev` profile (default)
- Loads config from `src/main/resources/dev-data/`
- Enables hot reload (limited)
- Shows detailed logs

**Development Configuration:**

The backend uses Spring profiles for environment-specific configuration:

`src/main/resources/application.properties` (dev profile):
```properties
dm.config.devices.path=src/main/resources/dev-data/devices.json
dm.config.properties.path=src/main/resources/dev-data/config.properties
dm.config.devices.dir=src/main/resources/dev-data/
dm.reboot.test.mode=true
dm.network.interfaces.path=src/main/resources/dev-data/interfaces
```

`src/main/resources/application-prod.properties` (prod profile):
```properties
dm.config.devices.path=/opt/dm/devices.json
dm.config.properties.path=/opt/dm/config.properties
dm.config.devices.dir=/opt/dm/devices.d/
dm.reboot.test.mode=false
dm.network.interfaces.path=/etc/network/interfaces
```

**Sample Data Files:**
Located in `backend/src/main/resources/dev-data/`:
- `devices.json`
- `config.properties`
- `IBAC.json`
- `S900.json`
- `oritestgtdb.json`
- `wxt53x.json`
- `interfaces` (network config)

### Frontend

**Start the Frontend:**
```bash
cd frontend
npm run dev
```

**What This Does:**
- Starts Vite dev server on port `3000`
- Enables hot module replacement (HMR)
- Proxies API calls to backend (port 8080)
- Provides source maps for debugging
- Fast refresh on file changes

**Vite Configuration:**

`frontend/vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
});
```

### Quick Start Script

Use the provided scripts for convenience:

**Start:**
```bash
./START_APP.sh
```

**Stop:**
```bash
./STOP_APP.sh
```

---

## Project Structure

### Backend Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/observis/dmconfig/
│   │   │   ├── DmConfigApplication.java    # Main application class
│   │   │   ├── controller/
│   │   │   │   └── ConfigController.java  # REST API endpoints
│   │   │   ├── service/
│   │   │   │   ├── ConfigService.java     # Business logic
│   │   │   │   ├── FileService.java       # File I/O
│   │   │   │   ├── RebootService.java     # System reboot
│   │   │   │   └── NetworkConfigService.java # Network config
│   │   │   └── validation/
│   │   │       └── ValidationService.java  # Input validation
│   │   └── resources/
│   │       ├── application.properties         # Dev profile config
│   │       ├── application-prod.properties    # Prod profile config
│   │       └── dev-data/                     # Dev sample data
│   └── test/
│       ├── java/com/observis/dmconfig/
│       │   ├── controller/    # Controller tests
│       │   ├── service/       # Service tests
│       │   ├── validation/    # Validation tests
│       │   ├── integration/   # Integration tests
│       │   └── e2e/          # End-to-end tests
│       └── resources/
│           └── test-*.{json,properties}  # Test data
├── pom.xml              # Maven configuration
├── settings.xml         # Maven settings (use Maven Central)
└── Dockerfile          # Production container
```

### Frontend Structure

```
frontend/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Main app component
│   ├── App.css                     # App styles
│   ├── index.css                   # Global styles
│   ├── components/
│   │   ├── DevicesTab.tsx         # DM Details page
│   │   ├── ConfigPropertiesTab.tsx # Server Connection page
│   │   ├── DeviceTab.tsx          # Device config pages
│   │   ├── NetworkConfigTab.tsx   # Network config page
│   │   └── __tests__/             # Component tests
│   ├── api/
│   │   └── configApi.ts           # API client
│   ├── utils/
│   │   ├── validation.ts          # Validation utilities
│   │   └── __tests__/             # Utility tests
│   └── __tests__/
│       └── integration/           # Integration tests
├── e2e/                           # Playwright E2E tests
│   ├── app.spec.ts
│   ├── network-config.spec.ts
│   └── save-workflow.spec.ts
├── public/
│   ├── ms-bio.svg                # IBAC2 icon
│   ├── ms-rad.svg                # S900 icon
│   └── ms-chem.svg               # GTD Module-B icon
├── package.json                   # Dependencies
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript config
├── playwright.config.ts          # E2E test config
└── Dockerfile                    # Production container
```

---

## Development Workflow

### Making Changes

**1. Create a Feature Branch:**
```bash
git checkout -b feature/your-feature-name
```

**2. Make Your Changes:**
- Write tests first (TDD approach)
- Implement the feature
- Run tests to verify
- Check linter output

**3. Test Locally:**
```bash
# Backend tests
cd backend
mvn test -s settings.xml

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

**4. Commit Your Changes:**
```bash
git add .
git commit -m "feat: add new feature"
```

**5. Push and Create PR:**
```bash
git push origin feature/your-feature-name
# Create pull request on GitHub
```

### Code Style

**Backend (Java):**
- Follow Spring Boot conventions
- Use `@Service`, `@Controller`, `@Autowired` annotations
- Keep methods focused and small
- Write comprehensive JavaDoc for public APIs

**Frontend (TypeScript/React):**
- Use functional components with hooks
- TypeScript for all new code
- Props interface for all components
- Descriptive variable names

**Formatting:**
- Backend: Default IntelliJ formatting
- Frontend: Prettier (configured in project)

### Naming Conventions

**Backend:**
- Classes: `PascalCase` (e.g., `ConfigService`)
- Methods: `camelCase` (e.g., `saveDevicesConfig`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_NAME_LENGTH`)

**Frontend:**
- Components: `PascalCase` (e.g., `DevicesTab`)
- Functions: `camelCase` (e.g., `handleSaveClick`)
- Files: Match component name (e.g., `DevicesTab.tsx`)
- Constants: `UPPER_SNAKE_CASE`

---

## Testing

### Backend Testing

**Run All Tests:**
```bash
cd backend
mvn test -s settings.xml
```

**Run Specific Test Class:**
```bash
mvn test -Dtest=ConfigServiceTest -s settings.xml
```

**Run E2E Tests Only:**
```bash
mvn test -Dtest="*EndToEnd*" -s settings.xml
```

**Test Coverage:**
```bash
mvn test jacoco:report -s settings.xml
# Report: target/site/jacoco/index.html
```

**Writing Backend Tests:**

```java
@SpringBootTest
class ConfigServiceTest {
    @Autowired
    private ConfigService configService;

    @Test
    void testSaveDevicesConfig() {
        Map<String, String> data = new HashMap<>();
        data.put("deviceManagerKey", "DM-1");
        data.put("deviceManagerName", "Test");
        
        assertDoesNotThrow(() -> configService.saveDevicesConfig(data));
    }
}
```

### Frontend Testing

**Run All Unit Tests:**
```bash
cd frontend
npm test
```

**Run Tests in Watch Mode:**
```bash
npm test -- --watch
```

**Run E2E Tests:**
```bash
npm run test:e2e           # Headless
npm run test:e2e:ui        # Interactive UI
npm run test:e2e:headed    # See browser
```

**Test Coverage:**
```bash
npm run test:coverage
# Report: coverage/index.html
```

**Writing Component Tests:**

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DevicesTab from '../DevicesTab';

test('renders device manager key field', () => {
  render(<DevicesTab onDataChange={() => {}} onValidationChange={() => {}} />);
  
  const keyInput = screen.getByLabelText(/Device Manager Key/i);
  expect(keyInput).toBeInTheDocument();
});

test('validates MQTT topic', async () => {
  const user = userEvent.setup();
  render(<DevicesTab onDataChange={() => {}} onValidationChange={() => {}} />);
  
  const keyInput = screen.getByLabelText(/Device Manager Key/i);
  await user.type(keyInput, 'invalid/topic');
  
  expect(screen.getByText(/Invalid MQTT topic/i)).toBeInTheDocument();
});
```

**Writing E2E Tests:**

```typescript
import { test, expect } from '@playwright/test';

test('save workflow saves multiple tabs', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Modify DM Details
  await page.click('text=DM Details');
  await page.fill('[placeholder*="DM-1"]', 'DM-TEST');
  
  // Modify Server Connection
  await page.click('text=Server Connection');
  await page.fill('[placeholder*="192.168"]', '192.168.1.200');
  
  // Save all
  await page.click('button:has-text("Save Changes")');
  await page.click('button:has-text("Confirm")');
  
  await expect(page.locator('text=Saved successfully')).toBeVisible();
});
```

---

## Debugging

### Backend Debugging

**Enable Debug Logging:**

`application.properties`:
```properties
logging.level.com.observis.dmconfig=DEBUG
logging.level.org.springframework.web=DEBUG
```

**IntelliJ Debug:**
1. Set breakpoint in code
2. Right-click `DmConfigApplication.java`
3. Select "Debug 'DmConfigApplication'"

**View Logs:**
```bash
# In console where mvn spring-boot:run is running
# Or check logs directory if configured
```

### Frontend Debugging

**Browser DevTools:**
```
F12 → Console tab
F12 → Network tab (for API calls)
F12 → React DevTools (install extension)
```

**VS Code Debugging:**

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ]
}
```

**Common Issues:**

**API Not Responding:**
```bash
# Check backend is running
curl http://localhost:8080/api/devices

# Check Vite proxy configuration
# Should proxy /api/* to http://localhost:8080
```

**Hot Reload Not Working:**
```bash
# Frontend: Check Vite is running
# Backend: Spring Boot DevTools (auto-restart limited)
```

---

## Building for Production

### Backend Build

**Create JAR:**
```bash
cd backend
mvn clean package -s settings.xml -DskipTests
```

**Output:** `target/dm-web-config-1.0.0.jar`

**Run JAR:**
```bash
java -Dspring.profiles.active=prod -jar target/dm-web-config-1.0.0.jar
```

### Frontend Build

**Create Production Build:**
```bash
cd frontend
npm run build
```

**Output:** `dist/` directory

**Preview Production Build:**
```bash
npm run preview
```

### Docker Build

**Build Images:**
```bash
# Build both containers
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

**Run in Docker:**
```bash
docker-compose up -d
```

**View Logs:**
```bash
docker-compose logs -f
docker-compose logs backend
docker-compose logs frontend
```

---

## Contributing

### Pull Request Process

1. **Write Tests First** (TDD approach)
2. **Implement Feature** to pass tests
3. **Run All Tests** (unit + E2E)
4. **Check Code Style** (linter)
5. **Update Documentation** if needed
6. **Create Pull Request** with clear description
7. **Address Review Comments**

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semi-colons, etc
- `refactor`: Code change that neither fixes bug nor adds feature
- `test`: Adding tests
- `chore`: Updating build tasks, package manager configs, etc

**Examples:**
```
feat(ui): add save all changes functionality

Implemented multi-tab save that saves all modified
configurations in a single operation with one reboot.

Closes #123
```

```
fix(backend): correct IPv4 validation regex

The previous regex didn't handle edge cases like 192.168.1.0.
Updated to properly validate all valid IPv4 addresses.
```

### Code Review Checklist

**Before Requesting Review:**
- ✅ All tests passing
- ✅ No linter errors
- ✅ Code is self-documenting
- ✅ Complex logic has comments
- ✅ No console.log / println left in code
- ✅ Documentation updated
- ✅ Commits are clean and clear

**Reviewers Check For:**
- Code follows project patterns
- Tests cover new functionality
- No security vulnerabilities
- Performance considerations
- Error handling is comprehensive
- UI/UX is consistent

---

## Advanced Topics

### Adding a New Configuration Tab

**1. Create Component:**

`frontend/src/components/NewConfigTab.tsx`:
```typescript
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { TextField, Box, Typography } from '@mui/material';

interface NewConfigTabProps {
  onDataChange: (hasChanges: boolean) => void;
  onValidationChange: (isValid: boolean) => void;
}

const NewConfigTab = forwardRef((props: NewConfigTabProps, ref) => {
  const [data, setData] = useState('');
  const [originalData, setOriginalData] = useState('');

  useImperativeHandle(ref, () => ({
    getData: () => ({ newField: data })
  }));

  useEffect(() => {
    // Load data from API
  }, []);

  useEffect(() => {
    props.onDataChange(data !== originalData);
  }, [data]);

  return (
    <Box>{/* Your form fields */}</Box>
  );
});

export default NewConfigTab;
```

**2. Add to App.tsx:**

```typescript
import NewConfigTab from './components/NewConfigTab';

// Add ref
const newConfigTabRef = useRef<any>(null);

// Add to menuSections
{
  label: 'New Config',
  key: 'newconfig',
  icon: <SettingsIcon />,
  index: 7
}

// Add to content rendering
{currentTab === 7 && (
  <NewConfigTab
    ref={newConfigTabRef}
    onDataChange={(changed) => handleDataChange('newconfig', changed)}
    onValidationChange={(valid) => handleValidationChange('newconfig', valid)}
  />
)}

// Add to save switch
case 'newconfig':
  const newData = newConfigTabRef.current?.getData();
  response = await saveData('newconfig', newData);
  break;
```

**3. Add Backend Endpoint:**

```java
@GetMapping("/newconfig")
public ResponseEntity<?> getNewConfig() {
    // Implementation
}

@PostMapping("/newconfig")
public ResponseEntity<?> saveNewConfig(@RequestBody Map<String, String> data) {
    // Implementation
}
```

### Custom Validation

**Frontend:**

`frontend/src/utils/validation.ts`:
```typescript
export function validateCustomField(value: string): boolean {
  // Your validation logic
  return /^[a-zA-Z0-9]+$/.test(value);
}
```

**Backend:**

`backend/src/main/java/com/observis/dmconfig/validation/ValidationService.java`:
```java
public boolean isCustomFieldValid(String value) {
    if (value == null || value.isEmpty()) {
        return false;
    }
    return value.matches("^[a-zA-Z0-9]+$");
}
```

---

## Useful Commands

### Maven

```bash
# Clean build
mvn clean install -s settings.xml

# Skip tests
mvn clean package -DskipTests -s settings.xml

# Run specific test
mvn test -Dtest=TestClassName -s settings.xml

# Generate coverage
mvn test jacoco:report -s settings.xml

# Run in production profile
mvn spring-boot:run -Dspring-boot.run.profiles=prod -s settings.xml
```

### NPM

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Run all tests
npm test

# Run E2E tests
npm run test:e2e

# Update dependencies
npm update

# Check outdated packages
npm outdated
```

### Docker

```bash
# Build and start
docker-compose up --build

# Start detached
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Remove volumes
docker-compose down -v

# Restart specific service
docker-compose restart backend

# Execute command in container
docker-compose exec backend bash
```

### Git

```bash
# Create feature branch
git checkout -b feature/name

# Stage changes
git add .

# Commit
git commit -m "message"

# Push branch
git push -u origin feature/name

# Pull latest
git pull origin main

# Rebase on main
git rebase main

# Squash commits
git rebase -i HEAD~3
```

---

## Resources

**Spring Boot:**
- https://spring.io/projects/spring-boot
- https://docs.spring.io/spring-boot/docs/current/reference/html/

**React:**
- https://react.dev/
- https://reactrouter.com/

**Material UI:**
- https://mui.com/material-ui/getting-started/

**Testing:**
- https://junit.org/junit5/
- https://vitest.dev/
- https://playwright.dev/

**Build Tools:**
- https://maven.apache.org/
- https://vitejs.dev/

---

For more information, see:
- [Quick Start Guide](quick-start-guide.md)
- [API Documentation](../API.md)
- [E2E Testing Guide](../testing/e2e-test-guide.md)
