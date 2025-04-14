'use client'; // This component uses client-side hooks (useEffect, useState, Zustand, dnd-kit)
import React, { useEffect, useState, useMemo } from 'react'; // Import useState, useMemo
import {
  Typography, Grid, Paper, Container, TextField, Box,
  Accordion, AccordionSummary, AccordionDetails // Import Accordion components
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Import icon for Accordion
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

  return (
    <Layout>
      <Container> {/* Added Container */}
        <Typography variant="h4" gutterBottom>
          {isEditMode ? `Edit Scenario: ${scenarioName}` : 'Create New Scenario'}
        </Typography>

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
        {/* TODO: Add Review/Save buttons */}
      </Container>
    </Layout>
  );
};

export default CreateEditPageComponent;
