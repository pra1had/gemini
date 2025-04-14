'use client'; // DataGrid is a client component
import React, { useCallback, useState } from 'react'; // Import useCallback, useState
import { Box, Typography, Button, Stack } from '@mui/material'; // Import Button, Stack
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  DataGrid,
  GridColDef,
  GridRowsProp,
  GridRowModel,
  GridValidRowModel,
  GridRowSelectionModel, // Import type for selection model
  GridToolbar, // Import GridToolbar
} from '@mui/x-data-grid';
import { Action, StepRowData } from '@/store/scenarioStore'; // Import StepRowData

interface StepDataGridProps {
  actionDetails: Action | undefined;
  stepId: string; // ID of the parent step
  stepData: StepRowData[]; // Actual data for this step's grid
  onUpdateData: (stepId: string, newStepData: StepRowData[]) => void; // Function to update data in the store
}

// --- Dynamic Column Generation ---
const getColumnsForActionType = (actionType: Action['type']): GridColDef[] => {
  // Basic example: return different columns based on type
  // TODO: Replace with schema-driven generation later
  const commonCols: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 50, editable: false }, // Make ID non-editable generally
  ];

  switch (actionType) {
    case 'SimpleCommand':
      return [
        ...commonCols,
        { field: 'commandParam', headerName: 'Command Param', width: 150, editable: true },
        {
          field: 'value',
          headerName: 'Value',
          width: 200,
          editable: true,
          // Example validation: Make this field required
          preProcessEditCellProps: (params) => {
            const hasError = !params.props.value; // Check if value is empty
            // Return the new props with error state and helper text
            return { ...params.props, error: hasError, helperText: hasError ? 'Value is required.' : null };
          },
        },
      ];
    case 'SetAndExecute':
      return [
        ...commonCols,
        { field: 'variable', headerName: 'Variable', width: 150, editable: true },
        { field: 'setValue', headerName: 'Set Value', width: 200, editable: true },
        { field: 'description', headerName: 'Notes', width: 200, editable: true },
      ];
    case 'PostAndVerify':
    case 'FetchAndVerify':
      return [
        ...commonCols,
        { field: 'field', headerName: 'Field (Req/Resp)', width: 150, editable: true },
        { field: 'expectedValue', headerName: 'Expected Value', width: 200, editable: true },
        { field: 'actualValue', headerName: 'Actual (Verify Only)', width: 200, editable: actionType === 'FetchAndVerify' }, // Example conditional editability
        { field: 'verificationType', headerName: 'Verification', width: 150, editable: true, type: 'singleSelect', valueOptions: ['Equals', 'Contains', 'Exists'] },
      ];
    default:
      // Fallback basic columns
      return [
        ...commonCols,
        { field: 'key', headerName: 'Key', width: 150, editable: true },
        { field: 'value', headerName: 'Value', width: 200, editable: true },
      ];
  }
};

// Placeholder data - can be removed if initial state handles empty data well
/*
const placeholderColumns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'parameter', headerName: 'Parameter', width: 130, editable: true },
  { field: 'value', headerName: 'Value', width: 200, editable: true },
  { field: 'description', headerName: 'Description', width: 200 },
];

const placeholderRows: GridRowsProp = [
  { id: 1, parameter: 'userId', value: 'user-123', description: 'The ID of the user' },
  { id: 2, parameter: 'productId', value: 'prod-abc', description: 'The product identifier' },
  { id: 3, parameter: 'quantity', value: 1, description: 'Number of items' },
];
*/

const StepDataGrid: React.FC<StepDataGridProps> = ({
  actionDetails,
  stepId,
  stepData,
  onUpdateData,
}) => {
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);

  if (!actionDetails) {
    return <Typography variant="caption">Action details not found.</Typography>;
  }

  // --- Row Update Handling ---
  const processRowUpdate = useCallback(
    (newRow: GridRowModel<StepRowData>, oldRow: GridRowModel<StepRowData>): Promise<StepRowData> => {
      // This function is called when a row is edited and committed.
      // We need to update the corresponding row in our stepData array.
      const updatedData = stepData.map((row) =>
        row.id === newRow.id ? { ...row, ...newRow } : row
      );
      onUpdateData(stepId, updatedData); // Call the store action to update the state

      // Return the updated row to the DataGrid
      // You might perform validation here before resolving
      return Promise.resolve(newRow as StepRowData);
    },
    [stepData, onUpdateData, stepId]
  );

  const handleProcessRowUpdateError = useCallback((error: any) => {
    // Handle errors during row update if needed
    console.error("Error processing row update:", error);
  }, []);

  // --- Add/Remove Row Handlers ---
  const handleAddRow = () => {
    // Generate a unique ID for the new row
    const newId = `new-${Date.now()}`;
    // Create a new row object with default values (or derive from columns)
    // For simplicity, start with just the ID, other fields will be editable
    const newRow: StepRowData = { id: newId };
    // Add the new row to the existing data
    const updatedData = [...stepData, newRow];
    onUpdateData(stepId, updatedData);
  };

  const handleRemoveSelectedRows = () => {
    if (selectionModel.length === 0) return; // Nothing selected

    const updatedData = stepData.filter((row) => !selectionModel.includes(row.id));
    onUpdateData(stepId, updatedData);
    setSelectionModel([]); // Clear selection after removal
  };

  // Generate columns dynamically based on the action type
  const columns = getColumnsForActionType(actionDetails.type);

  // Use stepData from props if available, otherwise fallback to empty array
  const rowsToDisplay = stepData && stepData.length > 0 ? stepData : []; // Use actual data

  return (
    <Box sx={{ height: 300, width: '100%', mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Data Grid for: {actionDetails.code} (Type: {actionDetails.type})
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Button size="small" startIcon={<AddIcon />} onClick={handleAddRow}>
          Add Row
        </Button>
        <Button
          size="small"
          startIcon={<DeleteIcon />}
          onClick={handleRemoveSelectedRows}
          disabled={selectionModel.length === 0}
          color="error"
        >
          Remove Selected
        </Button>
      </Stack>
      <DataGrid
        rows={rowsToDisplay} // Use data from props
        columns={columns} // Use dynamically generated columns
        initialState={{
          pagination: {
              paginationModel: { page: 0, pageSize: 5 },
            },
          }}
        pageSizeOptions={[5, 10]}
        checkboxSelection // Enable checkbox selection for removal
        rowSelectionModel={selectionModel}
        onRowSelectionModelChange={(newSelectionModel) => {
          setSelectionModel(newSelectionModel);
        }}
        // disableRowSelectionOnClick // Keep this if you only want selection via checkbox
        editMode="row" // Enable row editing
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={handleProcessRowUpdateError}
        // Add the toolbar which includes export/copy functionality
        slots={{
          toolbar: GridToolbar,
        }}
      />
      <Typography variant="caption" display="block" sx={{ fontStyle: 'italic', mt: 1 }}>
        (Grid includes Toolbar, basic validation example added for SimpleCommand's value field.)
      </Typography>
    </Box>
  );
};

export default StepDataGrid;
