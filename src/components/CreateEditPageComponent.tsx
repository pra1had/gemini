'use client'; // This component uses client-side hooks (useEffect, useState, Zustand, dnd-kit)
import React, { useEffect, useState, useMemo } from 'react';
import {
  Typography, Grid, Paper, Container, TextField, Box, Button, // Import Button
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileDownloadIcon from '@mui/icons-material/FileDownload'; // Icon for export button
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useScenarioStore, Action, ScenarioDto, StepRowData } from '@/store/scenarioStore'; // Import ScenarioDto and StepRowData
// Import save and health check functions from API client
import { saveScenarioTemporary, checkBackendHealth } from '@/services/apiClient';
import { SortableStepItem } from '@/components/SortableStepItem';
import Layout from '@/components/Layout'; // Import Layout
import * as XLSX from 'xlsx';

interface CreateEditPageProps {
  scenarioId?: string; // Optional scenarioId passed from the page route
}

const CreateEditPageComponent: React.FC<CreateEditPageProps> = ({ scenarioId }) => {
  const [searchTerm, setSearchTerm] = useState(''); // State for search input
  const [expandedComponent, setExpandedComponent] = useState<string | false>(false); // State for accordion expansion

  // Select state and actions individually from Zustand store
  const scenarioName = useScenarioStore((state) => state.scenarioName);
  const availableActions = useScenarioStore((state) => state.availableActions);
  const flowSteps = useScenarioStore((state) => state.flowSteps);
  const isEditMode = useScenarioStore((state) => state.isEditMode);
  const currentScenarioId = useScenarioStore((state) => state.currentScenarioId); // Get currentScenarioId
  const expandedStepId = useScenarioStore((state) => state.expandedStepId);
  const loadScenario = useScenarioStore((state) => state.loadScenario);
  const addFlowStep = useScenarioStore((state) => state.addFlowStep);
  const removeFlowStep = useScenarioStore((state) => state.removeFlowStep);
  const reorderFlowSteps = useScenarioStore((state) => state.reorderFlowSteps);
  const toggleStepExpansion = useScenarioStore((state) => state.toggleStepExpansion);
  const fetchAndSetAvailableActions = useScenarioStore((state) => state.fetchAndSetAvailableActions); // Get the fetch action
  // Ensure we are using the correct update action name from the store
  const updateStepGridData = useScenarioStore((state) => state.updateStepGridData);
  // Need setFlowSteps, setScenarioName, and setCurrentScenarioId
  const setFlowSteps = useScenarioStore((state) => state.setFlowSteps);
  const setScenarioName = useScenarioStore((state) => state.setScenarioName);
  const setCurrentScenarioId = useScenarioStore((state) => state.setCurrentScenarioId);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    console.log("CreateEditPageComponent mounted/scenarioId changed. Fetching actions...");
    // Load scenario data based on the prop passed from the page route
    loadScenario(scenarioId ?? null);
    // Fetch available actions when the component mounts
    // Check backend health
    checkBackendHealth().then(isHealthy => {
      console.log("Backend health status:", isHealthy ? "UP" : "DOWN");
      // Optionally update UI based on health status
    });
    // Fetch available actions
    fetchAndSetAvailableActions().then(() => {
        console.log("Finished fetching actions.");
    }).catch((err: unknown) => { // Add type for err
        console.error("Error during action fetch in useEffect:", err);
    });

    // Dependencies: scenarioId ensures reload if navigating between edit pages,
    // loadScenario and fetchAndSetAvailableActions are stable references from Zustand.
  }, [scenarioId, loadScenario, fetchAndSetAvailableActions]);

  const handleAddAction = (action: Action) => {
    addFlowStep(action);
  };

  // Memoize the filtering and grouping logic
  const groupedAndFilteredActions = useMemo(() => {
    // console.log("Filtering with searchTerm:", searchTerm); // Debug log removed
    const filtered = availableActions.filter(action =>
      action.actionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.componentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.actionCodeGroupName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group by componentName, then actionCodeGroupName
    const groups: Record<string, Record<string, Action[]>> = {};
    filtered.forEach(action => {
      if (!groups[action.componentName]) {
        groups[action.componentName] = {};
      }
      if (!groups[action.componentName][action.actionCodeGroupName]) {
        groups[action.componentName][action.actionCodeGroupName] = [];
      }
      groups[action.componentName][action.actionCodeGroupName].push(action);
    });

    // console.log("Filtered actions count:", filtered.length); // Debug log removed
    // console.log("Grouped actions:", groups); // Debug log removed
    return groups;
  }, [availableActions, searchTerm]);

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedComponent(isExpanded ? panel : false);
  };


  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = flowSteps.findIndex((step) => step.id === active.id);
      const newIndex = flowSteps.findIndex((step) => step.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrderedSteps = arrayMove(flowSteps, oldIndex, newIndex);
        reorderFlowSteps(newOrderedSteps);
      }
    }
  };

  const handleExport = () => {
    if (!currentScenarioId) {
      console.warn("Cannot export unsaved scenario.");
      return;
    }

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Helper function to add spacing rows
    const addSpacingRows = (worksheet: XLSX.WorkSheet, startRow: number, numRows: number) => {
      for (let i = 0; i < numRows; i++) {
        worksheet[`A${startRow + i}`] = { v: '' };
      }
    };

    // Process each step
    flowSteps.forEach((step, stepIndex) => {
      const action = availableActions.find(a => a.actionCode === step.actionCode);
      if (!action) return;

      // Create a new worksheet for each step
      const ws = XLSX.utils.aoa_to_sheet([]);
      
      // Add step header
      ws['A1'] = { v: `Step ${stepIndex + 1}: ${action.actionCode}` };
      ws['A2'] = { v: `Component: ${action.componentName}` };
      ws['A3'] = { v: `Group: ${action.actionCodeGroupName}` };
      
      // Add spacing
      addSpacingRows(ws, 4, 2);

      // Process parameters
      if (step.stepParamsData && step.stepParamsData.length > 0) {
        ws['A6'] = { v: 'Parameters' };
        
        // Get all unique parameter names
        const paramNames = new Set<string>();
        step.stepParamsData.forEach((row: StepRowData) => {
          Object.keys(row).forEach(key => {
            if (key.startsWith('param_') || key.startsWith('query_')) {
              paramNames.add(key);
            }
          });
        });

        // Add parameter headers
        const headers = ['ID', ...Array.from(paramNames)];
        XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A7' });

        // Add parameter data
        const data = step.stepParamsData.map((row: StepRowData) => {
          const rowData = [row.id];
          paramNames.forEach(param => {
            rowData.push(row[param] || '');
          });
          return rowData;
        });
        XLSX.utils.sheet_add_aoa(ws, data, { origin: 'A8' });
      }

      // Add spacing between sections
      const lastRow = XLSX.utils.decode_range(ws['!ref'] || 'A1').e.r;
      addSpacingRows(ws, lastRow + 2, 2);

      // Process request body
      if (step.stepRequestData && step.stepRequestData.length > 0) {
        const requestStartRow = lastRow + 4;
        ws[`A${requestStartRow}`] = { v: 'Request Body' };
        
        // Get all unique field names
        const fieldNames = new Set<string>();
        step.stepRequestData.forEach((row: StepRowData) => {
          Object.keys(row).forEach(key => {
            if (key !== 'id') {
              fieldNames.add(key);
            }
          });
        });

        // Add request headers
        const headers = ['ID', ...Array.from(fieldNames)];
        XLSX.utils.sheet_add_aoa(ws, [headers], { origin: `A${requestStartRow + 1}` });

        // Add request data
        const data = step.stepRequestData.map((row: StepRowData) => {
          const rowData = [row.id];
          fieldNames.forEach(field => {
            rowData.push(row[field] || '');
          });
          return rowData;
        });
        XLSX.utils.sheet_add_aoa(ws, data, { origin: `A${requestStartRow + 2}` });
      }

      // Add spacing between sections
      const lastRow2 = XLSX.utils.decode_range(ws['!ref'] || 'A1').e.r;
      addSpacingRows(ws, lastRow2 + 2, 2);

      // Process response body
      if (step.stepResponseData && step.stepResponseData.length > 0) {
        const responseStartRow = lastRow2 + 4;
        ws[`A${responseStartRow}`] = { v: 'Response Body' };
        
        // Get all unique field names
        const fieldNames = new Set<string>();
        step.stepResponseData.forEach((row: StepRowData) => {
          Object.keys(row).forEach(key => {
            if (key !== 'id') {
              fieldNames.add(key);
            }
          });
        });

        // Add response headers
        const headers = ['ID', ...Array.from(fieldNames)];
        XLSX.utils.sheet_add_aoa(ws, [headers], { origin: `A${responseStartRow + 1}` });

        // Add response data
        const data = step.stepResponseData.map((row: StepRowData) => {
          const rowData = [row.id];
          fieldNames.forEach(field => {
            rowData.push(row[field] || '');
          });
          return rowData;
        });
        XLSX.utils.sheet_add_aoa(ws, data, { origin: `A${responseStartRow + 2}` });
      }

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, `Step ${stepIndex + 1}`);
    });

    // Generate and download the Excel file
    XLSX.writeFile(wb, `${scenarioName || 'scenario'}.xlsx`);
  };

  // --- Save Handler ---
  const handleSave = async () => {
    console.log("Attempting to save scenario...");
    // Add loading state indication if needed
    const scenarioToSave: ScenarioDto = {
      scenarioId: currentScenarioId ?? undefined, // Include ID only if it exists (for updates)
      scenarioName: scenarioName,
      steps: flowSteps,
    };

    try {
      const savedScenario = await saveScenarioTemporary(scenarioToSave);
      console.log("Scenario saved successfully:", savedScenario);
      // Update the store with the potentially new ID and confirmed data
      // Use loadScenario to potentially refresh the state completely based on the saved data,
      // ensuring consistency, especially if the backend modifies data on save.
      // Or, update specific fields if preferred:
      loadScenario(savedScenario.scenarioId ?? null); // Reload with the returned ID
      // setScenarioName(savedScenario.scenarioName); // Update name if backend could change it
      // setFlowSteps(savedScenario.steps); // Update steps if backend could change them
      // Optionally show a success message to the user
    } catch (error) {
      console.error("Failed to save scenario:", error);
      // Optionally show an error message to the user
    } finally {
      // Remove loading state indication if added
    }
  };

  return (
    <Layout>
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">
            {isEditMode ? `Edit Scenario: ${scenarioName}` : 'Create New Scenario'}
          </Typography> {/* Close Typography tag here */}
          {/* Add Export Button Here */}
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={!currentScenarioId} // Disable if no scenario ID (not saved yet)
          >
            Export to Excel
          </Button>
        </Box>
        {/* Add Scenario ID and Name inputs */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Scenario ID"
              value={currentScenarioId || ''}
              onChange={(e) => setCurrentScenarioId(e.target.value || null)} // Update store on change
              disabled={isEditMode} // Disable if editing existing
              required // Mark as required
              variant="outlined"
              size="small"
              helperText={isEditMode ? "Cannot change ID when editing" : "Required for new scenarios"}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
             <TextField
               fullWidth
               label="Scenario Name"
               value={scenarioName}
               onChange={(e) => setScenarioName(e.target.value)}
               required
               variant="outlined"
               size="small"
             />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Left Panel: Available Actions */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}> {/* Ensure paper takes height */}
              <Typography variant="h6" gutterBottom>Available Actions</Typography>
              <TextField
                fullWidth
                label="Search Actions"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
              />
              {/* Render grouped and filtered actions */}
              <Box sx={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}> {/* Add scroll */}
                {Object.entries(groupedAndFilteredActions).map(([componentName, groupMap]) => (
                  <Accordion
                    key={componentName}
                    expanded={expandedComponent === componentName}
                    onChange={handleAccordionChange(componentName)}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography sx={{ fontWeight: 'bold' }}>{componentName}</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 1 }}>
                      {Object.entries(groupMap).map(([groupName, actions]) => (
                        <Box key={groupName} sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ ml: 1, fontStyle: 'italic' }}>{groupName}</Typography>
                          {actions.map((action) => (
                            <Box
                              key={action.actionCode}
                              sx={{
                                p: 1, ml: 2, cursor: 'pointer',
                                '&:hover': { backgroundColor: 'action.hover' },
                                borderRadius: 1
                              }}
                              onClick={() => handleAddAction(action)}
                            >
                              {action.actionCode}
                            </Box>
                          ))}
                        </Box>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                ))}
                {Object.keys(groupedAndFilteredActions).length === 0 && searchTerm && (
                  <Typography sx={{ p: 2, textAlign: 'center' }}>No actions found matching "{searchTerm}".</Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Right Panel: Scenario Flow */}
          <Grid item xs={12} md={8}> {/* Removed component="div" */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Your Flow</Typography>
              {flowSteps.length === 0 ? (
                <Typography>Drag or click actions from the left to add them here.</Typography>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={flowSteps.map(step => step.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {flowSteps.map((step, index) => (
                      <SortableStepItem
                        key={step.id}
                        step={step}
                        index={index}
                         availableActions={availableActions}
                         onRemove={removeFlowStep}
                         expandedStepId={expandedStepId}
                         onToggleExpansion={toggleStepExpansion}
                         onUpdateGridData={updateStepGridData} // Pass the correct update function
                       />
                     ))}
                   </SortableContext>
                </DndContext>
              )}
            </Paper>
          </Grid>
        </Grid>
        {/* TODO: Add Review/Save buttons (Phase 4) */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
             {/* Save Button */}
           <Button
             variant="contained"
             color="primary"
             onClick={handleSave}
             // Disable if no steps OR if creating new and no ID is provided
             disabled={flowSteps.length === 0 || (!isEditMode && !currentScenarioId)}
           >
             {isEditMode ? 'Update Scenario (Temporary)' : 'Save New Scenario (Temporary)'}
           </Button>
        </Box>
      </Container>
    </Layout>
  );
};

export default CreateEditPageComponent;
