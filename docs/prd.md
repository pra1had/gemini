# PRD: Scenario Workbench

## 1. Product overview
### 1.1 Document title and version
   - PRD: Scenario Workbench
   - Version: 1.0

### 1.2 Product summary
   - Scenario Workbench is a web application designed to help Product Owners (POs) and Quality Assurance (QA) teams collaboratively define and manage business and test scenarios involving sequences of backend API calls. The application aims to replace unstructured methods (like manual Excel editing) with a dedicated tool.
   - It features an Excel-like user interface for building scenarios by selecting predefined "Actions" (derived from backend API specifications) and inputting relevant data for requests and expected outputs for verification.
   - The primary output is a structured Markdown file, formatted for compatibility with the existing Concordion test framework, which is committed directly to a selected GitHub repository via a Pull Request for version control. The application also allows exporting scenarios to a standard (non-annotated) Excel format. A middleware component is included to read OpenAPI specifications and provide the list of available actions to the frontend.

## 2. Goals
### 2.1 Business goals
   - Enable structured capture of business/test scenarios by POs and QAs.
   - Link scenario definitions directly to the automated testing process (via generated Concordion Markdown).
   - Reduce rework in requirement definition and test creation.
   - Shorten test scenario creation time.
   - Accelerate delivery feedback loops by integrating scenario definition with version control and automation.
### 2.2 User goals
   - Easily define end-to-end scenarios (positive and negative paths) by chaining API calls (represented as user-friendly Actions).
   - Intuitively specify input data for API requests within scenarios.
   - Clearly define expected output data (for API responses or state verification) within scenarios.
   - Seamlessly integrate scenario definitions into the existing Git and Concordion workflow.
### 2.3 Non-goals
   - The application will not execute the tests directly; it generates files for an external test runner (Concordion).
   - The application will not handle authentication *for the target APIs* being called within a scenario.
   - The application will not manage the API lifecycle or replace the need for an API registry/OpenAPI specifications.
   - The application will not support dynamic data extraction from one step's response to use as input in a later step (V1).

## 3. User personas
### 3.1 Key user types
   - Product Owners (POs)
   - Quality Assurance (QA) Teams
   - Developers
### 3.2 Basic persona details
   - **Product Owner (PO)**: Defines business requirements and scenarios, needs to ensure tests align with requirements. Uses the tool to create, manage, and version control scenarios.
   - **Quality Assurance (QA)**: Understands requirements and API design, responsible for testing functionality (including edge cases and negative paths). Uses the tool to create, manage, and version control detailed test scenarios.
   - **Developer**: Builds and maintains APIs based on requirements and design. Uses the tool to view scenarios for understanding business logic, API usage patterns, and debugging test failures.
### 3.3 Role-based access
   - **PO**: Can Create, Read (Search/View), Update, Delete (TBD - needs confirmation), and Export Scenarios. Can initiate Save (Git PR). Can Duplicate Scenarios.
   - **QA**: Can Create, Read (Search/View), Update, Delete (TBD - needs confirmation), and Export Scenarios. Can initiate Save (Git PR). Can Duplicate Scenarios.
   - **Developer**: Can Read (Search/View) and Export Scenarios. (Cannot Create, Update, Delete, Save, Duplicate).
   - *(Note: User-to-Role mapping managed via configuration file).*

## 4. Functional requirements
   - **Middleware API Discovery** (Priority: High)
     - Middleware service reads OpenAPI specifications from a configured source.
     - Middleware generates a structured list of user-friendly "Actions" (mapping names to API details, data requirements, and action types like `SimpleCommand`, `Set and Execute`, `Post and Verify`, `Fetch and Verify`).
     - Middleware provides an API endpoint for the frontend to fetch this Action List.
   - **Scenario Management** (Priority: High)
     - Create new scenarios via the UI.
     - Search/Filter existing scenarios (reading Markdown files from configured Git repos).
     - View existing scenarios.
     - Edit existing scenarios (loading from Markdown).
     - Save scenarios (initiates Git PR workflow: select repo, name scenario, auto-branch, commit Concordion Markdown, raise PR).
     - Delete scenarios (TBD: Requires confirmation on workflow - e.g., does it delete the file/branch/PR in Git?).
     - Duplicate an existing scenario (prompts for new unique name, copies flow/data).
   - **Scenario Building UI** (Priority: High)
     - Display available Actions (from Middleware) in a categorized list.
     - Allow users to add Actions as steps to a "Flow" panel.
     - Allow users to reorder steps within the flow.
     - Allow users to remove steps from the flow.
   - **Step Data Entry UI** (Priority: High)
     - Clicking a step in the flow expands it inline.
     - Display relevant data entry sections based on Action type (e.g., Parameters, Request Body, Verification).
     - Use Excel-like grids for tabular data entry (Request Body, Verification).
     - Grids support required features: copy/paste, keyboard navigation, basic validation feedback, add/remove rows.
     - Require explicit "Apply Changes" action within the expanded step to save data modifications for that step.
   - **Markdown Generation & Parsing** (Priority: High)
     - Generate Concordion-compatible Markdown files representing the scenario flow and data, using reference-style links for commands/variables.
     - Parse existing Concordion-compatible Markdown files (from Git) to load scenarios into the UI for viewing/editing.
   - **Excel Export** (Priority: Medium)
     - Provide an "Export" function to generate and download a standard (non-annotated) Excel file representing the current scenario flow and data.
   - **Configuration** (Priority: High)
     - Read GitHub repository list (for Save/Search) from a config file.
     - Read User-to-Role mapping from a config file.
     - Read GitHub service account token from a config file.

