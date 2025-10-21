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
 * E2E tests specifically for network configuration functionality
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Network Configuration E2E Tests")
public class NetworkConfigEndToEndTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("E2E: Read network configuration")
    public void testReadNetworkConfiguration() throws Exception {
        mockMvc.perform(get("/api/network"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.interface").exists())
                .andExpect(jsonPath("$.method").exists())
                .andExpect(jsonPath("$.address").exists())
                .andExpect(jsonPath("$.netmask").exists())
                .andExpect(jsonPath("$.gateway").exists());
    }

    @Test
    @DisplayName("E2E: Save valid static IP configuration")
    public void testSaveValidStaticIPConfiguration() throws Exception {
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
    @DisplayName("E2E: Save DHCP configuration")
    public void testSaveDHCPConfiguration() throws Exception {
        Map<String, String> networkConfig = new HashMap<>();
        networkConfig.put("interface", "eth0");
        networkConfig.put("method", "dhcp");
        networkConfig.put("address", "");
        networkConfig.put("netmask", "");
        networkConfig.put("gateway", "");

        mockMvc.perform(post("/api/network")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(networkConfig)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("E2E: Reject invalid IP address")
    public void testRejectInvalidIPAddress() throws Exception {
        Map<String, String> networkConfig = new HashMap<>();
        networkConfig.put("interface", "eth0");
        networkConfig.put("method", "static");
        networkConfig.put("address", "256.256.256.256");  // Invalid
        networkConfig.put("netmask", "255.255.255.0");
        networkConfig.put("gateway", "192.168.1.1");

        mockMvc.perform(post("/api/network")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(networkConfig)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value(containsString("Invalid")));
    }

    @Test
    @DisplayName("E2E: Reject invalid netmask")
    public void testRejectInvalidNetmask() throws Exception {
        Map<String, String> networkConfig = new HashMap<>();
        networkConfig.put("interface", "eth0");
        networkConfig.put("method", "static");
        networkConfig.put("address", "192.168.1.100");
        networkConfig.put("netmask", "999.999.999.999");  // Invalid
        networkConfig.put("gateway", "192.168.1.1");

        mockMvc.perform(post("/api/network")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(networkConfig)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("E2E: Accept valid config without gateway")
    public void testAcceptValidConfigWithoutGateway() throws Exception {
        Map<String, String> networkConfig = new HashMap<>();
        networkConfig.put("interface", "eth0");
        networkConfig.put("method", "static");
        networkConfig.put("address", "192.168.1.100");
        networkConfig.put("netmask", "255.255.255.0");
        networkConfig.put("gateway", "");  // Optional

        mockMvc.perform(post("/api/network")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(networkConfig)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("E2E: Reject invalid gateway when provided")
    public void testRejectInvalidGateway() throws Exception {
        Map<String, String> networkConfig = new HashMap<>();
        networkConfig.put("interface", "eth0");
        networkConfig.put("method", "static");
        networkConfig.put("address", "192.168.1.100");
        networkConfig.put("netmask", "255.255.255.0");
        networkConfig.put("gateway", "invalid-gateway");  // Invalid

        mockMvc.perform(post("/api/network")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(networkConfig)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("E2E: Interface is auto-detected (ignores provided value)")
    public void testInterfaceAutoDetected() throws Exception {
        // Interface field is now auto-detected by the backend
        // The backend should ignore whatever interface value is provided
        Map<String, String> networkConfig = new HashMap<>();
        networkConfig.put("interface", "ignored-interface-name");
        networkConfig.put("method", "dhcp");
        networkConfig.put("address", "");
        networkConfig.put("netmask", "");
        networkConfig.put("gateway", "");

        mockMvc.perform(post("/api/network")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(networkConfig)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        
        // Verify that reading config returns auto-detected interface
        mockMvc.perform(get("/api/network"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.interface").exists())
                .andExpect(jsonPath("$.method").value("dhcp"));
    }

    @Test
    @DisplayName("E2E: Complete network reconfiguration workflow")
    public void testCompleteNetworkReconfiguration() throws Exception {
        // 1. Read current config
        String currentConfig = mockMvc.perform(get("/api/network"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // 2. Update to static IP
        Map<String, String> staticConfig = new HashMap<>();
        staticConfig.put("interface", "eth0");
        staticConfig.put("method", "static");
        staticConfig.put("address", "10.0.0.50");
        staticConfig.put("netmask", "255.255.255.0");
        staticConfig.put("gateway", "10.0.0.1");

        mockMvc.perform(post("/api/network")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(staticConfig)))
                .andExpect(status().isOk());

        // 3. Verify new config (after simulated reboot)
        mockMvc.perform(get("/api/network"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.address").value("10.0.0.50"))
                .andExpect(jsonPath("$.netmask").value("255.255.255.0"))
                .andExpect(jsonPath("$.gateway").value("10.0.0.1"));

        // 4. Switch to DHCP
        Map<String, String> dhcpConfig = new HashMap<>();
        dhcpConfig.put("interface", "eth0");
        dhcpConfig.put("method", "dhcp");
        dhcpConfig.put("address", "");
        dhcpConfig.put("netmask", "");
        dhcpConfig.put("gateway", "");

        mockMvc.perform(post("/api/network")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dhcpConfig)))
                .andExpect(status().isOk());

        // 5. Verify DHCP config
        mockMvc.perform(get("/api/network"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.method").value("dhcp"));
    }
}


