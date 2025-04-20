# Scenario Workbench Development Plan (Phased Approach)

## Overview
Scenario Workbench is a web application designed to help Product Owners (POs) and Quality Assurance (QA) teams collaboratively define and manage business and test scenarios involving sequences of backend API calls. It features an Excel-like UI for building scenarios using predefined "Actions" derived from OpenAPI specifications. The primary output is a Concordion-compatible Markdown file committed to a GitHub repository via a Pull Request, with an option to export to standard Excel. A middleware component reads OpenAPI specs to provide the Action list. This plan follows the suggested phases from PRD section 9.3.

*(Note: General project setup tasks like repository initialization, environment config, CI/CD, documentation, and full testing/deployment are ongoing activities but key initial setup steps are included in Phase 1 for clarity. Decisions on frameworks/tools should be made before starting Phase 1).*

---

## Phase 1: UI Foundation & Core Flow (~1 week)
*Goal: Build main UI layout, flow panel interactions (add/remove/reorder), inline step expansion, basic grid component. Use mock data.*
*Key Deliverable: Clickable prototype of core scenario building flow.*

- [x] **Project Setup (Initial)** (Migrated to Next.js)
  - [ ] Initialize Git repository for the main application. (Assumed external)
  - [ ] Define required tools (Node.js version, package manager, IDE extensions). (Assumed external)
  - [x] Choose and set up Frontend framework/structure (Next.js with App Router).
  - [x] Choose and integrate a UI component library (Material UI v6).
  - [x] Set up basic project structure (Next.js `src` directory structure).
  - [x] Set up linters and formatters (ESLint via `create-next-app`).
  - [x] Create `README.md` with basic setup instructions (`create-next-app` default).
- [x] **Frontend Foundation (Phase 1 Focus)**
  - [x] Implement client-side routing (Next.js App Router).
  - [x] Define main application routes (Search `/`, Create `/create`, Edit `/edit/[scenarioId]`).
  - [x] Choose and set up state management solution (Zustand).
  - [x] Define initial state structure for scenarios (using mock data in Zustand store).
  - [x] Create main application layout component (`src/components/Layout.tsx`).
  - [x] Create basic API Client Service (using mock functions). (Mock data handled directly in store for now)
- [x] **Scenario Building UI (Core Flow - US-001, US-003, US-004)**
  - [x] Implement "Create Scenario" action (placeholder via `/create` route).
  - [x] Implement UI for the "Your Flow" panel (`CreateEditPageComponent`).
  - [x] Implement adding Actions (from a mock list) to the flow (click implemented).
  - [x] Implement reordering steps within the flow (dnd-kit implemented).
  - [x] Implement removing steps from the flow (delete button implemented).
  - [x] Implement inline expansion/collapse for steps in the flow panel.
- [x] **Step Data Entry UI (Basic Grid - Part of US-005)**
  - [x] Develop the *basic* "Excel-like" grid component:
    - [x] Static rendering based on mock Action type (Placeholder exists).
    - [x] Basic data display from mock state (Placeholder exists).
    - [x] Placeholder for data input (Placeholder exists).
- [x] **Mock Data**
  - [x] Create mock Action List data (in Zustand store).
  - [x] Create mock Scenario data structure for state management (in Zustand store).

---

## Phase 2: Backend Integration & Grid Enhancement (~1 week)
*Goal: Develop middleware (read OpenAPI, provide Action List API). Connect frontend. Implement temporary backend state persistence. Enhance grid features (copy/paste, nav, validation, rows). Implement "Apply Changes" (or implicit save as per US-005 Revised).*
*Key Deliverable: Functional UI connected to backend, temporary scenario persistence, rich grid editing.*

- [x] **Project Setup (Backend & Config)**
  - [x] Choose and set up Backend framework/structure (e.g., Node.js with Express, Python with Flask/Django).
  - [x] Initialize Git repository for Middleware (if separate).
  - [x] Define structure for configuration files (e.g., JSON, YAML).
  - [x] Implement loading mechanism for:
    - [x] OpenAPI specification source location(s).
    - [ ] (Placeholders for other configs: GitHub repos, User Roles, Token, Component->Repo mapping).
