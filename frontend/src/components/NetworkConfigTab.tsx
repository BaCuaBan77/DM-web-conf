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
  Box,
  Paper
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
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
            Network Interface Configuration
          </Typography>
        </Box>

        {/* Form Content */}
        <Box sx={{ p: 3 }}>
          {message && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>Warning:</strong> Changing network settings will cause the system to reboot.
            Make sure you can access the device on the new IP address.
          </Alert>

          <Box component="form" sx={{ '& .MuiTextField-root': { mb: 3 } }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Interface Name
              </Typography>
              <TextField
                fullWidth
                placeholder="eth0"
                value={interfaceName}
                onChange={(e) => setInterfaceName(e.target.value)}
                helperText="Network interface name (e.g., eth0, enp0s3)"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                  }
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Configuration Method
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  row
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <FormControlLabel value="static" control={<Radio />} label="Static IP" />
                  <FormControlLabel value="dhcp" control={<Radio />} label="DHCP" />
                </RadioGroup>
              </FormControl>
            </Box>

            {method === 'static' && (
              <>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    IP Address
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="192.168.1.100"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    error={!!errors.address}
                    helperText={errors.address || 'Static IP address for this device'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'white',
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Netmask
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="255.255.255.0"
                    value={netmask}
                    onChange={(e) => setNetmask(e.target.value)}
                    error={!!errors.netmask}
                    helperText={errors.netmask || 'Network netmask (e.g., 255.255.255.0)'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'white',
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Gateway
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="192.168.1.1"
                    value={gateway}
                    onChange={(e) => setGateway(e.target.value)}
                    error={!!errors.gateway}
                    helperText={errors.gateway || 'Default gateway (optional)'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'white',
                      }
                    }}
                  />
                </Box>
              </>
            )}
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
              <li>Static IP is recommended for production environments</li>
              <li>Ensure the IP address is not already in use on your network</li>
              <li>System will reboot automatically after saving changes</li>
            </Box>
          </Alert>
        </Box>
      </Paper>
    </Box>
  );
});

NetworkConfigTab.displayName = 'NetworkConfigTab';

export default NetworkConfigTab;

