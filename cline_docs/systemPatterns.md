# System Patterns

## How the System is Built

The system is a Java application built using the Spring Boot framework. It follows a standard layered architecture:

1.  **Controller Layer (`ActionCodeController`):** Exposes RESTful endpoints (`@RestController`). Handles incoming HTTP requests and delegates processing to the service layer. Responsible for mapping service results to HTTP responses (Spring Boot handles JSON serialization).
2.  **Service Layer (`ActionCodeService`):** Contains the core business logic (`@Service`). Responsible for:
    *   Fetching the API manifest JSON from a configured URL using a REST client.
    *   Parsing the fetched manifest.
    *   Fetching individual OpenAPI specification content from URLs specified in the manifest using a REST client.
    *   Parsing the fetched OpenAPI content using `swagger-parser`.
    *   Extracting and transforming data from the parsed schemas and manifest.
    *   Mapping extracted data into Data Transfer Objects (DTOs).
    *   Handling errors during HTTP fetching and parsing.
3.  **Data Transfer Objects (DTOs):** Plain Old Java Objects (POJOs) located in the `*.dto` package. Used to structure the data returned by the service and controller layers, specifically for the `/action-codes` endpoint response. Key DTOs include `ActionCodeInfo`, `PathPropertyListMap`, `ParameterInfo`, and `RequestBodyColumnInfo`.

## Key Technical Decisions

*   **OpenAPI Specification Parsing:** The `io.swagger.parser.v3:swagger-parser` library is used to parse OpenAPI v3 specification files. This library handles the resolution of local `$ref` pointers automatically.
*   **Request Body Flattening:** A recursive approach is employed within the `ActionCodeService` to traverse the nested structure of request body schemas defined in the OpenAPI files. This process flattens the structure into a list of `RequestBodyColumnInfo` objects, capturing the technical name, mandatory status, and a derived path string for each field.
*   **Manifest-Driven Processing:** The service uses a fetched JSON manifest as a central source to discover the relevant OpenAPI schema URLs and associated metadata (`componentName`, `actionCode`).
*   **HTTP Client:** A REST client (e.g., Spring's `RestTemplate` or `WebClient`) is used to fetch the manifest and OpenAPI schemas from configured URLs.
*   **Spring Boot for Web Layer:** Standard Spring Boot features (`@RestController`, `@GetMapping`, automatic JSON serialization) are used for the web layer.
*   **Dependency Management:** Maven is used for managing project dependencies and the build lifecycle.

## Architecture Patterns

*   **Layered Architecture:** Clear separation of concerns between Controller, Service, and DTO layers.
*   **Dependency Injection:** Spring's dependency injection is used (e.g., injecting `ActionCodeService` into `ActionCodeController`).
*   **Service Facade:** The `ActionCodeService` acts as a facade, orchestrating the parsing and data transformation logic.
*   **DTO Pattern:** Used for transferring data between layers and structuring the API response.
