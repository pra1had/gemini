'use client'; // Components using hooks like useSortable need to be client components
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Paper, Grid, Typography, IconButton } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import { ScenarioStep, Action } from '@/store/scenarioStore'; // Use @ alias

interface SortableStepItemProps {
  step: ScenarioStep;
  index: number;
  availableActions: Action[];
  onRemove: (stepId: string) => void;
  expandedStepId: string | null;
  onToggleExpansion: (stepId: string) => void;
}

export const SortableStepItem: React.FC<SortableStepItemProps> = ({
  step,
  index,
  availableActions,
  onRemove,
  expandedStepId,
  onToggleExpansion,
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

  const actionDetails = availableActions.find(a => a.id === step.actionId);

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
            Step {index + 1}: {actionDetails?.code || 'Unknown Action'} ({actionDetails?.type})
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
            Data for: {actionDetails?.code}
          </Typography>
          <Paper variant="outlined" sx={{ p: 1, mt: 1, backgroundColor: 'grey.100' }}>
            <Typography variant="caption" display="block" sx={{ fontStyle: 'italic' }}>
              (Excel-like grid for Parameters/Request/Verification based on Action Type '{actionDetails?.type}' will go here)
            </Typography>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              <Grid item xs={4}><Typography variant="body2">Field 1</Typography></Grid>
              <Grid item xs={8}><Typography variant="body2">Value 1</Typography></Grid>
              <Grid item xs={4}><Typography variant="body2">Field 2</Typography></Grid>
              <Grid item xs={8}><Typography variant="body2">Value 2</Typography></Grid>
            </Grid>
          </Paper>
        </Paper>
      )}
    </Paper>
  );
};
