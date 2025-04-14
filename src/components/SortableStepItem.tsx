'use client'; // Components using hooks like useSortable need to be client components
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Paper, Grid, Typography, IconButton } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import { ScenarioStep, Action, StepRowData } from '@/store/scenarioStore'; // Use @ alias, import StepRowData
import StepDataGrid from './StepDataGrid'; // Import the new grid component

interface SortableStepItemProps {
  step: ScenarioStep;
  index: number;
  availableActions: Action[];
  onRemove: (stepId: string) => void;
  expandedStepId: string | null;
  onToggleExpansion: (stepId: string) => void;
  onUpdateData: (stepId: string, newStepData: StepRowData[]) => void; // Add the prop for updating data
}

export const SortableStepItem: React.FC<SortableStepItemProps> = ({
  step,
  index,
  availableActions,
  onRemove,
  expandedStepId,
  onToggleExpansion,
  onUpdateData, // Destructure the new prop
}) => {
  const isExpanded = expandedStepId === step.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  // Find action details using actionCode now
  const actionDetails = availableActions.find(a => a.actionCode === step.actionCode);

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      variant="outlined"
      sx={{ p: 1, mb: 1 }}
    >
      <Grid container alignItems="center">
        <Grid item>
          <IconButton {...attributes} {...listeners} size="small" sx={{ cursor: 'grab', mr: 1 }}>
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
        </Grid>
        <Grid item sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => onToggleExpansion(step.id)}>
          <Typography>
            {/* Display actionCode */}
            Step {index + 1}: {actionDetails?.actionCode || 'Unknown Action'} ({actionDetails?.type})
          </Typography>
        </Grid>
        <Grid item>
          <IconButton
            aria-label="delete step"
            size="small"
            onClick={() => onRemove(step.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Grid>
      </Grid>
      {isExpanded && (
        <Paper elevation={0} sx={{ p: 2, mt: 1, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
          <Typography variant="subtitle2" gutterBottom>
              {/* Display actionCode */}
              Data for: {actionDetails?.actionCode}
            </Typography>
            {/* Pass step data and update handler to the grid */}
            <StepDataGrid
              actionDetails={actionDetails}
              stepId={step.id} // Pass stepId for the update handler
              stepData={step.stepData}
              onUpdateData={onUpdateData}
            />
          </Paper>
        )}
    </Paper>
  );
};
