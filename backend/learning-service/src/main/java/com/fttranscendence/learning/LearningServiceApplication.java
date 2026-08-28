package com.fttranscendence.learning;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.Clock;

@SpringBootApplication
@EnableScheduling
public class LearningServiceApplication {

    /**
     * The application time source is a bean so time-sensitive read models can be
     * exercised at timezone boundaries without relying on the host clock.
     */
    @Bean
    Clock dashboardClock() {
        return Clock.systemUTC();
    }

    public static void main(String[] args) {
        SpringApplication.run(LearningServiceApplication.class, args);
    }
}
