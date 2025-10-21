package com.observis.dmconfig.service;

import com.observis.dmconfig.validation.ValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for managing Debian network configuration (/etc/network/interfaces)
 */
@Service
public class NetworkConfigService {

    @Autowired
    private ValidationService validationService;

    @Value("${dm.network.interfaces.path:/etc/network/interfaces}")
    private String interfacesPath;

    /**
     * Read network configuration from /etc/network/interfaces
     */
    public Map<String, String> getNetworkConfig() throws IOException {
        String content = Files.readString(Paths.get(interfacesPath));
        return parseNetworkConfig(content);
    }

    /**
     * Save network configuration to /etc/network/interfaces
     */
    public void saveNetworkConfig(Map<String, String> config) throws IOException {
        // Override interface with auto-detected one (ignore client-provided value)
        config.put("interface", detectNetworkInterface());
        
        // Validate IP addresses (only if not empty - empty is allowed for DHCP)
        String address = config.get("address");
        String netmask = config.get("netmask");
        String gateway = config.get("gateway");

        if (address != null && !address.isEmpty() && !validationService.validateIPv4(address)) {
            throw new IllegalArgumentException("Invalid IP address");
        }

        if (netmask != null && !netmask.isEmpty() && !validationService.validateIPv4(netmask)) {
            throw new IllegalArgumentException("Invalid netmask");
        }

        if (gateway != null && !gateway.isEmpty() && !validationService.validateIPv4(gateway)) {
            throw new IllegalArgumentException("Invalid gateway");
        }

        // Generate interfaces file content
        String content = generateInterfacesContent(config);
        Files.writeString(Paths.get(interfacesPath), content);
    }

    /**
     * Detect the primary network interface on the system
     */
    private String detectNetworkInterface() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface iface = interfaces.nextElement();
                // Skip loopback and inactive interfaces
                if (!iface.isLoopback() && iface.isUp() && !iface.isVirtual()) {
                    return iface.getName();
                }
            }
        } catch (SocketException e) {
            // If detection fails, fall back to eth0
            return "eth0";
        }
        return "eth0"; // Fallback
    }

    /**
     * Parse network configuration from interfaces file
     */
    private Map<String, String> parseNetworkConfig(String content) {
        Map<String, String> config = new HashMap<>();
        
        // Default values - detect actual interface
        config.put("interface", detectNetworkInterface());
        config.put("method", "static");
        config.put("address", "");
        config.put("netmask", "");
        config.put("gateway", "");

        String[] lines = content.split("\n");
        boolean inInterfaceBlock = false;

        for (String line : lines) {
            line = line.trim();
            
            // Match any interface except loopback (lo)
            if (line.startsWith("iface ") && !line.startsWith("iface lo")) {
                inInterfaceBlock = true;
                if (line.contains("inet")) {
                    if (line.contains("dhcp")) {
                        config.put("method", "dhcp");
                    } else if (line.contains("static")) {
                        config.put("method", "static");
                    }
                }
                // Extract actual interface name from the file
                String[] parts = line.split("\\s+");
                if (parts.length > 1) {
                    config.put("interface", parts[1]);
                }
            } else if (inInterfaceBlock) {
                if (line.startsWith("address")) {
                    String[] parts = line.split("\\s+");
                    if (parts.length > 1) {
                        config.put("address", parts[1]);
                    }
                } else if (line.startsWith("netmask")) {
                    String[] parts = line.split("\\s+");
                    if (parts.length > 1) {
                        config.put("netmask", parts[1]);
                    }
                } else if (line.startsWith("gateway")) {
                    String[] parts = line.split("\\s+");
                    if (parts.length > 1) {
                        config.put("gateway", parts[1]);
                    }
                } else if (line.isEmpty() || line.startsWith("iface") || line.startsWith("auto")) {
                    inInterfaceBlock = false;
                }
            }
        }

        return config;
    }

    /**
     * Generate /etc/network/interfaces file content
     */
    private String generateInterfacesContent(Map<String, String> config) {
        StringBuilder sb = new StringBuilder();
        
        sb.append("# This file describes the network interfaces available on your system\n");
        sb.append("# and how to activate them. For more information, see interfaces(5).\n\n");
        
        sb.append("# The loopback network interface\n");
        sb.append("auto lo\n");
        sb.append("iface lo inet loopback\n\n");
        
        String iface = config.get("interface"); // Already set in saveNetworkConfig or parseNetworkConfig
        String method = config.getOrDefault("method", "static");
        
        sb.append("# The primary network interface\n");
        sb.append("auto ").append(iface).append("\n");
        sb.append("iface ").append(iface).append(" inet ").append(method).append("\n");
        
        if ("static".equals(method)) {
            String address = config.get("address");
            String netmask = config.get("netmask");
            String gateway = config.get("gateway");
            
            if (address != null && !address.isEmpty()) {
                sb.append("    address ").append(address).append("\n");
            }
            if (netmask != null && !netmask.isEmpty()) {
                sb.append("    netmask ").append(netmask).append("\n");
            }
            if (gateway != null && !gateway.isEmpty()) {
                sb.append("    gateway ").append(gateway).append("\n");
            }
        }
        
        return sb.toString();
    }
}

