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
     * Extracts nested configuration and returns simplified format for UI
     */
    public JsonNode getDeviceConfig(String deviceName) throws IOException {
        String devicePath = devicesDir + deviceName + ".json";
        JsonNode fullConfig = fileService.readJsonFile(devicePath);
        
        // Extract nested configuration for UI
        return extractSimplifiedConfig(deviceName, fullConfig);
    }
    
    /**
     * Extract simplified configuration from nested structure
     */
    private JsonNode extractSimplifiedConfig(String deviceName, JsonNode fullConfig) {
        ObjectNode simplified = objectMapper.createObjectNode();
        
        // Check for serialDeviceConfiguration (IBAC, WXT53X)
        if (fullConfig.has("serialDeviceConfiguration")) {
            JsonNode config = fullConfig.get("serialDeviceConfiguration");
            simplified.put("address", config.path("address").asText(""));
            simplified.put("speed", config.path("speed").asText(""));
            simplified.put("bits", config.path("bits").asText(""));
            simplified.put("stopBits", config.path("stopBits").asText(""));
            simplified.put("parity", config.path("parity").asText(""));
            simplified.put("serialPortType", config.path("serialPortType").asText(""));
            simplified.put("name", config.path("name").asText(""));
            simplified.put("enabled", config.path("enabled").asBoolean(true));
        }
        // Check for networkDeviceConfiguration (S900, Oritest)
        else if (fullConfig.has("networkDeviceConfiguration")) {
            JsonNode config = fullConfig.get("networkDeviceConfiguration");
            simplified.put("address", config.path("address").asText(""));
            simplified.put("portNumber", config.path("portNumber").asText(""));
            simplified.put("name", config.path("name").asText(""));
            simplified.put("enabled", config.path("enabled").asBoolean(true));
        }
        // Fallback: return as-is for simple format
        else {
            return fullConfig;
        }
        
        return simplified;
    }

    /**
     * Save device-specific configuration
     * Merges simplified UI format back into nested structure
     */
    public void saveDeviceConfig(String deviceName, JsonNode config) throws IOException {
        // Validate the simplified config
        validateDeviceConfig(deviceName, config);

        String devicePath = devicesDir + deviceName + ".json";
        
        // Read existing full configuration
        JsonNode existingConfig = fileService.readJsonFile(devicePath);
        
        // Merge simplified config into nested structure
        JsonNode mergedConfig = mergeIntoNestedConfig(deviceName, existingConfig, config);
        
        // Write merged configuration back
        fileService.writeJsonFile(devicePath, mergedConfig);
    }
    
    /**
     * Merge simplified UI config into nested structure, preserving other fields
     */
    private JsonNode mergeIntoNestedConfig(String deviceName, JsonNode existing, JsonNode simplified) {
        ObjectNode result = (ObjectNode) existing.deepCopy();
        
        // Check for serialDeviceConfiguration (IBAC, WXT53X)
        if (result.has("serialDeviceConfiguration")) {
            ObjectNode config = (ObjectNode) result.get("serialDeviceConfiguration");
            if (simplified.has("address")) config.put("address", simplified.get("address").asText());
            if (simplified.has("speed")) {
                // Convert string to number
                String speedStr = simplified.get("speed").asText();
                try {
                    config.put("speed", Integer.parseInt(speedStr));
                } catch (NumberFormatException e) {
                    config.put("speed", speedStr);
                }
            }
            if (simplified.has("bits")) {
                String bitsStr = simplified.get("bits").asText();
                try {
                    config.put("bits", Integer.parseInt(bitsStr));
                } catch (NumberFormatException e) {
                    config.put("bits", bitsStr);
                }
            }
            if (simplified.has("stopBits")) {
                String stopBitsStr = simplified.get("stopBits").asText();
                try {
                    config.put("stopBits", Integer.parseInt(stopBitsStr));
                } catch (NumberFormatException e) {
                    config.put("stopBits", stopBitsStr);
                }
            }
            if (simplified.has("parity")) config.put("parity", simplified.get("parity").asText());
            if (simplified.has("serialPortType")) config.put("serialPortType", simplified.get("serialPortType").asText());
            if (simplified.has("name")) config.put("name", simplified.get("name").asText());
            if (simplified.has("enabled")) config.put("enabled", simplified.get("enabled").asBoolean());
        }
        // Check for networkDeviceConfiguration (S900, Oritest)
        else if (result.has("networkDeviceConfiguration")) {
            ObjectNode config = (ObjectNode) result.get("networkDeviceConfiguration");
            if (simplified.has("address")) config.put("address", simplified.get("address").asText());
            if (simplified.has("portNumber")) config.put("portNumber", simplified.get("portNumber").asText());
            if (simplified.has("name")) config.put("name", simplified.get("name").asText());
            if (simplified.has("enabled")) config.put("enabled", simplified.get("enabled").asBoolean());
        }
        // Fallback: return simplified config as-is
        else {
            return simplified;
        }
        
        return result;
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

