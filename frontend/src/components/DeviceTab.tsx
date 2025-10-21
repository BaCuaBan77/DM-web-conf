import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Stack,
  Paper
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { getDeviceConfig } from '../api/configApi';
import {
  validateDeviceName,
  validateIPv4,
  validatePortNumber
} from '../utils/validation';
import { useConfig } from '../context/ConfigContext';

interface DeviceTabProps {
  deviceName: string;
  onDataChange: (hasChanges: boolean) => void;
  onValidationChange: (isValid: boolean) => void;
}

// Parity conversion functions: UI uses "None"/"Even"/"Odd", backend uses "N"/"E"/"O"
const parityToDisplay = (parity: string): string => {
  const map: { [key: string]: string } = { 'N': 'None', 'E': 'Even', 'O': 'Odd' };
  return map[parity] || parity;
};

const parityToStorage = (parity: string): string => {
  const map: { [key: string]: string } = { 'None': 'N', 'Even': 'E', 'Odd': 'O' };
  return map[parity] || parity;
};

// Map device names to context keys
const getContextKey = (deviceName: string): 'ibac' | 's900' | 'ori' | 'wxt' => {
  const nameMap: { [key: string]: 'ibac' | 's900' | 'ori' | 'wxt' } = {
    'IBAC': 'ibac',
    'S900': 's900',
    'oritestgtdb': 'ori',
    'wxt53x': 'wxt'
  };
  return nameMap[deviceName] || 'ibac';
};

