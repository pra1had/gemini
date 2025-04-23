# Story Board: Adding Step Descriptions

## Overview

Based on user feedback, we need to enhance the scenario steps by adding textual descriptions before and after each step. This will help in elaborating the business scenario for users. The change affects multiple layers of the application and will be implemented incrementally.

## User Story

**As a** Product Owner or QA Engineer  
**I want to** add descriptive text before and after each step in my scenario  
**So that** I can better explain the business context and expected outcomes of each step

## Implementation Plan

### Phase 1: Backend Changes

1. **Update Data Model**
   - Modify `ScenarioStepDto.java`:
     ```java
     private String beforeDescription;
     private String afterDescription;
     ```
   - Update tests in:
     - `ScenarioPersistenceServiceTest`
     - `ScenarioPersistenceControllerIntegrationTest`

2. **Success Criteria**
   - ✓ DTO changes committed
   - ✓ Tests passing
   - ✓ Backwards compatibility maintained

### Phase 2: Frontend State Changes

1. **Update Store Types**
   - Modify `ScenarioStep` interface in `scenarioStore.ts`:
     ```typescript
     interface ScenarioStep {
       id: string;
       actionCode: string;
       beforeDescription: string;
       afterDescription: string;
       stepParamsData: StepRowData[];
       stepRequestData: StepRowData[];
       stepResponseData: StepRowData[];
     }
     ```

2. **Update Store Actions**
   - Modify `addFlowStep` to initialize descriptions:
     ```typescript
     const newStep: ScenarioStep = {
       id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
       actionCode: action.actionCode,
       beforeDescription: '',
       afterDescription: '',
       stepParamsData: [defaultParamsRow],
       stepRequestData: [defaultRequestRow],
       stepResponseData: [defaultResponseRow],
     };
     ```

3. **Success Criteria**
   - ✓ Type definitions updated
   - ✓ Store actions modified
   - ✓ Store tests passing

### Phase 3: UI Changes

1. **Update Step Component**
   - Modify `SortableStepItem.tsx`:
     ```typescript
     // Add text fields for descriptions
     <TextField
       multiline
       placeholder="Describe the context before this step..."
       value={step.beforeDescription}
       onChange={(e) => onUpdateDescription(step.id, 'before', e.target.value)}
       sx={{ mb: 2 }}
     />
     
     {/* Existing step content */}
     
     <TextField
       multiline
       placeholder="Describe the expected outcome after this step..."
       value={step.afterDescription}
       onChange={(e) => onUpdateDescription(step.id, 'after', e.target.value)}
       sx={{ mt: 2 }}
     />
     ```

2. **Styling**
   - Add distinct styling for description fields
   - Ensure visibility in both collapsed/expanded states
   - Add visual separation between descriptions and step data

3. **Success Criteria**
   - ✓ Description fields visible and functional
   - ✓ UI remains clean and intuitive
   - ✓ Descriptions persist correctly

### Phase 4: Excel Export Integration

1. **Update Excel Generation**
   - Add description rows in the export:
     ```
     [Before Description Row]
     Step 1: Action Name
     [Parameter Data Rows]
     [Request Data Rows]
     [Response Data Rows]
     [After Description Row]
     ```

2. **Formatting**
   - Style description rows distinctly:
     - Different background color
     - Italic font
     - Full-width merged cells
   - Clear visual separation from step data

3. **Success Criteria**
   - ✓ Descriptions appear in Excel export
   - ✓ Format is clear and readable
   - ✓ Export handles all edge cases (empty descriptions, long text)

### Testing Strategy

1. **Unit Tests**
   - Backend DTO validation
   - Store action behavior
   - Component rendering
   - Excel generation

2. **Integration Tests**
   - End-to-end flow
   - Data persistence
   - Excel export

3. **Edge Cases**
   - Empty descriptions
   - Very long descriptions
   - Special characters
   - Multiple steps

4. **Success Criteria**
   - ✓ All tests passing
   - ✓ Edge cases handled
   - ✓ No regressions

## Implementation Notes

1. **Small Increments**
   - Each phase can be implemented and tested independently
   - Changes can be rolled back if issues are found
   - Features can be toggled if needed

2. **Testing Focus**
   - Each layer tested in isolation
   - Integration tests for full flow
   - UI/UX testing with real users

3. **Migration**
   - Existing scenarios will initialize with empty descriptions
   - No data migration needed
   - Backwards compatible changes

## Future Considerations

1. **Potential Enhancements**
   - Rich text formatting in descriptions
   - Description templates
   - Description validation rules

2. **Performance**
   - Monitor impact on Excel generation time
   - Consider lazy loading for long descriptions
   - Optimize storage if needed
