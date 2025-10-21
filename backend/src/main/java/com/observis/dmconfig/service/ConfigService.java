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
     * Handles both simple format (mqtt.broker, mqtt.port) and full format (fi.observis.sas.mqtt.url)
     */
    public void saveConfigProperties(Map<String, String> configMap) throws IOException {
        // Read existing properties to preserve all fields
        Properties properties = fileService.readPropertiesFile(configPropertiesPath);
        
        // Check if we're receiving simplified format (from frontend)
        if (configMap.containsKey("mqtt.broker") && configMap.containsKey("mqtt.port")) {
            String broker = configMap.get("mqtt.broker");
            String port = configMap.get("mqtt.port");
            String username = configMap.get("mqtt.username");
            String password = configMap.get("mqtt.password");
            
            // Validate
            if (!validationService.validateIPv4(broker)) {
                throw new IllegalArgumentException("Invalid MQTT broker IP address");
            }
            if (!validationService.validatePortNumber(Integer.parseInt(port))) {
                throw new IllegalArgumentException("Invalid MQTT port number");
            }
            
            // Update fi.observis.sas.mqtt.url with new IP and port
            String mqttUrl = String.format("tcp://%s:%s", broker, port);
            properties.setProperty("fi.observis.sas.mqtt.url", mqttUrl);
            
            // Update username and password if provided
            if (username != null && !username.isEmpty()) {
                properties.setProperty("fi.observis.sas.mqtt.username", username);
            }
            if (password != null && !password.isEmpty()) {
                properties.setProperty("fi.observis.sas.mqtt.password", password);
            }
        } else {
            // Direct property update
            properties.putAll(configMap);
        }
        
        fileService.writePropertiesFile(configPropertiesPath, properties);
    }
    
    /**
     * Extract MQTT broker IP from fi.observis.sas.mqtt.url
     */
    private String extractMqttBroker(String mqttUrl) {
        if (mqttUrl == null) return "";
        // Format: tcp://192.168.26.5:1883
        try {
            String[] parts = mqttUrl.replace("tcp://", "").split(":");
            return parts.length > 0 ? parts[0] : "";
        } catch (Exception e) {
            return "";
        }
    }
    
    /**
     * Extract MQTT port from fi.observis.sas.mqtt.url
     */
    private String extractMqttPort(String mqttUrl) {
        if (mqttUrl == null) return "1883";
        // Format: tcp://192.168.26.5:1883
        try {
            String[] parts = mqttUrl.replace("tcp://", "").split(":");
            return parts.length > 1 ? parts[1] : "1883";
        } catch (Exception e) {
            return "1883";
        }
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

