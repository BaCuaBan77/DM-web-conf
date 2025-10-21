import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Stack
} from '@mui/material';
import { getDeviceConfig } from '../api/configApi';
import {
  validateDeviceName,
  validateIPv4,
  validatePortNumber
} from '../utils/validation';

interface DeviceTabProps {
  deviceName: string;
  onDataChange: (hasChanges: boolean) => void;
  onValidationChange: (isValid: boolean) => void;
}

const DeviceTab = forwardRef((props: DeviceTabProps, ref) => {
  const { deviceName, onDataChange, onValidationChange } = props;
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [originalData, setOriginalData] = useState<any>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useImperativeHandle(ref, () => ({
    getData: () => config
  }));

  useEffect(() => {
    loadData();
  }, [deviceName]);

  useEffect(() => {
    validateForm();
    checkForChanges();
  }, [config]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getDeviceConfig(deviceName);
      setConfig(data);
      setOriginalData(data);
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
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <InputLabel>Serial Port</InputLabel>
          <Select
            value={config.address || 'ttyS0'}
            onChange={(e) => updateField('address', e.target.value)}
            label="Serial Port"
          >
            <MenuItem value="ttyS0">ttyS0</MenuItem>
            <MenuItem value="ttyS1">ttyS1</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <InputLabel>Baud Rate</InputLabel>
          <Select
            value={config.speed || '9600'}
            onChange={(e) => updateField('speed', e.target.value)}
            label="Baud Rate"
          >
            <MenuItem value="9600">9600</MenuItem>
            <MenuItem value="19200">19200</MenuItem>
            <MenuItem value="38400">38400</MenuItem>
            <MenuItem value="57600">57600</MenuItem>
            <MenuItem value="115200">115200</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <InputLabel>Data Bits</InputLabel>
          <Select
            value={config.bits || '8'}
            onChange={(e) => updateField('bits', e.target.value)}
            label="Data Bits"
          >
            <MenuItem value="7">7</MenuItem>
            <MenuItem value="8">8</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <InputLabel>Stop Bits</InputLabel>
          <Select
            value={config.stopBits || '1'}
            onChange={(e) => updateField('stopBits', e.target.value)}
            label="Stop Bits"
          >
            <MenuItem value="1">1</MenuItem>
            <MenuItem value="2">2</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <InputLabel>Parity</InputLabel>
          <Select
            value={config.parity || 'None'}
            onChange={(e) => updateField('parity', e.target.value)}
            label="Parity"
          >
            <MenuItem value="None">None</MenuItem>
            <MenuItem value="Even">Even</MenuItem>
            <MenuItem value="Odd">Odd</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <InputLabel>Serial Port Type</InputLabel>
          <Select
            value={config.serialPortType || 'RS232'}
            onChange={(e) => updateField('serialPortType', e.target.value)}
            label="Serial Port Type"
          >
            <MenuItem value="RS232">RS232</MenuItem>
            <MenuItem value="RS485">RS485</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Stack>
  );

  // Render S900 configuration
  const renderS900Config = () => (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <TextField
        sx={{ flex: '1 1 200px', minWidth: '200px' }}
        label="IP Address"
        value={config.address || ''}
        onChange={(e) => updateField('address', e.target.value)}
        error={!!errors.address}
        helperText={errors.address || 'S900 device IP address'}
      />

      <TextField
        sx={{ flex: '1 1 200px', minWidth: '200px' }}
        label="Port Number"
        type="number"
        value={config.portNumber || ''}
        onChange={(e) => updateField('portNumber', parseInt(e.target.value) || '')}
        error={!!errors.portNumber}
        helperText={errors.portNumber || 'S900 device port number'}
      />
    </Box>
  );

  // Render oritestgtdb configuration
  const renderOritestgtdbConfig = () => (
    <TextField
      fullWidth
      label="IP Address"
      value={config.address || ''}
      onChange={(e) => updateField('address', e.target.value)}
      error={!!errors.address}
      helperText={errors.address || 'OriTestGTDB database IP address'}
    />
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {deviceName} Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure {deviceName} device settings.
      </Typography>

      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        {(deviceName.toUpperCase() === 'IBAC' || deviceName.toUpperCase() === 'WXT53X') && renderSerialConfig()}
        {deviceName.toUpperCase() === 'S900' && renderS900Config()}
        {deviceName.toUpperCase() === 'ORITESTGTDB' && renderOritestgtdbConfig()}
      </Box>

      <TextField
        fullWidth
        label="Device Name"
        value={config.name || ''}
        onChange={(e) => updateField('name', e.target.value)}
        error={!!errors.name}
        helperText={errors.name || 'Human-readable name for this device (max 50 characters)'}
      />
    </Box>
  );
});

DeviceTab.displayName = 'DeviceTab';

export default DeviceTab;
