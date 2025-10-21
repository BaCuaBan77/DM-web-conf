# E2E Testing Guide

## Overview

This project includes comprehensive End-to-End (E2E) tests covering:
- Frontend UI interactions with Playwright
- Backend API integration tests
- Full workflow testing from UI to backend

## Test Structure

```
frontend/
├── e2e/
│   ├── app.spec.ts              # Main UI tests
│   ├── network-config.spec.ts   # Network configuration tests
│   └── save-workflow.spec.ts    # Save & Reboot workflow tests
└── playwright.config.ts         # Playwright configuration

backend/
└── src/test/java/com/observis/dmconfig/e2e/
    ├── EndToEndWorkflowTest.java        # Full API workflow tests
    └── NetworkConfigEndToEndTest.java   # Network API tests
```

## Running E2E Tests

### Frontend E2E Tests (Playwright)

**Prerequisites:**
- Node.js 20.18.3
- Frontend and backend servers running

**Run all E2E tests:**
```bash
cd frontend
npm run test:e2e
```

**Run with UI (interactive mode):**
```bash
npm run test:e2e:ui
```

**Run in headed mode (see browser):**
```bash
npm run test:e2e:headed
```

**Run specific test file:**
```bash
npx playwright test e2e/network-config.spec.ts
```

### Backend E2E Tests (JUnit)

**Run all backend E2E tests:**
```bash
cd backend
mvn test -Dtest="*EndToEnd*"
```

**Run specific test class:**
```bash
mvn test -Dtest=EndToEndWorkflowTest
mvn test -Dtest=NetworkConfigEndToEndTest
```

**Run all tests (unit + integration + E2E):**
```bash
mvn test
```

## Test Coverage

### Frontend E2E Tests

#### `app.spec.ts` - Main Application Tests
- ✅ Material UI header display
- ✅ All tabs visibility
- ✅ Tab navigation
- ✅ Unsaved changes indicator
- ✅ MQTT topic validation
- ✅ IP address validation
- ✅ Port number validation
- ✅ Serial device configuration (IBAC)
- ✅ IP device configuration (S900)
- ✅ Save & Reboot confirmation dialog
- ✅ Material UI styling elements
- ✅ Tab state persistence

#### `network-config.spec.ts` - Network Configuration
- ✅ Load network configuration
- ✅ Validate IP address format
- ✅ Validate netmask format
- ✅ Optional gateway validation
- ✅ DHCP/Static toggle
- ✅ Unsaved changes detection
- ✅ Reboot warning display
- ✅ Valid static IP acceptance

#### `save-workflow.spec.ts` - Save & Reboot Workflow
- ✅ Complete save workflow (Devices)
- ✅ Complete save workflow (Config Properties)
- ✅ Validation prevents invalid saves
- ✅ Cancel save operation
- ✅ Loading state during save
- ✅ Error handling
- ✅ Change tracking across tabs

### Backend E2E Tests

#### `EndToEndWorkflowTest.java` - Full Workflows
- ✅ Device manager configuration workflow
- ✅ Config properties workflow
- ✅ Network configuration workflow
- ✅ IBAC device workflow
- ✅ S900 device workflow
- ✅ Validation in workflow
- ✅ Multiple sequential updates
- ✅ All GET endpoints

#### `NetworkConfigEndToEndTest.java` - Network Specific
- ✅ Read network configuration
- ✅ Save static IP configuration
- ✅ Save DHCP configuration
- ✅ Invalid IP rejection
- ✅ Invalid netmask rejection
- ✅ Optional gateway handling
- ✅ Different interface names
- ✅ Complete reconfiguration workflow

## Test Scenarios

### Scenario 1: User Changes Device Configuration
1. User opens application
2. Navigates to Devices tab
3. Modifies Device Manager Key
4. Unsaved changes indicator appears
5. Clicks Save & Reboot
6. Confirms in dialog
7. Configuration saved and system reboots

**Tested in:** `app.spec.ts`, `save-workflow.spec.ts`, `EndToEndWorkflowTest.java`

