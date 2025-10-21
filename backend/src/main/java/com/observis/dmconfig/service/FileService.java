package com.observis.dmconfig.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Properties;

/**
 * Service for reading and writing JSON and properties files
 */
@Service
public class FileService {

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Read JSON file and return as JsonNode
     */
    public JsonNode readJsonFile(String filePath) throws IOException {
        File file = new File(filePath);
        if (!file.exists()) {
            throw new IOException("File not found: " + filePath);
        }
        return objectMapper.readTree(file);
    }

    /**
     * Write JsonNode to JSON file
     */
    public void writeJsonFile(String filePath, JsonNode jsonNode) throws IOException {
        File file = new File(filePath);
        File parentDir = file.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            throw new IOException("Parent directory does not exist: " + parentDir.getAbsolutePath());
        }
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, jsonNode);
    }

    /**
     * Read properties file
     */
    public Properties readPropertiesFile(String filePath) throws IOException {
        Properties properties = new Properties();
        try (InputStream input = Files.newInputStream(Paths.get(filePath))) {
            properties.load(input);
        }
        return properties;
    }

    /**
     * Write properties to file
     */
    public void writePropertiesFile(String filePath, Properties properties) throws IOException {
        try (OutputStream output = Files.newOutputStream(Paths.get(filePath))) {
            properties.store(output, null);
        }
    }
}

