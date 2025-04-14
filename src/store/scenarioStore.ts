import { create } from 'zustand';
import { fetchActionList } from '@/services/apiClient'; // Import the API client function

// --- Interfaces ---
// Updated Action interface to match ActionCodeList.json structure
export interface Action {
  actionCode: string; // Use actionCode as the primary identifier and display name source
  componentName: string;
  actionCodeGroupName: string;
  type: 'SimpleCommand' | 'SetAndExecute' | 'PostAndVerify' | 'FetchAndVerify'; // Ensure these types match JSON values
  endPoint?: string; // Add optional fields from JSON
  pathPropertyListMap?: any; // Add optional fields from JSON (use a more specific type later if needed)
  // Note: We are removing the separate 'id' and 'code' fields
}

// Define a type for the row data within a step's grid
export type StepRowData = Record<string, any> & { id: number | string }; // Ensure each row has a unique id

export interface ScenarioStep {
  id: string; // Unique ID for the step instance in the flow
  actionCode: string; // Reference the Action using its actionCode
  stepData: StepRowData[]; // Array to hold data for this step's grid
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
  updateStepData: (stepId: string, newStepData: StepRowData[]) => void; // Action to update step data
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
    const initialData: StepRowData[] = [{ id: 1, parameter: 'param1', value: '' }]; // Example initial row

    const newStep: ScenarioStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
      actionCode: action.actionCode, // Use actionCode from the updated Action interface
      stepData: initialData, // Initialize step data
    };
    set((state) => ({ flowSteps: [...state.flowSteps, newStep] }));
  },

  removeFlowStep: (stepId) => {
    set((state) => ({
      flowSteps: state.flowSteps.filter((step) => step.id !== stepId),
    }));
  },

  updateStepData: (stepId, newStepData) => {
    set((state) => ({
      flowSteps: state.flowSteps.map((step) =>
        step.id === stepId ? { ...step, stepData: newStepData } : step
      ),
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
      set({
        scenarioName: `Scenario ${scenarioId}`,
        flowSteps: [
          // Replace 'act1' and 'act4' with actual actionCodes if known, otherwise use placeholders
          { id: 'step-edit-1', actionCode: 'placeholderActionCode1', stepData: [{ id: 1, param: 'a', value: '1' }] },
          { id: 'step-edit-2', actionCode: 'placeholderActionCode2', stepData: [{ id: 1, orderId: 'xyz', status: 'pending' }] },
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
