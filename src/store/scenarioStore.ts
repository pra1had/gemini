import { create } from 'zustand';
import { fetchActionList } from '@/services/apiClient'; // Import the API client function

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
  loadScenario: (scenarioId: string | null) => void;
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
    // TODO: Initialize stepData based on action.type or fetched schema later
    // For now, initialize with an empty array or a default row
    // Initialize all data arrays for the new step
    const newStep: ScenarioStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
      actionCode: action.actionCode,
      stepParamsData: [], // Initialize empty
      stepRequestData: [], // Initialize empty
      stepResponseData: [], // Initialize empty
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

  loadScenario: (scenarioId) => {
    if (scenarioId) {
      set({ isEditMode: true, currentScenarioId: scenarioId });
      // TODO: Fetch existing scenario data later
      // TODO: Fetch existing scenario data later, including stepData
      // For now, use placeholder data with initialized stepData
      // For now, use placeholder data with initialized stepData, using actionCode
      // TODO: Fetch existing scenario data later, including separate grid data
      // For now, use placeholder data with initialized separate grid data
      set({
        scenarioName: `Scenario ${scenarioId}`,
        flowSteps: [
          {
            id: 'step-edit-1',
            actionCode: 'placeholderActionCode1',
            stepParamsData: [{ id: 1, param_code: 'A1' }],
            stepRequestData: [],
            stepResponseData: [{ id: 1, res_status: 'OK' }],
          },
          {
            id: 'step-edit-2',
            actionCode: 'placeholderActionCode2',
            stepParamsData: [],
            stepRequestData: [{ id: 1, req_body_field: 'value1' }],
            stepResponseData: [],
          },
        ],
      });
    } else {
      get().resetStore();
      set({ scenarioName: 'New Scenario' });
    }
  },

  resetStore: () => {
    set({
      scenarioName: '',
      flowSteps: [],
      isEditMode: false,
      currentScenarioId: null,
      expandedStepId: null,
    });
  },
}));
