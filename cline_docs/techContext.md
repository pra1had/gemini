# Technical Context

## Technologies Used

*   **Programming Language:** Java 17
*   **Framework:** Spring Boot 3.2.4 (including spring-boot-starter-web, spring-boot-starter-jdbc, spring-boot-devtools)
*   **Build Tool:** Apache Maven
*   **API Specification Parsing:** `io.swagger.parser.v3:swagger-parser:2.1.25` (for parsing OpenAPI v3 schemas)
*   **Utility Libraries:**
    *   Lombok (`org.projectlombok:lombok:1.18.30`): Reduces boilerplate code (e.g., getters, setters, constructors).
    *   Log4jdbc (`org.bgee.log4jdbc-log4j2:log4jdbc-log4j2-jdbc4.1:1.16`): For logging SQL queries.
    *   HTTP Client: Spring's `RestTemplate` or `WebClient` (provided by `spring-boot-starter-webflux` if using WebClient, or core Spring if using RestTemplate).
*   **Testing:**
    *   JUnit 5 (via `spring-boot-starter-test`)
    *   RestAssured (`io.rest-assured:rest-assured:5.4.0`): For testing REST APIs.
    *   WireMock (`com.github.tomakehurst:wiremock-jre8:3.0.1`): For mocking external HTTP services during testing.
*   **Database (for potential future use/testing):** H2 (`com.h2database:h2`) - In-memory database.

## Development Setup

*   **Build:** Use Maven commands (e.g., `mvn clean install`, `mvn spring-boot:run`).
*   **IDE:** Any Java IDE supporting Maven projects (e.g., IntelliJ IDEA, Eclipse, VS Code with Java extensions). Lombok plugin required for IDE support.
*   **Running the Application:** Execute the main application class (`com.infosys.fbp.platform.App`) or use `mvn spring-boot:run`. Spring Boot DevTools provides automatic restarts on code changes.
*   **Configuration:** Application properties are managed in `src/main/resources/application.properties`. This will include URLs for the manifest and potentially base URLs for schemas. Logging configuration is in `src/main/resources/log4jdbc.log4j2.properties`.

## Technical Constraints

*   The application must have network access to fetch the manifest and OpenAPI schemas from their configured URLs.
*   Appropriate configuration (e.g., timeouts, potentially authentication) for the HTTP client needs to be set up.
*   The `swagger-parser` library needs to handle `$ref` resolution within the fetched schemas (including potentially remote references if the schemas use them and the parser is configured to allow it).
*   The implementation relies on specific structures within the fetched manifest JSON and the OpenAPI schemas (e.g., exactly one path per schema, presence of tags). Deviations might require code adjustments.
