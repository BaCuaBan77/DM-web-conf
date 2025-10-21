package com.observis.dmconfig.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.observis.dmconfig.validation.ValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

/**
 * Service for managing configuration files
 */
@Service
public class ConfigService {

    @Autowired
    private FileService fileService;

    @Autowired
    private ValidationService validationService;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${dm.config.devices.path:/opt/dm/devices.json}")
    private String devicesPath;

    @Value("${dm.config.properties.path:/opt/dm/config.properties}")
    private String configPropertiesPath;

    @Value("${dm.config.devices.dir:/opt/dm/devices.d/}")
    private String devicesDir;

    /**
     * Get devices.json configuration
     */
    public JsonNode getDevicesConfig() throws IOException {
        return fileService.readJsonFile(devicesPath);
    }

    /**
     * Save devices.json configuration
     */
    public void saveDevicesConfig(JsonNode config) throws IOException {
        // Validate deviceManagerKey
        String key = config.get("deviceManagerKey").asText();
        if (!validationService.validateDeviceManagerKey(key)) {
            throw new IllegalArgumentException("Invalid deviceManagerKey: must be max 20 chars, valid MQTT topic characters only");
        }

        // Validate deviceManagerName
        String name = config.get("deviceManagerName").asText();
        if (!validationService.validateDeviceManagerName(name)) {
            throw new IllegalArgumentException("Invalid deviceManagerName: must be max 50 chars");
        }

        fileService.writeJsonFile(devicesPath, config);
    }

    /**
     * Get config.properties
     */
    public Properties getConfigProperties() throws IOException {
        return fileService.readPropertiesFile(configPropertiesPath);
    }

    /**
     * Save config.properties
     */
    public void saveConfigProperties(Map<String, String> configMap) throws IOException {
        // Validate IP addresses
        String karafrest = configMap.get("fi.observis.sas.karafrest");
        String mqttUrl = configMap.get("fi.observis.sas.mqtt.url");

        if (karafrest != null && !validationService.validateIPv4(karafrest)) {
            throw new IllegalArgumentException("Invalid IP address for fi.observis.sas.karafrest");
        }

        if (mqttUrl != null && !validationService.validateIPv4(mqttUrl)) {
            throw new IllegalArgumentException("Invalid IP address for fi.observis.sas.mqtt.url");
        }

        Properties properties = new Properties();
        properties.putAll(configMap);
        
        fileService.writePropertiesFile(configPropertiesPath, properties);
    }

    /**
     * Get device-specific configuration
     */
    public JsonNode getDeviceConfig(String deviceName) throws IOException {
        String devicePath = devicesDir + deviceName + ".json";
        return fileService.readJsonFile(devicePath);
    }

    /**
     * Save device-specific configuration
     */
    public void saveDeviceConfig(String deviceName, JsonNode config) throws IOException {
        // Validate based on device type
        validateDeviceConfig(deviceName, config);

        String devicePath = devicesDir + deviceName + ".json";
        fileService.writeJsonFile(devicePath, config);
    }

    /**
     * Validate device-specific configuration
     */
    private void validateDeviceConfig(String deviceName, JsonNode config) {
        // Common validation: name field
        if (config.has("name")) {
            String name = config.get("name").asText();
            if (!validationService.validateDeviceName(name)) {
                throw new IllegalArgumentException("Invalid device name: must be max 50 chars");
            }
        }

        // Device-specific validation
        switch (deviceName.toUpperCase()) {
            case "IBAC":
            case "WXT53X":
                validateSerialDeviceConfig(config);
                break;
            case "S900":
                validateS900Config(config);
                break;
            case "ORITESTGTDB":
                validateOritestgtdbConfig(config);
                break;
            default:
                throw new IllegalArgumentException("Unknown device: " + deviceName);
        }
    }

    /**
     * Validate serial device configuration (IBAC, WXT53X)
     */
    private void validateSerialDeviceConfig(JsonNode config) {
        if (config.has("address")) {
            String address = config.get("address").asText();
            if (!validationService.validateSerialPort(address)) {
                throw new IllegalArgumentException("Invalid serial port address");
            }
        }

        if (config.has("speed")) {
            String speed = config.get("speed").asText();
            if (!validationService.validateBaudRate(speed)) {
                throw new IllegalArgumentException("Invalid baud rate");
            }
        }

        if (config.has("serialPortType")) {
            String type = config.get("serialPortType").asText();
            if (!validationService.validateSerialPortType(type)) {
                throw new IllegalArgumentException("Invalid serial port type");
            }
        }

        if (config.has("parity")) {
            String parity = config.get("parity").asText();
            if (!validationService.validateParity(parity)) {
                throw new IllegalArgumentException("Invalid parity");
            }
        }

        if (config.has("bits")) {
            String bits = config.get("bits").asText();
            if (!validationService.validateDataBits(bits)) {
                throw new IllegalArgumentException("Invalid data bits");
            }
        }

        if (config.has("stopBits")) {
            String stopBits = config.get("stopBits").asText();
            if (!validationService.validateStopBits(stopBits)) {
                throw new IllegalArgumentException("Invalid stop bits");
            }
        }
    }

    /**
     * Validate S900 configuration
     */
    private void validateS900Config(JsonNode config) {
        if (config.has("address")) {
            String address = config.get("address").asText();
            if (!validationService.validateIPv4(address)) {
                throw new IllegalArgumentException("Invalid IP address");
            }
        }

        if (config.has("portNumber")) {
            int port = config.get("portNumber").asInt();
            if (!validationService.validatePortNumber(port)) {
                throw new IllegalArgumentException("Invalid port number: must be 1-65535");
            }
        }
    }

    /**
     * Validate oritestgtdb configuration
     */
    private void validateOritestgtdbConfig(JsonNode config) {
        if (config.has("address")) {
            String address = config.get("address").asText();
            if (!validationService.validateIPv4(address)) {
                throw new IllegalArgumentException("Invalid IP address");
            }
        }
    }
}

