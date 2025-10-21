/**
 * API client for configuration management
 */

import axios from 'axios';

const API_BASE_URL = '/api';

export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Get devices.json configuration
 */
export async function getDevicesConfig(): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/devices`);
  return response.data;
}

/**
 * Save devices.json configuration
 */
export async function saveDevicesConfig(data: any): Promise<ApiResponse> {
  const response = await axios.post(`${API_BASE_URL}/save`, {
    configType: 'devices',
    data
  });
  return response.data;
}

/**
 * Get config.properties
 */
export async function getConfigProperties(): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/config/properties`);
  return response.data;
}

/**
 * Save config.properties
 */
export async function saveConfigProperties(data: any): Promise<ApiResponse> {
  const response = await axios.post(`${API_BASE_URL}/save`, {
    configType: 'properties',
    data
  });
  return response.data;
}

/**
 * Get device-specific configuration
 */
export async function getDeviceConfig(deviceName: string): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/device/${deviceName}`);
  return response.data;
}

/**
 * Save device-specific configuration
 */
export async function saveDeviceConfig(deviceName: string, data: any): Promise<ApiResponse> {
  const response = await axios.post(`${API_BASE_URL}/device/${deviceName}`, data);
  return response.data;
}

/**
 * Trigger system reboot
 */
export async function reboot(): Promise<ApiResponse> {
  const response = await axios.post(`${API_BASE_URL}/reboot`);
  return response.data;
}

/**
 * Get network configuration
 */
export async function getNetworkConfig(): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/network`);
  return response.data;
}

/**
 * Save network configuration (automatically reboots)
 */
export async function saveNetworkConfig(data: any): Promise<ApiResponse> {
  const response = await axios.post(`${API_BASE_URL}/network`, data);
  return response.data;
}

/**
 * Save configuration data (general purpose - devices or config)
 */
export async function saveData(configType: string, data: any): Promise<ApiResponse> {
  const response = await axios.post(`${API_BASE_URL}/save`, {
    configType,
    data
  });
  return response.data;
}

