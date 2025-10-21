import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { TextField, CircularProgress, Alert, Box, Typography, Paper } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { getConfigProperties } from '../api/configApi';
import { validateIPv4, validatePort } from '../utils/validation';

interface ConfigPropertiesTabProps {
  onDataChange: (hasChanges: boolean) => void;
  onValidationChange: (isValid: boolean) => void;
}

const ConfigPropertiesTab = forwardRef((props: ConfigPropertiesTabProps, ref) => {
  const { onDataChange, onValidationChange } = props;
  const [mqttBroker, setMqttBroker] = useState('');
  const [mqttPort, setMqttPort] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [originalData, setOriginalData] = useState<any>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useImperativeHandle(ref, () => ({
    getData: () => ({
      'mqtt.broker': mqttBroker,
      'mqtt.port': mqttPort
    })
  }));

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    validateForm();
    checkForChanges();
  }, [mqttBroker, mqttPort]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getConfigProperties();
      setMqttBroker(data['mqtt.broker'] || '');
      setMqttPort(data['mqtt.port'] || '');
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
      mqttBroker !== originalData['mqtt.broker'] ||
      mqttPort !== originalData['mqtt.port'];
    
    onDataChange(hasChanges);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!mqttBroker || !validateIPv4(mqttBroker)) {
      newErrors.mqttBroker = 'Invalid IPv4 address';
    }

    if (!mqttPort || !validatePort(parseInt(mqttPort))) {
      newErrors.mqttPort = 'Invalid port (1-65535)';
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
            MQTT Broker Configuration
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
                MQTT Broker IP
              </Typography>
              <TextField
                fullWidth
                placeholder="192.168.1.100"
                value={mqttBroker}
                onChange={(e) => setMqttBroker(e.target.value)}
                error={!!errors.mqttBroker}
                helperText={errors.mqttBroker || 'IPv4 address of the MQTT broker'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                  }
                }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                MQTT Port
              </Typography>
              <TextField
                fullWidth
                placeholder="1883"
                type="number"
                value={mqttPort}
                onChange={(e) => setMqttPort(e.target.value)}
                error={!!errors.mqttPort}
                helperText={errors.mqttPort || 'Port number for MQTT broker (default: 1883)'}
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
              <li>Ensure the MQTT broker is accessible from this device</li>
              <li>Default MQTT port is 1883 (unencrypted) or 8883 (TLS)</li>
              <li>Changes take effect after saving and restarting</li>
            </Box>
          </Alert>
        </Box>
      </Paper>
    </Box>
  );
});

ConfigPropertiesTab.displayName = 'ConfigPropertiesTab';

export default ConfigPropertiesTab;
