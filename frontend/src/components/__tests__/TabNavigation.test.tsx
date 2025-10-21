import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import * as configApi from '../../api/configApi';

// Mock API calls
vi.mock('../../api/configApi');

/**
 * Tests for tab navigation and UI responsiveness
 * Priority: Medium
 * Covers TDD Plan sections 2.2 (Tab switching and UI responsiveness)
 */
describe('Tab Navigation', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock all API calls to return default data
    vi.mocked(configApi.getDevicesConfig).mockResolvedValue({
      deviceManagerKey: 'test_key',
      deviceManagerName: 'Test Manager'
    });
    vi.mocked(configApi.getConfigProperties).mockResolvedValue({
      'fi.observis.sas.karafrest': '192.168.1.100',
      'fi.observis.sas.mqtt.url': '192.168.1.101'
    });
    vi.mocked(configApi.getDeviceConfig).mockResolvedValue({
      address: 'ttyS0',
      speed: '9600',
      name: 'Device'
    });
  });

  // ===== Test: Tab switching =====
  
  it('should display all configuration tabs', async () => {
    // Act
    render(<App />);

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /devices/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /config properties/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /ibac/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /s900/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /oritestgtdb/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /wxt53x/i })).toBeInTheDocument();
    });
  });

  it('should switch between tabs and display correct data', async () => {
    // Arrange
    render(<App />);

    // Wait for initial tab to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('test_key')).toBeInTheDocument();
    });

    // Act - switch to Config Properties tab
    const configPropertiesTab = screen.getByRole('tab', { name: /config properties/i });
    await userEvent.click(configPropertiesTab);

    // Assert
    await waitFor(() => {
      expect(screen.getByDisplayValue('192.168.1.100')).toBeInTheDocument();
    });
  });

  it('should maintain data when switching back to previous tab', async () => {
    // Arrange
    render(<App />);
    await waitFor(() => screen.getByDisplayValue('test_key'));

    const devicesTab = screen.getByRole('tab', { name: /devices/i });
    const ibacTab = screen.getByRole('tab', { name: /ibac/i });

    // Act - switch to IBAC tab
    await userEvent.click(ibacTab);
    await waitFor(() => screen.getByDisplayValue('ttyS0'));

    // Switch back to Devices tab
    await userEvent.click(devicesTab);

    // Assert - original data is still there
    await waitFor(() => {
      expect(screen.getByDisplayValue('test_key')).toBeInTheDocument();
    });
  });

  it('should load data only when tab is activated', async () => {
    // Arrange
    render(<App />);
    await waitFor(() => screen.getByDisplayValue('test_key'));

    // Assert - Devices API was called
    expect(configApi.getDevicesConfig).toHaveBeenCalledTimes(1);
    
    // ConfigProperties should not be loaded yet
    expect(configApi.getConfigProperties).not.toHaveBeenCalled();

    // Act - switch to Config Properties tab
    const configPropertiesTab = screen.getByRole('tab', { name: /config properties/i });
    await userEvent.click(configPropertiesTab);

    // Assert - ConfigProperties API is now called
    await waitFor(() => {
      expect(configApi.getConfigProperties).toHaveBeenCalledTimes(1);
    });
  });

  it('should indicate active tab visually', async () => {
    // Arrange
    render(<App />);
    await waitFor(() => screen.getByDisplayValue('test_key'));

    const devicesTab = screen.getByRole('tab', { name: /devices/i });
    const ibacTab = screen.getByRole('tab', { name: /ibac/i });

    // Assert - Devices tab is active
    expect(devicesTab).toHaveAttribute('aria-selected', 'true');
    expect(ibacTab).toHaveAttribute('aria-selected', 'false');

    // Act - switch to IBAC tab
    await userEvent.click(ibacTab);

    // Assert - IBAC tab is now active
    await waitFor(() => {
      expect(ibacTab).toHaveAttribute('aria-selected', 'true');
      expect(devicesTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  // ===== Test: UI Responsiveness =====
  
  it('should render with responsive layout', () => {
    // Arrange & Act
    const { container } = render(<App />);

    // Assert - check for responsive container classes
    const mainContainer = container.querySelector('.container, .responsive-container, [class*="container"]');
    expect(mainContainer).toBeInTheDocument();
  });

  it('should display tabs in correct order', async () => {
    // Arrange & Act
    render(<App />);

    // Assert
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveTextContent(/devices/i);
    expect(tabs[1]).toHaveTextContent(/config properties/i);
    expect(tabs[2]).toHaveTextContent(/ibac/i);
    expect(tabs[3]).toHaveTextContent(/s900/i);
    expect(tabs[4]).toHaveTextContent(/oritestgtdb/i);
    expect(tabs[5]).toHaveTextContent(/wxt53x/i);
  });
});

