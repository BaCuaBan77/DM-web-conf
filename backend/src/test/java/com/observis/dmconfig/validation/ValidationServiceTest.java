package com.observis.dmconfig.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for ValidationService - Input validation for all configuration properties
 * Priority: High
 * Covers TDD Plan sections 1.2 (Validation test cases)
 */
@SpringBootTest
class ValidationServiceTest {

    @Autowired
    private ValidationService validationService;

    // ===== Test: deviceManagerKey validation =====
    
    @Test
    void testValidateDeviceManagerKey_ValidInput_ReturnsTrue() {
        assertTrue(validationService.validateDeviceManagerKey("valid_key"));
        assertTrue(validationService.validateDeviceManagerKey("key_123"));
        assertTrue(validationService.validateDeviceManagerKey("device-sensor"));
        assertTrue(validationService.validateDeviceManagerKey("a"));
        assertTrue(validationService.validateDeviceManagerKey("12345678901234567890")); // exactly 20 chars
        assertTrue(validationService.validateDeviceManagerKey("key with spaces")); // spaces now allowed
    }

    @ParameterizedTest
    @ValueSource(strings = {"has/slash", "has#hash", "has+plus", "key/with/slashes"})
    void testValidateDeviceManagerKey_InvalidCharacters_ReturnsFalse(String input) {
        assertFalse(validationService.validateDeviceManagerKey(input));
    }

    @Test
    void testValidateDeviceManagerKey_TooLong_ReturnsFalse() {
        String tooLong = "a".repeat(21); // 21 characters
        assertFalse(validationService.validateDeviceManagerKey(tooLong));
    }

    @Test
    void testValidateDeviceManagerKey_Empty_ReturnsFalse() {
        assertFalse(validationService.validateDeviceManagerKey(""));
        assertFalse(validationService.validateDeviceManagerKey(null));
    }

    @Test
    void testValidateDeviceManagerKey_ValidMQTTTopicCharacters() {
        // Updated MQTT validation: No /, #, + allowed
        // Spaces, underscores, dashes, alphanumeric all allowed
        assertTrue(validationService.validateDeviceManagerKey("sensor_temperature_1"));
        assertTrue(validationService.validateDeviceManagerKey("device_manager_001"));
        assertTrue(validationService.validateDeviceManagerKey("device-sensor"));
        assertTrue(validationService.validateDeviceManagerKey("My Device Key")); // spaces allowed
    }

    // ===== Test: deviceManagerName validation =====
    
    @Test
    void testValidateDeviceManagerName_ValidInput_ReturnsTrue() {
        assertTrue(validationService.validateDeviceManagerName("Valid Name"));
        assertTrue(validationService.validateDeviceManagerName("Name with spaces"));
        assertTrue(validationService.validateDeviceManagerName("a".repeat(50))); // exactly 50 chars
    }

    @Test
    void testValidateDeviceManagerName_TooLong_ReturnsFalse() {
        String tooLong = "a".repeat(51); // 51 characters
        assertFalse(validationService.validateDeviceManagerName(tooLong));
    }

    @Test
    void testValidateDeviceManagerName_Empty_ReturnsFalse() {
        assertFalse(validationService.validateDeviceManagerName(""));
        assertFalse(validationService.validateDeviceManagerName(null));
    }

    // ===== Test: IPv4 validation =====
    
