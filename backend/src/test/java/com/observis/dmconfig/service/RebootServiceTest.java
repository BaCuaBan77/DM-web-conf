package com.observis.dmconfig.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermission;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for RebootService - Reboot script execution
 * Priority: High
 * Covers TDD Plan sections 1.2 (Reboot script execution test cases)
 */
@SpringBootTest
class RebootServiceTest {

    @Autowired
    private RebootService rebootService;

    @TempDir
    Path tempDir;

    // ===== Test: Reboot script execution =====
    
    @Test
    void testExecuteReboot_ScriptExists_ExecutesSuccessfully() throws IOException {
        // Arrange
        Path rebootScript = tempDir.resolve("reboot.sh");
        Files.writeString(rebootScript, "#!/bin/bash\necho 'Reboot simulated'\n");
        
        // Make script executable (Unix-like systems only)
        if (System.getProperty("os.name").toLowerCase().contains("nix") || 
            System.getProperty("os.name").toLowerCase().contains("nux")) {
            Files.setPosixFilePermissions(rebootScript, Set.of(
                PosixFilePermission.OWNER_READ,
                PosixFilePermission.OWNER_WRITE,
                PosixFilePermission.OWNER_EXECUTE
            ));
        }

        // Act & Assert
        assertDoesNotThrow(() -> {
            rebootService.executeRebootScript(rebootScript.toString());
        });
    }

    @Test
    void testExecuteReboot_ScriptNotFound_ThrowsException() {
        // Arrange
        String nonExistentScript = tempDir.resolve("nonexistent.sh").toString();

        // Act & Assert
        assertThrows(IOException.class, () -> {
            rebootService.executeRebootScript(nonExistentScript);
        });
    }

    @Test
    void testExecuteReboot_SimulatedMode_DoesNotActuallyReboot() {
        // This test ensures that in test mode, the reboot is simulated
        // and the system does not actually reboot
        
        // Arrange
        boolean testMode = true;

        // Act & Assert
        assertDoesNotThrow(() -> {
            rebootService.simulateReboot(testMode);
        });
    }

    @Test
    void testExecuteReboot_ReturnsSuccessMessage() throws IOException {
        // Arrange
        Path rebootScript = tempDir.resolve("reboot.sh");
        Files.writeString(rebootScript, "#!/bin/bash\nexit 0\n");

        // Act
        String result = rebootService.executeRebootScript(rebootScript.toString());

        // Assert
        assertNotNull(result);
        assertTrue(result.contains("success") || result.contains("initiated"));
    }
}