### Scenario 2: User Configures Static IP
1. User navigates to Network Config tab
2. Selects Static IP method
3. Enters IP, Netmask, Gateway
4. Real-time validation checks input
5. Clicks Save & Reboot
6. System saves and automatically reboots

**Tested in:** `network-config.spec.ts`, `NetworkConfigEndToEndTest.java`

### Scenario 3: Validation Prevents Invalid Input
1. User enters invalid MQTT topic (with /)
2. Validation error appears immediately
3. Save button remains disabled
4. User corrects input
5. Validation passes, save enabled

**Tested in:** `app.spec.ts`, `save-workflow.spec.ts`, `EndToEndWorkflowTest.java`

### Scenario 4: Multiple Device Configurations
1. User configures IBAC (serial device)
2. Saves and reboots
3. User configures S900 (IP device)
4. Saves and reboots
5. All configurations persist

**Tested in:** `app.spec.ts`, `EndToEndWorkflowTest.java`

## Writing New E2E Tests

### Frontend (Playwright)

Create a new test file in `frontend/e2e/`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page.getByRole('button')).toBeVisible();
  });
});
```

### Backend (JUnit)

Create a new test class in `backend/src/test/java/com/observis/dmconfig/e2e/`:

```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("My Feature E2E Tests")
public class MyFeatureEndToEndTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("E2E: Test scenario description")
    public void testScenario() throws Exception {
        mockMvc.perform(get("/api/endpoint"))
                .andExpect(status().isOk());
    }
}
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  backend-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-java@v2
        with:
          java-version: '17'
      - name: Run Backend E2E Tests
        run: cd backend && mvn test -Dtest="*EndToEnd*"

  frontend-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd frontend && npm install
      - name: Install Playwright
        run: cd frontend && npx playwright install --with-deps
      - name: Run Frontend E2E Tests
        run: cd frontend && npm run test:e2e
```

## Debugging E2E Tests

### Frontend (Playwright)

**View test report:**
```bash
npx playwright show-report
```

**Debug specific test:**
```bash
npx playwright test --debug e2e/app.spec.ts
```

**Generate trace:**
```bash
npx playwright test --trace on
```

### Backend (JUnit)

**Run with verbose output:**
```bash
mvn test -Dtest=EndToEndWorkflowTest -X
```

**Run with Spring debug:**
```bash
mvn test -Dtest=EndToEndWorkflowTest -Dlogging.level.org.springframework=DEBUG
```

## Best Practices

1. **Independent Tests**: Each test should be independent and not rely on other tests
2. **Clean State**: Use `beforeEach` to ensure clean state
3. **Descriptive Names**: Use clear, descriptive test names
4. **Wait Strategies**: Use proper wait strategies (avoid fixed timeouts when possible)
5. **Mock External Services**: Mock services like reboot to prevent actual system changes
6. **Assertions**: Use meaningful assertions with clear error messages
7. **Page Objects**: Consider using Page Object Model for complex UIs (future enhancement)

## Troubleshooting

### Frontend Tests Fail with "Page not found"
- Ensure backend is running on port 8080
- Ensure frontend dev server starts (port 3001)
- Check `playwright.config.ts` webServer configuration

### Backend Tests Fail with "Port in use"
- Ensure no other instance is running
- Use `@ActiveProfiles("test")` to use test profile

### Tests Timeout
- Increase timeout in playwright.config.ts
- Check for slow network or API responses
- Use `page.waitForLoadState('networkidle')`

### Validation Tests Inconsistent
- Add explicit waits after input (`page.waitForTimeout(300)`)
- Check validation is async/debounced

## Future Enhancements

- [ ] Add visual regression testing
- [ ] Add performance testing
- [ ] Add accessibility (a11y) tests
- [ ] Add cross-browser testing
- [ ] Add mobile viewport testing
- [ ] Add load testing
- [ ] Add API contract testing
- [ ] Implement Page Object Model pattern