## 5. User experience
### 5.1. Entry points & first-time user flow
   - Default entry point is the "Search Scenario" page.
   - If no scenarios exist (first-time use), the Search page displays an empty state with an interactive tooltip guide:
     - Tooltip 1: Points to the "Create Scenario" button/link.
     - Tooltip 2 (on Create page): Points to the list of available Actions.
     - Tooltip 3: Points to the first Action added to the flow, prompting data entry via inline expansion.
     - Tooltip 4: Points to the "Save" button.
### 5.2. Core experience
   - **Returning User (Edit Flow):**
     - User lands on Search page, searches/filters for a scenario.
     - User clicks "Edit" on the desired scenario.
     - User is navigated to the Edit page with the scenario loaded into the flow builder.
     - User modifies the flow (add/remove/reorder steps) or clicks a step to expand it.
     - User edits data in the inline grids and clicks "Apply Changes" for the step.
     - User clicks the main "Save" button, selects target repo, confirms scenario name, triggering the Git PR workflow.
   - **Returning User (Duplicate Flow):**
     - User lands on Search page, searches/filters for a scenario.
     - User clicks "Duplicate" on the desired scenario.
     - User is prompted for a new, unique scenario name.
     - User is navigated to the Edit page with the duplicated scenario loaded.
   - **Export Flow:**
     - From the Edit or View page, user clicks "Export".
     - A standard Excel file representing the scenario is generated and downloaded.
### 5.3. Advanced features & edge cases
   - Dynamic data linking between steps is explicitly out of scope for V1.
   - Handling of Git conflicts if multiple users edit the same scenario concurrently (via different branches/PRs) is managed by standard Git workflow outside the tool.
   - Error handling for failed Git operations (e.g., invalid token, permissions issues, API errors) needs graceful feedback to the user.
### 5.4. UI/UX highlights
   - Data entry grids provide an Excel-like experience:
     - Easy copy/paste support.
     - Keyboard navigation between cells.
     - Inline data validation feedback (e.g., for mandatory fields).
     - Ability to easily add/remove rows in data tables.
   - Clear visual distinction between different data sections (Parameters, Request, Verification) within expanded steps.
   - Intuitive drag-and-drop or click-based interface for building the scenario flow.

## 6. Narrative
A QA Engineer, tasked with verifying a new feature involving multiple microservice interactions, needs a structured way to define complex positive and negative test scenarios that aren't easily captured in traditional test scripts. They open the Scenario Workbench and land on the Search page. Seeing no existing scenario matching their need, they click "Create Scenario." Guided by tooltips, they select the necessary API actions from the list, dragging them into the flow panel in the correct sequence. Clicking on each step, they use the familiar grid interface to input specific valid or invalid data and define the expected success or error responses in the verification tables, applying changes for each step. Once the flow is complete, they click "Save," select the appropriate repository, name their scenario (e.g., "User Creation Happy Path" or "Invalid Input Handling"), and initiate the Pull Request creation. Now, the complex scenario is clearly documented, version-controlled in Git via its Markdown representation, and ready to be exported as a Concordion Excel file for automated execution, ensuring consistent and reliable testing.

## 7. Success metrics
### 7.1. User-centric metrics
   - Number of unique active users (POs & QAs) per week/month.
   - Number of new scenarios created (i.e., PRs raised) per week/month.
   - Average number of steps per created scenario.
   - Number of scenario exports (to Excel) per week/month.
