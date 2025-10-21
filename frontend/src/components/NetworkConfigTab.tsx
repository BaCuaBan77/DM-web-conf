import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';
import { getNetworkConfig } from '../api/configApi';
import { validateIPv4 } from '../utils/validation';

interface NetworkConfigTabProps {
  onDataChange: (hasChanges: boolean) => void;
  onValidationChange: (isValid: boolean) => void;
}

const NetworkConfigTab = forwardRef((props: NetworkConfigTabProps, ref) => {
  const { onDataChange, onValidationChange } = props;
  const [method, setMethod] = useState('static');
  const [interfaceName, setInterfaceName] = useState('eth0');
  const [address, setAddress] = useState('');
  const [netmask, setNetmask] = useState('');
  const [gateway, setGateway] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [originalData, setOriginalData] = useState<any>(null);

  useImperativeHandle(ref, () => ({
    getData: () => ({
      interface: interfaceName,
      method,
      address: method === 'static' ? address : '',
      netmask: method === 'static' ? netmask : '',
      gateway: method === 'static' ? gateway : ''
    })
  }));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getNetworkConfig();
      setInterfaceName(data.interface || 'eth0');
      setMethod(data.method || 'static');
      setAddress(data.address || '');
      setNetmask(data.netmask || '');
      setGateway(data.gateway || '');
      setOriginalData(data);
    } catch (error: any) {
      setMessage(`Failed to load: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    validateForm();
    checkForChanges();
  }, [method, address, netmask, gateway, interfaceName]);

  const checkForChanges = () => {
    if (!originalData) return;
    
    const hasChanges = 
      method !== originalData.method ||
      address !== originalData.address ||
      netmask !== originalData.netmask ||
      gateway !== originalData.gateway ||
      interfaceName !== originalData.interface;
    
    onDataChange(hasChanges);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (method === 'static') {
      if (!address || !validateIPv4(address)) {
        newErrors.address = 'Invalid IP address';
      }

      if (!netmask || !validateIPv4(netmask)) {
        newErrors.netmask = 'Invalid netmask';
      }

      if (gateway && !validateIPv4(gateway)) {
        newErrors.gateway = 'Invalid gateway';
      }
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
        Debian Static IP Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure the network interface settings for this device.
      </Typography>

      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Box component="form" sx={{ '& .MuiTextField-root': { mb: 2 } }}>
        <TextField
          fullWidth
          label="Interface Name"
          value={interfaceName}
          onChange={(e) => setInterfaceName(e.target.value)}
          helperText="Network interface name (e.g., eth0, enp0s3)"
        />

        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">Configuration Method</FormLabel>
          <RadioGroup
            row
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <FormControlLabel value="static" control={<Radio />} label="Static IP" />
            <FormControlLabel value="dhcp" control={<Radio />} label="DHCP" />
          </RadioGroup>
        </FormControl>

        {method === 'static' && (
          <>
            <TextField
              fullWidth
              label="IP Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              error={!!errors.address}
              helperText={errors.address || 'Static IP address for this device'}
            />

            <TextField
              fullWidth
              label="Netmask"
              value={netmask}
              onChange={(e) => setNetmask(e.target.value)}
              error={!!errors.netmask}
              helperText={errors.netmask || 'Network netmask (e.g., 255.255.255.0)'}
            />

            <TextField
              fullWidth
              label="Gateway"
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
              error={!!errors.gateway}
              helperText={errors.gateway || 'Default gateway (optional)'}
            />
          </>
        )}
      </Box>

      <Alert severity="warning" sx={{ mt: 2 }}>
        <strong>Warning:</strong> Changing network settings will cause the system to reboot.
        Make sure you can access the device on the new IP address.
      </Alert>
    </Box>
  );
});

NetworkConfigTab.displayName = 'NetworkConfigTab';

export default NetworkConfigTab;

