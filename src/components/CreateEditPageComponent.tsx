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
import { useScenarioStore, Action } from '@/store/scenarioStore';
import { SortableStepItem } from '@/components/SortableStepItem';
import Layout from '@/components/Layout'; // Import Layout

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
  const updateStepData = useScenarioStore((state) => state.updateStepData); // Get the update action

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Load scenario data based on the prop passed from the page route
    loadScenario(scenarioId ?? null);
    // Fetch available actions when the component mounts or scenarioId changes
    fetchAndSetAvailableActions();
  }, [scenarioId, loadScenario, fetchAndSetAvailableActions]); // Add fetch action to dependencies

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
      // Optionally show a user message/alert
      return;
    }
    // Construct the backend URL
    // Assuming backend runs on port 5001 during development
    const exportUrl = `http://localhost:5001/api/scenarios/export/excel/${encodeURIComponent(currentScenarioId)}`;
    console.log("Triggering export:", exportUrl);

    // Trigger download by navigating or using fetch
    // Direct navigation is simpler for GET requests triggering downloads
    window.open(exportUrl, '_blank');

    // Alternative using fetch (more complex handling of blob/filename):
    // fetch(exportUrl)
    //   .then(response => {
    //     if (!response.ok) {
    //       throw new Error(`Export failed: ${response.statusText}`);
    //     }
    //     // Extract filename from Content-Disposition header if possible
    //     const disposition = response.headers.get('content-disposition');
    //     let filename = `${currentScenarioId}.xlsx`; // Default filename
    //     if (disposition && disposition.indexOf('attachment') !== -1) {
    //       const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    //       const matches = filenameRegex.exec(disposition);
    //       if (matches != null && matches[1]) {
    //         filename = matches[1].replace(/['"]/g, '');
    //       }
    //     }
    //     return response.blob().then(blob => ({ blob, filename }));
    //   })
    //   .then(({ blob, filename }) => {
    //     const url = window.URL.createObjectURL(blob);
    //     const a = document.createElement('a');
    //     a.href = url;
    //     a.download = filename;
    //     document.body.appendChild(a);
    //     a.click();
    //     a.remove();
    //     window.URL.revokeObjectURL(url);
    //   })
    //   .catch(error => {
    //     console.error("Export error:", error);
    //     // Show error message to user
    //   });
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
        {/* Removed the misplaced closing </Typography> tag from here */}

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
                         onUpdateData={updateStepData} // Pass the update function
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
           {/* Placeholder for Save/Review buttons */}
        </Box>
      </Container>
    </Layout>
  );
};

export default CreateEditPageComponent;