### 7.2. Business metrics
   - User-reported reduction in test scenario creation time (measured via periodic surveys).
   - User-reported reduction in rework related to scenario definition (measured via periodic surveys).
   - User-reported acceleration in delivery speed attributed to improved scenario management (measured via periodic surveys).
### 7.3. Technical metrics
   - Application Uptime / Availability (e.g., % uptime per month).

## 8. Technical considerations
### 8.1. Integration points
   - **GitHub API (Read):** Middleware reads OpenAPI specs from configured repositories/paths.
   - **GitHub API (Write):** Backend uses a configured Service Account Token to create branches, commit generated Markdown files, and raise Pull Requests in user-selected repositories.
   - **Frontend-Backend:** Frontend calls backend APIs to fetch Action Lists, load/save scenario state, trigger Markdown/Excel generation, and initiate Git operations.
### 8.2. Data storage & privacy
   - Primary scenario data is stored as Markdown files within designated GitHub repositories (source of truth).
   - Application configuration (GitHub repo list, User-to-Role mapping, Service Account Token) stored in configuration files deployed with the application. No application-specific database required for V1.
   - Sensitive data (Service Account Token) must be stored securely according to best practices.
### 8.3. Scalability & performance
   - V1 assumes scenario complexity and number of users will not cause significant performance issues with Markdown generation/parsing, Excel export, or GitHub API interactions. Monitor export times and API usage as adoption grows.
### 8.4. Potential challenges
   - **Primary:** Implementing the feature-rich, performant, and user-friendly Excel-like grid UI component.
   - **Secondary:** Ensuring robust generation and parsing of the specific Concordion Markdown format. Handling GitHub API errors and edge cases gracefully. Ensuring middleware correctly parses various OpenAPI specs.

## 9. Milestones & sequencing
### 9.1. Project estimate
   - Medium: 2-4 weeks
### 9.2. Team size & composition
   - Small Team: 2 Full-stack Engineers
### 9.3. Suggested phases
   - **Phase 1: UI Foundation & Core Flow** (Estimate: ~1 week)
     - Build main UI layout, flow panel interactions (add/remove/reorder), inline step expansion, basic grid component. Use mock data.
     - *Key Deliverable:* Clickable prototype of core scenario building flow.
   - **Phase 2: Backend Integration & Grid Enhancement** (Estimate: ~1 week)
     - Develop middleware (read OpenAPI, provide Action List API). Connect frontend. Implement temporary backend state persistence. Enhance grid features (copy/paste, nav, validation, rows). Implement "Apply Changes".
     - *Key Deliverable:* Functional UI connected to backend, temporary scenario persistence, rich grid editing.
   - **Phase 3: Markdown Translation & Excel Export** (Estimate: ~0.5 - 1 week)
     - Implement backend logic for generating Concordion Markdown from internal state and parsing Markdown to load state. Implement standard Excel export. Update persistence to use Markdown format (still temporary storage).
     - *Key Deliverable:* Save/load via Markdown format (temp storage), standard Excel export.
   - **Phase 4: Git Integration** (Estimate: ~0.5 - 1 week)
     - Replace temporary storage with GitHub integration (read Markdown for Search/Load, commit Markdown & raise PR on Save). Implement final Search page reading from Git.
     - *Key Deliverable:* Fully functional V1 with Git persistence and Excel export.

## 10. User stories

### 10.1 Initiate Scenario Creation and Define Metadata
*   **ID**: US-001
*   **Description**: As a PO or QA user, I want to initiate the creation of a new scenario and provide its essential metadata (Name, Component, Tags) so that the scenario is properly identified and categorized before I start adding steps.
*   **Acceptance Criteria**:
    *   When the user clicks the "Create Scenario" action (e.g., from the Search page), they are prompted to enter metadata.
    *   The user must provide a unique Scenario Name.
    *   The user selects the relevant Component (e.g., from a predefined list corresponding to `componentName` in the Action List source).
    *   The user can optionally add one or more relevant free-form Tags.
    *   After providing the metadata, the user is presented with the main scenario building UI (Action list on left, empty "Your Flow" panel on right).
    *   The entered Scenario Name is displayed prominently on the page.

### 10.2 View Available Actions
*   **ID**: US-002
*   **Description**: As a PO or QA user, I want to see the list of available Actions on the scenario creation/editing page so that I can select them to build my scenario flow.
*   **Acceptance Criteria**:
    *   On the Create/Edit Scenario page, the frontend makes a request to the middleware API endpoint for the Action List.
    *   The list of Actions is displayed in the left panel.
    *   Actions are grouped by `componentName` and `actionCodeGroupName`.
    *   Each Action displays its user-friendly `code`.
    *   The list allows easy browsing (e.g., collapsible sections).

