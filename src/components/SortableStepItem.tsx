'use client'; // Components using hooks like useSortable need to be client components
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Paper, Grid, Typography, IconButton } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
// Import GridType and update store imports
import { ScenarioStep, Action, StepRowData, GridType } from '@/store/scenarioStore';
// Import the container component instead of the old grid
import StepDataGridContainer from './StepDataGrid';

interface SortableStepItemProps {
  step: ScenarioStep; // Step object now contains stepParamsData, stepRequestData, stepResponseData
  index: number;
  availableActions: Action[];
  onRemove: (stepId: string) => void;
  expandedStepId: string | null;
  onToggleExpansion: (stepId: string) => void;
  // Update prop name to match the new store action
  onUpdateGridData: (stepId: string, gridType: GridType, newGridData: StepRowData[]) => void;
}

export const SortableStepItem: React.FC<SortableStepItemProps> = ({
  step,
  index,
  availableActions,
  onRemove,
  expandedStepId,
  onToggleExpansion,
  onUpdateGridData, // Destructure the updated prop
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
          {/* Render the container component */}
          <StepDataGridContainer
            step={step} // Pass the whole step object
            actionDetails={actionDetails}
            onUpdateGridData={onUpdateGridData} // Pass the updated store action handler
          />
        </Paper>
      )}
    </Paper>
  );
};
