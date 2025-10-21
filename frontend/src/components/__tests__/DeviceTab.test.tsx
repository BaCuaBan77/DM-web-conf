import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeviceTab from '../DeviceTab';
import { getDeviceConfig, saveDeviceConfig } from '../../api/configApi';

// Mock API calls
vi.mock('../../api/configApi');

/**
 * Tests for DeviceTab component (IBAC, S900, oritestgtdb, wxt53x)
 * Priority: High
 * Covers TDD Plan sections 2.2 (Frontend test cases for device-specific JSON editing)
 */
describe('DeviceTab - IBAC', () => {
  const mockIBACData = {
    address: 'ttyS0',
    speed: '9600',
    bits: '8',
    stopBits: '1',
    parity: 'None',
    serialPortType: 'RS232',
    name: 'IBAC Device'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== Test: Load device configuration =====
  
  it('should load and display IBAC configuration', async () => {
    // Arrange
    vi.mocked(getDeviceConfig).mockResolvedValue(mockIBACData);

    // Act
    render(<DeviceTab deviceName="IBAC" />);

    // Assert
    await waitFor(() => {
      expect(screen.getByDisplayValue('ttyS0')).toBeInTheDocument();
      expect(screen.getByDisplayValue('9600')).toBeInTheDocument();
      expect(screen.getByDisplayValue('IBAC Device')).toBeInTheDocument();
    });
  });

  // ===== Test: Dropdown fields =====
  
  it('should restrict address dropdown to valid options', async () => {
    // Arrange
    vi.mocked(getDeviceConfig).mockResolvedValue(mockIBACData);
    render(<DeviceTab deviceName="IBAC" />);
    await waitFor(() => screen.getByDisplayValue('ttyS0'));

    const addressSelect = screen.getByLabelText(/address/i) as HTMLSelectElement;

    // Assert
    expect(addressSelect.options).toHaveLength(2); // ttyS0, ttyS1
    expect(addressSelect.options[0].value).toBe('ttyS0');
    expect(addressSelect.options[1].value).toBe('ttyS1');
  });

  it('should restrict speed dropdown to valid baud rates', async () => {
    // Arrange
    vi.mocked(getDeviceConfig).mockResolvedValue(mockIBACData);
    render(<DeviceTab deviceName="IBAC" />);
    await waitFor(() => screen.getByDisplayValue('9600'));

    const speedSelect = screen.getByLabelText(/speed/i) as HTMLSelectElement;

    // Assert
    expect(speedSelect.options.length).toBeGreaterThanOrEqual(5);
    const speedValues = Array.from(speedSelect.options).map(opt => opt.value);
    expect(speedValues).toContain('9600');
    expect(speedValues).toContain('19200');
    expect(speedValues).toContain('38400');
    expect(speedValues).toContain('57600');
    expect(speedValues).toContain('115200');
  });

  it('should restrict serialPortType dropdown to RS232/RS485', async () => {
    // Arrange
    vi.mocked(getDeviceConfig).mockResolvedValue(mockIBACData);
    render(<DeviceTab deviceName="IBAC" />);
    await waitFor(() => screen.getByDisplayValue('RS232'));

    const typeSelect = screen.getByLabelText(/serial port type/i) as HTMLSelectElement;

    // Assert
    expect(typeSelect.options).toHaveLength(2);
    expect(typeSelect.options[0].value).toBe('RS232');
    expect(typeSelect.options[1].value).toBe('RS485');
  });

  // ===== Test: Text field validation =====
  
  it('should validate device name - max 50 characters', async () => {
    // Arrange
    vi.mocked(getDeviceConfig).mockResolvedValue(mockIBACData);
    render(<DeviceTab deviceName="IBAC" />);
    await waitFor(() => screen.getByDisplayValue('IBAC Device'));

    const nameInput = screen.getByLabelText(/name/i);

    // Act
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'a'.repeat(51));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/maximum 50 characters/i)).toBeInTheDocument();
    });
  });

  it('should accept spaces in device name', async () => {
    // Arrange
    vi.mocked(getDeviceConfig).mockResolvedValue(mockIBACData);
    render(<DeviceTab deviceName="IBAC" />);
    await waitFor(() => screen.getByDisplayValue('IBAC Device'));

    const nameInput = screen.getByLabelText(/name/i);

    // Act
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Valid Name With Spaces');

    // Assert
    await waitFor(() => {
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    });
  });

  // ===== Test: Save functionality =====
  
  it('should save valid IBAC configuration', async () => {
    // Arrange
    vi.mocked(getDeviceConfig).mockResolvedValue(mockIBACData);
    vi.mocked(saveDeviceConfig).mockResolvedValue({ success: true, message: 'Saved' });
    
    render(<DeviceTab deviceName="IBAC" />);
    await waitFor(() => screen.getByDisplayValue('ttyS0'));

    const addressSelect = screen.getByLabelText(/address/i);
    const saveButton = screen.getByRole('button', { name: /save/i });

    // Act
    await userEvent.selectOptions(addressSelect, 'ttyS1');
    await userEvent.click(saveButton);

    // Assert
    await waitFor(() => {
      expect(saveDeviceConfig).toHaveBeenCalledWith('IBAC', expect.objectContaining({
        address: 'ttyS1'
      }));
      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    });
  });
});

