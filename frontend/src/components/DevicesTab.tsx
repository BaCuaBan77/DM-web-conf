import React, { useState, useEffect } from 'react';
import { getDevicesConfig, saveDevicesConfig } from '../api/configApi';
import { validateDeviceManagerKey, validateDeviceManagerName } from '../utils/validation';

const DevicesTab: React.FC = () => {
  const [deviceManagerKey, setDeviceManagerKey] = useState('');
  const [deviceManagerName, setDeviceManagerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getDevicesConfig();
      setDeviceManagerKey(data.deviceManagerKey || '');
      setDeviceManagerName(data.deviceManagerName || '');
    } catch (error: any) {
      setMessage(`Failed to load: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!validateDeviceManagerKey(deviceManagerKey)) {
      if (deviceManagerKey.includes('/')) {
        newErrors.deviceManagerKey = 'Forward slashes (/) not allowed';
      } else if (deviceManagerKey.includes('#') || deviceManagerKey.includes('+')) {
        newErrors.deviceManagerKey = 'Invalid MQTT characters (# and + not allowed)';
      } else if (deviceManagerKey.length > 20) {
        newErrors.deviceManagerKey = 'Maximum 20 characters allowed';
      } else {
        newErrors.deviceManagerKey = 'Invalid device manager key';
      }
    }

    if (!validateDeviceManagerName(deviceManagerName)) {
      if (deviceManagerName.length > 50) {
        newErrors.deviceManagerName = 'Maximum 50 characters allowed';
      } else {
        newErrors.deviceManagerName = 'Invalid device manager name';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const result = await saveDevicesConfig({
        deviceManagerKey,
        deviceManagerName
      });
      setMessage(result.message || 'Saved successfully');
    } catch (error: any) {
      setMessage(`Save failed: ${error.message}`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const isFormValid = validateDeviceManagerKey(deviceManagerKey) && 
                      validateDeviceManagerName(deviceManagerName);

  return (
    <div>
      <h2>Device Manager Configuration</h2>
      
      <div>
        <label htmlFor="deviceManagerKey">Device Manager Key:</label>
        <input
          id="deviceManagerKey"
          type="text"
          value={deviceManagerKey}
          onChange={(e) => setDeviceManagerKey(e.target.value)}
          onBlur={validateForm}
        />
        {errors.deviceManagerKey && (
          <div style={{ color: 'red' }}>{errors.deviceManagerKey}</div>
        )}
      </div>

      <div>
        <label htmlFor="deviceManagerName">Device Manager Name:</label>
        <input
          id="deviceManagerName"
          type="text"
          value={deviceManagerName}
          onChange={(e) => setDeviceManagerName(e.target.value)}
          onBlur={validateForm}
        />
        {errors.deviceManagerName && (
          <div style={{ color: 'red' }}>{errors.deviceManagerName}</div>
        )}
      </div>

      <button onClick={handleSave} disabled={!isFormValid}>
        Save
      </button>

      {message && <div>{message}</div>}
    </div>
  );
};

export default DevicesTab;

