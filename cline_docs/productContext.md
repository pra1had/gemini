# Product Context

## Why This Project Exists

The Scenario Workbench is a web application designed to help Product Owners (POs) and Quality Assurance (QA) teams collaboratively define and manage business and test scenarios involving sequences of backend API calls. The application aims to replace unstructured methods (like manual Excel editing) with a dedicated tool.

## What Problems It Solves

1. **Structured Scenario Definition:**
   - Enables structured capture of business/test scenarios by POs and QAs
   - Links scenario definitions directly to automated testing via Concordion Markdown
   - Reduces rework in requirement definition and test creation
   - Shortens test scenario creation time
   - Accelerates delivery feedback loops through Git integration

2. **User Experience:**
   - Provides an Excel-like interface familiar to business users
   - Simplifies API interaction through user-friendly "Actions"
   - Facilitates collaboration between POs and QAs
   - Integrates seamlessly with existing Git and Concordion workflows

3. **Backend Utility:**
   - Simplifies construction of complex API request DTOs
   - Provides structured, tabular descriptions of target APIs
   - Enables dynamic UI generation based on OpenAPI specifications

## How It Should Work

### Backend Service (`backend/`)

1. **Manifest Fetching:** The service fetches a central manifest JSON from a configured HTTP endpoint. This manifest lists different components and the URLs for the OpenAPI schema associated with each "action code" (API endpoint).

2. **OpenAPI Fetching & Parsing:** For each action code listed in the fetched manifest, the service fetches the corresponding OpenAPI specification from its specified URL using a REST client. It then uses the `swagger-parser` library to parse the fetched schema content. The parser handles `$ref` resolution (potentially including remote references if configured).

3. **`/api/actions` Endpoint:** The service exposes a single GET endpoint `/api/actions` specifically for the frontend Scenario Workbench UI. 

4. **Structured JSON Response:** When called, the `/api/actions` endpoint returns a JSON array. Each object in the array represents an "action code" and contains structured information extracted and mapped from the OpenAPI specification and the manifest file. This includes:
   - `componentName`: The logical grouping of the API
   - `actionCode`: The specific API operation identifier
   - `actionCodeGroupName`: A category tag for the action
   - `endPoint`: The relative URL path of the target API
   - `type`: The nature of the operation ("PostAndVerify" for POST, "FetchAndVerify" for GET)
   - `pathPropertyListMap`: Lists of required path and query parameters
   - `RequestBodyColumnList`: A flattened list of all potential fields within the request body schema
   - `ResponseBodyColumnList`: A flattened list of all potential fields within the response body schema

5. **Assumptions:**
   - Each OpenAPI file defines exactly one path
   - The `actionCodeGroupName` is taken from the first tag in the operation's `tags` array
   - The service relies on `swagger-parser` to handle `$ref` pointers within the fetched schemas

### Frontend Application (`src/`)

1. **Scenario Management:**
   - Create new scenarios via the UI
   - Search/Filter existing scenarios (reading Markdown from Git)
   - View existing scenarios
   - Edit existing scenarios
   - Save scenarios (initiates Git PR workflow)
   - Delete scenarios (TBD)
   - Duplicate scenarios

2. **Scenario Building:**
   - Display available Actions from backend in a categorized list
   - Add Actions as steps to a "Flow" panel
   - Reorder steps within the flow
   - Remove steps from the flow
   - Expand steps for data entry
   - Excel-like grid for data entry
   - Review and save scenarios
   - Export to Excel format

3. **User Roles:**
   - **Product Owner (PO):** Create, Read, Update, Delete, Export, Save (Git PR), Duplicate
   - **Quality Assurance (QA):** Same permissions as PO
   - **Developer:** Read and Export only

4. **Key Features:**
   - Excel-like data entry experience
   - Git integration for version control
   - Concordion-compatible Markdown generation
   - Role-based access control
   - Standard Excel export option

5. **Non-Goals (V1):**
   - Direct test execution (generates files for external Concordion runner)
   - Target API authentication handling
   - API lifecycle management
   - Dynamic data extraction between steps
