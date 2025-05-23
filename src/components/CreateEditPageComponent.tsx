'use client'; // This component uses client-side hooks (useEffect, useState, Zustand, dnd-kit)
import React, { useEffect, useState, useMemo } from 'react';
import {
  Typography, Grid, Paper, Container, TextField, Box, Button, // Import Button
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileDownloadIcon from '@mui/icons-material/FileDownload'; // Icon for export button
import HtmlIcon from '@mui/icons-material/Html'; // Icon for HTML export
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
import { useScenarioStore, Action, ScenarioDto, StepRowData, GridType } from '@/store/scenarioStore'; // Import ScenarioDto and StepRowData
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
  const updateStepDescription = useScenarioStore((state) => state.updateStepDescription); // Add this line
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
      return startRow + numRows;
    };

    // Helper function to merge cells
    const mergeCells = (ws: XLSX.WorkSheet, start: string, end: string) => {
      if (!ws['!merges']) ws['!merges'] = [];
      const startAddr = XLSX.utils.decode_cell(start);
      const endAddr = XLSX.utils.decode_cell(end);
      ws['!merges'].push({ 
        s: { r: startAddr.r, c: startAddr.c }, 
        e: { r: endAddr.r, c: endAddr.c } 
      });
    };

    // Helper function to set column widths
    const setColumnWidths = (ws: XLSX.WorkSheet, widths: { [key: string]: number }) => {
      const cols: Array<{ wch: number }> = [];
      Object.entries(widths).forEach(([col, width]) => {
        const colIndex = XLSX.utils.decode_col(col);
        cols[colIndex] = { wch: width };
      });
      ws['!cols'] = cols;
    };

    // Helper function to create a table
    const createTable = (ws: XLSX.WorkSheet, data: any[][], startRow: number, tableName: string) => {
      // Add the data first
      XLSX.utils.sheet_add_aoa(ws, data, { origin: `A${startRow}` });

      // Calculate the range for the table
      const endRow = startRow + data.length - 1;
      const endCol = XLSX.utils.encode_col(data[0].length - 1);
      
      // Define the table
      const tableRef = `A${startRow}:${endCol}${endRow}`;
      
      if (!ws['!tables']) ws['!tables'] = [];
      ws['!tables'].push({
        ref: tableRef,
        name: tableName,
        headerRow: true,
        totalsRow: false,
        displayName: tableName,
        tableStyleInfo: {
          name: "TableStyleMedium2",
          showFirstColumn: false,
          showLastColumn: false,
          showRowStripes: true,
          showColumnStripes: false
        }
      });

      // Update the worksheet range if needed
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      const tableRange = XLSX.utils.decode_range(tableRef);
      range.e.r = Math.max(range.e.r, tableRange.e.r);
      range.e.c = Math.max(range.e.c, tableRange.e.c);
      ws['!ref'] = XLSX.utils.encode_range(range);

      // Return the next row position
      return endRow + 1;
    };

    // Process each step
    flowSteps.forEach((step, stepIndex) => {
      const action = availableActions.find(a => a.actionCode === step.actionCode);
      if (!action) return;

      // Create a new worksheet for each step
      const ws = XLSX.utils.aoa_to_sheet([]);
      let currentRow = 1;

      // Add before description with styling
      if (step.beforeDescription) {
        ws[`A${currentRow}`] = { 
          v: 'Before Context:',
          s: { font: { bold: true, italic: true }, fill: { fgColor: { rgb: 'F5F5F5' } } }
        };
        currentRow++;
        ws[`A${currentRow}`] = { 
          v: step.beforeDescription,
          s: { font: { italic: true }, fill: { fgColor: { rgb: 'F5F5F5' } } }
        };

        // Merge cells for description
        const lastCol = 'E'; // Merge across 5 columns
        mergeCells(ws, `A${currentRow}`, `${lastCol}${currentRow}`);
        mergeCells(ws, `A${currentRow-1}`, `${lastCol}${currentRow-1}`);

        currentRow++;
        currentRow = addSpacingRows(ws, currentRow, 1);
      }

      // Set column widths for better readability
      setColumnWidths(ws, {
        'A': 15, // First column
        'B': 30, // Second column
        'C': 30, // Third column
        'D': 30, // Fourth column
        'E': 30  // Fifth column
      });

      // Add step header
      ws[`A${currentRow}`] = { 
        v: `Step ${stepIndex + 1}: ${action.actionCode}`,
        s: { font: { bold: true } }
      };
      currentRow++;
      ws[`A${currentRow}`] = { v: `Component: ${action.componentName}` };
      currentRow++;
      ws[`A${currentRow}`] = { v: `Group: ${action.actionCodeGroupName}` };
      currentRow++;

      // Add spacing after header
      currentRow = addSpacingRows(ws, currentRow + 1, 1);

      // Process parameters
      if (step.stepParamsData && step.stepParamsData.length > 0) {
        ws[`A${currentRow}`] = { v: 'Parameters' };
        currentRow++;

        // Get all unique parameter names
        const paramNames = new Set<string>();
        step.stepParamsData.forEach((row: StepRowData) => {
          Object.keys(row).forEach(key => {
            if (key.startsWith('param_') || key.startsWith('query_')) {
              paramNames.add(key);
            }
          });
        });

        // Prepare table data
        const headers = ['ID', ...Array.from(paramNames)];
        const data = step.stepParamsData.map((row: StepRowData) => {
          const rowData = [row.id];
          paramNames.forEach(param => {
            rowData.push(row[param] || '');
          });
          return rowData;
        });

        // Create table and get next row position
        currentRow = createTable(ws, [headers, ...data], currentRow, `Parameters_Step${stepIndex + 1}`);
        currentRow = addSpacingRows(ws, currentRow + 1, 2);
      }

      // Process request body
      if (step.stepRequestData && step.stepRequestData.length > 0) {
        ws[`A${currentRow}`] = { v: 'Request Body' };
        currentRow++;

        // Get all unique field names
        const fieldNames = new Set<string>();
        step.stepRequestData.forEach((row: StepRowData) => {
          Object.keys(row).forEach(key => {
            if (key !== 'id') {
              fieldNames.add(key);
            }
          });
        });

        // Prepare table data
        const headers = ['ID', ...Array.from(fieldNames)];
        const data = step.stepRequestData.map((row: StepRowData) => {
          const rowData = [row.id];
          fieldNames.forEach(field => {
            rowData.push(row[field] || '');
          });
          return rowData;
        });

        // Create table and get next row position
        currentRow = createTable(ws, [headers, ...data], currentRow, `Request_Step${stepIndex + 1}`);
        currentRow = addSpacingRows(ws, currentRow + 1, 2);
      }

      // Process response body
      if (step.stepResponseData && step.stepResponseData.length > 0) {
        ws[`A${currentRow}`] = { v: 'Response Body' };
        currentRow++;

        // Get all unique field names
        const fieldNames = new Set<string>();
        step.stepResponseData.forEach((row: StepRowData) => {
          Object.keys(row).forEach(key => {
            if (key !== 'id') {
              fieldNames.add(key);
            }
          });
        });

        // Prepare table data
        const headers = ['ID', ...Array.from(fieldNames)];
        const data = step.stepResponseData.map((row: StepRowData) => {
          const rowData = [row.id];
          fieldNames.forEach(field => {
            rowData.push(row[field] || '');
          });
          return rowData;
        });

        // Create table and get next row position
        currentRow = createTable(ws, [headers, ...data], currentRow, `Response_Step${stepIndex + 1}`);
      }

      console.log(`Step ${stepIndex + 1} after description:`, step.afterDescription);
      console.log('Current row before after description:', currentRow);

      // Add after description with styling
      if (step.afterDescription) {
        // Add spacing before after description
        currentRow = addSpacingRows(ws, currentRow, 2);
        console.log('Row after spacing:', currentRow);
        
        // Add after description header
        ws[`A${currentRow}`] = { 
          v: 'Expected Outcome:',
          s: { font: { bold: true, italic: true }, fill: { fgColor: { rgb: 'F5F5F5' } } }
        };
        currentRow++;
        
        // Add after description content
        ws[`A${currentRow}`] = { 
          v: step.afterDescription,
          s: { font: { italic: true }, fill: { fgColor: { rgb: 'F5F5F5' } } }
        };

        // Merge cells for description
        const lastCol = 'E'; // Merge across 5 columns
        mergeCells(ws, `A${currentRow}`, `${lastCol}${currentRow}`);
        mergeCells(ws, `A${currentRow-1}`, `${lastCol}${currentRow-1}`);

        // Ensure worksheet range includes the after description
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        range.e.r = Math.max(range.e.r, currentRow);
        range.e.c = Math.max(range.e.c, XLSX.utils.decode_col('E'));
        ws['!ref'] = XLSX.utils.encode_range(range);

        console.log('Final row after adding description:', currentRow);
        console.log('Worksheet range:', ws['!ref']);
      }

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, `Step ${stepIndex + 1}`);
    });

    // Generate and download the Excel file
    const wopts: XLSX.WritingOptions = { 
      bookType: 'xlsx',
      bookSST: false,
      type: 'binary',
      cellStyles: true
    };
    XLSX.writeFile(wb, `${scenarioName || 'scenario'}.xlsx`, wopts);
  };

  // --- HTML Export Handler ---
  const handleExportHtml = () => {
    if (!currentScenarioId) {
      console.warn("Cannot export unsaved scenario.");
      return; // Or handle differently, maybe allow export of current state
    }

    const scenario = {
      scenarioId: currentScenarioId,
      scenarioName: scenarioName,
      steps: flowSteps,
    };

    const generateHtml = (data: ScenarioDto): string => {
      let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scenario: ${data.scenarioName} (${data.scenarioId})</title>
  <style>
    body { font-family: sans-serif; line-height: 1.6; margin: 20px; }
    h1, h2, h3 { color: #333; }
    h2 { border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; }
    h3 { margin-top: 20px; color: #555; }
    .step { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; background-color: #f9f9f9; }
    .description { background-color: #eef; padding: 10px; border-radius: 3px; margin-bottom: 10px; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    pre { background-color: #eee; padding: 10px; border-radius: 3px; overflow-x: auto; }
    .grid-container { margin-top: 15px; }
    .empty-grid { color: #888; }
  </style>
</head>
<body>
  <h1>Scenario: ${data.scenarioName} (${data.scenarioId})</h1>
`;

      data.steps.forEach((step, index) => {
        const action = availableActions.find(a => a.actionCode === step.actionCode);
        html += `
  <div class="step">
    <h2>Step ${index + 1}: ${step.actionCode}${action ? ` (${action.type})` : ''}</h2>
    ${step.beforeDescription ? `<div class="description"><strong>Before:</strong> ${step.beforeDescription}</div>` : ''}

    ${generateGridHtml('Parameters', step.stepParamsData)}
    ${generateGridHtml('Request Body', step.stepRequestData)}
    ${generateGridHtml('Response Verification', step.stepResponseData)}

    ${step.afterDescription ? `<div class="description"><strong>After:</strong> ${step.afterDescription}</div>` : ''}
  </div>
`;
      });

      html += `
</body>
</html>
`;
      return html;
    };

    const generateGridHtml = (title: string, gridData: StepRowData[]): string => {
        if (!gridData || gridData.length === 0 || Object.keys(gridData[0]).length <= 1) { // Check if grid is empty or only has 'id'
             return `<div class="grid-container"><h3>${title}</h3><p class="empty-grid">No data.</p></div>`;
        }

        const headers = Object.keys(gridData[0]).filter(key => key !== 'id'); // Exclude 'id' column
        if (headers.length === 0 && gridData.length > 0) {
            // Handle case where rows exist but have no columns other than id (e.g., after adding a row but before defining columns)
            return `<div class="grid-container"><h3>${title}</h3><p class="empty-grid">No columns defined or data entered.</p></div>`;
        }
         if (headers.length === 0) { // Extra check if headers somehow ended up empty
            return `<div class="grid-container"><h3>${title}</h3><p class="empty-grid">No data columns found.</p></div>`;
        }


        let tableHtml = `<div class="grid-container"><h3>${title}</h3><table><thead><tr>`;
        headers.forEach(header => {
            tableHtml += `<th>${header}</th>`;
        });
        tableHtml += `</tr></thead><tbody>`;

        gridData.forEach(row => {
            tableHtml += `<tr>`;
            headers.forEach(header => {
                // Basic handling for non-string data, improve as needed
                const cellValue = row[header];
                const displayValue = (cellValue === null || cellValue === undefined) ? '' : String(cellValue);
                tableHtml += `<td>${displayValue}</td>`; // Simple string conversion
            });
            tableHtml += `</tr>`;
        });

        tableHtml += `</tbody></table></div>`;
        return tableHtml;
    };


    try {
      const htmlContent = generateHtml(scenario);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scenario-${scenario.scenarioId}-${scenario.scenarioName || 'export'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log("HTML export initiated.");
    } catch (error) {
      console.error("Failed to generate or download HTML:", error);
      // Optionally show an error message to the user
    }
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
          {/* Add Export Buttons Here */}
          <Box> {/* Wrap buttons in a Box for layout */}
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExport}
              disabled={!currentScenarioId} // Disable if no scenario ID (not saved yet)
              sx={{ mr: 1 }} // Add margin between buttons
            >
              Export to Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<HtmlIcon />} // Use HTML icon
              onClick={handleExportHtml}
              disabled={!currentScenarioId} // Disable if no scenario ID
            >
              Download as HTML
            </Button>
          </Box>
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
                         onUpdateGridData={updateStepGridData}
                         onUpdateDescription={updateStepDescription}
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
