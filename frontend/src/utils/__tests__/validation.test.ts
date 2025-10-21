import { describe, it, expect } from 'vitest';
import {
  validateDeviceManagerKey,
  validateDeviceManagerName,
  validateIPv4,
  validatePortNumber,
  validateSerialPort,
  validateBaudRate,
  validateSerialPortType,
  validateDeviceName,
  validateParity,
  validateDataBits,
  validateStopBits,
  isMQTTTopicValid
} from '../validation';

/**
 * Tests for validation utility functions
 * Priority: High
 * Covers TDD Plan sections 2.2 (Frontend validation test cases)
 */
describe('Validation Utils', () => {
  
  // ===== Test: MQTT Topic validation (deviceManagerKey) =====
  
  describe('validateDeviceManagerKey', () => {
    it('should accept valid MQTT topic characters', () => {
      expect(validateDeviceManagerKey('valid_key')).toBe(true);
      expect(validateDeviceManagerKey('device-sensor')).toBe(true);
      expect(validateDeviceManagerKey('key_123')).toBe(true);
      expect(validateDeviceManagerKey('a')).toBe(true);
      expect(validateDeviceManagerKey('key with spaces')).toBe(true); // spaces now allowed
    });

    it('should reject / (forward slash)', () => {
      expect(validateDeviceManagerKey('invalid/key')).toBe(false);
      expect(validateDeviceManagerKey('key/with/slashes')).toBe(false);
    });

    it('should reject # and + characters', () => {
      expect(validateDeviceManagerKey('key#invalid')).toBe(false);
      expect(validateDeviceManagerKey('key+invalid')).toBe(false);
      expect(validateDeviceManagerKey('key#+')).toBe(false);
    });

    it('should reject strings longer than 20 characters', () => {
      expect(validateDeviceManagerKey('a'.repeat(20))).toBe(true);
      expect(validateDeviceManagerKey('a'.repeat(21))).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(validateDeviceManagerKey('')).toBe(false);
    });

    it('should reject slashes (no hierarchy allowed)', () => {
      expect(validateDeviceManagerKey('sensor/temp/1')).toBe(false);
      expect(validateDeviceManagerKey('device/status')).toBe(false);
    });
  });

  describe('isMQTTTopicValid', () => {
    it('should validate MQTT topic format correctly', () => {
      expect(isMQTTTopicValid('valid_topic')).toBe(true);
      expect(isMQTTTopicValid('valid topic with spaces')).toBe(true); // spaces allowed
      expect(isMQTTTopicValid('topic/subtopic')).toBe(false); // slashes not allowed
      expect(isMQTTTopicValid('invalid#topic')).toBe(false);
      expect(isMQTTTopicValid('invalid+topic')).toBe(false);
    });
  });

  // ===== Test: deviceManagerName validation =====
  
  describe('validateDeviceManagerName', () => {
    it('should accept valid names with spaces', () => {
      expect(validateDeviceManagerName('Valid Name')).toBe(true);
      expect(validateDeviceManagerName('Device Manager 123')).toBe(true);
    });

    it('should accept names up to 50 characters', () => {
      expect(validateDeviceManagerName('a'.repeat(50))).toBe(true);
      expect(validateDeviceManagerName('a'.repeat(51))).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(validateDeviceManagerName('')).toBe(false);
    });
  });

  // ===== Test: IPv4 validation =====
  
  describe('validateIPv4', () => {
    it('should accept valid IPv4 addresses', () => {
      expect(validateIPv4('192.168.1.1')).toBe(true);
      expect(validateIPv4('10.0.0.1')).toBe(true);
      expect(validateIPv4('172.16.0.1')).toBe(true);
      expect(validateIPv4('255.255.255.255')).toBe(true);
      expect(validateIPv4('0.0.0.0')).toBe(true);
    });

    it('should reject invalid IPv4 addresses', () => {
      expect(validateIPv4('256.1.1.1')).toBe(false);
      expect(validateIPv4('192.168.1')).toBe(false);
      expect(validateIPv4('192.168.1.1.1')).toBe(false);
      expect(validateIPv4('abc.def.ghi.jkl')).toBe(false);
      expect(validateIPv4('192.168.-1.1')).toBe(false);
      expect(validateIPv4('')).toBe(false);
      expect(validateIPv4('192.168.1.300')).toBe(false);
    });

    it('should reject incomplete IP addresses', () => {
      expect(validateIPv4('192.168')).toBe(false);
      expect(validateIPv4('192')).toBe(false);
    });
  });

  // ===== Test: Port number validation =====
  
  describe('validatePortNumber', () => {
    it('should accept valid port numbers', () => {
      expect(validatePortNumber(1)).toBe(true);
      expect(validatePortNumber(80)).toBe(true);
      expect(validatePortNumber(443)).toBe(true);
      expect(validatePortNumber(8080)).toBe(true);
      expect(validatePortNumber(65535)).toBe(true);
    });

    it('should reject invalid port numbers', () => {
      expect(validatePortNumber(0)).toBe(false);
      expect(validatePortNumber(-1)).toBe(false);
      expect(validatePortNumber(65536)).toBe(false);
      expect(validatePortNumber(70000)).toBe(false);
    });
  });

  // ===== Test: Serial port validation =====
  
  describe('validateSerialPort', () => {
    it('should accept ttyS0 and ttyS1', () => {
      expect(validateSerialPort('ttyS0')).toBe(true);
      expect(validateSerialPort('ttyS1')).toBe(true);
    });

    it('should reject other serial ports', () => {
      expect(validateSerialPort('ttyS2')).toBe(false);
      expect(validateSerialPort('ttyUSB0')).toBe(false);
      expect(validateSerialPort('COM1')).toBe(false);
      expect(validateSerialPort('')).toBe(false);
    });
  });

  // ===== Test: Baud rate validation =====
  
  describe('validateBaudRate', () => {
    it('should accept standard baud rates', () => {
      expect(validateBaudRate('9600')).toBe(true);
      expect(validateBaudRate('19200')).toBe(true);
      expect(validateBaudRate('38400')).toBe(true);
      expect(validateBaudRate('57600')).toBe(true);
      expect(validateBaudRate('115200')).toBe(true);
    });

    it('should reject invalid baud rates', () => {
      expect(validateBaudRate('4800')).toBe(false);
      expect(validateBaudRate('230400')).toBe(false);
      expect(validateBaudRate('invalid')).toBe(false);
      expect(validateBaudRate('')).toBe(false);
    });
  });

  // ===== Test: Serial port type validation =====
  
  describe('validateSerialPortType', () => {
    it('should accept RS232 and RS485', () => {
      expect(validateSerialPortType('RS232')).toBe(true);
      expect(validateSerialPortType('RS485')).toBe(true);
    });

    it('should reject other types', () => {
      expect(validateSerialPortType('RS422')).toBe(false);
      expect(validateSerialPortType('USB')).toBe(false);
      expect(validateSerialPortType('')).toBe(false);
    });
  });

  // ===== Test: Device name validation =====
  
  describe('validateDeviceName', () => {
    it('should accept names up to 50 characters', () => {
      expect(validateDeviceName('Device Name')).toBe(true);
      expect(validateDeviceName('Name with 123 numbers')).toBe(true);
      expect(validateDeviceName('a'.repeat(50))).toBe(true);
    });

    it('should reject names longer than 50 characters', () => {
      expect(validateDeviceName('a'.repeat(51))).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(validateDeviceName('')).toBe(false);
    });
  });

  // ===== Test: Parity validation =====
  
  describe('validateParity', () => {
    it('should accept None, Even, Odd', () => {
      expect(validateParity('None')).toBe(true);
      expect(validateParity('Even')).toBe(true);
      expect(validateParity('Odd')).toBe(true);
    });

    it('should reject invalid parity values', () => {
      expect(validateParity('Mark')).toBe(false);
      expect(validateParity('Space')).toBe(false);
      expect(validateParity('')).toBe(false);
    });
  });

  // ===== Test: Data bits validation =====
  
  describe('validateDataBits', () => {
    it('should accept 7 and 8', () => {
      expect(validateDataBits('7')).toBe(true);
      expect(validateDataBits('8')).toBe(true);
    });

    it('should reject invalid data bits', () => {
      expect(validateDataBits('5')).toBe(false);
      expect(validateDataBits('6')).toBe(false);
      expect(validateDataBits('9')).toBe(false);
      expect(validateDataBits('')).toBe(false);
    });
  });

  // ===== Test: Stop bits validation =====
  
  describe('validateStopBits', () => {
    it('should accept 1 and 2', () => {
      expect(validateStopBits('1')).toBe(true);
      expect(validateStopBits('2')).toBe(true);
    });

    it('should reject invalid stop bits', () => {
      expect(validateStopBits('0')).toBe(false);
      expect(validateStopBits('3')).toBe(false);
      expect(validateStopBits('1.5')).toBe(false);
      expect(validateStopBits('')).toBe(false);
    });
  });
});

