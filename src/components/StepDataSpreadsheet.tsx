'use client';
import React, { useCallback, useState } from 'react';
import { Box, Typography, Button, Stack, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Spreadsheet, { createEmptyMatrix } from 'react-spreadsheet';
import { Action, StepRowData, ParameterInfo, RequestBodyColumnInfo, ResponseBodyColumnInfo, GridType, ScenarioStep } from '@/store/scenarioStore';

interface StepDataSpreadsheetContainerProps {
  step: ScenarioStep;
  actionDetails: Action | undefined;
  onUpdateGridData: (stepId: string, gridType: GridType, newGridData: StepRowData[]) => void;
}

interface SingleSpreadsheetComponentProps {
  gridType: GridType;
  title: string;
  stepId: string;
  rows: StepRowData[];
  columns: string[];
  onUpdateGridData: (stepId: string, gridType: GridType, newGridData: StepRowData[]) => void;
  actionDetails: Action;
}

const SingleSpreadsheetComponent: React.FC<SingleSpreadsheetComponentProps> = ({
  gridType,
  title,
  stepId,
  rows,
  columns,
  onUpdateGridData,
  actionDetails,
}) => {
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  // Convert rows to spreadsheet data format
  const spreadsheetData = rows.map(row => {
    return columns.map(col => {
      const value = row[col] || '';
      return { value };
    });
  });

  // Handle data changes
  const handleDataChange = (data: any) => {
    const updatedRows = data.map((row: any[], rowIndex: number) => {
      const newRow: StepRowData = { id: rows[rowIndex]?.id || `${gridType}-new-${Date.now()}-${rowIndex}` };
      columns.forEach((col, colIndex) => {
        newRow[col] = row[colIndex]?.value || '';
      });
      return newRow;
    });
    onUpdateGridData(stepId, gridType, updatedRows);
  };

  // Handle adding a new row
  const handleAddRow = () => {
    const newRow: StepRowData = { id: `${gridType}-new-${Date.now()}-${Math.random().toString(36).substring(2, 5)}` };
    columns.forEach(col => {
      newRow[col] = '';
    });
    const updatedData = [...rows, newRow];
    onUpdateGridData(stepId, gridType, updatedData);
  };

  // Handle removing selected rows
  const handleRemoveSelectedRows = () => {
    if (selectedRow === null) return;
    const updatedData = rows.filter((_, index) => index !== selectedRow);
    onUpdateGridData(stepId, gridType, updatedData);
    setSelectedRow(null);
  };

  // Only render if there are columns defined
  if (columns.length <= 1) {
    return null;
  }

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 1,
        mt: 2
      }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 400,
            color: 'rgba(0, 0, 0, 0.87)',
            fontSize: '1rem'
          }}
        >
          {title}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button 
            size="small" 
            startIcon={<AddIcon sx={{ fontSize: '20px' }} />} 
            onClick={handleAddRow}
            sx={{ 
              color: 'primary.main',
              textTransform: 'uppercase',
              fontWeight: 500,
              fontSize: '0.8125rem',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)'
              }
            }}
          >
            Add Row
          </Button>
          <Button
            size="small"
            startIcon={<DeleteIcon sx={{ fontSize: '20px', opacity: selectedRow === null ? 0.38 : 1 }} />}
            onClick={handleRemoveSelectedRows}
            disabled={selectedRow === null}
            sx={{ 
              color: 'rgba(0, 0, 0, 0.38)',
              textTransform: 'uppercase',
              fontWeight: 500,
              fontSize: '0.8125rem',
              '&:not(:disabled)': {
                color: 'rgba(0, 0, 0, 0.87)'
              },
              '&:hover:not(:disabled)': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Remove Selected
          </Button>
        </Stack>
      </Box>
      <Box sx={{
        '& .Spreadsheet': {
          '--background-color': '#fff',
          '--text-color': 'rgba(0, 0, 0, 0.87)',
          '--border-color': '#e0e0e0',
          '--header-background-color': '#fafafa',
          '--header-text-color': 'rgba(0, 0, 0, 0.87)',
          '--selected-background-color': 'rgba(25, 118, 210, 0.08)',
          '--selected-border-color': '#1976d2',
          border: '1px solid #e0e0e0',
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          fontSize: '0.875rem',
          width: '100%',
          overflow: 'auto',
          borderRadius: '4px',
          position: 'relative',
          maxHeight: '400px',

          '& .Spreadsheet__table': {
            borderCollapse: 'separate',
            borderSpacing: 0,
            width: 'max-content',
            minWidth: '100%',
          },

          '& .Spreadsheet__header': {
            backgroundColor: '#fafafa',
            color: 'rgba(0, 0, 0, 0.87)',
            fontWeight: 500,
            padding: '12px 16px',
            textAlign: 'left',
            borderBottom: '1px solid #e0e0e0',
            position: 'sticky',
            top: 0,
            zIndex: 2,
            minWidth: '150px'
          },

          '& .Spreadsheet__cell': {
            padding: '12px 16px',
            borderBottom: '1px solid #e0e0e0',
            borderRight: '1px solid #e0e0e0',
            backgroundColor: '#fff',
            minWidth: '150px',
            maxWidth: '300px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            '&:focus': {
              outline: 'none',
              border: '2px solid #1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
            }
          },

          '& input': {
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            fontSize: '0.875rem',
            padding: '12px 16px',
            border: 'none',
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            '&:focus': {
              outline: 'none',
            }
          },

          '& .Spreadsheet__row': {
            display: 'table-row',
            '&:last-child': {
              '& .Spreadsheet__cell': {
                borderBottom: 'none',
              }
            }
          },

          '& .Spreadsheet__row-header': {
            backgroundColor: '#fafafa',
            borderRight: '1px solid #e0e0e0',
            padding: '12px 16px',
            minWidth: '50px',
            textAlign: 'center'
          }
        }
      }}>
        <Spreadsheet
          data={spreadsheetData}
          onChange={handleDataChange}
          onSelect={(point: any) => {
            if (point && typeof point === 'object' && 'row' in point) {
              setSelectedRow(point.row);
            } else {
              setSelectedRow(null);
            }
          }}
          columnLabels={columns}
        />
      </Box>
    </Box>
  );
};

