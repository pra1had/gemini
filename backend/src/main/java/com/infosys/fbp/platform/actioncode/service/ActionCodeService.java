package com.infosys.fbp.platform.actioncode.service;

// import com.fasterxml.jackson.core.type.TypeReference; // No longer needed
import com.fasterxml.jackson.databind.ObjectMapper;
import com.infosys.fbp.platform.actioncode.dto.*; // Keep existing DTO imports
import com.infosys.fbp.platform.actioncode.dto.ApiListManifest; // Add import for new DTO
import com.infosys.fbp.platform.actioncode.dto.ComponentDetail; // Add import for new DTO
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.media.ArraySchema;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.parameters.Parameter;
import io.swagger.v3.oas.models.parameters.RequestBody;
import io.swagger.v3.parser.OpenAPIV3Parser;
import io.swagger.v3.parser.core.models.ParseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired; // Add import
import org.springframework.beans.factory.annotation.Value; // Add import
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException; // Add import
import org.springframework.web.client.RestTemplate;
// import org.springframework.util.ResourceUtils; // Already removed

// import java.io.File; // No longer needed for schema parsing
import java.io.IOException;
import java.net.URI; // Add import
import java.net.URISyntaxException; // Add import
import java.util.ArrayList;
import java.util.Collections; // Added import
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j // Lombok annotation for logging
public class ActionCodeService {

    // private static final String DOCS_BASE_PATH = "classpath:docs/"; // Remove constant

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final String baseUrl; // Renamed from apiListUrl
    private final String apiListContextPath; // New field

    // Constructor Injection
    @Autowired
    public ActionCodeService(ObjectMapper objectMapper, RestTemplate restTemplate,
                             @Value("${manifest.base.url}") String baseUrl, // Inject base URL
                             @Value("${manifest.api-list.context-path}") String apiListContextPath) { // Inject context path
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl; // Assign base URL
        this.apiListContextPath = apiListContextPath; // Assign context path
    }


