package com.observis.dmconfig.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;

/**
 * Service for executing reboot script
 */
@Service
public class RebootService {

    private static final Logger logger = LoggerFactory.getLogger(RebootService.class);

    @Value("${dm.reboot.script.path:/opt/dm/scripts/reboot.sh}")
    private String rebootScriptPath;

    @Value("${dm.reboot.test.mode:false}")
    private boolean testMode;

    /**
     * Execute reboot script
     */
    public void executeReboot() throws IOException {
        if (testMode) {
            simulateReboot(true);
            return;
        }
        executeRebootScript(rebootScriptPath);
    }

    /**
     * Execute the reboot script at the specified path
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

