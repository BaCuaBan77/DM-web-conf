package com.observis.dmconfig.e2e;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

/**
 * End-to-end tests for the complete application workflow
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("End-to-End Workflow Tests")
public class EndToEndWorkflowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("E2E: Complete device manager configuration workflow")
    public void testCompleteDeviceManagerWorkflow() throws Exception {
        // 1. Get current devices configuration
        mockMvc.perform(get("/api/devices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deviceManagerKey").exists())
                .andExpect(jsonPath("$.deviceManagerName").exists());

        // 2. Update devices configuration
        Map<String, Object> saveRequest = new HashMap<>();
        saveRequest.put("configType", "devices");
        
        Map<String, String> deviceData = new HashMap<>();
        deviceData.put("deviceManagerKey", "test-dm-key");
        deviceData.put("deviceManagerName", "Test Device Manager");
        saveRequest.put("data", deviceData);

        mockMvc.perform(post("/api/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(saveRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 3. Verify the update
        mockMvc.perform(get("/api/devices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deviceManagerKey").value("test-dm-key"))
                .andExpect(jsonPath("$.deviceManagerName").value("Test Device Manager"));
    }

    @Test
    @DisplayName("E2E: Complete config properties workflow")
    public void testCompleteConfigPropertiesWorkflow() throws Exception {
        // 1. Get current config properties
        mockMvc.perform(get("/api/config/properties"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.['fi.observis.sas.mqtt.url']").exists());

        // 2. Update config properties
        Map<String, Object> saveRequest = new HashMap<>();
        saveRequest.put("configType", "properties");
        
        Map<String, String> configData = new HashMap<>();
        configData.put("fi.observis.sas.mqtt.url", "192.168.1.100");
        configData.put("system.environment", "test");
        saveRequest.put("data", configData);

        mockMvc.perform(post("/api/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(saveRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 3. Verify the update
        mockMvc.perform(get("/api/config/properties"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.['fi.observis.sas.mqtt.url']").value("192.168.1.100"))
                .andExpect(jsonPath("$.['system.environment']").value("test"));
    }

    @Test
    @DisplayName("E2E: Complete network configuration workflow")
    public void testCompleteNetworkConfigWorkflow() throws Exception {
        // 1. Get current network configuration
        mockMvc.perform(get("/api/network"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.interface").exists())
                .andExpect(jsonPath("$.method").exists());

        // 2. Update network configuration (without actually rebooting)
        Map<String, String> networkConfig = new HashMap<>();
        networkConfig.put("interface", "eth0");
        networkConfig.put("method", "static");
        networkConfig.put("address", "192.168.1.100");
        networkConfig.put("netmask", "255.255.255.0");
        networkConfig.put("gateway", "192.168.1.1");

        mockMvc.perform(post("/api/network")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(networkConfig)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value(containsString("rebooting")));
    }

    @Test
    @DisplayName("E2E: Device-specific configuration workflow (IBAC)")
    public void testIBACDeviceWorkflow() throws Exception {
        // 1. Get current IBAC configuration
        mockMvc.perform(get("/api/device/IBAC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.address").exists())
                .andExpect(jsonPath("$.deviceType").value("IBAC"));

        // 2. Update IBAC configuration
        Map<String, Object> ibacConfig = new HashMap<>();
        ibacConfig.put("address", "ttyS1");
        ibacConfig.put("speed", "19200");
        ibacConfig.put("bits", "8");
        ibacConfig.put("stopBits", "1");
        ibacConfig.put("parity", "None");
        ibacConfig.put("serialPortType", "RS485");
        ibacConfig.put("name", "Updated IBAC Device");
        ibacConfig.put("deviceType", "IBAC");
        ibacConfig.put("enabled", true);

        mockMvc.perform(post("/api/device/IBAC")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(ibacConfig)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 3. Verify the update
        mockMvc.perform(get("/api/device/IBAC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.address").value("ttyS1"))
                .andExpect(jsonPath("$.speed").value("19200"))
                .andExpect(jsonPath("$.name").value("Updated IBAC Device"));
    }

    @Test
    @DisplayName("E2E: Device-specific configuration workflow (S900)")
    public void testS900DeviceWorkflow() throws Exception {
        // 1. Get current S900 configuration
        mockMvc.perform(get("/api/device/S900"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deviceType").value("S900"));

        // 2. Update S900 configuration
        Map<String, Object> s900Config = new HashMap<>();
        s900Config.put("address", "192.168.1.50");
        s900Config.put("portNumber", 8080);
        s900Config.put("name", "Updated S900 Device");
        s900Config.put("deviceType", "S900");
        s900Config.put("enabled", true);

        mockMvc.perform(post("/api/device/S900")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(s900Config)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 3. Verify the update
        mockMvc.perform(get("/api/device/S900"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.address").value("192.168.1.50"))
                .andExpect(jsonPath("$.portNumber").value(8080));
    }

    @Test
    @DisplayName("E2E: Validation prevents invalid configuration")
    public void testValidationInWorkflow() throws Exception {
        // Try to save invalid MQTT topic
        Map<String, Object> saveRequest = new HashMap<>();
        saveRequest.put("configType", "devices");
        
        Map<String, String> deviceData = new HashMap<>();
        deviceData.put("deviceManagerKey", "invalid/topic#key");  // Invalid MQTT topic
        deviceData.put("deviceManagerName", "Test");
        saveRequest.put("data", deviceData);

        mockMvc.perform(post("/api/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(saveRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("E2E: Multiple configuration updates in sequence")
    public void testMultipleUpdatesInSequence() throws Exception {
        // 1. Update devices
        Map<String, Object> devicesRequest = new HashMap<>();
        devicesRequest.put("configType", "devices");
        Map<String, String> deviceData = new HashMap<>();
        deviceData.put("deviceManagerKey", "seq-test-1");
        deviceData.put("deviceManagerName", "Sequential Test 1");
        devicesRequest.put("data", deviceData);

        mockMvc.perform(post("/api/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(devicesRequest)))
                .andExpect(status().isOk());

        // 2. Update config properties
        Map<String, Object> configRequest = new HashMap<>();
        configRequest.put("configType", "properties");
        Map<String, String> configData = new HashMap<>();
        configData.put("fi.observis.sas.mqtt.url", "10.0.0.1");
        configData.put("system.environment", "sequential-test");
        configRequest.put("data", configData);

        mockMvc.perform(post("/api/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(configRequest)))
                .andExpect(status().isOk());

        // 3. Update IBAC device
        Map<String, Object> ibacConfig = new HashMap<>();
        ibacConfig.put("address", "ttyS0");
        ibacConfig.put("name", "Sequential IBAC");
        ibacConfig.put("deviceType", "IBAC");
        ibacConfig.put("enabled", true);

        mockMvc.perform(post("/api/device/IBAC")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(ibacConfig)))
                .andExpect(status().isOk());

        // 4. Verify all updates persisted
        mockMvc.perform(get("/api/devices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deviceManagerKey").value("seq-test-1"));

        mockMvc.perform(get("/api/config/properties"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.['fi.observis.sas.mqtt.url']").value("10.0.0.1"));

        mockMvc.perform(get("/api/device/IBAC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Sequential IBAC"));
    }

    @Test
    @DisplayName("E2E: Network configuration validation")
    public void testNetworkConfigValidation() throws Exception {
        // Try to save invalid IP address
        Map<String, String> invalidConfig = new HashMap<>();
        invalidConfig.put("interface", "eth0");
        invalidConfig.put("method", "static");
        invalidConfig.put("address", "999.999.999.999");  // Invalid IP
        invalidConfig.put("netmask", "255.255.255.0");
        invalidConfig.put("gateway", "192.168.1.1");

        mockMvc.perform(post("/api/network")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidConfig)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("E2E: All GET endpoints return valid data")
    public void testAllGetEndpoints() throws Exception {
        // Test main endpoints
        mockMvc.perform(get("/api/devices"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));

        mockMvc.perform(get("/api/config/properties"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));

        // Test device endpoints that exist
        mockMvc.perform(get("/api/device/IBAC"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));

        mockMvc.perform(get("/api/device/S900"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));

        mockMvc.perform(get("/api/device/oritestgtdb"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));

        // Test network endpoint
        mockMvc.perform(get("/api/network"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }
}

