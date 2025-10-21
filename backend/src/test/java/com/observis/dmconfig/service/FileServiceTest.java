package com.observis.dmconfig.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for FileService - JSON and Properties file read/write operations
 * Priority: High
 * Covers TDD Plan sections 1.2 (Backend test cases for file I/O)
 */
@SpringBootTest
class FileServiceTest {

    @Autowired
    private FileService fileService;

    @Autowired
    private ObjectMapper objectMapper;

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
    }

    // ===== Test: Read devices.json =====
    @Test
    void testReadDevicesJson_ReturnsCorrectKeys() throws IOException {
        // Arrange
        String jsonContent = """
                {
                    "deviceManagerKey": "test_key",
                    "deviceManagerName": "Test Device Manager",
                    "otherField": "should be ignored"
                }
                """;
        Files.writeString(devicesJsonPath, jsonContent);

        // Act
        JsonNode result = fileService.readJsonFile(devicesJsonPath.toString());

        // Assert
        assertNotNull(result);
        assertEquals("test_key", result.get("deviceManagerKey").asText());
        assertEquals("Test Device Manager", result.get("deviceManagerName").asText());
    }

    // ===== Test: Read config.properties =====
    @Test
    void testReadConfigProperties_ReturnsCorrectKeyValuePairs() throws IOException {
        // Arrange
        String propertiesContent = """
                fi.observis.sas.karafrest=192.168.1.100
                fi.observis.sas.mqtt.url=192.168.1.101
                other.property=ignored
                """;
        Files.writeString(configPropertiesPath, propertiesContent);

        // Act
        Properties result = fileService.readPropertiesFile(configPropertiesPath.toString());

        // Assert
        assertNotNull(result);
        assertEquals("192.168.1.100", result.getProperty("fi.observis.sas.karafrest"));
        assertEquals("192.168.1.101", result.getProperty("fi.observis.sas.mqtt.url"));
    }

    // ===== Test: Read per-device JSON (IBAC.json) =====
    @Test
    void testReadIBACJson_ReturnsOnlyEditableProperties() throws IOException {
        // Arrange
        String jsonContent = """
                {
                    "address": "ttyS0",
                    "speed": "9600",
                    "bits": "8",
                    "stopBits": "1",
                    "parity": "None",
                    "serialPortType": "RS232",
                    "name": "IBAC Device",
                    "internalField": "not editable"
                }
                """;
        Files.writeString(ibacJsonPath, jsonContent);

        // Act
        JsonNode result = fileService.readJsonFile(ibacJsonPath.toString());

        // Assert
        assertNotNull(result);
        assertEquals("ttyS0", result.get("address").asText());
        assertEquals("9600", result.get("speed").asText());
        assertEquals("IBAC Device", result.get("name").asText());
    }

    // ===== Test: Write config.properties =====
    @Test
    void testWriteConfigProperties_OverwritesOriginalFile() throws IOException {
        // Arrange
        String originalContent = """
                fi.observis.sas.karafrest=192.168.1.100
                fi.observis.sas.mqtt.url=192.168.1.101
                """;
        Files.writeString(configPropertiesPath, originalContent);

        Properties updatedProperties = new Properties();
        updatedProperties.setProperty("fi.observis.sas.karafrest", "192.168.2.200");
        updatedProperties.setProperty("fi.observis.sas.mqtt.url", "192.168.2.201");

        // Act
        fileService.writePropertiesFile(configPropertiesPath.toString(), updatedProperties);

        // Assert
        Properties savedProperties = fileService.readPropertiesFile(configPropertiesPath.toString());
        assertEquals("192.168.2.200", savedProperties.getProperty("fi.observis.sas.karafrest"));
        assertEquals("192.168.2.201", savedProperties.getProperty("fi.observis.sas.mqtt.url"));
    }

    // ===== Test: Write JSON configuration =====
    @Test
    void testWriteJsonConfiguration_OverwritesOriginalFile() throws IOException {
        // Arrange
        String originalContent = """
                {
                    "deviceManagerKey": "old_key",
                    "deviceManagerName": "Old Name"
                }
                """;
        Files.writeString(devicesJsonPath, originalContent);

        ObjectNode updatedJson = objectMapper.createObjectNode();
        updatedJson.put("deviceManagerKey", "new_key");
        updatedJson.put("deviceManagerName", "New Name");

        // Act
        fileService.writeJsonFile(devicesJsonPath.toString(), updatedJson);

        // Assert
        JsonNode savedJson = fileService.readJsonFile(devicesJsonPath.toString());
        assertEquals("new_key", savedJson.get("deviceManagerKey").asText());
        assertEquals("New Name", savedJson.get("deviceManagerName").asText());
    }

    // ===== Test: Error handling for read failure =====
    @Test
    void testReadJsonFile_NonExistentFile_ThrowsException() {
        // Arrange
        String nonExistentPath = tempDir.resolve("nonexistent.json").toString();

        // Act & Assert
        assertThrows(IOException.class, () -> {
            fileService.readJsonFile(nonExistentPath);
        });
    }

    // ===== Test: Error handling for write failure =====
    @Test
    void testWriteJsonFile_InvalidPath_ThrowsException() {
        // Arrange
        String invalidPath = "/invalid/path/file.json";
        ObjectNode json = objectMapper.createObjectNode();

        // Act & Assert
        assertThrows(IOException.class, () -> {
            fileService.writeJsonFile(invalidPath, json);
        });
    }

    // ===== Test: Properties file preserves format =====
    @Test
    void testWriteProperties_PreservesKeyValueFormat() throws IOException {
        // Arrange
        Properties properties = new Properties();
        properties.setProperty("key1", "value1");
        properties.setProperty("key2", "value2");

        // Act
        fileService.writePropertiesFile(configPropertiesPath.toString(), properties);

        // Assert
        String content = Files.readString(configPropertiesPath);
        assertTrue(content.contains("key1=value1") || content.contains("key1 = value1"));
        assertTrue(content.contains("key2=value2") || content.contains("key2 = value2"));
    }
}

