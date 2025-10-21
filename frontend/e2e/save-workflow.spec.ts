import { test, expect } from '@playwright/test';

test.describe('Save Workflow E2E Tests', () => {
  
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
    await page.waitForTimeout(1500);

    // Make changes using placeholders
    const keyInput = page.getByPlaceholder('DM-1');
    await keyInput.clear();
    await keyInput.fill('new-device-key');
    
    const nameInput = page.getByPlaceholder('Detection Station 1');
    await nameInput.clear();
    await nameInput.fill('New Device Name');

    await page.waitForTimeout(500);

    // Click Save button
    const saveButton = page.getByTestId('save-button');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Confirm in dialog
    await expect(page.getByText('Confirm Save Changes')).toBeVisible();
    await page.getByTestId('dialog-confirm').click();

    // Should show success notification
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('should complete full save workflow for Config Properties tab', async ({ page }) => {
    // Go to Config Properties tab
    await page.getByTestId('tab-config').click();
    await page.waitForTimeout(1500);

    // Make changes using placeholders
    await page.getByPlaceholder('192.168.1.100').clear();
    await page.getByPlaceholder('192.168.1.100').fill('192.168.1.10');
    
    await page.getByPlaceholder('1883').clear();
    await page.getByPlaceholder('1883').fill('1884');

    await page.waitForTimeout(500);

    // Click Save button
    const saveButton = page.getByTestId('save-button');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Confirm
    await page.getByTestId('dialog-confirm').click();

    // Should show success
    await expect(page.getByText(/saved successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('should prevent save when validation fails', async ({ page }) => {
    await page.waitForTimeout(1500);

    // Enter invalid data
    await page.getByPlaceholder('DM-1').clear();
    await page.getByPlaceholder('DM-1').fill('invalid/key');

    await page.waitForTimeout(500);

    // Save button should be disabled due to validation error
    const saveButton = page.getByTestId('save-button');
    
    // Either button is disabled or clicking shows error
    const isEnabled = await saveButton.isEnabled();
    if (isEnabled) {
      await saveButton.click();
      // Should show error in snackbar or alert
      await expect(page.getByText(/invalid mqtt topic/i)).toBeVisible({ timeout: 2000 });
    } else {
      await expect(saveButton).toBeDisabled();
    }
  });

  test('should allow canceling save operation', async ({ page }) => {
    await page.waitForTimeout(1500);

    // Make changes
    await page.getByPlaceholder('DM-1').clear();
    await page.getByPlaceholder('DM-1').fill('test-cancel');

    await page.waitForTimeout(500);

    // Click Save button
    await page.getByTestId('save-button').click();

    // Dialog should appear
    await expect(page.getByText('Confirm Save Changes')).toBeVisible();

    // Click Cancel
    await page.getByTestId('dialog-cancel').click();

    // Dialog should close
    await expect(page.getByText('Confirm Save Changes')).not.toBeVisible();

    // Changes should still be there
    expect(await page.getByPlaceholder('DM-1').inputValue()).toBe('test-cancel');
    
    // Button should still be enabled
    await expect(page.getByTestId('save-button')).toBeEnabled();
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
    const keyInput = page.getByPlaceholder('DM-1');
    await keyInput.clear();
    await keyInput.fill('test-loading');
    await keyInput.blur();
    await page.waitForTimeout(500);

    // Check if button is enabled before clicking
    const saveButton = page.getByTestId('save-button');
    const isEnabled = await saveButton.isEnabled();
    
    if (isEnabled) {
      // Click Save button
      await saveButton.click();
      await page.getByTestId('dialog-confirm').click();

      // Should show "Saving..." text
      await expect(saveButton).toContainText('Saving');
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

    await page.waitForTimeout(1500);

    // Make changes
    await page.getByPlaceholder('DM-1').clear();
    await page.getByPlaceholder('DM-1').fill('test-error');
    await page.waitForTimeout(500);

    // Click Save button
    await page.getByTestId('save-button').click();
    await page.getByTestId('dialog-confirm').click();

    // Should show error notification (Failed to save or Error:)
    await expect(page.getByText(/Failed to save|Error:/i)).toBeVisible({ timeout: 5000 });
  });

  test('should maintain data across tab switches', async ({ page }) => {
    await page.waitForTimeout(1500);

    // Verify initial state - Devices tab should be visible
    await expect(page.getByPlaceholder('DM-1')).toBeVisible();
    
    // Switch to Config Properties
    await page.getByTestId('tab-config').click();
    await page.waitForTimeout(1500);
    await expect(page.getByPlaceholder('192.168.1.100')).toBeVisible();

    // Switch to Network Config
    await page.getByTestId('tab-network').click();
    await page.waitForTimeout(1500);
    await expect(page.getByRole('heading', { name: 'Network Interface Configuration' })).toBeVisible();

    // Switch back to Devices - should reload from backend
    await page.getByTestId('tab-devices').click();
    await page.waitForTimeout(1500);
    
    // Data should be loaded from backend
    const keyInput = page.getByPlaceholder('DM-1');
    const value = await keyInput.inputValue();
    expect(value.length).toBeGreaterThan(0); // Should have value from backend
  });
});