    public List<ActionCodeInfo> generateActionCodeList() {
        List<ActionCodeInfo> actionCodeInfos = new ArrayList<>();
        ApiListManifest apiListManifest; // Use the new DTO
        String fullApiListUrl = null; // Variable for the full URL

        // 1. Construct and fetch the manifest file (apiList.json) from the configured URL
        try {
            // Construct the full URL for the API list
            URI baseUriForManifest = new URI(baseUrl);
            fullApiListUrl = baseUriForManifest.resolve(apiListContextPath).toString();

            log.info("Fetching API list manifest from URL: {}", fullApiListUrl);
            String jsonResponse = restTemplate.getForObject(fullApiListUrl, String.class);
            if (jsonResponse == null) {
                 log.error("Received null response when fetching API list from URL: {}", fullApiListUrl);
                 return Collections.emptyList(); // Or throw exception
            }
            apiListManifest = objectMapper.readValue(jsonResponse, ApiListManifest.class);
        } catch (URISyntaxException e) {
             log.error("Invalid URI syntax for base URL '{}' or context path '{}'", baseUrl, apiListContextPath, e);
             return Collections.emptyList();
        } catch (RestClientException e) {
            log.error("Failed to fetch API list manifest from URL: {}", fullApiListUrl, e);
            return Collections.emptyList(); // Return empty list on HTTP error
        } catch (IOException e) {
            log.error("Failed to parse API list manifest JSON fetched from URL: {}", fullApiListUrl, e);
            return Collections.emptyList(); // Return empty list on parsing error
        }

        // 2. Iterate through components using the DTO getters
        apiListManifest.getComponents().forEach((componentName, componentDetail) -> {

            // Iterate over the apiSchemas map from the ComponentDetail DTO
            componentDetail.getApiSchemas().forEach((actionCode, schemaPath) -> {
                URI schemaUri = null;
                String schemaJsonContent = null;
                OpenAPI openAPI = null;
                try {
                    // 3. Construct the full URL for the schema file using the base URL
                    URI baseUriForSchema = new URI(baseUrl);
                    // Resolve the schemaPath relative to the base URL
                    schemaUri = baseUriForSchema.resolve(schemaPath); // Resolve relative to base URL

                    log.info("Fetching schema '{}' from URL: {}", actionCode, schemaUri);
                    schemaJsonContent = restTemplate.getForObject(schemaUri, String.class);

                    if (schemaJsonContent == null) {
                        log.error("Received null response when fetching schema '{}' from URL: {}", actionCode, schemaUri);
                        return; // Skip this schema
                    }

                    // 4. Parse the schema content directly from the string with dereferencing enabled
                    ParseOptions parseOptions = new ParseOptions();
                    parseOptions.setResolve(true); // Enable resolution of $refs
                    // The readContents method returns a ParseResult object
                    openAPI = new OpenAPIV3Parser().readContents(schemaJsonContent, null, parseOptions).getOpenAPI();

                    if (openAPI == null) {
                         log.warn("Could not parse OpenAPI schema content fetched from {}", schemaUri);
                         return; // Skip this schema if parsing failed
                    }
                    if (openAPI.getPaths() == null || openAPI.getPaths().isEmpty()) {
                        log.warn("No paths found in OpenAPI schema fetched from {}", schemaUri);
                        return; // Skip this schema if no paths defined
                    }

                    // Validate that exactly one path exists, as per assumption
                    if (openAPI.getPaths().size() != 1) {
                        log.warn("Expected exactly one path in OpenAPI schema fetched from {}, but found {}. Skipping this schema.", schemaUri, openAPI.getPaths().size());
                        return; // Skip this schema
                    }

                    // Assuming only one path per file as per caveat - Now validated above
                    Map.Entry<String, PathItem> pathEntry = openAPI.getPaths().entrySet().iterator().next();
                    String endpointPath = pathEntry.getKey();
                    PathItem pathItem = pathEntry.getValue();

                    // Determine operation type (POST or GET) and get the Operation object
                    Operation operation = null;
                    String httpMethod = null;
                    if (pathItem.getPost() != null) {
                        operation = pathItem.getPost();
                        httpMethod = "POST";
                    } else if (pathItem.getGet() != null) {
                        operation = pathItem.getGet();
                        httpMethod = "GET";
                    } else {
                        log.warn("No POST or GET operation found in path {} for schema {}", endpointPath, schemaPath);
                        return; // Skip if no supported operation
                    }

                    ActionCodeInfo info = new ActionCodeInfo();
                    info.setComponentName(componentName);
                    info.setActionCode(actionCode);

                    // 4. Extract Fields
                    info.setEndPoint(endpointPath);
                    info.setType(determineType(httpMethod));
                    info.setActionCodeGroupName(extractGroupName(operation));

                    // 5. Process Path and Query Parameters
                    processParameters(operation.getParameters(), info.getPathPropertyListMap());

                    // 7. Process Request Body
                    if (operation.getRequestBody() != null) {
                        List<RequestBodyColumnInfo> requestBodyColumns = processRequestBody(operation.getRequestBody(), openAPI);
                        info.setRequestBodyColumnList(requestBodyColumns);
                    }

                    // 8. Process Response Body (New Step)
                    if (operation.getResponses() != null) {
                        List<ResponseBodyColumnInfo> responseBodyColumns = processResponseBody(operation, openAPI);
                        info.setResponseBodyColumnList(responseBodyColumns);
                    }


                    actionCodeInfos.add(info);

                } catch (URISyntaxException e) {
                    log.error("Invalid URI syntax for base URL '{}' or schema path '{}'", baseUrl, schemaPath, e); // Use baseUrl in log
                } catch (RestClientException e) {
                    log.error("Failed to fetch schema '{}' from URL: {}", actionCode, schemaUri, e);
                } catch (Exception e) { // Catch broader exceptions during processing
                    log.error("Error processing schema '{}' fetched from URL {}: {}", actionCode, schemaUri, e.getMessage(), e);
                }
            });
        });

        return actionCodeInfos;
    }

