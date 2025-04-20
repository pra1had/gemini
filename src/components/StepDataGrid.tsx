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
  GridEventListener, // Import for handling cell clicks etc. if needed later
} from '@mui/x-data-grid';
import { Action, StepRowData, ParameterInfo, RequestBodyColumnInfo, ResponseBodyColumnInfo, GridType, ScenarioStep } from '@/store/scenarioStore'; // Import StepRowData, schema types, GridType, ScenarioStep

// Props for the main container component
interface StepDataGridContainerProps {
  step: ScenarioStep; // Pass the whole step object
  actionDetails: Action | undefined; // Action details for schema
  onUpdateGridData: (stepId: string, gridType: GridType, newGridData: StepRowData[]) => void; // Updated store action
}

// Props for the reusable SingleGridComponent
interface SingleGridComponentProps {
  gridType: GridType;
  title: string;
  stepId: string;
  rows: StepRowData[];
  columns: GridColDef[];
  onUpdateGridData: (stepId: string, gridType: GridType, newGridData: StepRowData[]) => void;
  actionDetails: Action; // Needed for adding rows with correct fields
}


// --- Reusable Single Grid Component ---
const SingleGridComponent: React.FC<SingleGridComponentProps> = ({
  gridType,
  title,
  stepId,
  rows,
  columns,
  onUpdateGridData,
  actionDetails, // Receive actionDetails
}) => {
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);

  // --- Row Update Handling ---
  const processRowUpdate = useCallback(
    (newRow: GridRowModel<StepRowData>, oldRow: GridRowModel<StepRowData>): Promise<StepRowData> => {
      const updatedData = rows.map((row) =>
        row.id === newRow.id ? { ...row, ...newRow } : row
      );
      onUpdateGridData(stepId, gridType, updatedData); // Pass gridType back
      return Promise.resolve(newRow as StepRowData);
    },
    [rows, onUpdateGridData, stepId, gridType]
  );

  const handleProcessRowUpdateError = useCallback((error: any) => {
    console.error(`Error processing row update for ${gridType}:`, error);
  }, [gridType]);

  // --- Add/Remove Row Handlers ---
  const handleAddRow = () => {
    const newId = `${gridType}-new-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const newRow: StepRowData = { id: newId };
    // Initialize fields based on the columns for *this specific grid*
    columns.forEach(col => {
      if (col.field !== 'id') {
        newRow[col.field] = ''; // Initialize dynamic fields
      }
    });
    const updatedData = [...rows, newRow];
    onUpdateGridData(stepId, gridType, updatedData);
  };

  const handleRemoveSelectedRows = () => {
    if (selectionModel.length === 0) return;
    const updatedData = rows.filter((row) => !selectionModel.includes(row.id));
    onUpdateGridData(stepId, gridType, updatedData);
    setSelectionModel([]);
  };

  // Only render grid if there are columns defined (besides ID)
  if (columns.length <= 1) {
    return null; // Or render a placeholder message
  }

  return (
    // Removed fixed height: 300 to allow natural sizing
    <Box sx={{ width: '100%', mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'medium' }}>
        {title}
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
        rows={rows}
        columns={columns}
        initialState={{
          pagination: { paginationModel: { page: 0, pageSize: 5 } },
        }}
        pageSizeOptions={[5, 10]}
        checkboxSelection
        rowSelectionModel={selectionModel}
        onRowSelectionModelChange={setSelectionModel}
        editMode="row"
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={handleProcessRowUpdateError}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
            toolbar: {
              showQuickFilter: true, // Enable quick filter
            },
          }}
      />
    </Box>
  );
};


// --- Dynamic Column Generation (Adapted for Specific Grid Type) ---
const generateGridColumns = (actionDetails: Action, gridType: GridType): GridColDef[] => {
  // Always include ID column
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70, editable: false },
  ];

   // Helper for validation based on mandatory flag
  const validationRule = (isMandatory: boolean | undefined) => ({
    preProcessEditCellProps: (params: any) => {
      const hasError = Boolean(isMandatory && !params.props.value);
      return { ...params.props, error: hasError, helperText: hasError ? 'Required' : null };
    },
  });

  // 1. Generate Columns for Parameters Grid (Path & Query)
  if (gridType === 'params') {
    // Path Params
    // Ensure actionDetails and pathPropertyListMap exist before iterating
    actionDetails.pathPropertyListMap?.pathParamList?.forEach((param: ParameterInfo, index: number) => { // Add index
      columns.push({
        field: `param_${param.technicalColumnName}_${index}`, // Add index for guaranteed uniqueness
        headerName: `Path: ${param.technicalColumnName}`,
        description: param.derivedDataType || param.technicalColumnName, // Use description if available
        width: 150,
        editable: true,
        ...validationRule(param.isMandatory),
      });
    }); // End pathParamList loop

    // Query Params - Corrected loop
    actionDetails.pathPropertyListMap?.queryParamList?.forEach((param: ParameterInfo, index: number) => { // Add index
      columns.push({
        // Use 'query_' prefix and index for field key to ensure uniqueness
        field: `query_${param.technicalColumnName}_${index}`,
        headerName: `Query: ${param.technicalColumnName}`,
        description: param.derivedDataType || param.technicalColumnName, // Use description from schema if available
        width: 150,
        editable: true,
        ...validationRule(param.isMandatory),
      });
    });
  }

  // Helper function sanitizePathForField removed as attributePath is now used directly for field ID.
  // Header text logic removed as attributeGridPath is now used directly for headerName.

  // 2. Generate Columns for Request Body Grid
  if (gridType === 'request') {
    actionDetails.requestBodyColumnList?.forEach((reqCol: RequestBodyColumnInfo) => {
      // Use the new fields directly from the DTO
      const fieldName = reqCol.attributePath; // Use attributePath for field ID
      const headerText = reqCol.attributeGridPath; // Use attributeGridPath for header

      // Basic validation to ensure the fields exist, though they should if backend is correct
      if (!fieldName || !headerText) {
        console.warn("Missing attributePath or attributeGridPath for request column:", reqCol);
        return; // Skip this column if essential data is missing
      }

      columns.push({
        field: fieldName, // Use attributePath
        headerName: headerText, // Use attributeGridPath
        description: `Request Body Field: ${reqCol.technicalColumnName} (Path: ${headerText})`, // Updated description
        width: 200,
        editable: true,
        ...validationRule(reqCol.isMandatory), // Keep validation rule
      });
    });
  }

   // 3. Generate Columns for Response Body Grid (Verification)
  if (gridType === 'response') {
    actionDetails.responseBodyColumnList?.forEach((resCol: ResponseBodyColumnInfo) => {
      // Use the new fields directly from the DTO
      const fieldName = resCol.attributePath; // Use attributePath for field ID
      const headerText = resCol.attributeGridPath; // Use attributeGridPath for header

      // Basic validation
      if (!fieldName || !headerText) {
        console.warn("Missing attributePath or attributeGridPath for response column:", resCol);
        return; // Skip this column if essential data is missing
      }

      columns.push({
        field: fieldName, // Use attributePath
        headerName: headerText, // Use attributeGridPath
        description: `Response Verification Field: ${resCol.technicalColumnName} (Path: ${headerText})`, // Updated description
        width: 200,
        editable: true, // Allow entering expected values
        ...validationRule(resCol.isMandatory), // Keep validation rule (mandatory might mean 'must exist')
      });
    }); // End of responseBodyColumnList loop
  }

  // Add a generic 'Notes' column if a grid type has no specific columns other than ID
  if (columns.length === 1 && gridType !== 'params' && gridType !== 'request' && gridType !== 'response') {
     // This condition might need adjustment based on expected empty states
     // Maybe only add notes if ALL grids are empty? Or handle empty state differently.
     // For now, let's assume if a specific grid type has no schema fields, it shouldn't render.
     // The check is handled in SingleGridComponent.
  }

  return columns;
};


/* Placeholder data - removed */
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

// --- Main Container Component ---
const StepDataGridContainer: React.FC<StepDataGridContainerProps> = ({
  step,
  actionDetails,
  onUpdateGridData,
}) => {

  if (!actionDetails) {
    return <Typography variant="caption">Action details not found for step {step.id}.</Typography>;
  }

  // Generate columns for each grid type
  const paramsColumns = generateGridColumns(actionDetails, 'params');
  const requestColumns = generateGridColumns(actionDetails, 'request');
  const responseColumns = generateGridColumns(actionDetails, 'response');

  return (
    <Box sx={{ width: '100%', mt: 1 }}>
       <Typography variant="body2" gutterBottom>
         Input/Verification Data for: <strong>{actionDetails.actionCode}</strong>
       </Typography>

      {/* Parameters Grid */}
      <SingleGridComponent
        gridType="params"
        title="Parameters (Path & Query)"
        stepId={step.id}
        rows={step.stepParamsData}
        columns={paramsColumns}
        onUpdateGridData={onUpdateGridData}
        actionDetails={actionDetails}
      />

      {/* Request Body Grid */}
      <SingleGridComponent
        gridType="request"
        title="Request Body"
        stepId={step.id}
        rows={step.stepRequestData}
        columns={requestColumns}
        onUpdateGridData={onUpdateGridData}
        actionDetails={actionDetails}
      />

      {/* Response Body Grid (Verification) */}
      <SingleGridComponent
        gridType="response"
        title="Response Verification"
        stepId={step.id}
        rows={step.stepResponseData}
        columns={responseColumns}
        onUpdateGridData={onUpdateGridData}
        actionDetails={actionDetails}
      />
    </Box>
  );
};

export default StepDataGridContainer; // Export the container component
