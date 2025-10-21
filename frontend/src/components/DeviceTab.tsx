import React, { useState, useEffect } from 'react';
import { getDeviceConfig, saveDeviceConfig } from '../api/configApi';
import {
  validateSerialPort,
  validateBaudRate,
  validateSerialPortType,
  validateParity,
  validateDataBits,
  validateStopBits,
  validateDeviceName,
  validateIPv4,
  validatePortNumber
} from '../utils/validation';

interface DeviceTabProps {
  deviceName: string;
}

const DeviceTab: React.FC<DeviceTabProps> = ({ deviceName }) => {
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadData();
  }, [deviceName]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getDeviceConfig(deviceName);
      setConfig(data);
    } catch (error: any) {
      setMessage(`Failed to load: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (config.name && !validateDeviceName(config.name)) {
      newErrors.name = 'Maximum 50 characters allowed';
    }

    // Serial device validation (IBAC, WXT53X)
    if (deviceName.toUpperCase() === 'IBAC' || deviceName.toUpperCase() === 'WXT53X') {
      if (config.address && !validateSerialPort(config.address)) {
        newErrors.address = 'Invalid serial port';
      }
    }

    // S900 validation
    if (deviceName.toUpperCase() === 'S900') {
      if (config.address && !validateIPv4(config.address)) {
        newErrors.address = 'Invalid IP address';
      }
      if (config.portNumber !== undefined && !validatePortNumber(config.portNumber)) {
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
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const result = await saveDeviceConfig(deviceName, config);
      setMessage(result.message || 'Saved');
    } catch (error: any) {
      setMessage(`Save failed: ${error.message}`);
    }
  };

  const updateField = (field: string, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const isFormValid = Object.keys(errors).length === 0;

  // Render serial device configuration (IBAC, WXT53X)
  const renderSerialConfig = () => (
    <>
      <div>
        <label htmlFor="address">Address:</label>
        <select
          id="address"
          value={config.address || ''}
          onChange={(e) => updateField('address', e.target.value)}
        >
          <option value="ttyS0">ttyS0</option>
          <option value="ttyS1">ttyS1</option>
        </select>
      </div>

      <div>
        <label htmlFor="speed">Speed:</label>
        <select
          id="speed"
          value={config.speed || ''}
          onChange={(e) => updateField('speed', e.target.value)}
        >
          <option value="9600">9600</option>
          <option value="19200">19200</option>
          <option value="38400">38400</option>
          <option value="57600">57600</option>
          <option value="115200">115200</option>
        </select>
      </div>

      <div>
        <label htmlFor="bits">Data Bits:</label>
        <select
          id="bits"
          value={config.bits || ''}
          onChange={(e) => updateField('bits', e.target.value)}
        >
          <option value="7">7</option>
          <option value="8">8</option>
        </select>
      </div>

      <div>
        <label htmlFor="stopBits">Stop Bits:</label>
        <select
          id="stopBits"
          value={config.stopBits || ''}
          onChange={(e) => updateField('stopBits', e.target.value)}
        >
          <option value="1">1</option>
          <option value="2">2</option>
        </select>
      </div>

      <div>
        <label htmlFor="parity">Parity:</label>
        <select
          id="parity"
          value={config.parity || ''}
          onChange={(e) => updateField('parity', e.target.value)}
        >
          <option value="None">None</option>
          <option value="Even">Even</option>
          <option value="Odd">Odd</option>
        </select>
      </div>

      <div>
        <label htmlFor="serialPortType">Serial Port Type:</label>
        <select
          id="serialPortType"
          value={config.serialPortType || ''}
          onChange={(e) => updateField('serialPortType', e.target.value)}
        >
          <option value="RS232">RS232</option>
          <option value="RS485">RS485</option>
        </select>
      </div>
    </>
  );

  // Render S900 configuration
  const renderS900Config = () => (
    <>
      <div>
        <label htmlFor="address">Address:</label>
        <input
          id="address"
          type="text"
          value={config.address || ''}
          onChange={(e) => updateField('address', e.target.value)}
          onBlur={validateForm}
        />
        {errors.address && <div style={{ color: 'red' }}>{errors.address}</div>}
      </div>

      <div>
        <label htmlFor="portNumber">Port Number:</label>
        <input
          id="portNumber"
          type="number"
          value={config.portNumber || ''}
          onChange={(e) => updateField('portNumber', parseInt(e.target.value))}
          onBlur={validateForm}
        />
        {errors.portNumber && <div style={{ color: 'red' }}>{errors.portNumber}</div>}
      </div>
    </>
  );

  // Render oritestgtdb configuration
  const renderOritestgtdbConfig = () => (
    <div>
      <label htmlFor="address">Address:</label>
      <input
        id="address"
        type="text"
        value={config.address || ''}
        onChange={(e) => updateField('address', e.target.value)}
        onBlur={validateForm}
      />
      {errors.address && <div style={{ color: 'red' }}>{errors.address}</div>}
    </div>
  );

  return (
    <div>
      <h2>{deviceName} Configuration</h2>
      
      {(deviceName.toUpperCase() === 'IBAC' || deviceName.toUpperCase() === 'WXT53X') && renderSerialConfig()}
      {deviceName.toUpperCase() === 'S900' && renderS900Config()}
      {deviceName.toUpperCase() === 'ORITESTGTDB' && renderOritestgtdbConfig()}

      <div>
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          type="text"
          value={config.name || ''}
          onChange={(e) => updateField('name', e.target.value)}
          onBlur={validateForm}
        />
        {errors.name && <div style={{ color: 'red' }}>{errors.name}</div>}
      </div>

      <button onClick={handleSave} disabled={!isFormValid}>
        Save
      </button>

      {message && <div>{message}</div>}
    </div>
  );
};

export default DeviceTab;