    private String determineType(String httpMethod) {
        if ("POST".equalsIgnoreCase(httpMethod)) {
            return "PostAndVerify";
        } else if ("GET".equalsIgnoreCase(httpMethod)) {
            return "FetchAndVerify";
        }
        return "Unknown";
    }

    private String extractGroupName(Operation operation) {
        if (operation != null && operation.getTags() != null && !operation.getTags().isEmpty()) {
            return operation.getTags().get(0); // Get first tag as group name
        }
        return "DefaultGroup"; // Or handle as needed
    }

    private void processParameters(List<Parameter> parameters, PathPropertyListMap propertyMap) {
        if (parameters == null) return;

        parameters.forEach(param -> {
            ParameterInfo paramInfo = new ParameterInfo();
            paramInfo.setTechnicalColumnName(param.getName());
            paramInfo.setMandatory(Boolean.TRUE.equals(param.getRequired())); // Handle null case
            paramInfo.setDerivedDataType(param.getDescription()); // Use description as per plan

            if ("path".equalsIgnoreCase(param.getIn())) {
                propertyMap.getPathParamList().add(paramInfo);
            } else if ("query".equalsIgnoreCase(param.getIn())) {
                propertyMap.getQueryParamList().add(paramInfo);
            }
        });
    }

    private List<RequestBodyColumnInfo> processRequestBody(RequestBody requestBody, OpenAPI openAPI) {
        List<RequestBodyColumnInfo> columns = new ArrayList<>();
        if (requestBody.getContent() == null || !requestBody.getContent().containsKey("application/json")) {
            return columns; // No JSON request body defined
        }

        Schema<?> requestSchema = requestBody.getContent().get("application/json").getSchema();

        // Resolve top-level $ref if present
        if (requestSchema.get$ref() != null) {
            requestSchema = findSchemaByRef(requestSchema.get$ref(), openAPI);
            if (requestSchema == null) return columns; // Could not resolve ref
        }

        // Find the actual root data schema (handling wrapper like ApiSingleRequestDemandCode)
        Schema<?> rootDataSchema = findActualDataSchema(requestSchema, openAPI);
        if (rootDataSchema == null) {
             log.warn("Could not determine root data schema for request body.");
             return columns;
        }

        // Start flattening from the root data schema using the generic method
        flattenSchemaGeneric(rootDataSchema, openAPI, "", columns, Optional.ofNullable(rootDataSchema.getRequired()), ":request"); // Use generic method

        return columns;
    }

    // Helper to find the actual data schema, potentially unwrapping an array/object wrapper
    private Schema<?> findActualDataSchema(Schema<?> initialSchema, OpenAPI openAPI) {
         if (initialSchema == null) return null;

         // If it's an array, look at items
         if (initialSchema instanceof ArraySchema) {
             Schema<?> itemsSchema = ((ArraySchema) initialSchema).getItems();
             if (itemsSchema.get$ref() != null) {
                 return findSchemaByRef(itemsSchema.get$ref(), openAPI);
             }
             return itemsSchema; // Assuming direct schema definition in items
         }

         // If it's an object with a single property often named 'request' or 'data'
         if ("object".equals(initialSchema.getType()) && initialSchema.getProperties() != null && initialSchema.getProperties().size() == 1) {
             Schema<?> potentialDataSchema = initialSchema.getProperties().values().iterator().next();
              // If this property is an array, look inside its items
             if (potentialDataSchema instanceof ArraySchema) {
                 Schema<?> itemsSchema = ((ArraySchema) potentialDataSchema).getItems();
                 if (itemsSchema.get$ref() != null) {
                     return findSchemaByRef(itemsSchema.get$ref(), openAPI);
                 }
                 return itemsSchema;
             } else if (potentialDataSchema.get$ref() != null) {
                 return findSchemaByRef(potentialDataSchema.get$ref(), openAPI);
             }
             return potentialDataSchema; // Return the schema of the single property
         }

         // Otherwise, assume the initial schema is the data schema
         return initialSchema;
    }

