package com.fttranscendence.learning.database;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.ResultSet;

import static org.junit.jupiter.api.Assertions.assertEquals;

@Testcontainers(disabledWithoutDocker = true)
class PostgresMigrationIntegrationTest {

    @Container
    private static final PostgreSQLContainer<?> POSTGRES =
        new PostgreSQLContainer<>("postgres:17-alpine");

    @Test
    void learningMigrationsAreRepeatableOnPostgres() throws Exception {
        Flyway flyway = Flyway.configure()
            .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
            .schemas("learning")
            .defaultSchema("learning")
            .locations("classpath:db/migration")
            .load();

        assertEquals(5, flyway.migrate().migrationsExecuted);
        assertEquals(0, flyway.migrate().migrationsExecuted);

        try (Connection connection = POSTGRES.createConnection("");
             ResultSet result = connection.createStatement().executeQuery(
                 "SELECT COUNT(*) FROM information_schema.tables "
                     + "WHERE table_schema = 'learning' "
                     + "AND table_name IN ('tutor_classes', 'student_profiles', 'syllabus_topics')")) {
            result.next();
            assertEquals(3, result.getInt(1));
        }

        try (Connection connection = POSTGRES.createConnection("");
             ResultSet result = connection.createStatement().executeQuery(
                 "SELECT COUNT(*) FROM learning.syllabus_topics "
                     + "WHERE curriculum_version = 'MOE_PRIMARY_SCIENCE_2023'")) {
            result.next();
            assertEquals(24, result.getInt(1));
        }
    }
}