describe('DeviceTab - S900', () => {
  const mockS900Data = {
    address: '192.168.1.50',
    portNumber: 502,
    name: 'S900 Device'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load and display S900 configuration', async () => {
    // Arrange
    vi.mocked(getDeviceConfig).mockResolvedValue(mockS900Data);

    // Act
    render(<DeviceTab deviceName="S900" />);

    // Assert
    await waitFor(() => {
      expect(screen.getByDisplayValue('192.168.1.50')).toBeInTheDocument();
      expect(screen.getByDisplayValue('502')).toBeInTheDocument();
      expect(screen.getByDisplayValue('S900 Device')).toBeInTheDocument();
    });
  });

  // ===== Test: IPv4 validation for S900 =====
  
  it('should validate S900 address as IPv4', async () => {
    // Arrange
    vi.mocked(getDeviceConfig).mockResolvedValue(mockS900Data);
    render(<DeviceTab deviceName="S900" />);
    await waitFor(() => screen.getByDisplayValue('192.168.1.50'));

    const addressInput = screen.getByLabelText(/address/i);

    // Act
    await userEvent.clear(addressInput);
    await userEvent.type(addressInput, 'invalid.ip');

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/invalid IP address/i)).toBeInTheDocument();
    });
  });

  // ===== Test: Port number validation =====
  
  it('should validate port number - reject out of range', async () => {
    // Arrange
    vi.mocked(getDeviceConfig).mockResolvedValue(mockS900Data);
    render(<DeviceTab deviceName="S900" />);
    await waitFor(() => screen.getByDisplayValue('502'));

    const portInput = screen.getByLabelText(/port number/i);

    // Act
    await userEvent.clear(portInput);
    await userEvent.type(portInput, '70000');

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/port must be between 1 and 65535/i)).toBeInTheDocument();
    });
  });

  it('should accept valid port number in range 1-65535', async () => {
    // Arrange
    vi.mocked(getDeviceConfig).mockResolvedValue(mockS900Data);
    render(<DeviceTab deviceName="S900" />);
    await waitFor(() => screen.getByDisplayValue('502'));

    const portInput = screen.getByLabelText(/port number/i);

    // Act
    await userEvent.clear(portInput);
    await userEvent.type(portInput, '8080');

    // Assert
    await waitFor(() => {
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    });
  });

  it('should disable save button with invalid port number', async () => {
    // Arrange
    vi.mocked(getDeviceConfig).mockResolvedValue(mockS900Data);
    render(<DeviceTab deviceName="S900" />);
    await waitFor(() => screen.getByDisplayValue('502'));

    const portInput = screen.getByLabelText(/port number/i);
    const saveButton = screen.getByRole('button', { name: /save/i });

    // Act
    await userEvent.clear(portInput);
    await userEvent.type(portInput, '0');

    // Assert
    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });
  });
});

describe('DeviceTab - oritestgtdb', () => {
  const mockOritestgtdbData = {
    address: '192.168.1.60',
    name: 'Oritestgtdb Device'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load and display oritestgtdb configuration', async () => {
    // Arrange
    vi.mocked(getDeviceConfig).mockResolvedValue(mockOritestgtdbData);

    // Act
    render(<DeviceTab deviceName="oritestgtdb" />);

    // Assert
    await waitFor(() => {
      expect(screen.getByDisplayValue('192.168.1.60')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Oritestgtdb Device')).toBeInTheDocument();
    });
  });

  it('should validate oritestgtdb address as IPv4', async () => {
    // Arrange
    vi.mocked(getDeviceConfig).mockResolvedValue(mockOritestgtdbData);
    render(<DeviceTab deviceName="oritestgtdb" />);
    await waitFor(() => screen.getByDisplayValue('192.168.1.60'));

    const addressInput = screen.getByLabelText(/address/i);

    // Act
    await userEvent.clear(addressInput);
    await userEvent.type(addressInput, '999.999.999.999');

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/invalid IP address/i)).toBeInTheDocument();
    });
  });
});