    // --- New Method to Process Response Body ---
    private List<ResponseBodyColumnInfo> processResponseBody(Operation operation, OpenAPI openAPI) {
        List<ResponseBodyColumnInfo> columns = new ArrayList<>();
        if (operation.getResponses() == null) {
            return columns;
        }

        // Find a success response, prioritizing 200, then 201, then default
        io.swagger.v3.oas.models.responses.ApiResponse apiResponse = operation.getResponses().get("200");
        if (apiResponse == null) {
             apiResponse = operation.getResponses().get("201"); // Check for 201
        }
        if (apiResponse == null) {
             // Try default if 200 and 201 are not present
             apiResponse = operation.getResponses().getDefault();
        }

        if (apiResponse == null || apiResponse.getContent() == null || !apiResponse.getContent().containsKey("application/json")) {
            log.debug("No '200', '201', or 'default' JSON response schema found for operation."); // Updated log message
            return columns; // No suitable JSON response schema defined
        }

        Schema<?> responseSchema = apiResponse.getContent().get("application/json").getSchema();

        // Resolve top-level $ref if present
        if (responseSchema.get$ref() != null) {
            responseSchema = findSchemaByRef(responseSchema.get$ref(), openAPI);
            if (responseSchema == null) return columns; // Could not resolve ref
        }

        // Find the actual root data schema (reuse existing helper)
        Schema<?> rootDataSchema = findActualDataSchema(responseSchema, openAPI);
        if (rootDataSchema == null) {
             log.warn("Could not determine root data schema for response body.");
             return columns;
        }

        // Start flattening from the root data schema using the generic flatten method
        flattenSchemaGeneric(rootDataSchema, openAPI, "", columns, Optional.ofNullable(rootDataSchema.getRequired()), ":response");

        return columns;
    }
    // --- End New Method ---


