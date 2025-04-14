'use client'; // This component uses client-side hooks (useEffect, useState, Zustand, dnd-kit)
import React, { useEffect } from 'react';
import { Typography, Grid, Paper, Container } from '@mui/material';
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Load scenario data based on the prop passed from the page route
    loadScenario(scenarioId ?? null);
  }, [scenarioId, loadScenario]);

  const handleAddAction = (action: Action) => {
    addFlowStep(action);
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
          <Grid item xs={12} md={4}> {/* Removed component="div" as it's default */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Available Actions</Typography>
              {availableActions.map((action) => (
                <div key={action.id} style={{ marginBottom: '8px', cursor: 'pointer' }} onClick={() => handleAddAction(action)}>
                  {action.code} ({action.componentName})
                </div>
              ))}
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