### 10.3 Add Action to Scenario Flow
*   **ID**: US-003
*   **Description**: As a PO or QA user, I want to add an Action from the available list to the "Your Flow" panel so that I can build the sequence of steps for my scenario.
*   **Acceptance Criteria**:
    *   User can click or drag an Action from the left panel list.
    *   The selected Action appears as a new step at the end of the sequence in the "Your Flow" panel.
    *   The step displays the Action's `code`.
    *   The step includes controls for reordering and removing.

### 10.4 Expand/Collapse Scenario Step for Data Entry
*   **ID**: US-004
*   **Description**: As a PO or QA user, I want to expand or collapse a step in the "Your Flow" panel so that I can view and edit its associated data (parameters, request body, verification) and potentially view multiple steps' data at once.
*   **Acceptance Criteria**:
    *   User can click on a step item in the "Your Flow" panel to toggle its expansion state.
    *   Clicking an unexpanded step expands an inline section below it.
    *   The expanded section displays the relevant data entry areas based on the Action's type.
    *   Column headers/fields correspond to the Action's definition.
    *   Clicking an already expanded step collapses its inline section.
    *   Multiple steps can be expanded simultaneously.

### 10.5 Enter/Edit Data in Scenario Step (Revised)
*   **ID**: US-005
*   **Description**: As a PO or QA user, I want to enter and edit data in the fields and grids within an expanded scenario step so that I can define the specific parameters, request bodies, and verification details for that step, holding these changes temporarily until I proceed to review and save the entire scenario.
*   **Acceptance Criteria**:
    *   User can type data into input fields and grid cells within an expanded step.
    *   Copy/paste and keyboard navigation are supported within the data entry areas.
    *   User can add/remove rows in data grids.
    *   Basic inline validation (e.g., for mandatory fields) is provided.
    *   Data changes made within the expanded section are held in the UI's temporary state for that step.
    *   There is no "Apply Changes" button within the step; changes are implicitly kept as the user interacts with other steps or UI elements.

### 10.6 Review Scenario Details (Revised)
*   **ID**: US-006
*   **Description**: As a PO or QA user, after defining the steps and entering data, I want to navigate to a "Review" step or view where I can see a summary of the entire scenario (metadata, target repository, sequence of steps, and entered data) before committing it.
*   **Acceptance Criteria**:
    *   A "Review" button or navigation element is available on the scenario building page.
    *   Clicking "Review" transitions the user to a read-only summary view of the scenario.
    *   The review view displays the Scenario Name, Component, and Tags.
    *   The review view displays the target GitHub repository (derived from the selected Component Name via application configuration).
    *   The review view lists all the steps in the defined order.
    *   For each step, the entered parameters, request body data, and verification data are displayed clearly using read-only versions of the data entry grids.
    *   The user can navigate back from the Review view to the scenario building page to make further edits if needed.
    *   A final "Save" or "Confirm & Save" button is present on the Review view.

### 10.7 Save Scenario (Trigger Git PR) (Revised v2)
*   **ID**: US-007
*   **Description**: As a PO or QA user, after reviewing the scenario details, I want to save the scenario, which triggers the process of committing the corresponding Markdown file to the predetermined Git repository via a Pull Request, and be clearly notified of the outcome.
*   **Acceptance Criteria**:
    *   From the Review view, the user clicks the final "Save" button.
    *   The application uses the previously entered Scenario Name for the branch and filename.
    *   The application identifies the target GitHub repository based on the Component Name selected in US-001 (using configured mapping).
    *   The backend generates the Concordion-compatible Markdown file based on the scenario's metadata, steps, and data held in state.
    *   The backend interacts with the GitHub API (using the service account token) against the determined target repository to:
        *   Create a new branch (named after the scenario).
        *   Commit the generated Markdown file to the new branch.
        *   Create a Pull Request from the new branch to the default target branch.
    *   If the PR creation fails, the user receives clear error feedback on the current page.
    *   If the PR creation succeeds, the user is redirected to a dedicated success page.
    *   The success page displays a confirmation message and a prominent, clickable link to the newly created Pull Request on GitHub.
    *   The success page may also offer options like "Create Another Scenario" or "Go to Search Page".