    // Recursive function to flatten the schema - Made Generic
    // Accepts List<?> and creates specific DTO type based on pathPrefix
    private void flattenSchemaGeneric(Schema<?> schema, OpenAPI openAPI, String currentPath, List columns, Optional<List<String>> parentRequired, String pathPrefix) {
        if (schema == null) return;

        // Resolve $ref if necessary
        if (schema.get$ref() != null) {
            Schema<?> resolvedSchema = findSchemaByRef(schema.get$ref(), openAPI);
            if (resolvedSchema != null) {
                // Use the resolved schema's required list if it exists
                flattenSchemaGeneric(resolvedSchema, openAPI, currentPath, columns, Optional.ofNullable(resolvedSchema.getRequired()), pathPrefix); // Pass prefix
            } else {
                log.warn("Could not resolve schema reference: {}", schema.get$ref());
            }
            return; // Stop processing the $ref schema itself
        }

        if (schema.getProperties() != null) {
            schema.getProperties().forEach((propertyName, propertySchema) -> {
                String newPath = currentPath + ":" + propertyName;
                boolean isMandatory = parentRequired.orElse(Collections.emptyList()).contains(propertyName); // Use emptyList for default

                // Resolve property schema ref if needed
                 Schema<?> actualPropertySchema = propertySchema;
                 if (propertySchema.get$ref() != null) {
                     actualPropertySchema = findSchemaByRef(propertySchema.get$ref(), openAPI);
                     if (actualPropertySchema == null) {
                         log.warn("Could not resolve property schema reference: {}", propertySchema.get$ref());
                         return; // Skip this property if ref cannot be resolved
                     }
                 }


                if (actualPropertySchema instanceof ArraySchema) {
                    // If it's an array, recurse on its items schema
                    Schema<?> itemsSchema = ((ArraySchema) actualPropertySchema).getItems();
                     // Pass the 'required' list of the *array's items schema* if it exists
                    flattenSchemaGeneric(itemsSchema, openAPI, newPath , columns, Optional.ofNullable(itemsSchema.getRequired()), pathPrefix); // Pass prefix
                } else if (actualPropertySchema.getProperties() != null || actualPropertySchema.get$ref() != null) {
                    // If it's an object (or a ref that resolves to one), recurse
                     // Pass the 'required' list of the *object schema itself*
                    flattenSchemaGeneric(actualPropertySchema, openAPI, newPath, columns, Optional.ofNullable(actualPropertySchema.getRequired()), pathPrefix); // Pass prefix
                } else {
                    // Basic type, add to list - Create appropriate DTO type
                    String derivedDataType = calculateDerivedDataType(newPath, pathPrefix);

                    if (":request".equals(pathPrefix)) {
                        RequestBodyColumnInfo columnInfo = new RequestBodyColumnInfo();
                        columnInfo.setTechnicalColumnName(propertyName);
                        columnInfo.setMandatory(isMandatory);
                        columnInfo.setDerivedDataType(derivedDataType);
                        columns.add(columnInfo);
                    } else if (":response".equals(pathPrefix)) {
                        ResponseBodyColumnInfo columnInfo = new ResponseBodyColumnInfo();
                        columnInfo.setTechnicalColumnName(propertyName);
                        // Note: 'mandatory' for response might mean 'defined' or 'always present'
                        // Use the 'isMandatory' flag derived from the parent schema's required list.
                        columnInfo.setMandatory(isMandatory); // Use the calculated mandatory status
                        columnInfo.setDerivedDataType(derivedDataType);
                        columns.add(columnInfo);
                    } else {
                         log.warn("Unknown path prefix '{}' during schema flattening.", pathPrefix);
                    }
                }
            });
        }
         // Handle cases where the schema itself is an array (e.g., request body is List<String>)
         else if (schema instanceof ArraySchema) {
             Schema<?> itemsSchema = ((ArraySchema) schema).getItems();
             // Recurse on items, path remains the same conceptually for the items within the root array
             flattenSchemaGeneric(itemsSchema, openAPI, currentPath, columns, Optional.ofNullable(itemsSchema.getRequired()), pathPrefix); // Pass prefix
         }
         // Potentially handle other schema types if necessary
    }

    // Helper to calculate derivedDataType consistently
    private String calculateDerivedDataType(String fullPath, String prefix) {
         int colonCount = fullPath.length() - fullPath.replace(":", "").length();
         if (colonCount <= 1) { // Top-level property (e.g., ":id") or empty path
             return prefix;
         } else { // Nested property (e.g., ":props:id")
             // Extract parent path (e.g., ":props" from ":props:id")
             String parentPath = fullPath.substring(0, fullPath.lastIndexOf(':'));
             // Construct the final path like ":request:props" or ":response:props"
             return prefix + parentPath; // parentPath already starts with ":"
         }
    }


    // Helper to find a schema by its $ref (#/components/schemas/SchemaName)
    private Schema<?> findSchemaByRef(String ref, OpenAPI openAPI) {
        if (ref == null || !ref.startsWith("#/components/schemas/")) {
            log.warn("Invalid or unsupported schema reference format: {}", ref);
            return null;
        }
        String schemaName = ref.substring("#/components/schemas/".length());
        if (openAPI.getComponents() == null || openAPI.getComponents().getSchemas() == null) {
             log.warn("No components/schemas found in the OpenAPI document to resolve ref: {}", ref);
            return null;
        }
        Schema<?> resolved = openAPI.getComponents().getSchemas().get(schemaName);
         if (resolved == null) {
             log.warn("Schema not found for reference: {}", ref);
         }
         return resolved;
    }
}
