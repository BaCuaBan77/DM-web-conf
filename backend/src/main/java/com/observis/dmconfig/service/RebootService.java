package com.observis.dmconfig.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Service for triggering system restart
 * 
 * This service creates a trigger file that is monitored by the
 * dm-reboot-watcher.service running on the host system.
 * 
 * The systemd service executes /opt/dm/reboot.sh which:
 * - Restarts network services (to apply network config changes)
 * - Restarts Docker containers (to apply device config changes)
 */
@Service
public class RebootService {

    private static final Logger logger = LoggerFactory.getLogger(RebootService.class);

    @Value("${dm.reboot.trigger.path:/opt/dm/.reboot-trigger}")
    private String rebootTriggerPath;

    @Value("${dm.reboot.test.mode:false}")
    private boolean testMode;

    /**
     * Trigger system restart by creating a trigger file
     * The dm-reboot-watcher.service monitors this file and executes the restart script
     */
    public void executeReboot() throws IOException {
        if (testMode) {
            simulateReboot(true);
            return;
        }
        createRebootTrigger();
    }

    /**
     * Create the reboot trigger file
     * The systemd service dm-reboot-watcher.service monitors this file
     */
    private void createRebootTrigger() throws IOException {
        try {
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            String content = "REBOOT_REQUESTED=" + timestamp + "\n";
            
            Files.write(
                Paths.get(rebootTriggerPath),
                content.getBytes(),
                StandardOpenOption.CREATE,
                StandardOpenOption.TRUNCATE_EXISTING
            );
            
            logger.info("Reboot trigger file created: {}", rebootTriggerPath);
            logger.info("dm-reboot-watcher.service will execute restart script");
        } catch (IOException e) {
            logger.error("Failed to create reboot trigger file: {}", rebootTriggerPath, e);
            throw new IOException("Failed to trigger system restart: " + e.getMessage(), e);
        }
    }

    /**
     * Execute the reboot script at the specified path (legacy method for testing)
     */
    public String executeRebootScript(String scriptPath) throws IOException {
        File scriptFile = new File(scriptPath);
        if (!scriptFile.exists()) {
            throw new IOException("Reboot script not found: " + scriptPath);
        }

        try {
            ProcessBuilder processBuilder = new ProcessBuilder(scriptPath);
            Process process = processBuilder.start();
            
            logger.info("Reboot script executed: {}", scriptPath);
            return "Reboot script executed successfully";
        } catch (IOException e) {
            logger.error("Failed to execute reboot script", e);
            throw e;
        }
    }

    /**
     * Simulate reboot for testing
     */
    public void simulateReboot(boolean testMode) {
        if (testMode) {
            logger.info("Reboot simulated (test mode)");
        }
    }
}

