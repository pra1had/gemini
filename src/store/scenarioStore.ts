import { create } from 'zustand';
// Import necessary functions and types from apiClient
import { fetchActionList, loadScenarioTemporary } from '@/services/apiClient';

// --- Interfaces ---

// Define types based on backend DTOs (matching ActionCodeList.json structure)
export interface ParameterInfo {
  technicalColumnName: string;
  derivedDataType?: string; // Description from OpenAPI
  isMandatory?: boolean;
}

export interface PathPropertyListMap {
  pathParamList?: ParameterInfo[];
  queryParamList?: ParameterInfo[];
}

export interface RequestBodyColumnInfo {
  technicalColumnName: string;
  derivedDataType?: string; // Flattened path like ":request:props:id"
  isMandatory?: boolean;
  attributePath?: string; // New field from backend (derivedDataType + ":" + technicalColumnName)
  attributeGridPath?: string; // New field from backend (derivedDataType + ":" + technicalColumnName)
}

export interface ResponseBodyColumnInfo {
  technicalColumnName: string;
  derivedDataType?: string; // Flattened path like ":response:results:id"
  isMandatory?: boolean; // Indicates if the field is required in the schema definition
  attributePath?: string; // New field from backend (derivedDataType + ":" + technicalColumnName)
  attributeGridPath?: string; // New field from backend (derivedDataType + ":" + technicalColumnName)
}

// Updated Action interface to include detailed schema lists
export interface Action {
  actionCode: string;
  componentName: string;
  actionCodeGroupName: string;
  type: 'SimpleCommand' | 'SetAndExecute' | 'PostAndVerify' | 'FetchAndVerify'; // Ensure these types match JSON values
  endPoint?: string;
  pathPropertyListMap?: PathPropertyListMap; // Use defined type
  requestBodyColumnList?: RequestBodyColumnInfo[]; // Add missing field
  responseBodyColumnList?: ResponseBodyColumnInfo[]; // Add missing field
}

// Define a type for the row data within a step's grid
export type StepRowData = Record<string, any> & { id: number | string }; // Ensure each row has a unique id
export type GridType = 'params' | 'request' | 'response'; // Type to identify the grid

// Updated ScenarioStep to hold data for three separate grids
export interface ScenarioStep {
  id: string; // Unique ID for the step instance in the flow
  actionCode: string; // Reference the Action using its actionCode
  stepParamsData: StepRowData[]; // Data for Path/Query Params grid
  stepRequestData: StepRowData[]; // Data for Request Body grid
  stepResponseData: StepRowData[]; // Data for Response Body grid (verification)
}

interface ScenarioState {
  scenarioName: string;
  availableActions: Action[];
  flowSteps: ScenarioStep[];
  isEditMode: boolean;
  currentScenarioId: string | null;
  expandedStepId: string | null; // Track which step is expanded
}

// Define the main Scenario DTO structure matching the backend
export interface ScenarioDto {
  scenarioId?: string; // Optional for new scenarios being saved
  scenarioName: string;
  steps: ScenarioStep[]; // Corresponds to flowSteps in the store state
}

interface ScenarioActions {
  setScenarioName: (name: string) => void;
  setAvailableActions: (actions: Action[]) => void; // Keep this setter
  fetchAndSetAvailableActions: () => Promise<void>; // Add fetch action
  setFlowSteps: (steps: ScenarioStep[]) => void;
  addFlowStep: (action: Action) => void;
  removeFlowStep: (stepId: string) => void;
  // Updated action to specify which grid's data to update
  updateStepGridData: (stepId: string, gridType: GridType, newGridData: StepRowData[]) => void;
  reorderFlowSteps: (steps: ScenarioStep[]) => void;
  toggleStepExpansion: (stepId: string) => void;
  setCurrentScenarioId: (id: string | null) => void; // Action to set ID from input
  loadScenario: (scenarioId: string | null) => Promise<void>; // Make return Promise<void> explicit
  resetStore: () => void;
}

// --- Initial State ---
const initialState: ScenarioState = {
  scenarioName: '',
  availableActions: [], // Initialize as empty, will be fetched
  flowSteps: [],
  isEditMode: false,
  currentScenarioId: null,
  expandedStepId: null,
};

