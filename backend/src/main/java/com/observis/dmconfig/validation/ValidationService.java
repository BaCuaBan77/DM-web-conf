package com.observis.dmconfig.validation;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Validation service for all configuration properties
 * Implements validation rules from TDD Plan Section 4
 */
@Service
public class ValidationService {

    private static final int DEVICE_MANAGER_KEY_MAX_LENGTH = 20;
    private static final int DEVICE_MANAGER_NAME_MAX_LENGTH = 50;
    private static final int DEVICE_NAME_MAX_LENGTH = 50;
    
    private static final Pattern IPV4_PATTERN = Pattern.compile(
        "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
    );
    
    // MQTT topic: allows any characters except /, #, and +
    private static final Pattern MQTT_TOPIC_PATTERN = Pattern.compile("^[^\\/#+]+$");
    
    private static final List<String> VALID_SERIAL_PORTS = Arrays.asList("ttyS0", "ttyS1", "/dev/ttyS0", "/dev/ttyS1");
    private static final List<String> VALID_BAUD_RATES = Arrays.asList("9600", "19200", "38400", "57600", "115200");
    private static final List<String> VALID_SERIAL_PORT_TYPES = Arrays.asList("RS232", "RS485");
    private static final List<String> VALID_PARITY_VALUES = Arrays.asList("N", "E", "O");
    private static final List<String> VALID_DATA_BITS = Arrays.asList("7", "8");
    private static final List<String> VALID_STOP_BITS = Arrays.asList("1", "2");

    /**
     * Validate deviceManagerKey: max 20 chars, valid MQTT topic characters only
     * No forward slashes (/), hash (#), or plus (+) allowed
     */
    public boolean validateDeviceManagerKey(String key) {
        if (key == null || key.isEmpty()) {
            return false;
        }
        if (key.length() > DEVICE_MANAGER_KEY_MAX_LENGTH) {
            return false;
        }
        // Check for valid MQTT topic characters (no /, #, +)
        return MQTT_TOPIC_PATTERN.matcher(key).matches();
    }

    /**
     * Validate deviceManagerName: max 50 chars, spaces allowed
     */
    public boolean validateDeviceManagerName(String name) {
        if (name == null || name.isEmpty()) {
            return false;
        }
        return name.length() <= DEVICE_MANAGER_NAME_MAX_LENGTH;
    }

    /**
     * Validate IPv4 address format
     */
    public boolean validateIPv4(String ip) {
        if (ip == null || ip.isEmpty()) {
            return false;
        }
        return IPV4_PATTERN.matcher(ip).matches();
    }

    /**
     * Validate port number: 1-65535
     */
    public boolean validatePortNumber(int port) {
        return port >= 1 && port <= 65535;
    }

    /**
     * Validate serial port: only ttyS0 or ttyS1
     */
    public boolean validateSerialPort(String port) {
        return port != null && VALID_SERIAL_PORTS.contains(port);
    }

    /**
     * Validate baud rate: only standard rates
     */
    public boolean validateBaudRate(String rate) {
        return rate != null && VALID_BAUD_RATES.contains(rate);
    }

    /**
     * Validate serial port type: only RS232 or RS485
     */
    public boolean validateSerialPortType(String type) {
        return type != null && VALID_SERIAL_PORT_TYPES.contains(type);
    }

    /**
     * Validate device name: max 50 chars, spaces allowed
     */
    public boolean validateDeviceName(String name) {
        if (name == null || name.isEmpty()) {
            return false;
        }
        return name.length() <= DEVICE_NAME_MAX_LENGTH;
    }

    /**
     * Validate parity: None, Even, or Odd
     */
    public boolean validateParity(String parity) {
        return parity != null && VALID_PARITY_VALUES.contains(parity);
    }

    /**
     * Validate data bits: 7 or 8
     */
    public boolean validateDataBits(String bits) {
        return bits != null && VALID_DATA_BITS.contains(bits);
    }

    /**
     * Validate stop bits: 1 or 2
     */
    public boolean validateStopBits(String stopBits) {
        return stopBits != null && VALID_STOP_BITS.contains(stopBits);
    }
}

