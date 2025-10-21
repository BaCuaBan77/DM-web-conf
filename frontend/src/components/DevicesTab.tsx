import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { TextField, CircularProgress, Alert, Box, Typography, Paper } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { getDevicesConfig } from '../api/configApi';
import { validateMQTTTopic } from '../utils/validation';
import { useConfig } from '../context/ConfigContext';

interface DevicesTabProps {
  onDataChange: (hasChanges: boolean) => void;
  onValidationChange: (isValid: boolean) => void;
}

const DevicesTab = forwardRef((props: DevicesTabProps, ref) => {
  const { onDataChange, onValidationChange } = props;
  const { configData, setConfigData } = useConfig();
  
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

  // Restore state from context when component mounts
  useEffect(() => {
    if (configData.devices !== null) {
      // Restore from context
      const { _original, ...deviceData } = configData.devices as any;
      setDeviceManagerKey(deviceData.key || '');
      setDeviceManagerName(deviceData.name || '');
      setOriginalData(_original || deviceData);
      setLoading(false);
    } else {
      // Load from API
      loadData();
    }
  }, []);

  // Save current state to context whenever it changes (only after data is loaded)
  useEffect(() => {
    if (originalData !== null) {
      setConfigData('devices', {
        key: deviceManagerKey,
        name: deviceManagerName,
        _original: originalData
      } as any);
    }
  }, [deviceManagerKey, deviceManagerName, originalData]);

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
      // Save to context with original data preserved
      setConfigData('devices', {
        key: data.deviceManagerKey || '',
        name: data.deviceManagerName || '',
        _original: data
      } as any);
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
            Device Configuration
          </Typography>
        </Box>

        {/* Form Content */}
        <Box sx={{ p: 3 }}>
          {message && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          <Box component="form" sx={{ '& .MuiTextField-root': { mb: 3 } }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Device Manager Key
              </Typography>
              <TextField
                fullWidth
                placeholder="DM-1"
                value={deviceManagerKey}
                onChange={(e) => setDeviceManagerKey(e.target.value)}
                error={!!errors.deviceManagerKey}
                helperText={errors.deviceManagerKey || 'MQTT topic key for this device manager'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                  }
                }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Device Manager Name
              </Typography>
              <TextField
                fullWidth
                placeholder="Detection Station 1"
                value={deviceManagerName}
                onChange={(e) => setDeviceManagerName(e.target.value)}
                error={!!errors.deviceManagerName}
                helperText={errors.deviceManagerName || 'Human-readable name for this device manager'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                  }
                }}
              />
            </Box>
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
              <li>Use unique keys to avoid MQTT topic conflicts</li>
              <li>Names should be descriptive for easy identification</li>
              <li>Changes take effect after saving and restarting</li>
            </Box>
          </Alert>
        </Box>
      </Paper>
    </Box>
  );
});

DevicesTab.displayName = 'DevicesTab';

export default DevicesTab;
