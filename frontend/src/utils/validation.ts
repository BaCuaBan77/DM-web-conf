/**
 * Validation utility functions
 * Mirrors backend validation logic
 */

const DEVICE_MANAGER_KEY_MAX_LENGTH = 20;
const DEVICE_MANAGER_NAME_MAX_LENGTH = 50;
const DEVICE_NAME_MAX_LENGTH = 50;

const IPV4_REGEX = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
// MQTT topic: allows any characters except /, #, and +
const MQTT_TOPIC_REGEX = /^[^\/#+]+$/;

const VALID_SERIAL_PORTS = ['ttyS0', 'ttyS1'];
const VALID_BAUD_RATES = ['9600', '19200', '38400', '57600', '115200'];
const VALID_SERIAL_PORT_TYPES = ['RS232', 'RS485'];
const VALID_PARITY_VALUES = ['None', 'Even', 'Odd'];
const VALID_DATA_BITS = ['7', '8'];
const VALID_STOP_BITS = ['1', '2'];

/**
 * Validate deviceManagerKey: max 20 chars, valid MQTT topic characters only
 */
export function validateDeviceManagerKey(key: string | null | undefined): boolean {
  if (!key || key.length === 0) {
    return false;
  }
  if (key.length > DEVICE_MANAGER_KEY_MAX_LENGTH) {
    return false;
  }
  return MQTT_TOPIC_REGEX.test(key);
}

/**
 * Check if string is a valid MQTT topic
 */
export function isMQTTTopicValid(topic: string | null | undefined): boolean {
  if (!topic) {
    return false;
  }
  return MQTT_TOPIC_REGEX.test(topic);
}

/**
 * Validate deviceManagerName: max 50 chars, spaces allowed
 */
export function validateDeviceManagerName(name: string | null | undefined): boolean {
  if (!name || name.length === 0) {
    return false;
  }
  return name.length <= DEVICE_MANAGER_NAME_MAX_LENGTH;
}

/**
 * Validate IPv4 address format
 */
export function validateIPv4(ip: string | null | undefined): boolean {
  if (!ip || ip.length === 0) {
    return false;
  }
  return IPV4_REGEX.test(ip);
}

/**
 * Validate port number: 1-65535
 */
export function validatePortNumber(port: number): boolean {
  return port >= 1 && port <= 65535;
}

/**
 * Validate serial port: only ttyS0 or ttyS1
 */
export function validateSerialPort(port: string | null | undefined): boolean {
  return port !== null && port !== undefined && VALID_SERIAL_PORTS.includes(port);
}

/**
 * Validate baud rate: only standard rates
 */
export function validateBaudRate(rate: string | null | undefined): boolean {
  return rate !== null && rate !== undefined && VALID_BAUD_RATES.includes(rate);
}

/**
 * Validate serial port type: only RS232 or RS485
 */
export function validateSerialPortType(type: string | null | undefined): boolean {
  return type !== null && type !== undefined && VALID_SERIAL_PORT_TYPES.includes(type);
}

/**
 * Validate device name: max 50 chars, spaces allowed
 */
export function validateDeviceName(name: string | null | undefined): boolean {
  if (!name || name.length === 0) {
    return false;
  }
  return name.length <= DEVICE_NAME_MAX_LENGTH;
}

/**
 * Validate parity: None, Even, or Odd
 */
export function validateParity(parity: string | null | undefined): boolean {
  return parity !== null && parity !== undefined && VALID_PARITY_VALUES.includes(parity);
}

/**
 * Validate data bits: 7 or 8
 */
export function validateDataBits(bits: string | null | undefined): boolean {
  return bits !== null && bits !== undefined && VALID_DATA_BITS.includes(bits);
}

/**
 * Validate stop bits: 1 or 2
 */
export function validateStopBits(stopBits: string | null | undefined): boolean {
  return stopBits !== null && stopBits !== undefined && VALID_STOP_BITS.includes(stopBits);
}

