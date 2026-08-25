package com.fttranscendence.learning.database;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.env.MockEnvironment;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalTime;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
class MigrationIntegrationTest {

    @Autowired private Flyway flyway;
    @Autowired private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void clearClasses() {
        jdbcTemplate.update("DELETE FROM class_memberships");
        jdbcTemplate.update("DELETE FROM student_profiles");
        jdbcTemplate.update("DELETE FROM tutor_classes");
    }

    @Test
    void migrationCreatesClassAndScheduleTablesAndCanBeRepeated() {
        assertEquals(1, tableCount("learning_schema_metadata"));
        assertEquals(1, tableCount("tutor_classes"));
        assertEquals(1, tableCount("class_schedules"));
        assertEquals(1, tableCount("student_profiles"));
        assertEquals(1, tableCount("class_memberships"));
        assertEquals("3", flyway.info().current().getVersion().getVersion());
        assertEquals(3, versionedMigrationCount());

        long appliedBefore = versionedMigrationCount();
        flyway.migrate();

        assertEquals(appliedBefore, versionedMigrationCount());
        assertEquals(1, tableCount("tutor_classes"));
    }

    @Test
    void migrationEnforcesOwnershipUniquenessStatusAndScheduleConstraints() {
        long classId = insertClass(101L, "P5 Science", "p5 science", "ACTIVE");

        assertThrows(
            DataIntegrityViolationException.class,
            () -> insertClass(101L, "Another display name", "p5 science", "ACTIVE")
        );
        assertThrows(
            DataIntegrityViolationException.class,
            () -> insertClass(0L, "Invalid Owner", "invalid owner", "ACTIVE")
        );
        assertThrows(
            DataIntegrityViolationException.class,
            () -> insertClass(202L, "Invalid Status", "invalid status", "ARCHIVED")
        );
        assertThrows(
            DataIntegrityViolationException.class,
            () -> jdbcTemplate.update(
                "INSERT INTO class_schedules "
                    + "(class_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)",
                classId,
                "MONDAY",
                LocalTime.of(16, 0),
                LocalTime.of(15, 0)
            )
        );
        assertThrows(
            DataIntegrityViolationException.class,
            () -> jdbcTemplate.update(
                "INSERT INTO class_schedules "
                    + "(class_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)",
                Long.MAX_VALUE,
                "MONDAY",
                LocalTime.of(15, 0),
                LocalTime.of(16, 0)
            )
        );
    }

    @Test
    void productionConfigurationRequiresExternalCredentialsAndValidationMode()
            throws IOException {
        Properties properties = loadProductionProperties();

        assertEquals("validate", properties.getProperty("spring.jpa.hibernate.ddl-auto"));
        assertRequiredPlaceholder(properties, "spring.datasource.url", "${LEARNING_DB_URL}");
        assertRequiredPlaceholder(properties, "spring.datasource.username", "${LEARNING_DB_USERNAME}");
        assertRequiredPlaceholder(properties, "spring.datasource.password", "${LEARNING_DB_PASSWORD}");
        assertEquals(
            "${LEARNING_DB_SCHEMA:learning}",
            properties.getProperty("spring.jpa.properties.hibernate.default_schema")
        );
        assertEquals(
            "${LEARNING_DB_SCHEMA:learning}",
            properties.getProperty("spring.flyway.default-schema")
        );
        assertRequiredPlaceholder(properties, "jwt.secret", "${JWT_SECRET}");
    }

    private long insertClass(
            long tutorId,
            String className,
            String normalizedClassName,
            String status) {
        jdbcTemplate.update(
            "INSERT INTO tutor_classes "
                + "(tutor_id, class_name, normalized_class_name, subject, class_level, status) "
                + "VALUES (?, ?, ?, ?, ?, ?)",
            tutorId,
            className,
            normalizedClassName,
            "Science",
            "P5",
            status
        );
        Long id = jdbcTemplate.queryForObject(
            "SELECT id FROM tutor_classes WHERE tutor_id = ? AND normalized_class_name = ?",
            Long.class,
            tutorId,
            normalizedClassName
        );
        if (id == null) {
            throw new IllegalStateException("Inserted class was not found");
        }
        return id;
    }

    private int tableCount(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES "
                + "WHERE TABLE_SCHEMA = 'PUBLIC' AND LOWER(TABLE_NAME) = ?",
            Integer.class,
            tableName
        );
        return count == null ? 0 : count;
    }

    private long versionedMigrationCount() {
        return java.util.Arrays.stream(flyway.info().applied())
            .filter(migration -> migration.getVersion() != null)
            .count();
    }

    private Properties loadProductionProperties() throws IOException {
        Path propertiesPath = Path.of(
            System.getProperty("basedir"),
            "src/main/resources/application.properties"
        );
        Properties properties = new Properties();
        try (InputStream input = Files.newInputStream(propertiesPath)) {
            properties.load(input);
        }
        return properties;
    }

    private void assertRequiredPlaceholder(
            Properties properties,
            String propertyName,
            String expectedPlaceholder) {
        String configuredValue = properties.getProperty(propertyName);
        assertEquals(expectedPlaceholder, configuredValue);
        assertThrows(
            IllegalArgumentException.class,
            () -> new MockEnvironment().resolveRequiredPlaceholders(configuredValue)
        );
    }
}