- [x] **Backend Foundation (Phase 2 Focus)**
  - [x] Set up basic API routing.
  - [x] Define standard API response format.
  - [ ] Implement health check endpoint (`/health`).
  - [x] Set up logging framework.
  - [x] Implement base error handling middleware.
- [x] **Middleware API Discovery (Backend - Part of Functional Req)**
  - [x] Implement service to fetch OpenAPI specs from configured Git source(s).
  - [x] Implement robust OpenAPI parsing logic.
  - [x] Implement logic to generate the structured "Action List".
  - [x] Create API endpoint (`/api/actions`) to return the Action List.
- [ ] **Backend (Temporary Persistence)**
  - [ ] Define internal representation/model for a Scenario (metadata, steps, data).
  - [ ] Implement temporary in-memory or simple file-based storage for scenarios (to be replaced in Phase 4).
  - [ ] Create basic API endpoints for saving and loading scenarios to/from temporary storage.
- [ ] **Frontend Integration (Phase 2 Focus)**
  - [ ] Connect Frontend API Client Service to actual backend endpoints (`/health`, `/api/actions`, temporary save/load).
  - [ ] Fetch *real* Action List from `/api/actions` and display in UI (US-002).
  - [ ] Connect Scenario Building UI state to temporary backend persistence via save/load calls.
- [x] **Step Data Entry UI (Grid Enhancement - US-005 Revised)**
  - [x] Enhance the grid component:
    - [x] Dynamic rendering based on *real* Action type from middleware.
    - [x] Data binding to component/state management state.
    - [ ] Implement Keyboard navigation.
    - [ ] Implement Copy/paste functionality.
    - [x] Implement Add/remove rows functionality.
    - [x] Implement Inline validation feedback (basic).
    - [x] Implement data input and update state (implicit save within step).
- [ ] **Authentication & Authorization (Initial Setup - US-012)**
  - [ ] Determine user identification mechanism (**Clarification Needed**).
  - [ ] Implement basic backend middleware to identify user (placeholder role logic).
  - [ ] Implement basic frontend logic to fetch/store user info (placeholder role).

---

## Phase 3: Markdown Translation & Excel Export (~0.5 - 1 week)
*Goal: Implement backend logic for generating Concordion Markdown from internal state and parsing Markdown to load state. Implement standard Excel export. Update persistence to use Markdown format (still temporary storage).*
*Key Deliverable: Save/load via Markdown format (temp storage), standard Excel export.*

- [ ] **Backend (Markdown)**
  - [ ] Implement service to generate Concordion-compatible Markdown from the internal Scenario model (Part of US-007).
    - [ ] Ensure correct formatting, reference-style links, etc.
  - [ ] Implement service to parse Concordion-compatible Markdown into the internal Scenario model (Part of US-009, US-010).
    - [ ] Handle variations and potential errors in Markdown structure.
- [ ] **Backend (Excel Export - US-011)**
  - [ ] Implement service to generate a standard Excel (`.xlsx`) file from the internal Scenario model.
    - [ ] Use a suitable library (e.g., `xlsx`, `exceljs`).
    - [ ] Ensure clear formatting, no Concordion annotations.
  - [ ] Create API endpoint (`/api/scenarios/export/excel`) to trigger generation and return the file stream.
- [ ] **Backend (Update Temporary Persistence)**
  - [ ] Modify temporary save/load endpoints to use the Markdown generation/parsing services (saving/loading Markdown to/from temp storage).
- [ ] **Frontend (Integration)**
  - [ ] Implement "Export" button on Edit page (US-011).
  - [ ] Connect Export button to `/api/scenarios/export/excel` endpoint.
  - [ ] Verify that saving/loading now correctly uses the Markdown format via the temporary persistence layer.

---

## Phase 4: Git Integration & Final Features (~0.5 - 1 week)
*Goal: Replace temporary storage with GitHub integration (read Markdown for Search/Load, commit Markdown & raise PR on Save). Implement final Search page reading from Git.*
*Key Deliverable: Fully functional V1 with Git persistence and Excel export.*

