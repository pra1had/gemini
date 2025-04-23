# System Patterns

## Backend Service (`backend/`)

### How the System is Built

The system is a Java application built using the Spring Boot framework. It follows a standard layered architecture:

1. **Controller Layer (`*.controller`):**
   - Exposes RESTful endpoints (`@RestController`)
   - Handles incoming HTTP requests and delegates to services
   - Maps service results to HTTP responses
   - Key Controllers:
     - `ActionCodeController`: Provides Action List API
     - `ScenarioPersistenceController`: Handles scenario save/load
     - `HealthController`: System health checks

2. **Service Layer (`*.service`):**
   - Contains core business logic (`@Service`)
   - Key Services:
     - `ActionCodeService`: Handles manifest and OpenAPI processing
     - `ScenarioPersistenceService`: Manages scenario state
   - Responsibilities:
     - Fetching and parsing API manifest JSON
     - Fetching and parsing OpenAPI specifications
     - Extracting and transforming schema data
     - Managing scenario persistence
     - Error handling during HTTP/parsing operations

3. **Data Transfer Objects (`*.dto`):**
   - Plain Old Java Objects (POJOs)
   - Structure data between layers
   - Key DTOs:
     - Action-related: `ActionCodeInfo`, `PathPropertyListMap`, `ParameterInfo`, `RequestBodyColumnInfo`, `ResponseBodyColumnInfo`
     - Scenario-related: `ScenarioDto`, `ScenarioStepDto`, `ScenarioStepDataDto`

### Key Technical Decisions

1. **OpenAPI Processing:**
   - Uses `io.swagger.parser.v3:swagger-parser` for OpenAPI v3 parsing
   - Automatic `$ref` pointer resolution
   - Validates one path per schema requirement

2. **Schema Flattening:**
   - Recursive traversal of nested structures
   - Generic flattening logic for both request/response bodies
   - Preserves field relationships via path strings

3. **HTTP Client:**
   - Spring's REST client for external HTTP calls
   - Configurable timeouts and error handling
   - Used for manifest and schema fetching

4. **Persistence Strategy:**
   - Initial: In-memory storage (`ConcurrentHashMap`)
   - Final: Git-based storage via GitHub API
   - Markdown as the persistence format

5. **Spring Boot Features:**
   - Automatic JSON serialization
   - Built-in health checks
   - Dependency injection
   - Configuration management

### Architecture Patterns

1. **Core Patterns:**
   - Layered Architecture (Controller, Service, DTO)
   - Dependency Injection (Spring)
   - Service Facade (`ActionCodeService`, `ScenarioPersistenceService`)
   - DTO Pattern for data transfer

2. **Integration Patterns:**
   - HTTP Client Pattern (manifest/schema fetching)
   - API Gateway Pattern (`/api/actions` endpoint)
   - File Generator Pattern (Markdown/Excel)

3. **Error Handling:**
   - Global exception handling
   - Consistent error response format
   - Graceful degradation

4. **Testing Patterns:**
   - Unit Testing with Mocks
   - Integration Testing with RestAssured
   - HTTP Mocking with WireMock

---

## Frontend Application (`src/`) - Scenario Workbench UI

### How the System is Built

1. **Framework Layer:**
   - Next.js (App Router) for routing and rendering
   - Server Components for static content
   - Client Components for interactive features

2. **UI Component Layer:**
   - React components in `src/components/`
   - Material UI v6 for base components
   - Custom components for specific features:
     - `Layout.tsx`: Main application structure
     - `CreateEditPageComponent.tsx`: Scenario building
     - `SortableStepItem.tsx`: Step management
     - `StepDataGrid.tsx`: Data entry

3. **State Management Layer:**
   - Zustand store (`scenarioStore.ts`)
   - Manages scenario building state
   - Handles API interactions via `apiClient.ts`

4. **Routing Layer:**
   - Next.js App Router in `src/app/`
   - Main routes:
     - `/`: Search/list scenarios
     - `/create`: New scenario
     - `/edit/[scenarioId]`: Edit existing
     - Review view (planned)

5. **API Integration Layer:**
   - Centralized API client (`apiClient.ts`)
   - Handles all backend communication
   - Manages request/response formatting

### Key Technical Decisions

1. **Framework Selection:**
   - Next.js App Router for modern features
   - TypeScript for type safety
   - Material UI for consistent design

2. **State Management:**
   - Zustand over Redux for simplicity
   - Centralized store for scenario state
   - Minimal boilerplate approach

3. **UI Components:**
   - Custom Excel-like grid component
   - Drag-and-drop using `dnd-kit`
   - MUI theme customization

4. **Data Flow:**
   - Unidirectional data flow
   - Implicit save within steps
   - Explicit final save to backend

### Architecture Patterns

1. **Core Patterns:**
   - Component-Based Architecture
   - Client-Side State Management
   - Service Layer Pattern (`apiClient.ts`)
   - App Router Pattern (Next.js)

2. **UI Patterns:**
   - Compound Components
   - Container/Presenter Pattern
   - Grid System Pattern
   - Theme Provider Pattern

3. **State Patterns:**
   - Store Pattern (Zustand)
   - Observer Pattern (state subscriptions)
   - Command Pattern (actions)

4. **Integration Patterns:**
   - API Client Pattern
   - Error Boundary Pattern
   - Loading State Pattern

5. **User Experience Patterns:**
   - Progressive Disclosure
   - Inline Editing
   - Drag and Drop
   - Form Validation
   - Toast Notifications (planned)
