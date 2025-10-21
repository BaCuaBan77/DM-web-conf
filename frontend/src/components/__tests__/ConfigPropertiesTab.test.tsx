import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfigPropertiesTab from '../ConfigPropertiesTab';
import { getConfigProperties, saveConfigProperties } from '../../api/configApi';

// Mock API calls
vi.mock('../../api/configApi');

/**
 * Tests for ConfigPropertiesTab component
 * Priority: High
 * Covers TDD Plan sections 2.2 (Frontend test cases for config.properties editing)
 */
describe('ConfigPropertiesTab', () => {
  const mockPropertiesData = {
    'fi.observis.sas.karafrest': '192.168.1.100',
    'fi.observis.sas.mqtt.url': '192.168.1.101'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== Test: Load properties on tab open =====
  
  it('should load and display config properties on mount', async () => {
    // Arrange
    vi.mocked(getConfigProperties).mockResolvedValue(mockPropertiesData);

    // Act
    render(<ConfigPropertiesTab />);

    // Assert
    await waitFor(() => {
      expect(screen.getByDisplayValue('192.168.1.100')).toBeInTheDocument();
      expect(screen.getByDisplayValue('192.168.1.101')).toBeInTheDocument();
    });
  });

  // ===== Test: IPv4 validation =====
  
  it('should validate IPv4 address - reject invalid format', async () => {
    // Arrange
    vi.mocked(getConfigProperties).mockResolvedValue(mockPropertiesData);
    render(<ConfigPropertiesTab />);
    await waitFor(() => screen.getByDisplayValue('192.168.1.100'));

    const karafrestInput = screen.getByLabelText(/karaf rest/i);

    // Act
    await userEvent.clear(karafrestInput);
    await userEvent.type(karafrestInput, '256.1.1.1');

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/invalid IP address/i)).toBeInTheDocument();
    });
  });

  it('should validate IPv4 address - reject incomplete IP', async () => {
    // Arrange
    vi.mocked(getConfigProperties).mockResolvedValue(mockPropertiesData);
    render(<ConfigPropertiesTab />);
    await waitFor(() => screen.getByDisplayValue('192.168.1.100'));

    const mqttInput = screen.getByLabelText(/mqtt url/i);

    // Act
    await userEvent.clear(mqttInput);
    await userEvent.type(mqttInput, '192.168.1');

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/invalid IP address/i)).toBeInTheDocument();
    });
  });

  it('should accept valid IPv4 addresses', async () => {
    // Arrange
    vi.mocked(getConfigProperties).mockResolvedValue(mockPropertiesData);
    render(<ConfigPropertiesTab />);
    await waitFor(() => screen.getByDisplayValue('192.168.1.100'));

    const karafrestInput = screen.getByLabelText(/karaf rest/i);

    // Act
    await userEvent.clear(karafrestInput);
    await userEvent.type(karafrestInput, '10.0.0.1');

    // Assert
    await waitFor(() => {
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    });
  });

  // ===== Test: Save functionality =====
  
  it('should save valid properties and show success message', async () => {
    // Arrange
    vi.mocked(getConfigProperties).mockResolvedValue(mockPropertiesData);
    vi.mocked(saveConfigProperties).mockResolvedValue({ success: true, message: 'Saved' });
    
    render(<ConfigPropertiesTab />);
    await waitFor(() => screen.getByDisplayValue('192.168.1.100'));

    const karafrestInput = screen.getByLabelText(/karaf rest/i);
    const saveButton = screen.getByRole('button', { name: /save/i });

    // Act
    await userEvent.clear(karafrestInput);
    await userEvent.type(karafrestInput, '192.168.2.200');
    await userEvent.click(saveButton);

    // Assert
    await waitFor(() => {
      expect(saveConfigProperties).toHaveBeenCalledWith({
        'fi.observis.sas.karafrest': '192.168.2.200',
        'fi.observis.sas.mqtt.url': '192.168.1.101'
      });
      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    });
  });

  it('should disable save button with invalid IP addresses', async () => {
    // Arrange
    vi.mocked(getConfigProperties).mockResolvedValue(mockPropertiesData);
    render(<ConfigPropertiesTab />);
    await waitFor(() => screen.getByDisplayValue('192.168.1.100'));

    const karafrestInput = screen.getByLabelText(/karaf rest/i);
    const saveButton = screen.getByRole('button', { name: /save/i });

    // Act
    await userEvent.clear(karafrestInput);
    await userEvent.type(karafrestInput, 'invalid.ip');

    // Assert
    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });
  });

  // ===== Test: Real-time validation =====
  
  it('should show validation errors in real-time', async () => {
    // Arrange
    vi.mocked(getConfigProperties).mockResolvedValue(mockPropertiesData);
    render(<ConfigPropertiesTab />);
    await waitFor(() => screen.getByDisplayValue('192.168.1.100'));

    const karafrestInput = screen.getByLabelText(/karaf rest/i);

    // Act
    await userEvent.clear(karafrestInput);
    await userEvent.type(karafrestInput, '999');

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/invalid IP address/i)).toBeInTheDocument();
    });
  });
});

