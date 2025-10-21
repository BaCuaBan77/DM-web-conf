import React, { useState } from 'react';
import DevicesTab from './components/DevicesTab';
import ConfigPropertiesTab from './components/ConfigPropertiesTab';
import DeviceTab from './components/DeviceTab';
import { reboot } from './api/configApi';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('devices');
  const [rebootMessage, setRebootMessage] = useState('');

  const handleReboot = async () => {
    if (window.confirm('Are you sure you want to reboot the system?')) {
      try {
        const result = await reboot();
        setRebootMessage(result.message || 'Reboot initiated');
      } catch (error: any) {
        setRebootMessage(`Reboot failed: ${error.message}`);
      }
    }
  };

  const tabs = [
    { id: 'devices', label: 'Devices' },
    { id: 'config-properties', label: 'Config Properties' },
    { id: 'ibac', label: 'IBAC' },
    { id: 's900', label: 'S900' },
    { id: 'oritestgtdb', label: 'oritestgtdb' },
    { id: 'wxt53x', label: 'WXT53X' }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'devices':
        return <DevicesTab />;
      case 'config-properties':
        return <ConfigPropertiesTab />;
      case 'ibac':
        return <DeviceTab deviceName="IBAC" />;
      case 's900':
        return <DeviceTab deviceName="S900" />;
      case 'oritestgtdb':
        return <DeviceTab deviceName="oritestgtdb" />;
      case 'wxt53x':
        return <DeviceTab deviceName="wxt53x" />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Device Manager Configuration</h1>
      </header>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {renderActiveTab()}
      </div>

      <div className="reboot-section">
        <button onClick={handleReboot}>Reboot System</button>
        {rebootMessage && <div>{rebootMessage}</div>}
      </div>
    </div>
  );
}

export default App;