### 10.8 Search and Filter Scenarios
*   **ID**: US-008
*   **Description**: As a PO, QA, or Developer user, I want to search and filter the list of existing scenarios on the Search page so that I can quickly find the specific scenario(s) I need to view, edit, duplicate, or export.
*   **Acceptance Criteria**:
    *   The Search Scenario page displays a list of scenarios retrieved from the configured GitHub repositories (by reading the Markdown files).
    *   A search input field is available. Entering text filters the list to show only scenarios whose name or potentially content matches the search term.
    *   Filtering options are available (e.g., dropdowns or checkboxes) to filter scenarios by:
        *   Component Name
        *   Tags
        *   (Potentially) Author/Creator (if available from Git history) - TBD
    *   The list displays key information for each scenario, such as Name, Component, Tags, and last modified date (from Git).
    *   The list provides actions for each scenario appropriate to the user's role (e.g., Edit, Duplicate, Export for PO/QA; View, Export for Developer).
    *   The search and filtering actions update the displayed list dynamically.

### 10.9 Load Existing Scenario for Editing
*   **ID**: US-009
*   **Description**: As a PO or QA user, I want to select an existing scenario from the Search page and load it into the editor so that I can make modifications to its steps or data.
*   **Acceptance Criteria**:
    *   On the Search Scenario page, an "Edit" action is available for each listed scenario (for users with PO/QA roles).
    *   Clicking "Edit" triggers the application to fetch the corresponding Markdown file content from the correct branch/repo in GitHub.
    *   The backend parses the Markdown file content.
    *   The user is navigated to the Edit Scenario page.
    *   The scenario's metadata (Name, Component, Tags) is populated on the Edit page.
    *   The scenario's steps are loaded into the "Your Flow" panel in the correct order.
    *   The data associated with each step (parameters, request body, verification) is loaded into the UI's temporary state, ready to be viewed/edited when the step is expanded (as per US-004 and US-005).

### 10.10 Duplicate Existing Scenario
*   **ID**: US-010
*   **Description**: As a PO or QA user, I want to duplicate an existing scenario from the Search page so that I can use it as a starting point for a new, similar scenario without modifying the original.
*   **Acceptance Criteria**:
    *   On the Search Scenario page, a "Duplicate" action is available for each listed scenario (for users with PO/QA roles).
    *   Clicking "Duplicate" prompts the user to enter a new, unique Scenario Name for the copy.
    *   After providing a name, the application fetches the original scenario's Markdown content from Git.
    *   The application parses the Markdown content.
    *   The user is navigated to the Edit Scenario page.
    *   The *new* Scenario Name provided by the user is displayed.
    *   The Component and Tags from the original scenario are pre-populated.
    *   The steps and associated data from the original scenario are loaded into the "Your Flow" panel and the UI's temporary state.
    *   The duplicated scenario is now in an unsaved state, ready for editing and subsequent saving (via US-006 and US-007, which will create a new PR).

### 10.11 Export Scenario to Standard Excel
*   **ID**: US-011
*   **Description**: As any user (PO, QA, or Developer), I want to export a scenario (either the one I am currently viewing/editing or one selected from the Search list) to a standard Excel file so that I can view or share the scenario data outside of the Workbench or potentially use it for other purposes.
*   **Acceptance Criteria**:
    *   An "Export" action is available on the Edit Scenario page.
    *   An "Export" action is available for each scenario listed on the Search Scenario page.
    *   Clicking "Export" triggers the backend to generate an Excel file (`.xlsx`).
    *   The Excel file contains the scenario's metadata (Name, Component, Tags).
    *   The Excel file represents the sequence of steps and their associated data (parameters, request body, verification) in a clear, readable format (e.g., using separate sheets or clearly delineated tables within a sheet).
    *   The generated Excel file does not contain Concordion-specific annotations or formatting (it's a standard data representation).
    *   The generated Excel file is downloaded to the user's browser.

### 10.12 Access Application Features Based on Role
*   **ID**: US-012
*   **Description**: As a logged-in user, I want my access to Scenario Workbench features (like creating, editing, saving, duplicating, exporting) to be restricted based on my assigned role (PO, QA, or Developer) defined in the application's configuration file, so that I can only perform actions appropriate for my role.
*   **Acceptance Criteria**:
    *   The application identifies the current user (mechanism TBD - e.g., SSO header, basic auth - needs clarification if not purely network access control).
    *   The application reads the User-to-Role mapping from the configuration file.
    *   Based on the current user's determined role:
        *   Users with PO or QA roles have access to Create, Search, Edit, Save (Git PR), Duplicate, and Export functionalities. UI elements for these actions are enabled/visible.
        *   Users with the Developer role have access only to Search and Export functionalities. UI elements for Create, Edit, Save, Duplicate are disabled/hidden.
    *   Users attempting to access functionality not permitted for their role (e.g., via direct URL manipulation) are prevented and shown an appropriate message or redirected.
