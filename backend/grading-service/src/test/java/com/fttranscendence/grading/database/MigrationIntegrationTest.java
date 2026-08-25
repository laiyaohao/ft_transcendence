package com.fttranscendence.grading.database;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.env.MockEnvironment;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
class MigrationIntegrationTest {

    @Autowired private Flyway flyway;
    @Autowired private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void clearSubmissions() {
        jdbcTemplate.update("DELETE FROM submission_missing_keywords");
        jdbcTemplate.update("DELETE FROM submissions");
    }

    @Test
    void cleanDatabaseContainsTheFlywayManagedGradingSchema() {
        assertEquals(1, tableCount("submissions"));
        assertEquals(1, tableCount("submission_missing_keywords"));
        assertEquals(1, versionedMigrationCount());
        assertEquals("1", flyway.info().current().getVersion().getVersion());
    }

    @Test
    void applyingMigrationsAgainIsANoOp() {
        long appliedBefore = versionedMigrationCount();

        flyway.migrate();

        assertEquals(appliedBefore, versionedMigrationCount());
        assertEquals(1, tableCount("submissions"));
        assertEquals(1, tableCount("submission_missing_keywords"));
    }

    @Test
    void missingKeywordsAreRemovedWhenTheirSubmissionIsDeleted() {
        jdbcTemplate.update(
            "INSERT INTO submissions (student_id, question_id, correctness) VALUES (?, ?, ?)",
            42L,
            "question-1",
            "Incorrect"
        );
        Long submissionId = jdbcTemplate.queryForObject(
            "SELECT id FROM submissions WHERE student_id = ?",
            Long.class,
            42L
        );
        jdbcTemplate.update(
            "INSERT INTO submission_missing_keywords (submission_id, keyword) VALUES (?, ?)",
            submissionId,
            "conduction"
        );

        jdbcTemplate.update("DELETE FROM submissions WHERE id = ?", submissionId);

        Integer keywordCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM submission_missing_keywords WHERE submission_id = ?",
            Integer.class,
            submissionId
        );
        assertEquals(0, keywordCount);
    }

    @Test
    void productionConfigurationRequiresDatabaseAndAiEnvironmentValues()
            throws IOException {
        Properties properties = loadProductionProperties();

        assertEquals("validate", properties.getProperty("spring.jpa.hibernate.ddl-auto"));
        assertRequiredPlaceholder(properties, "spring.datasource.url", "${GRADING_DB_URL}");
        assertRequiredPlaceholder(properties, "spring.datasource.username", "${GRADING_DB_USERNAME}");
        assertRequiredPlaceholder(properties, "spring.datasource.password", "${GRADING_DB_PASSWORD}");
        assertRequiredPlaceholder(properties, "jwt.secret", "${JWT_SECRET}");
        assertRequiredPlaceholder(properties, "ai.engine.url", "${AI_ENGINE_URL}");
        assertRequiredPlaceholder(properties, "ai.engine.model", "${AI_ENGINE_MODEL}");
        assertRequiredPlaceholder(properties, "ai.engine.api-key", "${AI_ENGINE_API_KEY}");
        assertRequiredPlaceholder(properties, "ai.vision.model", "${AI_VISION_MODEL}");
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
