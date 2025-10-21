import React, { useState, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Button,
  Container,
  Box,
  Paper,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  createTheme,
  ThemeProvider,
  CssBaseline
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import DevicesTab from './components/DevicesTab';
import ConfigPropertiesTab from './components/ConfigPropertiesTab';
import DeviceTab from './components/DeviceTab';
import NetworkConfigTab from './components/NetworkConfigTab';
import { saveData, saveDeviceConfig, saveNetworkConfig, reboot } from './api/configApi';
import './App.css';

// Material UI theme with green accent
const theme = createTheme({
  palette: {
    primary: {
      main: '#4CAF50', // Green
    },
    secondary: {
      main: '#388E3C', // Dark green
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

interface TabChangeStatus {
  [key: string]: boolean;
}

interface TabValidStatus {
  [key: string]: boolean;
}

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [hasChanges, setHasChanges] = useState<TabChangeStatus>({});
  const [isValid, setIsValid] = useState<TabValidStatus>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Refs to get data from child components
  const devicesTabRef = useRef<any>(null);
  const configPropertiesTabRef = useRef<any>(null);
  const ibacTabRef = useRef<any>(null);
  const s900TabRef = useRef<any>(null);
  const oriTabRef = useRef<any>(null);
  const wxtTabRef = useRef<any>(null);
  const networkTabRef = useRef<any>(null);

  const tabs = [
    { label: 'Devices', key: 'devices' },
    { label: 'Config Properties', key: 'config' },
    { label: 'IBAC', key: 'ibac' },
    { label: 'S900', key: 's900' },
    { label: 'OriTestGTDB', key: 'ori' },
    { label: 'WXT53X', key: 'wxt' },
    { label: 'Network Config', key: 'network' }
  ];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleDataChange = (tabKey: string, changed: boolean) => {
    setHasChanges(prev => ({ ...prev, [tabKey]: changed }));
  };

  const handleValidationChange = (tabKey: string, valid: boolean) => {
    setIsValid(prev => ({ ...prev, [tabKey]: valid }));
  };

  const getCurrentTabKey = () => tabs[currentTab].key;

  const isCurrentTabValid = () => {
    const currentKey = getCurrentTabKey();
    return isValid[currentKey] !== false; // Default to true if not set
  };

  const handleSaveAndReboot = async () => {
    // Check if current tab is valid
    if (!isCurrentTabValid()) {
      setSnackbar({
        open: true,
        message: 'Please fix validation errors before saving',
        severity: 'error'
      });
      return;
    }

    setConfirmDialog(true);
  };

  const executeSaveAndReboot = async () => {
    setConfirmDialog(false);
    setSaving(true);

    try {
      const currentKey = getCurrentTabKey();
      
      // Get data from current tab based on which tab is active
      let response;
      
      switch (currentKey) {
        case 'devices':
          const devicesData = devicesTabRef.current?.getData();
          response = await saveData('devices', devicesData);
          break;
        
        case 'config':
          const configData = configPropertiesTabRef.current?.getData();
          response = await saveData('config', configData);
          break;
        
        case 'ibac':
          const ibacData = ibacTabRef.current?.getData();
          response = await saveDeviceConfig('IBAC', ibacData);
          break;
        
        case 's900':
          const s900Data = s900TabRef.current?.getData();
          response = await saveDeviceConfig('S900', s900Data);
          break;
        
        case 'ori':
          const oriData = oriTabRef.current?.getData();
          response = await saveDeviceConfig('oritestgtdb', oriData);
          break;
        
        case 'wxt':
          const wxtData = wxtTabRef.current?.getData();
          response = await saveDeviceConfig('wxt53x', wxtData);
          break;
        
        case 'network':
          const networkData = networkTabRef.current?.getData();
          response = await saveNetworkConfig(networkData);
          // Network config automatically reboots, no need to call reboot separately
          setSnackbar({
            open: true,
            message: 'Network configuration saved! System is rebooting...',
            severity: 'success'
          });
          setSaving(false);
          return;
      }

      if (response?.success) {
        // Trigger reboot
        await reboot();
        
        setSnackbar({
          open: true,
          message: 'Configuration saved! System is rebooting...',
          severity: 'success'
        });
        
        // Clear the change flag for this tab
        setHasChanges(prev => ({ ...prev, [currentKey]: false }));
      } else {
        setSnackbar({
          open: true,
          message: response?.error || 'Save failed',
          severity: 'error'
        });
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const renderTabWithIndicator = (label: string, key: string) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {label}
        {hasChanges[key] && (
          <FiberManualRecordIcon 
            sx={{ 
              fontSize: 10, 
              color: 'warning.main',
              animation: 'pulse 2s infinite'
            }} 
          />
        )}
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" color="primary" elevation={2}>
          <Toolbar>
            <Box
              component="img"
              sx={{
                height: 40,
                mr: 2,
                filter: 'brightness(0) invert(1)', // Make logo white
              }}
              alt="Observis Logo"
              src="/observis-logo.png"
              onError={(e: any) => {
                e.target.style.display = 'none'; // Hide if logo not found
              }}
            />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Device Manager Configuration
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<SaveIcon />}
              onClick={handleSaveAndReboot}
              disabled={saving || hasChanges[getCurrentTabKey()] !== true}
            >
              {saving ? 'Saving...' : 'Save & Reboot'}
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Paper elevation={3}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  minWidth: 100,
                  fontSize: '0.875rem'
                }
              }}
            >
              {tabs.map((tab) => (
                <Tab
                  key={tab.key}
                  label={renderTabWithIndicator(tab.label, tab.key)}
                />
              ))}
            </Tabs>

            <Box sx={{ p: 3 }}>
              {currentTab === 0 && (
                <DevicesTab
                  ref={devicesTabRef}
                  onDataChange={(changed) => handleDataChange('devices', changed)}
                  onValidationChange={(valid) => handleValidationChange('devices', valid)}
                />
              )}
              {currentTab === 1 && (
                <ConfigPropertiesTab
                  ref={configPropertiesTabRef}
                  onDataChange={(changed) => handleDataChange('config', changed)}
                  onValidationChange={(valid) => handleValidationChange('config', valid)}
                />
              )}
              {currentTab === 2 && (
                <DeviceTab
                  ref={ibacTabRef}
                  deviceName="IBAC"
                  onDataChange={(changed) => handleDataChange('ibac', changed)}
                  onValidationChange={(valid) => handleValidationChange('ibac', valid)}
                />
              )}
              {currentTab === 3 && (
                <DeviceTab
                  ref={s900TabRef}
                  deviceName="S900"
                  onDataChange={(changed) => handleDataChange('s900', changed)}
                  onValidationChange={(valid) => handleValidationChange('s900', valid)}
                />
              )}
              {currentTab === 4 && (
                <DeviceTab
                  ref={oriTabRef}
                  deviceName="oritestgtdb"
                  onDataChange={(changed) => handleDataChange('ori', changed)}
                  onValidationChange={(valid) => handleValidationChange('ori', valid)}
                />
              )}
              {currentTab === 5 && (
                <DeviceTab
                  ref={wxtTabRef}
                  deviceName="wxt53x"
                  onDataChange={(changed) => handleDataChange('wxt', changed)}
                  onValidationChange={(valid) => handleValidationChange('wxt', valid)}
                />
              )}
              {currentTab === 6 && (
                <NetworkConfigTab
                  ref={networkTabRef}
                  onDataChange={(changed) => handleDataChange('network', changed)}
                  onValidationChange={(valid) => handleValidationChange('network', valid)}
                />
              )}
            </Box>
          </Paper>
        </Container>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialog}
          onClose={() => setConfirmDialog(false)}
        >
          <DialogTitle>Confirm Save & Reboot</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will save the current configuration and reboot the system. 
              The device will be unavailable for a few minutes during the reboot process.
              <br /><br />
              Do you want to continue?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialog(false)} color="inherit">
              Cancel
            </Button>
            <Button onClick={executeSaveAndReboot} color="primary" variant="contained" autoFocus>
              Save & Reboot
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </ThemeProvider>
  );
}

export default App;
