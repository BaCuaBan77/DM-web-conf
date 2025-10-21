package com.observis.dmconfig;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Main Spring Boot application class
 */
@SpringBootApplication
public class DmConfigApplication {

    public static void main(String[] args) {
        SpringApplication.run(DmConfigApplication.class, args);
    }

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}

