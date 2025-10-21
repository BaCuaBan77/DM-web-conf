import { useState, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  createTheme,
  ThemeProvider,
  CssBaseline,
  Divider
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import RadioIcon from '@mui/icons-material/Radio';
import WifiIcon from '@mui/icons-material/Wifi';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import DevicesTab from './components/DevicesTab';
import ConfigPropertiesTab from './components/ConfigPropertiesTab';
import DeviceTab from './components/DeviceTab';
import NetworkConfigTab from './components/NetworkConfigTab';
import { saveData, saveDeviceConfig, saveNetworkConfig, reboot } from './api/configApi';
import './App.css';

const DRAWER_WIDTH = 256;

// Material UI theme with green accent
const theme = createTheme({
  palette: {
    primary: {
      main: '#10b981', // Teal green to match screenshot
    },
    secondary: {
      main: '#059669', // Darker green
    },
    background: {
      default: '#f9fafb',
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

  const menuItems = [
    { label: 'Devices', key: 'devices', icon: <DescriptionIcon /> },
    { label: 'Config Properties', key: 'config', icon: <SettingsIcon /> },
    { label: 'IBAC', key: 'ibac', icon: <RadioIcon /> },
    { label: 'S900', key: 's900', icon: <RadioIcon /> },
    { label: 'ORITESTGTDB', key: 'ori', icon: <DescriptionIcon /> },
    { label: 'WXT53X', key: 'wxt', icon: <WifiIcon /> },
    { label: 'Network Config', key: 'network', icon: <NetworkCheckIcon /> }
  ];

  const handleMenuClick = (index: number) => {
    setCurrentTab(index);
  };

  const handleDataChange = (tabKey: string, changed: boolean) => {
    setHasChanges(prev => ({ ...prev, [tabKey]: changed }));
  };

  const handleValidationChange = (tabKey: string, valid: boolean) => {
    setIsValid(prev => ({ ...prev, [tabKey]: valid }));
  };

  const getCurrentTabKey = () => menuItems[currentTab].key;

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

  const getPageTitle = () => {
    const currentItem = menuItems[currentTab];
    if (currentTab === 0) return 'Device Manager Configuration';
    if (currentTab === 1) return 'Config Properties';
    if (currentTab === 6) return 'Network Configuration';
    return `${currentItem.label} Configuration`;
  };

  const getPageSubtitle = () => {
    if (currentTab === 0) return 'Configure the device manager key and name for MQTT communication';
    if (currentTab === 1) return 'Configure MQTT broker settings and connection parameters';
    if (currentTab === 6) return 'Configure network interface settings for static IP or DHCP';
    return `Configure ${menuItems[currentTab].label} device settings`;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* Left Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              bgcolor: '#ffffff',
              borderRight: '1px solid #e5e7eb',
            },
          }}
        >
          {/* Logo and Title */}
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <SettingsIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                Device Manager
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Configuration
              </Typography>
            </Box>
          </Box>

          <Divider />

          {/* Navigation Menu */}
          <List sx={{ px: 2, py: 2 }}>
            {menuItems.map((item, index) => (
              <ListItem key={item.key} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={currentTab === index}
                  onClick={() => handleMenuClick(index)}
                  sx={{
                    borderRadius: '8px',
                    '&.Mui-selected': {
                      bgcolor: '#d1fae5',
                      color: '#065f46',
                      '&:hover': {
                        bgcolor: '#a7f3d0',
                      },
                      '& .MuiListItemIcon-root': {
                        color: '#065f46',
                      },
                    },
                    '&:hover': {
                      bgcolor: '#f3f4f6',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: currentTab === index ? 600 : 400,
                    }}
                  />
                  {hasChanges[item.key] && (
                    <FiberManualRecordIcon 
                      sx={{ 
                        fontSize: 8, 
                        color: '#f59e0b',
                        ml: 1
                      }} 
                    />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          {/* Version at bottom */}
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ p: 3, borderTop: '1px solid #e5e7eb' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              v2.0.1
            </Typography>
          </Box>
        </Drawer>

        {/* Main Content Area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Top Bar */}
          <AppBar 
            position="static" 
            elevation={0}
            sx={{ 
              bgcolor: 'white',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <Toolbar sx={{ py: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.5 }}>
                  {getPageTitle()}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {getPageSubtitle()}
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveAndReboot}
                disabled={saving || hasChanges[getCurrentTabKey()] !== true}
                sx={{
                  textTransform: 'none',
                  px: 3,
                  py: 1.5,
                  borderRadius: '8px',
                  fontWeight: 600,
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Toolbar>
          </AppBar>

          {/* Content Area */}
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              p: 4,
              bgcolor: 'background.default',
              overflow: 'auto'
            }}
          >
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
        </Box>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialog}
          onClose={() => setConfirmDialog(false)}
        >
          <DialogTitle>Confirm Save Changes</DialogTitle>
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
              Save Changes
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
