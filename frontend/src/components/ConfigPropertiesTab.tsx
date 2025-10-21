import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { TextField, CircularProgress, Alert, Box, Typography } from '@mui/material';
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
      <Typography variant="h6" gutterBottom>
        Configuration Properties
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure MQTT broker connection settings.
      </Typography>

      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Box component="form" sx={{ '& .MuiTextField-root': { mb: 2 } }}>
        <TextField
          fullWidth
          label="MQTT Broker IP"
          value={mqttBroker}
          onChange={(e) => setMqttBroker(e.target.value)}
          error={!!errors.mqttBroker}
          helperText={errors.mqttBroker || 'IPv4 address of the MQTT broker'}
        />

        <TextField
          fullWidth
          label="MQTT Port"
          type="number"
          value={mqttPort}
          onChange={(e) => setMqttPort(e.target.value)}
          error={!!errors.mqttPort}
          helperText={errors.mqttPort || 'Port number for MQTT broker (default: 1883)'}
        />
      </Box>
    </Box>
  );
});

ConfigPropertiesTab.displayName = 'ConfigPropertiesTab';

export default ConfigPropertiesTab;
