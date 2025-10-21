package com.observis.dmconfig.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.observis.dmconfig.service.ConfigService;
import com.observis.dmconfig.service.RebootService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Properties;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for ConfigController REST API endpoints
 * Priority: High
 * Covers TDD Plan sections 1.2 (REST API endpoint test cases)
 */
@WebMvcTest(ConfigController.class)
class ConfigControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ConfigService configService;

    @MockBean
    private RebootService rebootService;

    // ===== Test: GET /api/devices - Read devices.json =====
    
    @Test
    void testGetDevices_ReturnsDevicesConfiguration() throws Exception {
        // Arrange
        ObjectNode devicesJson = objectMapper.createObjectNode();
        devicesJson.put("deviceManagerKey", "test_key");
        devicesJson.put("deviceManagerName", "Test Manager");
        
        when(configService.getDevicesConfig()).thenReturn(devicesJson);

        // Act & Assert
        mockMvc.perform(get("/api/devices"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.deviceManagerKey").value("test_key"))
                .andExpect(jsonPath("$.deviceManagerName").value("Test Manager"));

        verify(configService, times(1)).getDevicesConfig();
    }

    @Test
    void testGetDevices_ServiceError_Returns500() throws Exception {
        // Arrange
        when(configService.getDevicesConfig()).thenThrow(new RuntimeException("File read error"));

        // Act & Assert
        mockMvc.perform(get("/api/devices"))
                .andExpect(status().isInternalServerError());
    }

    // ===== Test: GET /api/config/properties - Read config.properties =====
    
    @Test
    void testGetConfigProperties_ReturnsPropertiesConfiguration() throws Exception {
        // Arrange
        Properties properties = new Properties();
        properties.setProperty("fi.observis.sas.karafrest", "192.168.1.100");
        properties.setProperty("fi.observis.sas.mqtt.url", "192.168.1.101");
        
        when(configService.getConfigProperties()).thenReturn(properties);

        // Act & Assert
        mockMvc.perform(get("/api/config/properties"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$['fi.observis.sas.karafrest']").value("192.168.1.100"))
                .andExpect(jsonPath("$['fi.observis.sas.mqtt.url']").value("192.168.1.101"));

        verify(configService, times(1)).getConfigProperties();
    }

    // ===== Test: GET /api/device/{deviceName} - Read device-specific JSON =====
    
    @Test
    void testGetDeviceConfig_IBAC_ReturnsConfiguration() throws Exception {
        // Arrange
        ObjectNode ibacJson = objectMapper.createObjectNode();
        ibacJson.put("address", "ttyS0");
        ibacJson.put("speed", "9600");
        ibacJson.put("name", "IBAC Device");
        
        when(configService.getDeviceConfig("IBAC")).thenReturn(ibacJson);

        // Act & Assert
        mockMvc.perform(get("/api/device/IBAC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.address").value("ttyS0"))
                .andExpect(jsonPath("$.speed").value("9600"))
                .andExpect(jsonPath("$.name").value("IBAC Device"));
    }

    @Test
    void testGetDeviceConfig_S900_ReturnsConfiguration() throws Exception {
        // Arrange
        ObjectNode s900Json = objectMapper.createObjectNode();
        s900Json.put("address", "192.168.1.50");
        s900Json.put("portNumber", 502);
        s900Json.put("name", "S900 Device");
        
        when(configService.getDeviceConfig("S900")).thenReturn(s900Json);

        // Act & Assert
        mockMvc.perform(get("/api/device/S900"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.address").value("192.168.1.50"))
                .andExpect(jsonPath("$.portNumber").value(502));
    }

    // ===== Test: POST /api/save - Save configuration =====
    
    @Test
    void testSaveConfig_ValidDevicesJson_Returns200() throws Exception {
        // Arrange
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("configType", "devices");
        ObjectNode data = objectMapper.createObjectNode();
        data.put("deviceManagerKey", "new_key");
        data.put("deviceManagerName", "New Name");
        requestBody.set("data", data);

        doNothing().when(configService).saveDevicesConfig(any());

        // Act & Assert
        mockMvc.perform(post("/api/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").exists());

        verify(configService, times(1)).saveDevicesConfig(any());
    }

    @Test
    void testSaveConfig_ValidConfigProperties_Returns200() throws Exception {
        // Arrange
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("configType", "properties");
        ObjectNode data = objectMapper.createObjectNode();
        data.put("fi.observis.sas.karafrest", "192.168.2.100");
        data.put("fi.observis.sas.mqtt.url", "192.168.2.101");
        requestBody.set("data", data);

        doNothing().when(configService).saveConfigProperties(any());

        // Act & Assert
        mockMvc.perform(post("/api/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(configService, times(1)).saveConfigProperties(any());
    }

    @Test
    void testSaveConfig_InvalidData_Returns400() throws Exception {
        // Arrange
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("configType", "devices");
        ObjectNode data = objectMapper.createObjectNode();
        data.put("deviceManagerKey", "invalid key with spaces");
        requestBody.set("data", data);

        doThrow(new IllegalArgumentException("Validation failed"))
                .when(configService).saveDevicesConfig(any());

        // Act & Assert
        mockMvc.perform(post("/api/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void testSaveConfig_ServiceError_Returns500() throws Exception {
        // Arrange
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("configType", "devices");
        ObjectNode data = objectMapper.createObjectNode();
        data.put("deviceManagerKey", "valid_key");
        requestBody.set("data", data);

        doThrow(new RuntimeException("File write error"))
                .when(configService).saveDevicesConfig(any());

        // Act & Assert
        mockMvc.perform(post("/api/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isInternalServerError());
    }

    // ===== Test: POST /api/reboot - Execute reboot script =====
    
    @Test
    void testReboot_Success_Returns200() throws Exception {
        // Arrange
        doNothing().when(rebootService).executeReboot();

        // Act & Assert
        mockMvc.perform(post("/api/reboot"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Reboot initiated"));

        verify(rebootService, times(1)).executeReboot();
    }

    @Test
    void testReboot_ScriptError_Returns500() throws Exception {
        // Arrange
        doThrow(new RuntimeException("Script execution failed"))
                .when(rebootService).executeReboot();

        // Act & Assert
        mockMvc.perform(post("/api/reboot"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ===== Test: Error handling - API returns correct error codes =====
    
    @Test
    void testGetDeviceConfig_InvalidDeviceName_Returns404() throws Exception {
        // Arrange
        when(configService.getDeviceConfig("nonexistent"))
                .thenThrow(new IllegalArgumentException("Device not found"));

        // Act & Assert
        mockMvc.perform(get("/api/device/nonexistent"))
                .andExpect(status().isNotFound());
    }

    // ===== Test: POST /api/device/{deviceName} - Save device-specific config =====
    
    @Test
    void testSaveDeviceConfig_ValidIBAC_Returns200() throws Exception {
        // Arrange
        ObjectNode ibacData = objectMapper.createObjectNode();
        ibacData.put("address", "ttyS1");
        ibacData.put("speed", "19200");
        ibacData.put("name", "Updated IBAC");

        doNothing().when(configService).saveDeviceConfig(eq("IBAC"), any());

        // Act & Assert
        mockMvc.perform(post("/api/device/IBAC")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(ibacData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(configService, times(1)).saveDeviceConfig(eq("IBAC"), any());
    }

    @Test
    void testSaveDeviceConfig_ValidationFailure_Returns400() throws Exception {
        // Arrange
        ObjectNode s900Data = objectMapper.createObjectNode();
        s900Data.put("address", "invalid.ip");
        s900Data.put("portNumber", 70000); // out of range

        doThrow(new IllegalArgumentException("Invalid IP or port"))
                .when(configService).saveDeviceConfig(eq("S900"), any());

        // Act & Assert
        mockMvc.perform(post("/api/device/S900")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(s900Data)))
                .andExpect(status().isBadRequest());
    }
}

