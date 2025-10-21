package com.observis.dmconfig.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.observis.dmconfig.service.ConfigService;
import com.observis.dmconfig.service.FileService;
import com.observis.dmconfig.service.RebootService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for full save workflow
 * Priority: High
 * Covers TDD Plan section 3 (Integration Tests)
 */
@SpringBootTest
@AutoConfigureMockMvc
class FullWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FileService fileService;

    @MockBean
    private RebootService rebootService;

    @TempDir
    Path tempDir;

    private Path devicesJsonPath;
    private Path configPropertiesPath;
    private Path ibacJsonPath;

    @BeforeEach
    void setUp() throws IOException {
        devicesJsonPath = tempDir.resolve("devices.json");
        configPropertiesPath = tempDir.resolve("config.properties");
        ibacJsonPath = tempDir.resolve("IBAC.json");

        // Set up initial test files
        String initialDevicesJson = """
                {
                    "deviceManagerKey": "initial_key",
                    "deviceManagerName": "Initial Name"
                }
                """;
        Files.writeString(devicesJsonPath, initialDevicesJson);

        String initialProperties = """
                fi.observis.sas.karafrest=192.168.1.100
                fi.observis.sas.mqtt.url=192.168.1.101
                """;
        Files.writeString(configPropertiesPath, initialProperties);

        String initialIBACJson = """
                {
                    "address": "ttyS0",
                    "speed": "9600",
                    "bits": "8",
                    "stopBits": "1",
                    "parity": "None",
                    "serialPortType": "RS232",
                    "name": "Initial IBAC"
                }
                """;
        Files.writeString(ibacJsonPath, initialIBACJson);
    }

    // ===== Test: Full save workflow - User edits → Save → Reboot =====
    
    @Test
    void testFullSaveWorkflow_DevicesJson_UpdatesFileAndTriggersReboot() throws Exception {
        // Arrange
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("configType", "devices");
        ObjectNode data = objectMapper.createObjectNode();
        data.put("deviceManagerKey", "updated_key");
        data.put("deviceManagerName", "Updated Name");
        requestBody.set("data", data);

        // Mock reboot service
        doNothing().when(rebootService).executeReboot();

        // Act - Save configuration
        mockMvc.perform(post("/api/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Trigger reboot
        mockMvc.perform(post("/api/reboot"))
                .andExpect(status().isOk());

        // Assert - Verify file was updated
        JsonNode savedJson = fileService.readJsonFile(devicesJsonPath.toString());
        assertEquals("updated_key", savedJson.get("deviceManagerKey").asText());
        assertEquals("Updated Name", savedJson.get("deviceManagerName").asText());

        // Verify reboot was called
        verify(rebootService, times(1)).executeReboot();
    }

    @Test
    void testFullSaveWorkflow_ConfigProperties_UpdatesFileAndTriggersReboot() throws Exception {
        // Arrange
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("configType", "properties");
        ObjectNode data = objectMapper.createObjectNode();
        data.put("fi.observis.sas.karafrest", "192.168.2.200");
        data.put("fi.observis.sas.mqtt.url", "192.168.2.201");
        requestBody.set("data", data);

        doNothing().when(rebootService).executeReboot();

        // Act - Save configuration
        mockMvc.perform(post("/api/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk());

        // Trigger reboot
        mockMvc.perform(post("/api/reboot"))
                .andExpect(status().isOk());

        // Assert - Verify file was updated
        Properties savedProperties = fileService.readPropertiesFile(configPropertiesPath.toString());
        assertEquals("192.168.2.200", savedProperties.getProperty("fi.observis.sas.karafrest"));
        assertEquals("192.168.2.201", savedProperties.getProperty("fi.observis.sas.mqtt.url"));

        verify(rebootService, times(1)).executeReboot();
    }

    // ===== Test: API error handling during save =====
    
    @Test
    void testSaveWorkflow_ValidationFailure_FilesUnchanged() throws Exception {
        // Arrange - invalid data (spaces in deviceManagerKey)
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("configType", "devices");
        ObjectNode data = objectMapper.createObjectNode();
        data.put("deviceManagerKey", "invalid key with spaces");
        data.put("deviceManagerName", "Some Name");
        requestBody.set("data", data);

        // Act - Attempt to save
        mockMvc.perform(post("/api/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        // Assert - Original file unchanged
        JsonNode originalJson = fileService.readJsonFile(devicesJsonPath.toString());
        assertEquals("initial_key", originalJson.get("deviceManagerKey").asText());
        assertEquals("Initial Name", originalJson.get("deviceManagerName").asText());
    }

    @Test
    void testSaveWorkflow_ApiError_ShowsErrorFrontend() throws Exception {
        // Arrange - simulate file write error by using invalid path
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("configType", "devices");
        requestBody.put("filePath", "/invalid/nonexistent/path.json");
        ObjectNode data = objectMapper.createObjectNode();
        data.put("deviceManagerKey", "valid_key");
        data.put("deviceManagerName", "Valid Name");
        requestBody.set("data", data);

        // Act
        mockMvc.perform(post("/api/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").exists());
    }

    // ===== Test: File update verification =====
    
    @Test
    void testFileUpdateVerification_AfterSave_FilesMatchUpdatedValues() throws Exception {
        // Arrange
        ObjectNode ibacData = objectMapper.createObjectNode();
        ibacData.put("address", "ttyS1");
        ibacData.put("speed", "19200");
        ibacData.put("bits", "8");
        ibacData.put("stopBits", "1");
        ibacData.put("parity", "Even");
        ibacData.put("serialPortType", "RS485");
        ibacData.put("name", "Updated IBAC");

        // Act - Save device config
        mockMvc.perform(post("/api/device/IBAC")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(ibacData)))
                .andExpect(status().isOk());

        // Assert - Verify file matches updated values
        JsonNode savedJson = fileService.readJsonFile(ibacJsonPath.toString());
        assertEquals("ttyS1", savedJson.get("address").asText());
        assertEquals("19200", savedJson.get("speed").asText());
        assertEquals("Even", savedJson.get("parity").asText());
        assertEquals("RS485", savedJson.get("serialPortType").asText());
        assertEquals("Updated IBAC", savedJson.get("name").asText());
    }

    // ===== Test: Reboot simulation =====
    
    @Test
    void testRebootSimulation_DoesNotActuallyReboot() throws Exception {
        // Arrange - mock reboot service to simulate without actual reboot
        doAnswer(invocation -> {
            // Simulate reboot without actually rebooting
            System.out.println("Reboot simulated in test");
            return null;
        }).when(rebootService).executeReboot();

        // Act
        mockMvc.perform(post("/api/reboot"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Assert
        verify(rebootService, times(1)).executeReboot();
        // Test continues running, proving actual reboot didn't occur
        assertTrue(true);
    }

    // ===== Test: Multiple file updates in sequence =====
    
    @Test
    void testMultipleFileUpdates_Sequential_AllFilesUpdatedCorrectly() throws Exception {
        // Arrange & Act - Update devices.json
        ObjectNode devicesData = objectMapper.createObjectNode();
        devicesData.put("deviceManagerKey", "multi_test_key");
        devicesData.put("deviceManagerName", "Multi Test");
        
        ObjectNode devicesRequest = objectMapper.createObjectNode();
        devicesRequest.put("configType", "devices");
        devicesRequest.set("data", devicesData);

        mockMvc.perform(post("/api/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(devicesRequest)))
                .andExpect(status().isOk());

        // Update config.properties
        ObjectNode propertiesData = objectMapper.createObjectNode();
        propertiesData.put("fi.observis.sas.karafrest", "10.0.0.50");
        propertiesData.put("fi.observis.sas.mqtt.url", "10.0.0.51");
        
        ObjectNode propertiesRequest = objectMapper.createObjectNode();
        propertiesRequest.put("configType", "properties");
        propertiesRequest.set("data", propertiesData);

        mockMvc.perform(post("/api/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(propertiesRequest)))
                .andExpect(status().isOk());

        // Assert - Verify both files were updated correctly
        JsonNode devicesJson = fileService.readJsonFile(devicesJsonPath.toString());
        assertEquals("multi_test_key", devicesJson.get("deviceManagerKey").asText());

        Properties properties = fileService.readPropertiesFile(configPropertiesPath.toString());
        assertEquals("10.0.0.50", properties.getProperty("fi.observis.sas.karafrest"));
    }

    // ===== Test: End-to-end workflow with validation =====
    
    @Test
    void testEndToEndWorkflow_ValidData_CompleteSuccessfully() throws Exception {
        // This test simulates a complete user workflow:
        // 1. Load configuration
        // 2. Modify values
        // 3. Save
        // 4. Verify changes
        // 5. Trigger reboot

        // Step 1: Load current configuration
        mockMvc.perform(get("/api/devices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deviceManagerKey").value("initial_key"));

        // Step 2 & 3: Modify and save
        ObjectNode updatedData = objectMapper.createObjectNode();
        updatedData.put("deviceManagerKey", "workflow_key");
        updatedData.put("deviceManagerName", "Workflow Test");
        
        ObjectNode saveRequest = objectMapper.createObjectNode();
        saveRequest.put("configType", "devices");
        saveRequest.set("data", updatedData);

        mockMvc.perform(post("/api/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(saveRequest)))
                .andExpect(status().isOk());

        // Step 4: Verify changes were saved
        mockMvc.perform(get("/api/devices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deviceManagerKey").value("workflow_key"))
                .andExpect(jsonPath("$.deviceManagerName").value("Workflow Test"));

        // Step 5: Trigger reboot
        doNothing().when(rebootService).executeReboot();
        
        mockMvc.perform(post("/api/reboot"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(rebootService, times(1)).executeReboot();
    }
}