// --- Store Implementation ---
export const useScenarioStore = create<ScenarioState & ScenarioActions>((set, get) => ({
  ...initialState,

  setScenarioName: (name) => set({ scenarioName: name }),
  setAvailableActions: (actions) => set({ availableActions: actions }), // Keep internal setter

  fetchAndSetAvailableActions: async () => {
    try {
      const actions = await fetchActionList();
      set({ availableActions: actions });
    } catch (error) {
      console.error("Failed to fetch and set available actions:", error);
      // Optionally set some error state in the store
      set({ availableActions: [] }); // Set to empty on error
    }
  },

  setFlowSteps: (steps) => set({ flowSteps: steps }),

  addFlowStep: (action) => {
    // Initialize default rows with all possible columns from the action's schema
    const defaultParamsRow: StepRowData = {
      id: `params-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };

    // Add all path parameters
    action.pathPropertyListMap?.pathParamList?.forEach((param, index) => {
      defaultParamsRow[`param_${param.technicalColumnName}_${index}`] = '';
    });

    // Add all query parameters
    action.pathPropertyListMap?.queryParamList?.forEach((param, index) => {
      defaultParamsRow[`query_${param.technicalColumnName}_${index}`] = '';
    });

    const defaultRequestRow: StepRowData = {
      id: `request-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };

    // Add all request body fields
    action.requestBodyColumnList?.forEach((col) => {
      if (col.attributePath) {
        defaultRequestRow[col.attributePath] = '';
      }
    });

    const defaultResponseRow: StepRowData = {
      id: `response-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };

    // Add all response body fields
    action.responseBodyColumnList?.forEach((col) => {
      if (col.attributePath) {
        defaultResponseRow[col.attributePath] = '';
      }
    });

    // Initialize all data arrays for the new step with default rows
    const newStep: ScenarioStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
      actionCode: action.actionCode,
      stepParamsData: [defaultParamsRow], // Initialize with default row
      stepRequestData: [defaultRequestRow], // Initialize with default row
      stepResponseData: [defaultResponseRow], // Initialize with default row
    };
    set((state) => ({ flowSteps: [...state.flowSteps, newStep] }));
  },

  removeFlowStep: (stepId) => {
    set((state) => ({
      flowSteps: state.flowSteps.filter((step) => step.id !== stepId),
    }));
  },

  // Implementation for the updated action
  updateStepGridData: (stepId, gridType, newGridData) => {
    set((state) => ({
      flowSteps: state.flowSteps.map((step) => {
        if (step.id === stepId) {
          switch (gridType) {
            case 'params':
              return { ...step, stepParamsData: newGridData };
            case 'request':
              return { ...step, stepRequestData: newGridData };
            case 'response':
              return { ...step, stepResponseData: newGridData };
            default:
              return step; // Should not happen
          }
        }
        return step;
      }),
    }));
  },

  reorderFlowSteps: (steps) => {
    set({ flowSteps: steps });
  },

  toggleStepExpansion: (stepId) => {
    set((state) => ({
      expandedStepId: state.expandedStepId === stepId ? null : stepId,
    }));
  },

  setCurrentScenarioId: (id) => set({ currentScenarioId: id }),

  // Updated loadScenario to fetch from the backend
  loadScenario: async (scenarioId) => {
    if (scenarioId) {
      // Loading existing scenario
      set({ isEditMode: true, currentScenarioId: scenarioId, scenarioName: 'Loading...', flowSteps: [] });
      try {
        const loadedScenario = await loadScenarioTemporary(scenarioId); // Call API client
        // Ensure loaded steps have initialized grid data arrays if they are missing/null from backend
        const sanitizedSteps = loadedScenario.steps.map((step: ScenarioStep) => ({ // Add type annotation for step
          ...step,
          stepParamsData: step.stepParamsData || [],
          stepRequestData: step.stepRequestData || [],
          stepResponseData: step.stepResponseData || [],
        }));
        set({
          scenarioName: loadedScenario.scenarioName,
          flowSteps: sanitizedSteps, // Use fetched and sanitized steps
          // Keep isEditMode and currentScenarioId
        });
      } catch (error) {
        console.error(`Failed to load scenario ${scenarioId}:`, error);
        // Handle error state - maybe reset or show an error message
        set({ scenarioName: `Error loading scenario ${scenarioId}`, flowSteps: [], currentScenarioId: null, isEditMode: false });
      }
    } else {
      // Resetting for creating a new scenario
      get().resetStore(); // Calls the updated resetStore below
      set({ scenarioName: 'New Scenario', isEditMode: false }); // Explicitly set edit mode false
    }
  },

  // Updated resetStore to clear currentScenarioId as well
  resetStore: () => {
    set({
      ...initialState // Reset to initial state which includes currentScenarioId: null
    });
  },
}));