const generateColumns = (actionDetails: Action, gridType: GridType): string[] => {
  const columns: string[] = ['id'];

  if (gridType === 'params') {
    actionDetails.pathPropertyListMap?.pathParamList?.forEach((param: ParameterInfo, index: number) => {
      columns.push(`param_${param.technicalColumnName}_${index}`);
    });

    actionDetails.pathPropertyListMap?.queryParamList?.forEach((param: ParameterInfo, index: number) => {
      columns.push(`query_${param.technicalColumnName}_${index}`);
    });
  }

  if (gridType === 'request') {
    actionDetails.requestBodyColumnList?.forEach((reqCol: RequestBodyColumnInfo) => {
      if (reqCol.attributePath) {
        columns.push(reqCol.attributePath);
      }
    });
  }

  if (gridType === 'response') {
    actionDetails.responseBodyColumnList?.forEach((resCol: ResponseBodyColumnInfo) => {
      if (resCol.attributePath) {
        columns.push(resCol.attributePath);
      }
    });
  }

  return columns;
};

const StepDataSpreadsheetContainer: React.FC<StepDataSpreadsheetContainerProps> = ({
  step,
  actionDetails,
  onUpdateGridData,
}) => {
  if (!actionDetails) return null;

  const paramsColumns = generateColumns(actionDetails, 'params');
  const requestColumns = generateColumns(actionDetails, 'request');
  const responseColumns = generateColumns(actionDetails, 'response');

  return (
    <Box sx={{ width: '100%' }}>
      {/* Parameters Grid */}
      <SingleSpreadsheetComponent
        gridType="params"
        title="Parameters"
        stepId={step.id}
        rows={step.stepParamsData || []}
        columns={paramsColumns}
        onUpdateGridData={onUpdateGridData}
        actionDetails={actionDetails}
      />

      {/* Request Body Grid */}
      <SingleSpreadsheetComponent
        gridType="request"
        title="Request Body"
        stepId={step.id}
        rows={step.stepRequestData || []}
        columns={requestColumns}
        onUpdateGridData={onUpdateGridData}
        actionDetails={actionDetails}
      />

      {/* Response Body Grid */}
      <SingleSpreadsheetComponent
        gridType="response"
        title="Response Body"
        stepId={step.id}
        rows={step.stepResponseData || []}
        columns={responseColumns}
        onUpdateGridData={onUpdateGridData}
        actionDetails={actionDetails}
      />
    </Box>
  );
};

export default StepDataSpreadsheetContainer; 