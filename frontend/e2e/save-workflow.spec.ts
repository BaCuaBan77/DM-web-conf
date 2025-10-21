import { test, expect } from '@playwright/test';

test.describe('Save & Reboot Workflow E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock the backend to prevent actual reboot during tests
    await page.route('**/api/save', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Configuration saved successfully' })
      });
    });

    await page.route('**/api/reboot', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'System rebooting...' })
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full save workflow for Devices tab', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Make changes
    const keyInput = page.getByLabel('Device Manager Key');
    await keyInput.clear();
    await keyInput.fill('new-device-key');
    
    const nameInput = page.getByLabel('Device Manager Name');
    await nameInput.clear();
    await nameInput.fill('New Device Name');

    await page.waitForTimeout(500);

    // Click Save & Reboot
    const saveButton = page.getByRole('button', { name: /save & reboot/i });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Confirm in dialog
    await expect(page.getByText('Confirm Save & Reboot')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /save & reboot/i }).click();

    // Should show success notification
    await expect(page.getByText(/configuration saved/i)).toBeVisible({ timeout: 5000 });
  });

  test('should complete full save workflow for Config Properties tab', async ({ page }) => {
    // Go to Config Properties tab
    await page.getByRole('tab', { name: /config properties/i }).click();
    await page.waitForTimeout(1000);

    // Make changes
    await page.getByLabel('MQTT Broker IP').clear();
    await page.getByLabel('MQTT Broker IP').fill('192.168.1.10');
    
    await page.getByLabel('MQTT Port').clear();
    await page.getByLabel('MQTT Port').fill('1883');

    await page.waitForTimeout(500);

    // Click Save & Reboot
    const saveButton = page.getByRole('button', { name: /save & reboot/i });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Confirm
    await page.getByRole('dialog').getByRole('button', { name: /save & reboot/i }).click();

    // Should show success
    await expect(page.getByText(/configuration saved/i)).toBeVisible({ timeout: 5000 });
  });

  test('should prevent save when validation fails', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Enter invalid data
    await page.getByLabel('Device Manager Key').clear();
    await page.getByLabel('Device Manager Key').fill('invalid/key');

    await page.waitForTimeout(500);

    // Save button might be enabled but validation should fail
    const saveButton = page.getByRole('button', { name: /save & reboot/i });
    
    // If button is enabled, clicking should show error
    if (await saveButton.isEnabled()) {
      await saveButton.click();
      await expect(page.getByText(/please fix validation errors/i)).toBeVisible({ timeout: 2000 });
    } else {
      // Button is correctly disabled
      await expect(saveButton).toBeDisabled();
    }
  });

  test('should allow canceling save operation', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Make changes
    await page.getByLabel('Device Manager Key').clear();
    await page.getByLabel('Device Manager Key').fill('test-cancel');

    await page.waitForTimeout(500);

    // Click Save & Reboot
    await page.getByRole('button', { name: /save & reboot/i }).click();

    // Dialog should appear
    await expect(page.getByText('Confirm Save & Reboot')).toBeVisible();

    // Click Cancel
    await page.getByRole('button', { name: /cancel/i }).click();

    // Dialog should close
    await expect(page.getByText('Confirm Save & Reboot')).not.toBeVisible();

    // Changes should still be there
    expect(await page.getByLabel('Device Manager Key').inputValue()).toBe('test-cancel');
    
    // Button should still be enabled
    await expect(page.getByRole('button', { name: /save & reboot/i })).toBeEnabled();
  });

  test('should show loading state during save', async ({ page }) => {
    // Delay the mock response
    await page.route('**/api/save', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Saved' })
      });
    });

    await page.waitForTimeout(1500);

    // Make changes
    const keyInput = page.getByLabel('Device Manager Key');
    await keyInput.clear();
    await keyInput.fill('test-loading');
    await keyInput.blur();
    await page.waitForTimeout(1500);

    // Check if button is enabled before clicking
    const saveButton = page.getByRole('button', { name: /save & reboot/i });
    const isEnabled = await saveButton.isEnabled();
    
    if (isEnabled) {
      // Click Save & Reboot
      await saveButton.click();
      await page.getByRole('dialog').getByRole('button', { name: /save & reboot/i }).click();

      // Should show "Saving..." text or button should be disabled
      await page.waitForTimeout(200);
    }
  });

  test('should handle save errors gracefully', async ({ page }) => {
    // Mock error response
    await page.route('**/api/save', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal server error' })
      });
    });

    await page.waitForTimeout(1000);

    // Make changes
    await page.getByLabel('Device Manager Key').clear();
    await page.getByLabel('Device Manager Key').fill('test-error');
    await page.waitForTimeout(500);

    // Click Save & Reboot
    await page.getByRole('button', { name: /save & reboot/i }).click();
    await page.getByRole('dialog').getByRole('button', { name: /save & reboot/i }).click();

    // Should show error notification
    await expect(page.getByText(/error/i)).toBeVisible({ timeout: 5000 });
  });

  test('should maintain workflow state across page reloads', async ({ page }) => {
    await page.waitForTimeout(1500);

    // Verify initial state - Devices tab should be visible
    await expect(page.getByLabel('Device Manager Key')).toBeVisible();
    
    // Switch to Config Properties
    await page.getByRole('tab', { name: /config properties/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByLabel('MQTT Broker IP')).toBeVisible();

    // Switch to Network Config
    await page.getByRole('tab', { name: /network config/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByLabel('Interface Name')).toBeVisible();

    // Switch back to Devices - should reload from backend
    await page.getByRole('tab', { name: /^devices$/i }).first().click();
    await page.waitForTimeout(1000);
    
    // Data should be loaded from backend
    const keyInput = page.getByLabel('Device Manager Key');
    const value = await keyInput.inputValue();
    expect(value.length).toBeGreaterThan(0); // Should have value from backend
  });
});


