# Action Code Utility Service - Implementation Plan

This document outlines the plan for creating the backend utility service to generate action code information based on OpenAPI specifications.

**1. Project Setup & Technology Stack:**

*   The service will be implemented as part of the existing **Java/Spring Boot** application located in the `scenario-builder` directory.
*   All new Java code (Controllers, Services, DTOs) will be organized within the package `com.infosys.fbp.platform.actioncode`.
*   **Dependency Update:** The following dependency will be added to `scenario-builder/pom.xml` to handle OpenAPI parsing:
    ```xml
    <dependency>
        <groupId>io.swagger.parser.v3</groupId>
        <artifactId>swagger-parser</artifactId>
        <version>2.1.25</version>
    </dependency>
    ```

**2. Data Transfer Objects (DTOs):**

*   Java POJOs will be created in the `com.infosys.fbp.platform.actioncode.dto` package to represent the structure of the final JSON output (`docs/ActionCodeList.json`):
    *   `ActionCodeInfo`: Top-level object for each action code.
    *   `PathPropertyListMap`: Container for path and query parameter lists.
    *   `ParameterInfo`: Represents a single path or query parameter.
    *   `RequestBodyColumnInfo`: Represents a flattened attribute from the request body schema.

**3. Service Layer (`ActionCodeService`):**

*   A Spring `@Service` named `ActionCodeService` will be created in `com.infosys.fbp.platform.actioncode.service`.
*   **Initialization:** The service will read and parse the manifest file `docs/apiList.json` (e.g., during startup or on first request) and store its contents.
*   **Main Logic (`generateActionCodeList` method):**
    *   This method will iterate through the components and action codes defined in the parsed `apiList.json`.
    *   For each action code entry:
        *   Retrieve the corresponding OpenAPI schema file path (e.g., `docs/create-demandCode.json`).
        *   **Parse Schema:** Use `io.swagger.v3.parser.OpenAPIV3Parser().read(schemaFilePath)` to parse the OpenAPI file. The `swagger-parser` library will handle the resolution of local `$ref` pointers automatically.
        *   Instantiate an `ActionCodeInfo` DTO.
        *   **Extract Fields:** Populate the `ActionCodeInfo` DTO by extracting data from the parsed `OpenAPI` object and the `apiList.json` data:
            *   `componentName`, `actionCode`: From `apiList.json`.
            *   `actionCodeGroupName`: From the first element (`tags[0]`) in the `tags` array of the relevant `Operation` object within the parsed schema.
            *   `endPoint`: From the path string (key) in the `Paths` object of the parsed schema. (Assumes only one path per file).
            *   `type`: Determined by the HTTP method key associated with the `Operation` (`post` -> "PostAndVerify", `get` -> "FetchAndVerify").
            *   `pathPropertyListMap`: Process the `parameters` list within the `Operation`:
                *   Filter parameters where `in` equals "path" and map them to `ParameterInfo` objects in the `PathParamList`.
                *   Filter parameters where `in` equals "query" and map them to `ParameterInfo` objects in the `QueryParamList`.
                *   For each `ParameterInfo`: `technicalColumnName` = `parameter.getName()`, `isMandatory` = `parameter.getRequired()`, `derivedDataType` = `parameter.getDescription()`.
            *   `RequestBodyColumnList`: This requires a dedicated recursive helper function:
                *   **Locate Root Data Schema:** Navigate through the `requestBody` -> `content` -> `application/json` -> `schema`. Identify the actual data schema, often referenced via `$ref` within a wrapper schema (e.g., find the `$ref` like `#/components/schemas/DemandCode` inside the `items` of the `request` property of `ApiSingleRequestDemandCode`). Use the resolved `Schema` object corresponding to this reference (e.g., the `DemandCode` schema) as the starting point.
                *   **Flattening (Revised Logic):**
                    *   Implement a recursive function that takes the current `Schema` object, the parent schema's `required` list (for mandatory checks), and the current path prefix string as input.
                    *   Start the recursion with the *root data schema* identified above, an empty path prefix (e.g., ""), and its parent's `required` list (if applicable, often the wrapper schema's list).
                    *   Inside the recursive function:
                        *   Iterate through the `properties` of the current schema.
                        *   For each property (key-value pair where value is the property `Schema`):
                            *   Construct the `derivedDataType` path string by appending `:<propertyKey>` to the current path prefix.
                            *   Check if the property key exists in the parent's `required` list to determine `isMandatory`.
                            *   If the property `Schema` represents a basic type (e.g., `type: string`, `type: integer`), create a `RequestBodyColumnInfo` object with the `technicalColumnName` (property key), calculated `isMandatory`, and the constructed `derivedDataType` path. Add it to the results list.
                            *   If the property `Schema` is an array (`type: array`), recursively call the function with the schema from `items`, the current schema's `required` list (if applicable, or an empty list), and the updated path prefix.
                            *   If the property `Schema` is an object (`type: object`) or contains a `$ref` (which `swagger-parser` should have resolved), recursively call the function with this property `Schema`, its own `required` list, and the updated path prefix.
                *   Collect all generated `RequestBodyColumnInfo` objects into the final list for the `ActionCodeInfo` DTO.
        *   Add the fully populated `ActionCodeInfo` DTO to a result list.
*   The `generateActionCodeList` method returns the complete list of `ActionCodeInfo` DTOs.

**4. Controller Layer (`ActionCodeController`):**

*   A standard Spring Boot `@RestController` named `ActionCodeController` will be created in `com.infosys.fbp.platform.actioncode.controller`.
*   It will be annotated with `@RequestMapping("/api")` or similar base path if desired.
*   Inject the `ActionCodeService` via constructor injection.
*   Define a `@GetMapping("/action-codes")` endpoint method that calls `actionCodeService.generateActionCodeList()` and returns the result. Spring Boot will automatically handle JSON serialization.

**5. Error Handling & File Access:**

*   Implement try-catch blocks within the service layer to handle potential `IOException` during file reading and errors during OpenAPI parsing. Log errors appropriately.
*   Consider how the application will locate the `docs` directory. Placing it within `src/main/resources` would make it accessible via the classpath. Alternatively, configure an absolute or relative file path.

**Revised Assumptions & Caveats:**

*   The project uses Java/Spring Boot.
*   The `io.swagger.parser.v3:swagger-parser` library (version 2.1.25) will be used for parsing.
*   `derivedDataType` for path/query parameters is sourced from the `description` field of the parameter.
*   `derivedDataType` for request body columns represents the flattened path of keys, starting *from the properties of the root data schema* (excluding any wrapper schema names like 'request'), prefixed with colons (e.g., `:demandCode`, `:props`, `:props:effectiveFrom`).
*   Each OpenAPI schema file contains exactly one path definition under the `paths` object.
*   The `actionCodeGroupName` is derived from the *first* tag listed in the operation's `tags` array.
*   The `swagger-parser` library successfully resolves all necessary local `$ref` pointers within each schema file. External references are not considered.
