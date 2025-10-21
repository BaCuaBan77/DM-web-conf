import { test, expect } from '@playwright/test';

test.describe('Material UI Application E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display the application with Material UI header', async ({ page }) => {
    // Check header
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.getByText('Device Manager Configuration')).toBeVisible();
    
    // Check Save button exists (should be disabled initially)
    const saveButton = page.getByTestId('save-button');
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeDisabled();
  });

  test('should have all tabs visible', async ({ page }) => {
    const tabs = [
      'devices',
      'config',
      'ibac',
      's900',
      'ori',
      'wxt',
      'network'
    ];

    for (const tabId of tabs) {
      await expect(page.getByTestId(`tab-${tabId}`)).toBeVisible();
    }
  });

  test('should switch between tabs', async ({ page }) => {
    // Click on Config Properties tab
    await page.getByTestId('tab-config').click();
    await page.waitForTimeout(1000);
    await expect(page.getByPlaceholder('192.168.1.100').first()).toBeVisible();

    // Click on Network Config tab
    await page.getByTestId('tab-network').click();
    await page.waitForTimeout(1500);
    await expect(page.getByText('Network Interface Configuration')).toBeVisible();

    // Go back to Devices tab
    await page.getByTestId('tab-devices').click();
    await page.waitForTimeout(1000);
    await expect(page.getByText('Device Configuration')).toBeVisible();
  });

  test('should show unsaved changes indicator when editing Devices tab', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(1500);

    // Get the first input field (using placeholder)
    const keyInput = page.getByPlaceholder('DM-1');
    await expect(keyInput).toBeVisible();
    
    // Edit the field
    await keyInput.clear();
    await keyInput.fill('test-device-key');

    // Wait a bit for change detection
    await page.waitForTimeout(500);

    // Check that Save button is now enabled
    const saveButton = page.getByTestId('save-button');
    await expect(saveButton).toBeEnabled();
  });

  test('should validate MQTT topic in Devices tab', async ({ page }) => {
    await page.waitForTimeout(1500);

    const keyInput = page.getByPlaceholder('DM-1');
    
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
    await page.getByTestId('tab-config').click();
    await page.waitForTimeout(1500);

    const ipInput = page.getByPlaceholder('192.168.1.100');
    
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
    await page.getByTestId('tab-config').click();
    await page.waitForTimeout(1500);

    const portInput = page.getByPlaceholder('1883');
    
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
    await page.getByTestId('tab-network').click();
    await page.waitForTimeout(1500);

    // Should show network configuration heading
    await expect(page.getByRole('heading', { name: 'Network Interface Configuration' })).toBeVisible();
    await expect(page.getByText('Configuration Method')).toBeVisible();
  });

  test('should toggle between DHCP and Static in Network Config', async ({ page }) => {
    // Go to Network Config tab
    await page.getByTestId('tab-network').click();
    await page.waitForTimeout(1500);

    // Click DHCP radio button
    await page.getByTestId('radio-dhcp').click();
    await page.waitForTimeout(500);

    // Click Static radio button
    await page.getByTestId('radio-static').click();
    await page.waitForTimeout(500);
    
    // IP fields should be visible
    await expect(page.getByTestId('input-address')).toBeVisible();
  });

  test('should show Save confirmation dialog', async ({ page }) => {
    // Make a change
    await page.waitForTimeout(1500);
    const keyInput = page.getByPlaceholder('DM-1');
    await keyInput.clear();
    await keyInput.fill('test-key-123');
    
    await page.waitForTimeout(500);

    // Click Save button
    const saveButton = page.getByTestId('save-button');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Should show confirmation dialog
    await expect(page.getByText('Confirm Save Changes')).toBeVisible();
    
    // Should have Cancel and Confirm buttons
    await expect(page.getByTestId('dialog-cancel')).toBeVisible();
    await expect(page.getByTestId('dialog-confirm')).toBeVisible();

    // Click Cancel
    await page.getByTestId('dialog-cancel').click();
    await expect(page.getByText('Confirm Save Changes')).not.toBeVisible();
  });

  test('should configure IBAC device with serial settings', async ({ page }) => {
    // Go to IBAC tab
    await page.getByTestId('tab-ibac').click();
    await page.waitForTimeout(1500);

    // Should show serial port configuration fields
    await expect(page.getByText('Serial Port').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Baud Rate' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Parity' })).toBeVisible();
  });

  test('should configure S900 device with IP settings', async ({ page }) => {
    // Go to S900 tab
    await page.getByTestId('tab-s900').click();
    await page.waitForTimeout(1500);

    // Should show IP configuration fields
    await expect(page.getByText('IP Address').first()).toBeVisible();
    await expect(page.getByText('Port Number').first()).toBeVisible();
    
    // Verify placeholder exists (IP address placeholder)
    await expect(page.getByPlaceholder('192.168.1.50')).toBeVisible();
  });

  test('should show warning in Network Config tab', async ({ page }) => {
    // Go to Network Config tab
    await page.getByTestId('tab-network').click();
    await page.waitForTimeout(1500);

    // Should show warning about reboot
    await expect(page.getByText(/warning/i)).toBeVisible();
    await expect(page.getByText(/changing network settings will cause the system to reboot/i)).toBeVisible();
  });

  test('should reload data when switching tabs', async ({ page }) => {
    await page.waitForTimeout(1500);

    // Switch to Config Properties tab
    await page.getByTestId('tab-config').click();
    await page.waitForTimeout(1500);
    
    // Verify Config Properties tab loaded
    await expect(page.getByPlaceholder('192.168.1.100')).toBeVisible();

    // Switch to Network Config tab
    await page.getByTestId('tab-network').click();
    await page.waitForTimeout(1500);
    
    // Verify Network Config tab loaded
    await expect(page.getByRole('heading', { name: 'Network Interface Configuration' })).toBeVisible();

    // Switch back to Devices tab
    await page.getByTestId('tab-devices').click();
    await page.waitForTimeout(1500);
    
    // Verify Devices tab reloaded (data comes from backend)
    const keyInput = page.getByPlaceholder('DM-1');
    await expect(keyInput).toBeVisible();
    const value = await keyInput.inputValue();
    expect(value.length).toBeGreaterThan(0); // Should have some value from backend
  });

  test('should show Material UI components', async ({ page }) => {
    // Check that the page uses Material UI styling
    await expect(page.getByText('Device Manager Configuration')).toBeVisible();
    
    // Verify tabs are clickable and visible
    await expect(page.getByTestId('tab-devices')).toBeVisible();
    await expect(page.getByTestId('tab-config')).toBeVisible();
    
    // Verify form inputs exist
    await expect(page.getByPlaceholder('DM-1')).toBeVisible();
  });
});