- [ ] **Backend (Configuration)**
  - [ ] Implement loading mechanism for remaining configs:
    - [ ] GitHub repository list (for Save/Search).
    - [ ] User-to-Role mapping.
    - [ ] GitHub service account token (secure handling).
    - [ ] Component Name to Target Repository mapping (for US-007).
- [ ] **Backend (Core Services)**
  - [ ] Create/Finalize utility for interacting with GitHub API (using Service Account Token).
- [ ] **Backend (GitHub Integration - Scenario Persistence)**
  - [ ] **Search/Load (US-008, US-009):**
    - [ ] Implement GitHub API interaction to list/read Markdown files from configured repositories/branches.
    - [ ] Create API endpoint (`/api/scenarios/search`) to search/filter scenarios (reads from Git).
    - [ ] Create API endpoint (`/api/scenarios/load`) to fetch specific scenario Markdown content from Git.
  - [ ] **Save (Git PR Workflow - US-007):**
    - [ ] Implement GitHub API interaction logic: Create branch, commit Markdown, create PR.
    - [ ] Handle potential Git conflicts and API errors gracefully.
    - [ ] Create API endpoint (`/api/scenarios/save`) to trigger Markdown generation and Git PR workflow. Returns PR link or error.
  - [ ] **Remove Temporary Persistence:** Delete code related to temporary file/in-memory storage.
- [ ] **Backend (Authentication & Authorization - Final - US-012)**
  - [ ] Implement final middleware/decorator to identify user and determine role based on config.
  - [ ] Implement role-based access control guards for all relevant API endpoints.
- [ ] **Frontend (Final Features)**
  - [ ] **Search Page (US-008):**
    - [ ] Implement final UI for searching and filtering scenarios.
    - [ ] Connect to `/api/scenarios/search` endpoint.
    - [ ] Display scenario list with role-based actions (Edit, Duplicate, Export, View).
  - [ ] **Load Scenario (US-009):** Connect "Edit" button to `/api/scenarios/load`.
  - [ ] **Duplicate Scenario (US-010):** Implement UI flow (prompt name), connect to `/api/scenarios/load` for original data, populate editor.
  - [ ] **Save Scenario Flow (US-001, US-006, US-007):**
    - [ ] Implement final "Create Scenario" metadata capture UI (US-001).
    - [ ] Implement "Review" button/navigation (US-006).
    - [ ] Implement Review View (read-only summary).
    - [ ] Implement final "Save" button on Review view, connect to `/api/scenarios/save` (US-007).
    - [ ] Implement Success Page UI with PR link.
  - [ ] **Role Handling (US-012):** Ensure all UI elements and routes are correctly restricted based on fetched user role.
  - [ ] **First-Time User Experience (PRD 5.1):** Implement empty state detection and tooltip guide.
  - [ ] **Export from Search (US-011):** Add Export button to Search results list.

---

## Ongoing Activities (Across Phases)
- [ ] **Testing:**
  - [ ] Unit Testing (as components/services are built).
  - [ ] Integration Testing (as features are integrated).
  - [ ] E2E Testing (starting Phase 2/3, focusing on key flows).
  - [ ] Markdown Compatibility Testing (Phase 3 onwards).
  - [ ] Security Testing (especially Phase 4).
- [ ] **Documentation:**
  - [ ] Developer Documentation (ongoing).
  - [ ] API Documentation (as APIs stabilize).
  - [ ] User Guides (towards end of Phase 4).
  - [ ] System Architecture Documentation (finalized in Phase 4).
- [ ] **Deployment:**
  - [ ] CI/CD Pipeline Setup (ideally starting Phase 1/2).
  - [ ] Staging Environment Setup (by Phase 3).
  - [ ] Production Environment Setup (Phase 4).
  - [ ] Monitoring Setup (Phase 4).
- [ ] **Maintenance Planning:** Define procedures (Phase 4).
