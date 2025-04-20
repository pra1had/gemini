# Product Context

## Why This Project Exists

This project provides a backend utility service designed to support a separate frontend system.

## What Problems It Solves

The primary goal is to simplify the process for the frontend system to construct complex API request Data Transfer Objects (DTOs). It achieves this by providing a structured, tabular description of various target APIs based on their OpenAPI specifications. The frontend can use this structured information to dynamically build user interfaces or forms for creating API requests.

## How It Should Work

1.  **Manifest Fetching:** The service fetches a central manifest JSON from a configured HTTP endpoint. This manifest lists different components and the URLs for the OpenAPI schema associated with each "action code" (API endpoint).
2.  **OpenAPI Fetching & Parsing:** For each action code listed in the fetched manifest, the service fetches the corresponding OpenAPI specification from its specified URL using a REST client. It then uses the `swagger-parser` library to parse the fetched schema content. The parser handles `$ref` resolution (potentially including remote references if configured).
3.  **`/action-codes` Endpoint:** The service exposes a single GET endpoint: `/action-codes`.
4.  **Structured JSON Response:** When called, the `/action-codes` endpoint returns a JSON array. Each object in the array represents an "action code" and contains structured information extracted and mapped from the OpenAPI specification and the manifest file. This includes:
    *   `componentName`: The logical grouping of the API.
    *   `actionCode`: The specific API operation identifier.
    *   `actionCodeGroupName`: A category tag for the action.
    *   `endPoint`: The relative URL path of the target API.
    *   `type`: The nature of the operation ("PostAndVerify" for POST, "FetchAndVerify" for GET).
    *   `pathPropertyListMap`: Lists of required path and query parameters, including their names, mandatory status, and descriptions (used as `derivedDataType`).
    *   `RequestBodyColumnList`: A flattened list of all potential fields within the request body schema. Each item includes the technical name, mandatory status, and a derived data type path indicating its position in the original nested structure (e.g., `:props:effectiveFrom`). This flattening handles nested objects and arrays.
5.  **Assumptions:**
    *   Each OpenAPI file defines exactly one path.
    *   The `actionCodeGroupName` is taken from the first tag in the operation's `tags` array.
    *   The service relies on `swagger-parser` to handle `$ref` pointers within the fetched schemas.