    @ParameterizedTest
    @ValueSource(strings = {
        "192.168.1.1",
        "10.0.0.1",
        "172.16.0.1",
        "255.255.255.255",
        "0.0.0.0"
    })
    void testValidateIPv4_ValidFormats_ReturnsTrue(String ip) {
        assertTrue(validationService.validateIPv4(ip));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "256.1.1.1",        // out of range
        "192.168.1",        // incomplete
        "192.168.1.1.1",    // too many octets
        "abc.def.ghi.jkl",  // non-numeric
        "192.168.-1.1",     // negative
        "",                 // empty
        "192.168.1.300"     // out of range
    })
    void testValidateIPv4_InvalidFormats_ReturnsFalse(String ip) {
        assertFalse(validationService.validateIPv4(ip));
    }

    @Test
    void testValidateIPv4_Null_ReturnsFalse() {
        assertFalse(validationService.validateIPv4(null));
    }

    // ===== Test: Port number validation =====
    
    @ParameterizedTest
    @ValueSource(ints = {1, 80, 443, 8080, 65535})
    void testValidatePortNumber_ValidRange_ReturnsTrue(int port) {
        assertTrue(validationService.validatePortNumber(port));
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, 65536, 70000, -100})
    void testValidatePortNumber_OutOfRange_ReturnsFalse(int port) {
        assertFalse(validationService.validatePortNumber(port));
    }

    // ===== Test: Serial port validation =====
    
    @ParameterizedTest
    @ValueSource(strings = {"ttyS0", "ttyS1"})
    void testValidateSerialPort_ValidOptions_ReturnsTrue(String port) {
        assertTrue(validationService.validateSerialPort(port));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ttyS2", "ttyUSB0", "COM1", "", "invalid"})
    void testValidateSerialPort_InvalidOptions_ReturnsFalse(String port) {
        assertFalse(validationService.validateSerialPort(port));
    }

    // ===== Test: Baud rate validation =====
    
    @ParameterizedTest
    @ValueSource(strings = {"9600", "19200", "38400", "57600", "115200"})
    void testValidateBaudRate_ValidOptions_ReturnsTrue(String rate) {
        assertTrue(validationService.validateBaudRate(rate));
    }

    @ParameterizedTest
    @ValueSource(strings = {"4800", "230400", "invalid", ""})
    void testValidateBaudRate_InvalidOptions_ReturnsFalse(String rate) {
        assertFalse(validationService.validateBaudRate(rate));
    }

    // ===== Test: Serial port type validation =====
    
    @ParameterizedTest
    @ValueSource(strings = {"RS232", "RS485"})
    void testValidateSerialPortType_ValidOptions_ReturnsTrue(String type) {
        assertTrue(validationService.validateSerialPortType(type));
    }

    @ParameterizedTest
    @ValueSource(strings = {"RS422", "USB", "invalid", ""})
    void testValidateSerialPortType_InvalidOptions_ReturnsFalse(String type) {
        assertFalse(validationService.validateSerialPortType(type));
    }

    // ===== Test: Generic name validation (max 50 chars) =====
    
    @Test
    void testValidateDeviceName_ValidInput_ReturnsTrue() {
        assertTrue(validationService.validateDeviceName("Device Name"));
        assertTrue(validationService.validateDeviceName("Name with 123 numbers"));
        assertTrue(validationService.validateDeviceName("a".repeat(50))); // exactly 50
    }

    @Test
    void testValidateDeviceName_TooLong_ReturnsFalse() {
        String tooLong = "a".repeat(51);
        assertFalse(validationService.validateDeviceName(tooLong));
    }

    @Test
    void testValidateDeviceName_Empty_ReturnsFalse() {
        assertFalse(validationService.validateDeviceName(""));
        assertFalse(validationService.validateDeviceName(null));
    }

    // ===== Test: Parity validation =====
    
    @ParameterizedTest
    @ValueSource(strings = {"None", "Even", "Odd"})
    void testValidateParity_ValidOptions_ReturnsTrue(String parity) {
        assertTrue(validationService.validateParity(parity));
    }

    @ParameterizedTest
    @ValueSource(strings = {"Mark", "Space", "invalid", ""})
    void testValidateParity_InvalidOptions_ReturnsFalse(String parity) {
        assertFalse(validationService.validateParity(parity));
    }

    // ===== Test: Data bits validation =====
    
    @ParameterizedTest
    @ValueSource(strings = {"7", "8"})
    void testValidateDataBits_ValidOptions_ReturnsTrue(String bits) {
        assertTrue(validationService.validateDataBits(bits));
    }

    @ParameterizedTest
    @ValueSource(strings = {"5", "6", "9", "invalid", ""})
    void testValidateDataBits_InvalidOptions_ReturnsFalse(String bits) {
        assertFalse(validationService.validateDataBits(bits));
    }

    // ===== Test: Stop bits validation =====
    
    @ParameterizedTest
    @ValueSource(strings = {"1", "2"})
    void testValidateStopBits_ValidOptions_ReturnsTrue(String stopBits) {
        assertTrue(validationService.validateStopBits(stopBits));
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "3", "1.5", "invalid", ""})
    void testValidateStopBits_InvalidOptions_ReturnsFalse(String stopBits) {
        assertFalse(validationService.validateStopBits(stopBits));
    }
}

