import React, { useState, useEffect } from 'react';
import { getConfigProperties, saveConfigProperties } from '../api/configApi';
import { validateIPv4 } from '../utils/validation';

const ConfigPropertiesTab: React.FC = () => {
  const [karafrest, setKarafrest] = useState('');
  const [mqttUrl, setMqttUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getConfigProperties();
      setKarafrest(data['fi.observis.sas.karafrest'] || '');
      setMqttUrl(data['fi.observis.sas.mqtt.url'] || '');
    } catch (error: any) {
      setMessage(`Failed to load: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!validateIPv4(karafrest)) {
      newErrors.karafrest = 'Invalid IP address';
    }

    if (!validateIPv4(mqttUrl)) {
      newErrors.mqttUrl = 'Invalid IP address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const result = await saveConfigProperties({
        'fi.observis.sas.karafrest': karafrest,
        'fi.observis.sas.mqtt.url': mqttUrl
      });
      setMessage(result.message || 'Saved');
    } catch (error: any) {
      setMessage(`Save failed: ${error.message}`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const isFormValid = validateIPv4(karafrest) && validateIPv4(mqttUrl);

  return (
    <div>
      <h2>Configuration Properties</h2>
      
      <div>
        <label htmlFor="karafrest">Karaf REST:</label>
        <input
          id="karafrest"
          type="text"
          value={karafrest}
          onChange={(e) => setKarafrest(e.target.value)}
          onBlur={validateForm}
        />
        {errors.karafrest && (
          <div style={{ color: 'red' }}>{errors.karafrest}</div>
        )}
      </div>

      <div>
        <label htmlFor="mqttUrl">MQTT URL:</label>
        <input
          id="mqttUrl"
          type="text"
          value={mqttUrl}
          onChange={(e) => setMqttUrl(e.target.value)}
          onBlur={validateForm}
        />
        {errors.mqttUrl && (
          <div style={{ color: 'red' }}>{errors.mqttUrl}</div>
        )}
      </div>

      <button onClick={handleSave} disabled={!isFormValid}>
        Save
      </button>

      {message && <div>{message}</div>}
    </div>
  );
};

export default ConfigPropertiesTab;