const DeviceTab = forwardRef((props: DeviceTabProps, ref) => {
  const { deviceName, onDataChange, onValidationChange } = props;
  const { configData, setConfigData } = useConfig();
  const contextKey = getContextKey(deviceName);
  
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [originalData, setOriginalData] = useState<any>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useImperativeHandle(ref, () => ({
    getData: () => {
      // Convert parity from display format to storage format before saving
      const dataToSave = { ...config };
      if (dataToSave.parity) {
        dataToSave.parity = parityToStorage(dataToSave.parity);
      }
      return dataToSave;
    }
  }));

  // Restore state from context when component mounts
  useEffect(() => {
    const contextData = configData[contextKey];
    if (contextData !== null) {
      // Restore from context - exclude _original from config
      const { _original, ...configWithoutOriginal } = contextData as any;
      setConfig(configWithoutOriginal);
      setOriginalData(_original || configWithoutOriginal);
      setLoading(false);
    } else {
      // Load from API
      loadData();
    }
  }, [deviceName]);

  // Save current state to context whenever it changes (only after data is loaded)
  useEffect(() => {
    if (originalData !== null) {
      setConfigData(contextKey, {
        ...config,
        _original: originalData
      });
    }
  }, [config, originalData, contextKey]);

  useEffect(() => {
    validateForm();
    checkForChanges();
  }, [config]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getDeviceConfig(deviceName);
      
      // Convert parity from storage format to display format
      if (data.parity) {
        data.parity = parityToDisplay(data.parity);
      }
      
      setConfig(data);
      setOriginalData(data);
      // Save to context with original data preserved
      setConfigData(contextKey, {
        ...data,
        _original: data
      });
    } catch (error: any) {
      setMessage(`Failed to load: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkForChanges = () => {
    if (!originalData) return;
    
    const hasChanges = JSON.stringify(config) !== JSON.stringify(originalData);
    onDataChange(hasChanges);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (config.name && !validateDeviceName(config.name)) {
      newErrors.name = 'Maximum 50 characters allowed';
    }

    // S900 validation
    if (deviceName.toUpperCase() === 'S900') {
      if (config.address && !validateIPv4(config.address)) {
        newErrors.address = 'Invalid IP address';
      }
      if (config.portNumber !== undefined && config.portNumber && !validatePortNumber(config.portNumber)) {
        newErrors.portNumber = 'Port must be between 1 and 65535';
      }
    }

    // oritestgtdb validation
    if (deviceName.toUpperCase() === 'ORITESTGTDB') {
      if (config.address && !validateIPv4(config.address)) {
        newErrors.address = 'Invalid IP address';
      }
      if (config.portNumber !== undefined && config.portNumber && !validatePortNumber(config.portNumber)) {
        newErrors.portNumber = 'Port must be between 1 and 65535';
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidationChange(isValid);
    return isValid;
  };

  const updateField = (field: string, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Render serial device configuration (IBAC, WXT53X)
  const renderSerialConfig = () => (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Serial Port
          </Typography>
          <FormControl fullWidth>
            <Select
              value={config.address || 'ttyS0'}
              onChange={(e) => updateField('address', e.target.value)}
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="ttyS0">ttyS0</MenuItem>
              <MenuItem value="ttyS1">ttyS1</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Baud Rate
          </Typography>
          <FormControl fullWidth>
            <Select
              value={config.speed || '9600'}
              onChange={(e) => updateField('speed', e.target.value)}
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="9600">9600</MenuItem>
              <MenuItem value="19200">19200</MenuItem>
              <MenuItem value="38400">38400</MenuItem>
              <MenuItem value="57600">57600</MenuItem>
              <MenuItem value="115200">115200</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Data Bits
          </Typography>
          <FormControl fullWidth>
            <Select
              value={config.bits || '8'}
              onChange={(e) => updateField('bits', e.target.value)}
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="7">7</MenuItem>
              <MenuItem value="8">8</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Stop Bits
          </Typography>
          <FormControl fullWidth>
            <Select
              value={config.stopBits || '1'}
              onChange={(e) => updateField('stopBits', e.target.value)}
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="1">1</MenuItem>
              <MenuItem value="2">2</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Parity
          </Typography>
          <FormControl fullWidth>
            <Select
              value={config.parity || 'None'}
              onChange={(e) => updateField('parity', e.target.value)}
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="None">None</MenuItem>
              <MenuItem value="Even">Even</MenuItem>
              <MenuItem value="Odd">Odd</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Serial Port Type
          </Typography>
          <FormControl fullWidth>
            <Select
              value={config.serialPortType || 'RS232'}
              onChange={(e) => updateField('serialPortType', e.target.value)}
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="RS232">RS232</MenuItem>
              <MenuItem value="RS485">RS485</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
    </Stack>
  );

  // Render S900 configuration
  const renderS900Config = () => (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          IP Address
        </Typography>
        <TextField
          fullWidth
          placeholder="192.168.1.50"
          value={config.address || ''}
          onChange={(e) => updateField('address', e.target.value)}
          error={!!errors.address}
          helperText={errors.address || 'S900 device IP address'}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white' } }}
        />
      </Box>

      <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Port Number
        </Typography>
        <TextField
          fullWidth
          placeholder="21012"
          type="number"
          value={config.portNumber || ''}
          onChange={(e) => updateField('portNumber', parseInt(e.target.value) || '')}
          error={!!errors.portNumber}
          helperText={errors.portNumber || 'S900 device port number (default: 21012)'}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white' } }}
        />
      </Box>
    </Box>
  );

  // Render oritestgtdb configuration
  const renderOritestgtdbConfig = () => (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          IP Address
        </Typography>
        <TextField
          fullWidth
          placeholder="192.168.1.10"
          value={config.address || ''}
          onChange={(e) => updateField('address', e.target.value)}
          error={!!errors.address}
          helperText={errors.address || 'GTD Module-B network IP address'}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white' } }}
        />
      </Box>

      <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Port Number
        </Typography>
        <TextField
          fullWidth
          placeholder="80"
          type="number"
          value={config.portNumber || ''}
          onChange={(e) => updateField('portNumber', parseInt(e.target.value) || '')}
          error={!!errors.portNumber}
          helperText={errors.portNumber || 'GTD Module-B port number (default: 80)'}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white' } }}
        />
      </Box>
    </Box>
  );

  const getDeviceTitle = () => {
    if (deviceName.toUpperCase() === 'IBAC') return 'IBAC2 Device Configuration';
    if (deviceName.toUpperCase() === 'S900') return 'S900 Device Configuration';
    if (deviceName.toUpperCase() === 'ORITESTGTDB') return 'GTD Module-B Configuration';
    if (deviceName.toUpperCase() === 'WXT53X') return 'WXT53X Weather Station';
    return `${deviceName} Configuration`;
  };

  const getConfigTips = () => {
    if (deviceName.toUpperCase() === 'IBAC' || deviceName.toUpperCase() === 'WXT53X') {
      return [
        'Ensure the serial port matches the physical connection',
        'Verify baud rate matches the device specifications',
        'Check that parity and stop bits are correctly configured'
      ];
    }
    if (deviceName.toUpperCase() === 'S900') {
      return [
        'Ensure the S900 device is on the same network',
        'Default port is 21012',
        'Verify the device IP address is static or reserved in DHCP'
      ];
    }
    if (deviceName.toUpperCase() === 'ORITESTGTDB') {
      return [
        'GTD Module-B must be accessible from this device',
        'Ensure network connectivity to the device',
        'Default port is 80, verify firewall rules allow connections'
      ];
    }
    return [
      'Configure device-specific settings carefully',
      'Test connectivity after configuration changes',
      'Changes take effect after saving and restarting'
    ];
  };

  return (
    <Box>
      <Paper 
        elevation={0} 
        sx={{ 
          bgcolor: 'white',
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}
      >
        {/* Green Header */}
        <Box 
          sx={{ 
            bgcolor: '#10b981', 
            color: 'white', 
            py: 2.5, 
            px: 3 
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {getDeviceTitle()}
          </Typography>
        </Box>

        {/* Form Content */}
        <Box sx={{ p: 3 }}>
          {message && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            {(deviceName.toUpperCase() === 'IBAC' || deviceName.toUpperCase() === 'WXT53X') && renderSerialConfig()}
            {deviceName.toUpperCase() === 'S900' && renderS900Config()}
            {deviceName.toUpperCase() === 'ORITESTGTDB' && renderOritestgtdbConfig()}
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Device Name
            </Typography>
            <TextField
              fullWidth
              placeholder={`My ${deviceName} Device`}
              value={config.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name || 'Human-readable name for this device (max 50 characters)'}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                }
              }}
            />
          </Box>

          {/* Configuration Tips Box */}
          <Alert 
            icon={<InfoIcon />}
            severity="info"
            sx={{ 
              mt: 3,
              bgcolor: '#dbeafe',
              color: '#1e40af',
              '& .MuiAlert-icon': {
                color: '#3b82f6'
              },
              border: '1px solid #93c5fd',
              borderRadius: 2
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Configuration Tips
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5, '& li': { mb: 0.5 } }}>
              {getConfigTips().map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </Box>
          </Alert>
        </Box>
      </Paper>
    </Box>
  );
});

DeviceTab.displayName = 'DeviceTab';

export default DeviceTab;
