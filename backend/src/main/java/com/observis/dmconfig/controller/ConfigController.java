package com.observis.dmconfig.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.observis.dmconfig.service.ConfigService;
import com.observis.dmconfig.service.RebootService;
import com.observis.dmconfig.service.NetworkConfigService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

/**
 * REST controller for configuration management
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ConfigController {

    private static final Logger logger = LoggerFactory.getLogger(ConfigController.class);

    @Autowired
    private ConfigService configService;

    @Autowired
    private RebootService rebootService;

    @Autowired
    private NetworkConfigService networkConfigService;

    /**
     * GET /api/devices - Get devices.json configuration
     */
    @GetMapping("/devices")
    public ResponseEntity<?> getDevices() {
        try {
            JsonNode config = configService.getDevicesConfig();
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            logger.error("Error reading devices config", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    /**
     * GET /api/config/properties - Get config.properties
     * Returns simplified format: mqtt.broker, mqtt.port, mqtt.username, mqtt.password
     */
    @GetMapping("/config/properties")
    public ResponseEntity<?> getConfigProperties() {
        try {
            Properties properties = configService.getConfigProperties();
            
            // Extract MQTT settings from fi.observis.sas.mqtt.url format
            String mqttUrl = properties.getProperty("fi.observis.sas.mqtt.url", "tcp://192.168.1.100:1883");
            String username = properties.getProperty("fi.observis.sas.mqtt.username", "");
            String password = properties.getProperty("fi.observis.sas.mqtt.password", "");
            
            // Parse URL to extract broker and port
            // Format: tcp://192.168.26.5:1883
            String broker = "";
            String port = "1883";
            
            if (mqttUrl != null && mqttUrl.startsWith("tcp://")) {
                String address = mqttUrl.replace("tcp://", "");
                String[] parts = address.split(":");
                if (parts.length > 0) {
                    broker = parts[0];
                }
                if (parts.length > 1) {
                    port = parts[1];
                }
            }
            
            // Return simplified format for frontend
            Map<String, String> response = new HashMap<>();
            response.put("mqtt.broker", broker);
            response.put("mqtt.port", port);
            response.put("mqtt.username", username);
            response.put("mqtt.password", password);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error reading config properties", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    /**
     * GET /api/device/{deviceName} - Get device-specific configuration
     */
    @GetMapping("/device/{deviceName}")
    public ResponseEntity<?> getDeviceConfig(@PathVariable String deviceName) {
        try {
            JsonNode config = configService.getDeviceConfig(deviceName);
            return ResponseEntity.ok(config);
        } catch (IllegalArgumentException e) {
            logger.error("Device not found: {}", deviceName, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("Device not found: " + deviceName));
        } catch (Exception e) {
            logger.error("Error reading device config", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    /**
     * POST /api/save - Save configuration
     */
    @PostMapping("/save")
    public ResponseEntity<?> saveConfig(@RequestBody Map<String, Object> request) {
        try {
            String configType = (String) request.get("configType");
            Object data = request.get("data");

            if (configType == null || data == null) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Missing configType or data"));
            }

            switch (configType) {
                case "devices":
                    JsonNode devicesData = convertToJsonNode(data);
                    configService.saveDevicesConfig(devicesData);
                    break;
                case "properties":
                    @SuppressWarnings("unchecked")
                    Map<String, String> propertiesData = (Map<String, String>) data;
                    configService.saveConfigProperties(propertiesData);
                    break;
                default:
                    return ResponseEntity.badRequest()
                            .body(createErrorResponse("Unknown configType: " + configType));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Configuration saved successfully");
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.error("Validation error", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            logger.error("Error saving config", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    /**
     * POST /api/device/{deviceName} - Save device-specific configuration
     */
    @PostMapping("/device/{deviceName}")
    public ResponseEntity<?> saveDeviceConfig(
            @PathVariable String deviceName,
            @RequestBody JsonNode config) {
        try {
            configService.saveDeviceConfig(deviceName, config);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Device configuration saved successfully");
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.error("Validation error", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            logger.error("Error saving device config", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    /**
     * POST /api/reboot - Execute reboot script
     */
    @PostMapping("/reboot")
    public ResponseEntity<?> reboot() {
        try {
            rebootService.executeReboot();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Reboot initiated");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error executing reboot", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Helper method to create error response
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", message);
        return response;
    }

    /**
     * GET /api/network - Get network configuration
     */
    @GetMapping("/network")
    public ResponseEntity<?> getNetworkConfig() {
        try {
            Map<String, String> config = networkConfigService.getNetworkConfig();
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            logger.error("Error reading network config", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    /**
     * POST /api/network - Save network configuration and reboot
     */
    @PostMapping("/network")
    public ResponseEntity<?> saveNetworkConfig(@RequestBody Map<String, String> config) {
        try {
            networkConfigService.saveNetworkConfig(config);
            
            // Trigger reboot after saving network config
            rebootService.executeReboot();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Network configuration saved successfully. System rebooting...");
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.error("Validation error", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            logger.error("Error saving network config", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    /**
     * Helper method to convert Object to JsonNode
     */
    private JsonNode convertToJsonNode(Object data) throws Exception {
        if (data instanceof JsonNode) {
            return (JsonNode) data;
        }
        // Convert Map to JsonNode
        return new com.fasterxml.jackson.databind.ObjectMapper().valueToTree(data);
    }
}

