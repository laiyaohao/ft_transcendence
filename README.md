*The project has been created as part of the 42 curriculum by lkoh, lwin, pzaw, tyingchu, ylai.*
# ft_transcendence

## Descriptions

Someone add description here please

## Instructions

### Prerequisites

- Docker Engine (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- Make utility

### Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ft_transcendence
   ```
   

2. **Configure environment file:**
   The project uses environmental variables stored in the [`.env`] file. Ensure the following variables are defined:
   - `POSTGRES_USER`
   - `POSTGRES_PW`
   - `POSTGRES_DB`

3. **For local backend development:**
   Spring Boot will use environmental variables stored in the [`./backend/<service_name>/src/main/resources/application-local.properties`] file. Ensure the following variables are defined the same as above:
   - `spring.datasource.username` same as `POSTGRES_USER` above
   - `spring.datasource.password` same as `POSTGRES_PW` above
   - `spring.datasource.url` same as `POSTGRES_DB` above

   Then, in the `backend` directory, run the following command to start the backend server locally:

   ```bash
   ./mvnw spring-boot:run -Dspring-boot.run.profiles=local
   ```

   Alternatively, the backend can also be set up using Docker. Uncomment the following lines in `./compose.yaml`:

   ```Dockerfile
   auth-service:
    build: ./backend/auth-service
    ports:
      - "8081:8081"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      # These override the application.properties values
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/${POSTGRES_DB}
      - SPRING_DATASOURCE_USERNAME=${POSTGRES_USER}
      - SPRING_DATASOURCE_PASSWORD=${POSTGRES_PW}
   ```


3. **Build and start the services:**
   ```bash
   make up
   ```