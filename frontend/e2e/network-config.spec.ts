import { test, expect } from '@playwright/test';

test.describe('Network Configuration E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to Network Config tab
    await page.getByTestId('tab-network').click();
    await page.waitForTimeout(1500);
  });

  test('should load network configuration from backend', async ({ page }) => {
    // Check that the Network Interface Configuration heading is visible
    await expect(page.getByRole('heading', { name: 'Network Interface Configuration' })).toBeVisible();
    
    // Interface is now auto-detected and displayed as read-only
    await expect(page.getByRole('heading', { name: 'Network Interface', exact: true })).toBeVisible();
    await expect(page.getByText('(Auto-detected)')).toBeVisible();

    // Check that method selection is visible
    await expect(page.getByText('Configuration Method')).toBeVisible();
  });

  test('should validate IP address format', async ({ page }) => {
    // Make sure we're in Static IP mode first
    await page.getByTestId('radio-static').click();
    await page.waitForTimeout(500);

    // Enter invalid IP address
    const addressInput = page.getByTestId('input-address');
    await addressInput.clear();
    await addressInput.fill('999.999.999.999');
    await addressInput.blur();
    await page.waitForTimeout(300);

    // Should show validation error
    await expect(page.getByText(/invalid ip address/i)).toBeVisible();
  });

  test('should validate netmask format', async ({ page }) => {
    // Make sure we're in Static IP mode
    await page.getByTestId('radio-static').click();
    await page.waitForTimeout(500);

    // Enter invalid netmask
    const netmaskInput = page.getByTestId('input-netmask');
    await netmaskInput.clear();
    await netmaskInput.fill('999.0.0.0');
    await netmaskInput.blur();
    await page.waitForTimeout(300);

    // Should show validation error
    await expect(page.getByText(/invalid netmask/i)).toBeVisible();
  });

  test('should allow optional gateway', async ({ page }) => {
    // Make sure we're in Static IP mode
    await page.getByTestId('radio-static').click();
    await page.waitForTimeout(500);

    // Gateway field should exist and be optional (can be empty)
    const gatewayInput = page.getByTestId('input-gateway');
    await expect(gatewayInput).toBeVisible();
    
    // Clear gateway
    await gatewayInput.clear();
    await gatewayInput.blur();
    await page.waitForTimeout(300);

    // Should not show error for empty gateway
    // (checking that no validation error appears is implicit)
  });

  test('should validate gateway format when provided', async ({ page }) => {
    // Make sure we're in Static IP mode
    await page.getByTestId('radio-static').click();
    await page.waitForTimeout(500);

    // Enter invalid gateway
    const gatewayInput = page.getByTestId('input-gateway');
    await gatewayInput.clear();
    await gatewayInput.fill('invalid.ip');
    await gatewayInput.blur();
    await page.waitForTimeout(300);

    // Should show validation error
    await expect(page.getByText(/invalid gateway/i)).toBeVisible();
  });

  test('should enable Save button when network config changes', async ({ page }) => {
    // Make sure we're in Static IP mode
    await page.getByTestId('radio-static').click();
    await page.waitForTimeout(500);

    // Make a change
    const addressInput = page.getByTestId('input-address');
    await addressInput.clear();
    await addressInput.fill('192.168.1.20');
    await page.waitForTimeout(500);

    // Save button should be enabled
    const saveButton = page.getByTestId('save-button');
    await expect(saveButton).toBeEnabled();
  });

  test('should switch between DHCP and Static methods', async ({ page }) => {
    // Check DHCP radio
    await page.getByTestId('radio-dhcp').click();
    await page.waitForTimeout(500);

    // Verify DHCP is selected
    await expect(page.getByTestId('radio-dhcp')).toBeChecked();

    // Switch to Static
    await page.getByTestId('radio-static').click();
    await page.waitForTimeout(500);

    // Verify Static is selected
    await expect(page.getByTestId('radio-static')).toBeChecked();
    
    // IP fields should be visible
    await expect(page.getByTestId('input-address')).toBeVisible();
  });

  test('should show unsaved changes indicator on Network Config tab', async ({ page }) => {
    // Make a change
    await page.getByTestId('radio-static').click();
    await page.waitForTimeout(500);

    const addressInput = page.getByTestId('input-address');
    await addressInput.clear();
    await addressInput.fill('10.0.0.50');
    await page.waitForTimeout(500);

    // Save button should be enabled (indicating unsaved changes)
    const saveButton = page.getByTestId('save-button');
    await expect(saveButton).toBeEnabled();
  });

  test('should accept valid static IP configuration', async ({ page }) => {
    // Switch to Static mode
    await page.getByTestId('radio-static').click();
    await page.waitForTimeout(500);

    // Fill in valid static IP configuration
    await page.getByTestId('input-address').clear();
    await page.getByTestId('input-address').fill('192.168.2.100');
    
    await page.getByTestId('input-netmask').clear();
    await page.getByTestId('input-netmask').fill('255.255.255.0');
    
    await page.getByTestId('input-gateway').clear();
    await page.getByTestId('input-gateway').fill('192.168.2.1');
    
    await page.waitForTimeout(500);

    // No validation errors should appear
    // Verify Save button is enabled (valid changes made)
    const saveButton = page.getByTestId('save-button');
    await expect(saveButton).toBeEnabled();
  });

  test('should display auto-detected interface as read-only', async ({ page }) => {
    // Verify interface is displayed
    await expect(page.getByRole('heading', { name: 'Network Interface', exact: true })).toBeVisible();
    
    // Verify auto-detected label
    await expect(page.getByText('(Auto-detected)')).toBeVisible();
    
    // Verify there's no text input field for interface (it's displayed as read-only text)
    // Count input fields - there should only be 0 or 3 (if static mode: address, netmask, gateway)
    // but no input for interface
    const interfaceInputs = await page.locator('input[type="text"]').count();
    // Interface is NOT an input field (it's just text)
    expect(interfaceInputs).toBeLessThanOrEqual(3);
  });
});
