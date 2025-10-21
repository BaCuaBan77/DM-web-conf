import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import * as configApi from '../../api/configApi';
import { ConfigProvider } from '../../context/ConfigContext';

// Mock API calls
vi.mock('../../api/configApi');

// Helper to render with ConfigProvider
const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ConfigProvider>
      {component}
    </ConfigProvider>
  );
};

/**
 * Integration tests for frontend save workflow
 * Priority: High
 * Covers TDD Plan section 3 (Integration Tests - Frontend perspective)
 */
describe('Save Workflow Integration', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== Test: Full save workflow from user perspective =====
  
  it('should complete full save workflow: load → edit → validate → save → confirm', async () => {
    // Arrange
    const initialData = {
      deviceManagerKey: 'initial_key',
      deviceManagerName: 'Initial Name'
    };
    
    const updatedData = {
      deviceManagerKey: 'updated_key',
      deviceManagerName: 'Updated Name'
    };

    vi.mocked(configApi.getDevicesConfig)
      .mockResolvedValueOnce(initialData)
      .mockResolvedValueOnce(updatedData);
    
    vi.mocked(configApi.saveDevicesConfig).mockResolvedValue({
      success: true,
      message: 'Configuration saved successfully'
    });

    // Step 1: Load page
    renderWithProvider(<App />);

    // Step 2: Wait for data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('initial_key')).toBeInTheDocument();
    });

    // Step 3: Edit configuration
    const keyInput = screen.getByLabelText(/device manager key/i);
    const nameInput = screen.getByLabelText(/device manager name/i);
    
    await userEvent.clear(keyInput);
    await userEvent.type(keyInput, 'updated_key');
    
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Name');

    // Step 4: Validate (should happen automatically)
    await waitFor(() => {
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    });

    // Step 5: Save
    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).not.toBeDisabled();
    
    await userEvent.click(saveButton);

    // Step 6: Confirm success
    await waitFor(() => {
      expect(configApi.saveDevicesConfig).toHaveBeenCalledWith({
        deviceManagerKey: 'updated_key',
        deviceManagerName: 'Updated Name'
      });
      expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
    });
  });

  // ===== Test: Save workflow with validation error =====
  
  it('should prevent save when validation fails', async () => {
    // Arrange
    const initialData = {
      deviceManagerKey: 'valid_key',
      deviceManagerName: 'Valid Name'
    };

    vi.mocked(configApi.getDevicesConfig).mockResolvedValue(initialData);

    renderWithProvider(<App />);
    await waitFor(() => screen.getByDisplayValue('valid_key'));

    // Act - enter invalid data
    const keyInput = screen.getByLabelText(/device manager key/i);
    await userEvent.clear(keyInput);
    await userEvent.type(keyInput, 'invalid key with spaces');

    // Assert - save button should be disabled
    const saveButton = screen.getByRole('button', { name: /save/i });
    await waitFor(() => {
      expect(saveButton).toBeDisabled();
      expect(screen.getByText(/spaces not allowed/i)).toBeInTheDocument();
    });

    // Attempt to click (should not call API)
    await userEvent.click(saveButton);
    expect(configApi.saveDevicesConfig).not.toHaveBeenCalled();
  });

  // ===== Test: Multiple file saves in one session =====
  
  it('should handle saving multiple configurations in sequence', async () => {
    // Arrange
    vi.mocked(configApi.getDevicesConfig).mockResolvedValue({
      deviceManagerKey: 'key1',
      deviceManagerName: 'Name1'
    });
    
    vi.mocked(configApi.getConfigProperties).mockResolvedValue({
      'fi.observis.sas.karafrest': '192.168.1.100',
      'fi.observis.sas.mqtt.url': '192.168.1.101'
    });

    vi.mocked(configApi.saveDevicesConfig).mockResolvedValue({
      success: true,
      message: 'Devices saved'
    });
    
    vi.mocked(configApi.saveConfigProperties).mockResolvedValue({
      success: true,
      message: 'Properties saved'
    });

    renderWithProvider(<App />);
    await waitFor(() => screen.getByDisplayValue('key1'));

    // Save devices configuration
    const saveButton1 = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton1);
    
    await waitFor(() => {
      expect(screen.getByText(/devices saved/i)).toBeInTheDocument();
    });

    // Switch to config properties tab
    const propertiesTab = screen.getByRole('tab', { name: /config properties/i });
    await userEvent.click(propertiesTab);
    
    await waitFor(() => screen.getByDisplayValue('192.168.1.100'));

    // Modify and save properties
    const karafInput = screen.getByLabelText(/karaf rest/i);
    await userEvent.clear(karafInput);
    await userEvent.type(karafInput, '192.168.2.100');

    const saveButton2 = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton2);

    // Assert - both saves completed
    await waitFor(() => {
      expect(configApi.saveDevicesConfig).toHaveBeenCalledTimes(1);
      expect(configApi.saveConfigProperties).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/properties saved/i)).toBeInTheDocument();
    });
  });

  // ===== Test: Error recovery =====
  
  it('should allow retry after save error', async () => {
    // Arrange
    vi.mocked(configApi.getDevicesConfig).mockResolvedValue({
      deviceManagerKey: 'test_key',
      deviceManagerName: 'Test Name'
    });
    
    // First save attempt fails
    vi.mocked(configApi.saveDevicesConfig)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ success: true, message: 'Saved on retry' });

    renderWithProvider(<App />);
    await waitFor(() => screen.getByDisplayValue('test_key'));

    const saveButton = screen.getByRole('button', { name: /save/i });

    // First attempt - error
    await userEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    // Second attempt - success
    await userEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/saved on retry/i)).toBeInTheDocument();
    });

    expect(configApi.saveDevicesConfig).toHaveBeenCalledTimes(2);
  });

  // ===== Test: Reboot workflow =====
  
  it('should trigger reboot after save', async () => {
    // Arrange
    vi.mocked(configApi.getDevicesConfig).mockResolvedValue({
      deviceManagerKey: 'test_key',
      deviceManagerName: 'Test Name'
    });
    
    vi.mocked(configApi.saveDevicesConfig).mockResolvedValue({
      success: true,
      message: 'Saved'
    });
    
    vi.mocked(configApi.reboot).mockResolvedValue({
      success: true,
      message: 'Reboot initiated'
    });

    renderWithProvider(<App />);
    await waitFor(() => screen.getByDisplayValue('test_key'));

    // Save configuration
    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    });

    // Trigger reboot
    const rebootButton = screen.getByRole('button', { name: /reboot/i });
    await userEvent.click(rebootButton);

    await waitFor(() => {
      expect(configApi.reboot).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/reboot initiated/i)).toBeInTheDocument();
    });
  });

  // ===== Test: Form state persistence =====
  
  it('should preserve unsaved changes when switching tabs', async () => {
    // Arrange
    vi.mocked(configApi.getDevicesConfig).mockResolvedValue({
      deviceManagerKey: 'original_key',
      deviceManagerName: 'Original Name'
    });
    
    vi.mocked(configApi.getConfigProperties).mockResolvedValue({
      'fi.observis.sas.karafrest': '192.168.1.100',
      'fi.observis.sas.mqtt.url': '192.168.1.101'
    });

    renderWithProvider(<App />);
    await waitFor(() => screen.getByDisplayValue('original_key'));

    // Modify but don't save
    const keyInput = screen.getByLabelText(/device manager key/i);
    await userEvent.clear(keyInput);
    await userEvent.type(keyInput, 'modified_key');

    // Switch tabs
    const propertiesTab = screen.getByRole('tab', { name: /config properties/i });
    await userEvent.click(propertiesTab);
    
    await waitFor(() => screen.getByDisplayValue('192.168.1.100'));

    // Switch back
    const devicesTab = screen.getByRole('tab', { name: /devices/i });
    await userEvent.click(devicesTab);

    // Assert - modified value is preserved
    await waitFor(() => {
      expect(screen.getByDisplayValue('modified_key')).toBeInTheDocument();
    });
  });
});

