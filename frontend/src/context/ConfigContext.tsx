import { createContext, useContext, useState, ReactNode } from 'react';

// Types for all configuration data
interface NetworkConfig {
  interface: string;
  method: string;
  address: string;
  netmask: string;
  gateway: string;
}

interface DevicesConfig {
  name: string;
  key: string;
}

interface ConfigProperties {
  broker: string;
  port: string;
  username: string;
  password: string;
}

interface DeviceConfig {
  [key: string]: any; // Generic device configuration
}

interface ConfigState {
  devices: DevicesConfig | null;
  network: NetworkConfig | null;
  config: ConfigProperties | null;
  ibac: DeviceConfig | null;
  s900: DeviceConfig | null;
  ori: DeviceConfig | null;
  wxt: DeviceConfig | null;
}

interface ChangeState {
  [key: string]: boolean;
  devices: boolean;
  network: boolean;
  config: boolean;
  ibac: boolean;
  s900: boolean;
  ori: boolean;
  wxt: boolean;
}

interface ValidationState {
  [key: string]: boolean;
  devices: boolean;
  network: boolean;
  config: boolean;
  ibac: boolean;
  s900: boolean;
  ori: boolean;
  wxt: boolean;
}

interface ConfigContextType {
  // State
  configData: ConfigState;
  hasChanges: ChangeState;
  isValid: ValidationState;
  
  // Actions
  setConfigData: (tabKey: keyof ConfigState, data: any) => void;
  setHasChanges: (tabKey: keyof ChangeState, changed: boolean) => void;
  setIsValid: (tabKey: keyof ValidationState, valid: boolean) => void;
  resetChanges: (tabKeys: string[]) => void;
  clearConfigData: (tabKey: keyof ConfigState) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [configData, setConfigDataState] = useState<ConfigState>({
    devices: null,
    network: null,
    config: null,
    ibac: null,
    s900: null,
    ori: null,
    wxt: null,
  });

  const [hasChanges, setHasChangesState] = useState<ChangeState>({
    devices: false,
    network: false,
    config: false,
    ibac: false,
    s900: false,
    ori: false,
    wxt: false,
  });

  const [isValid, setIsValidState] = useState<ValidationState>({
    devices: true,
    network: true,
    config: true,
    ibac: true,
    s900: true,
    ori: true,
    wxt: true,
  });

  const setConfigData = (tabKey: keyof ConfigState, data: any) => {
    setConfigDataState(prev => ({
      ...prev,
      [tabKey]: data,
    }));
  };

  const setHasChanges = (tabKey: keyof ChangeState, changed: boolean) => {
    setHasChangesState(prev => ({
      ...prev,
      [tabKey]: changed,
    }));
  };

  const setIsValid = (tabKey: keyof ValidationState, valid: boolean) => {
    setIsValidState(prev => ({
      ...prev,
      [tabKey]: valid,
    }));
  };

  const resetChanges = (tabKeys: string[]) => {
    setHasChangesState(prev => {
      const newState = { ...prev };
      tabKeys.forEach(key => {
        newState[key as keyof ChangeState] = false;
      });
      return newState;
    });
  };

  const clearConfigData = (tabKey: keyof ConfigState) => {
    setConfigDataState(prev => ({
      ...prev,
      [tabKey]: null,
    }));
  };

  return (
    <ConfigContext.Provider
      value={{
        configData,
        hasChanges,
        isValid,
        setConfigData,
        setHasChanges,
        setIsValid,
        resetChanges,
        clearConfigData,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

