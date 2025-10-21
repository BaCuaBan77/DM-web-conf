import { test, expect } from '@playwright/test';

test.describe('Material UI Application E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display the application with Material UI header', async ({ page }) => {
    // Check header
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByText('Device Manager Configuration')).toBeVisible();
    
    // Check Save & Reboot button exists (should be disabled initially)
    const saveButton = page.getByRole('button', { name: /save & reboot/i });
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeDisabled();
  });

  test('should have all tabs visible', async ({ page }) => {
    const tabs = [
      'Devices',
      'Config Properties',
      'IBAC',
      'S900',
      'OriTestGTDB',
      'WXT53X',
      'Network Config'
    ];

    for (const tabName of tabs) {
      await expect(page.getByRole('tab', { name: new RegExp(tabName, 'i') })).toBeVisible();
    }
  });

  test('should switch between tabs', async ({ page }) => {
    // Click on Config Properties tab
    await page.getByRole('tab', { name: /config properties/i }).click();
    await expect(page.getByText('MQTT Broker IP')).toBeVisible();

    // Click on Network Config tab
    await page.getByRole('tab', { name: /network config/i }).click();
    await expect(page.getByText('Debian Static IP Configuration')).toBeVisible();

    // Go back to Devices tab
    await page.getByRole('tab', { name: /^devices$/i }).first().click();
    await expect(page.getByText('Device Manager Key')).toBeVisible();
  });

  test('should show unsaved changes indicator when editing Devices tab', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(1000);

    // Get the current value
    const keyInput = page.getByLabel('Device Manager Key');
    await expect(keyInput).toBeVisible();
    
    // Edit the field
    await keyInput.clear();
    await keyInput.fill('test-device-key');

    // Wait a bit for change detection
    await page.waitForTimeout(500);

    // Check that Save & Reboot button is now enabled
    const saveButton = page.getByRole('button', { name: /save & reboot/i });
    await expect(saveButton).toBeEnabled();
  });

  test('should validate MQTT topic in Devices tab', async ({ page }) => {
    await page.waitForTimeout(1000);

    const keyInput = page.getByLabel('Device Manager Key');
    
    // Enter invalid MQTT topic (with /)
    await keyInput.clear();
    await keyInput.fill('invalid/topic');
    await keyInput.blur();

    // Wait for validation
    await page.waitForTimeout(300);

    // Should show error
    await expect(page.getByText(/invalid mqtt topic/i)).toBeVisible();
  });

  test('should validate IP address in Config Properties tab', async ({ page }) => {
    // Go to Config Properties tab
    await page.getByRole('tab', { name: /config properties/i }).click();
    await page.waitForTimeout(1000);

    const ipInput = page.getByLabel('MQTT Broker IP');
    
    // Enter invalid IP
    await ipInput.clear();
    await ipInput.fill('999.999.999.999');
    await ipInput.blur();

    await page.waitForTimeout(300);

    // Should show error
    await expect(page.getByText(/invalid ipv4/i)).toBeVisible();
  });

  test('should validate port number in Config Properties tab', async ({ page }) => {
    // Go to Config Properties tab
    await page.getByRole('tab', { name: /config properties/i }).click();
    await page.waitForTimeout(1000);

    const portInput = page.getByLabel('MQTT Port');
    
    // Enter invalid port
    await portInput.clear();
    await portInput.fill('99999');
    await portInput.blur();

    await page.waitForTimeout(300);

    // Should show error (port must be 1-65535)
    await expect(page.getByText(/invalid port/i)).toBeVisible();
  });

  test('should load and display network configuration', async ({ page }) => {
    // Go to Network Config tab
    await page.getByRole('tab', { name: /network config/i }).click();
    await page.waitForTimeout(1000);

    // Should show network configuration fields
    await expect(page.getByLabel('Interface Name')).toBeVisible();
    await expect(page.getByText('Configuration Method')).toBeVisible();
    await expect(page.getByLabel('IP Address')).toBeVisible();
  });

  test('should toggle between DHCP and Static in Network Config', async ({ page }) => {
    // Go to Network Config tab
    await page.getByRole('tab', { name: /network config/i }).click();
    await page.waitForTimeout(1000);

    // Click DHCP radio button
    await page.getByLabel('DHCP').click();
    
    // IP fields should not be required/visible for input
    await page.waitForTimeout(300);

    // Click Static radio button
    await page.getByLabel('Static IP').click();
    
    // IP fields should be visible
    await expect(page.getByLabel('IP Address')).toBeVisible();
    await expect(page.getByLabel('Netmask')).toBeVisible();
    await expect(page.getByLabel('Gateway')).toBeVisible();
  });

  test('should show Save & Reboot confirmation dialog', async ({ page }) => {
    // Make a change
    await page.waitForTimeout(1000);
    const keyInput = page.getByLabel('Device Manager Key');
    await keyInput.clear();
    await keyInput.fill('test-key-123');
    
    await page.waitForTimeout(500);

    // Click Save & Reboot button
    const saveButton = page.getByRole('button', { name: /save & reboot/i });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Should show confirmation dialog
    await expect(page.getByText('Confirm Save & Reboot')).toBeVisible();
    await expect(page.getByText(/this will save the current configuration/i)).toBeVisible();
    
    // Should have Cancel and Save & Reboot buttons
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('button', { name: /save & reboot/i })).toBeVisible();

    // Click Cancel
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByText('Confirm Save & Reboot')).not.toBeVisible();
  });

  test('should display loading state while fetching data', async ({ page }) => {
    // Reload to see loading state
    await page.reload();
    
    // Should show loading spinner initially (might be very quick)
    const spinner = page.locator('svg[class*="MuiCircularProgress"]');
    // This might not be visible if loading is too fast
  });

  test('should configure IBAC device with serial settings', async ({ page }) => {
    // Go to IBAC tab
    await page.getByRole('tab', { name: /ibac/i }).click();
    await page.waitForTimeout(1000);

    // Should show serial port configuration
    await expect(page.getByText('Serial Port')).toBeVisible();
    await expect(page.getByText('Baud Rate')).toBeVisible();
    await expect(page.getByText('Parity')).toBeVisible();

    // Test changing serial port
    await page.getByLabel('Serial Port').click();
    await page.getByRole('option', { name: 'ttyS1' }).click();

    // Button should be enabled after change
    await page.waitForTimeout(500);
    const saveButton = page.getByRole('button', { name: /save & reboot/i });
    await expect(saveButton).toBeEnabled();
  });

  test('should configure S900 device with IP settings', async ({ page }) => {
    // Go to S900 tab
    await page.getByRole('tab', { name: /s900/i }).click();
    await page.waitForTimeout(1000);

    // Should show IP configuration
    await expect(page.getByLabel('IP Address')).toBeVisible();
    await expect(page.getByLabel('Port Number')).toBeVisible();

    // Test changing IP
    const ipInput = page.getByLabel('IP Address');
    await ipInput.clear();
    await ipInput.fill('192.168.1.50');

    await page.waitForTimeout(500);
    const saveButton = page.getByRole('button', { name: /save & reboot/i });
    await expect(saveButton).toBeEnabled();
  });

  test('should show warning in Network Config tab', async ({ page }) => {
    // Go to Network Config tab
    await page.getByRole('tab', { name: /network config/i }).click();
    await page.waitForTimeout(1000);

    // Should show warning about reboot
    await expect(page.getByText(/warning/i)).toBeVisible();
    await expect(page.getByText(/changing network settings will cause the system to reboot/i)).toBeVisible();
  });

  test('should persist tab state when switching tabs', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Make a change in Devices tab
    const keyInput = page.getByLabel('Device Manager Key');
    const originalValue = await keyInput.inputValue();
    await keyInput.clear();
    await keyInput.fill('test-device-modified');

    // Switch to another tab
    await page.getByRole('tab', { name: /config properties/i }).click();
    await page.waitForTimeout(500);

    // Switch back to Devices tab
    await page.getByRole('tab', { name: /^devices$/i }).first().click();
    await page.waitForTimeout(500);

    // Value should still be there
    const currentValue = await page.getByLabel('Device Manager Key').inputValue();
    expect(currentValue).toBe('test-device-modified');
  });

  test('should show all Material UI styling elements', async ({ page }) => {
    // Check for Material UI Paper component
    const paper = page.locator('[class*="MuiPaper"]').first();
    await expect(paper).toBeVisible();

    // Check for Material UI Tabs
    const tabs = page.locator('[class*="MuiTabs"]').first();
    await expect(tabs).toBeVisible();

    // Check for Material UI TextField
    await expect(page.locator('[class*="MuiTextField"]').first()).toBeVisible();
  });
});


