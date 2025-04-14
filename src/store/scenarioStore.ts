import { create } from 'zustand';

// --- Interfaces ---
export interface Action {
  id: string;
  code: string; // User-friendly name/code
  componentName: string;
  actionCodeGroupName: string;
  type: 'SimpleCommand' | 'SetAndExecute' | 'PostAndVerify' | 'FetchAndVerify'; // Example types
}

export interface ScenarioStep {
  id: string; // Unique ID for the step instance in the flow
  actionId: string; // ID of the Action definition
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
  setAvailableActions: (actions: Action[]) => void;
  setFlowSteps: (steps: ScenarioStep[]) => void;
  addFlowStep: (action: Action) => void;
  removeFlowStep: (stepId: string) => void;
  reorderFlowSteps: (steps: ScenarioStep[]) => void;
  toggleStepExpansion: (stepId: string) => void;
  loadScenario: (scenarioId: string | null) => void;
  resetStore: () => void;
}

// --- Initial State ---
const initialState: ScenarioState = {
  scenarioName: '',
  availableActions: [
    { id: 'act1', code: 'Create User', componentName: 'User Service', actionCodeGroupName: 'CRUD', type: 'PostAndVerify' },
    { id: 'act2', code: 'Get User Details', componentName: 'User Service', actionCodeGroupName: 'Read', type: 'FetchAndVerify' },
    { id: 'act3', code: 'Update User Profile', componentName: 'User Service', actionCodeGroupName: 'CRUD', type: 'SetAndExecute' },
    { id: 'act4', code: 'Place Order', componentName: 'Order Service', actionCodeGroupName: 'Core', type: 'PostAndVerify' },
    { id: 'act5', code: 'Get Order Status', componentName: 'Order Service', actionCodeGroupName: 'Read', type: 'FetchAndVerify' },
  ],
  flowSteps: [],
  isEditMode: false,
  currentScenarioId: null,
  expandedStepId: null,
};

// --- Store Implementation ---
export const useScenarioStore = create<ScenarioState & ScenarioActions>((set, get) => ({
  ...initialState,

  setScenarioName: (name) => set({ scenarioName: name }),
  setAvailableActions: (actions) => set({ availableActions: actions }),
  setFlowSteps: (steps) => set({ flowSteps: steps }),

  addFlowStep: (action) => {
    const newStep: ScenarioStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
      actionId: action.id,
    };
    set((state) => ({ flowSteps: [...state.flowSteps, newStep] }));
  },

  removeFlowStep: (stepId) => {
    set((state) => ({
      flowSteps: state.flowSteps.filter((step) => step.id !== stepId),
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
      set({
        scenarioName: `Scenario ${scenarioId}`,
        flowSteps: [
          { id: 'step-edit-1', actionId: 'act1' },
          { id: 'step-edit-2', actionId: 'act4' },
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
