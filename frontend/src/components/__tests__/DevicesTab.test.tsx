import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DevicesTab from '../DevicesTab';
import { getDevicesConfig, saveDevicesConfig } from '../../api/configApi';
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
 * Tests for DevicesTab component
 * Priority: High
 * Covers TDD Plan sections 2.2 (Frontend test cases for devices.json editing)
 */
describe('DevicesTab', () => {
  const mockDevicesData = {
    deviceManagerKey: 'test_key',
    deviceManagerName: 'Test Device Manager'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== Test: Load properties on tab open =====
  
  it('should load and display devices configuration on mount', async () => {
    // Arrange
    vi.mocked(getDevicesConfig).mockResolvedValue(mockDevicesData);

    // Act
    renderWithProvider(<DevicesTab onDataChange={() => {}} onValidationChange={() => {}} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByDisplayValue('test_key')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Device Manager')).toBeInTheDocument();
    });
  });

  it('should show loading state while fetching data', async () => {
    // Arrange
    vi.mocked(getDevicesConfig).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockDevicesData), 100))
    );

    // Act
    renderWithProvider(<DevicesTab onDataChange={() => {}} onValidationChange={() => {}} />);

    // Assert
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  // ===== Test: Text field validation - deviceManagerKey =====
  
  it('should validate deviceManagerKey - reject forward slashes', async () => {
    // Arrange
    vi.mocked(getDevicesConfig).mockResolvedValue(mockDevicesData);
    render(<DevicesTab onDataChange={() => {}} onValidationChange={() => {}} />);
    await waitFor(() => screen.getByDisplayValue('test_key'));

    const keyInput = screen.getByLabelText(/device manager key/i);

    // Act
    await userEvent.clear(keyInput);
    await userEvent.type(keyInput, 'invalid/key');

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/forward slashes.*not allowed/i)).toBeInTheDocument();
    });
  });

  it('should validate deviceManagerKey - reject # and + characters', async () => {
    // Arrange
    vi.mocked(getDevicesConfig).mockResolvedValue(mockDevicesData);
    render(<DevicesTab onDataChange={() => {}} onValidationChange={() => {}} />);
    await waitFor(() => screen.getByDisplayValue('test_key'));

    const keyInput = screen.getByLabelText(/device manager key/i);

    // Act
    await userEvent.clear(keyInput);
    await userEvent.type(keyInput, 'key#with+invalid');

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/invalid MQTT characters/i)).toBeInTheDocument();
    });
  });

  it('should validate deviceManagerKey - reject > 20 characters', async () => {
    // Arrange
    vi.mocked(getDevicesConfig).mockResolvedValue(mockDevicesData);
    render(<DevicesTab onDataChange={() => {}} onValidationChange={() => {}} />);
    await waitFor(() => screen.getByDisplayValue('test_key'));

    const keyInput = screen.getByLabelText(/device manager key/i);

    // Act
    await userEvent.clear(keyInput);
    await userEvent.type(keyInput, 'a'.repeat(21));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/maximum 20 characters/i)).toBeInTheDocument();
    });
  });

  it('should accept valid MQTT topic characters in deviceManagerKey', async () => {
    // Arrange
    vi.mocked(getDevicesConfig).mockResolvedValue(mockDevicesData);
    render(<DevicesTab onDataChange={() => {}} onValidationChange={() => {}} />);
    await waitFor(() => screen.getByDisplayValue('test_key'));

    const keyInput = screen.getByLabelText(/device manager key/i);

    // Act - spaces and dashes are now allowed, but not slashes
    await userEvent.clear(keyInput);
    await userEvent.type(keyInput, 'valid_key-123');

    // Assert
    await waitFor(() => {
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    });
  });

  // ===== Test: Text field validation - deviceManagerName =====
  
  it('should validate deviceManagerName - reject > 50 characters', async () => {
    // Arrange
    vi.mocked(getDevicesConfig).mockResolvedValue(mockDevicesData);
    render(<DevicesTab onDataChange={() => {}} onValidationChange={() => {}} />);
    await waitFor(() => screen.getByDisplayValue('Test Device Manager'));

    const nameInput = screen.getByLabelText(/device manager name/i);

    // Act
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'a'.repeat(51));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/maximum 50 characters/i)).toBeInTheDocument();
    });
  });

  it('should accept spaces in deviceManagerName', async () => {
    // Arrange
    vi.mocked(getDevicesConfig).mockResolvedValue(mockDevicesData);
    render(<DevicesTab onDataChange={() => {}} onValidationChange={() => {}} />);
    await waitFor(() => screen.getByDisplayValue('Test Device Manager'));

    const nameInput = screen.getByLabelText(/device manager name/i);

    // Act
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Valid Name With Spaces');

    // Assert
    await waitFor(() => {
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    });
  });

  // ===== Test: Save button behavior =====
  
  it('should enable save button with valid inputs', async () => {
    // Arrange
    vi.mocked(getDevicesConfig).mockResolvedValue(mockDevicesData);
    render(<DevicesTab onDataChange={() => {}} onValidationChange={() => {}} />);
    await waitFor(() => screen.getByDisplayValue('test_key'));

    const saveButton = screen.getByRole('button', { name: /save/i });

    // Assert
    expect(saveButton).not.toBeDisabled();
  });

  it('should disable save button with invalid inputs', async () => {
    // Arrange
    vi.mocked(getDevicesConfig).mockResolvedValue(mockDevicesData);
    render(<DevicesTab onDataChange={() => {}} onValidationChange={() => {}} />);
    await waitFor(() => screen.getByDisplayValue('test_key'));

    const keyInput = screen.getByLabelText(/device manager key/i);
    const saveButton = screen.getByRole('button', { name: /save/i });

    // Act - enter invalid key
    await userEvent.clear(keyInput);
    await userEvent.type(keyInput, 'invalid key with spaces');

    // Assert
    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });
  });

  it('should call save API with valid inputs and show success message', async () => {
    // Arrange
    vi.mocked(getDevicesConfig).mockResolvedValue(mockDevicesData);
    vi.mocked(saveDevicesConfig).mockResolvedValue({ success: true, message: 'Saved successfully' });
    
    render(<DevicesTab onDataChange={() => {}} onValidationChange={() => {}} />);
    await waitFor(() => screen.getByDisplayValue('test_key'));

    const keyInput = screen.getByLabelText(/device manager key/i);
    const saveButton = screen.getByRole('button', { name: /save/i });

    // Act
    await userEvent.clear(keyInput);
    await userEvent.type(keyInput, 'new_valid_key');
    await userEvent.click(saveButton);

    // Assert
    await waitFor(() => {
      expect(saveDevicesConfig).toHaveBeenCalledWith({
        deviceManagerKey: 'new_valid_key',
        deviceManagerName: 'Test Device Manager'
      });
      expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
    });
  });

  it('should show error message when save API fails', async () => {
    // Arrange
    vi.mocked(getDevicesConfig).mockResolvedValue(mockDevicesData);
    vi.mocked(saveDevicesConfig).mockRejectedValue(new Error('Save failed'));
    
    render(<DevicesTab onDataChange={() => {}} onValidationChange={() => {}} />);
    await waitFor(() => screen.getByDisplayValue('test_key'));

    const saveButton = screen.getByRole('button', { name: /save/i });

    // Act
    await userEvent.click(saveButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/save failed/i)).toBeInTheDocument();
    });
  });

  // ===== Test: Error handling =====
  
  it('should show error message when loading fails', async () => {
    // Arrange
    vi.mocked(getDevicesConfig).mockRejectedValue(new Error('Failed to load'));

    // Act
    renderWithProvider(<DevicesTab onDataChange={() => {}} onValidationChange={() => {}} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  // ===== Test: Real-time validation =====
  
  it('should show validation message in real-time as user types', async () => {
    // Arrange
    vi.mocked(getDevicesConfig).mockResolvedValue(mockDevicesData);
    render(<DevicesTab onDataChange={() => {}} onValidationChange={() => {}} />);
    await waitFor(() => screen.getByDisplayValue('test_key'));

    const keyInput = screen.getByLabelText(/device manager key/i);

    // Act - start typing invalid input
    await userEvent.clear(keyInput);
    await userEvent.type(keyInput, 'invalid ');

    // Assert - validation message appears while typing
    await waitFor(() => {
      expect(screen.getByText(/spaces not allowed/i)).toBeInTheDocument();
    });
  });
});

