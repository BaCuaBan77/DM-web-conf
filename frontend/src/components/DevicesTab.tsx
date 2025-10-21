import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { TextField, CircularProgress, Alert, Box, Typography } from '@mui/material';
import { getDevicesConfig } from '../api/configApi';
import { validateMQTTTopic } from '../utils/validation';

interface DevicesTabProps {
  onDataChange: (hasChanges: boolean) => void;
  onValidationChange: (isValid: boolean) => void;
}

const DevicesTab = forwardRef((props: DevicesTabProps, ref) => {
  const { onDataChange, onValidationChange } = props;
  const [deviceManagerKey, setDeviceManagerKey] = useState('');
  const [deviceManagerName, setDeviceManagerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [originalData, setOriginalData] = useState<any>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useImperativeHandle(ref, () => ({
    getData: () => ({
      deviceManagerKey,
      deviceManagerName
    })
  }));

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    validateForm();
    checkForChanges();
  }, [deviceManagerKey, deviceManagerName]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getDevicesConfig();
      setDeviceManagerKey(data.deviceManagerKey || '');
      setDeviceManagerName(data.deviceManagerName || '');
      setOriginalData(data);
    } catch (error: any) {
      setMessage(`Failed to load: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkForChanges = () => {
    if (!originalData) return;
    
    const hasChanges = 
      deviceManagerKey !== originalData.deviceManagerKey ||
      deviceManagerName !== originalData.deviceManagerName;
    
    onDataChange(hasChanges);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!deviceManagerKey) {
      newErrors.deviceManagerKey = 'Device Manager Key is required';
    } else if (!validateMQTTTopic(deviceManagerKey)) {
      newErrors.deviceManagerKey = 'Invalid MQTT topic (alphanumeric, spaces, -, _, and . only)';
    }

    if (!deviceManagerName || deviceManagerName.trim().length === 0) {
      newErrors.deviceManagerName = 'Device Manager Name is required';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidationChange(isValid);
    return isValid;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Device Manager Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure the device manager key and name for MQTT communication.
      </Typography>

      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Box component="form" sx={{ '& .MuiTextField-root': { mb: 2 } }}>
        <TextField
          fullWidth
          label="Device Manager Key"
          value={deviceManagerKey}
          onChange={(e) => setDeviceManagerKey(e.target.value)}
          error={!!errors.deviceManagerKey}
          helperText={errors.deviceManagerKey || 'MQTT topic key for this device manager'}
        />

        <TextField
          fullWidth
          label="Device Manager Name"
          value={deviceManagerName}
          onChange={(e) => setDeviceManagerName(e.target.value)}
          error={!!errors.deviceManagerName}
          helperText={errors.deviceManagerName || 'Human-readable name for this device manager'}
        />
      </Box>
    </Box>
  );
});

DevicesTab.displayName = 'DevicesTab';

export default DevicesTab;
