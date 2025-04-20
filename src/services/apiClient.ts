import { Action, ScenarioDto } from '@/store/scenarioStore'; // Import ScenarioDto

const API_BASE_URL = 'http://localhost:5001'; // Python Backend server address (Keep for reference or remove if unused)
const JAVA_API_BASE_URL = 'http://localhost:8080'; // Java Backend server address

/**
 * Fetches the list of available actions from the Java backend.
 */
export const fetchActionList = async (): Promise<Action[]> => {
  try {
    // Correct endpoint for the frontend as per ActionCodeController.java
    const response = await fetch(`${JAVA_API_BASE_URL}/api/actions`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // TODO: Add validation for the received data structure if necessary
    return data as Action[]; // Assuming the backend returns data matching the Action type
  } catch (error) {
    console.error("Error fetching action list:", error);
    // Return empty array or re-throw error based on how you want to handle failures
    return [];
  }
};

/**
 * Checks the health of the Java backend server.
 */
export const checkBackendHealth = async (): Promise<boolean> => {
    try {
        // Updated to use the Java backend endpoint
        const response = await fetch(`${JAVA_API_BASE_URL}/health`);
        if (!response.ok) {
            console.error("Java Backend health check failed:", response.status);
            return false;
        }
        const data = await response.json();
        // Check for the status returned by the Java backend
        return data.status === 'UP';
    } catch (error) {
        console.error("Error during Java backend health check:", error);
        return false;
    }
};


// --- Placeholder functions for future implementation ---

/**
 * Saves scenario data to the Java backend (temporary persistence).
 * @param scenarioData - The scenario data object to save.
 */
export const saveScenarioTemporary = async (scenarioData: ScenarioDto): Promise<ScenarioDto> => {
    try {
        // Use Java backend URL and endpoint
        const response = await fetch(`${JAVA_API_BASE_URL}/api/scenarios/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scenarioData),
        });
        if (!response.ok) {
            // Consider more specific error handling based on status code (e.g., 403 Unauthorized)
            const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error saving scenario:", error);
        throw error; // Re-throw to allow calling component to handle it
    }
};

/**
 * Loads scenario data from the Java backend (temporary persistence).
 * @param scenarioId - The ID of the scenario to load.
 */
export const loadScenarioTemporary = async (scenarioId: string): Promise<ScenarioDto> => {
    try {
        // Use Java backend URL and endpoint
        const response = await fetch(`${JAVA_API_BASE_URL}/api/scenarios/load/${scenarioId}`);
        if (!response.ok) {
             // Consider more specific error handling based on status code (e.g., 404 Not Found)
            const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
        }
        const data: ScenarioDto = await response.json();
        // Java backend returns the ScenarioDto directly
        return data;
    } catch (error) {
        console.error(`Error loading scenario ${scenarioId} from Java backend:`, error);
        throw error; // Re-throw to allow calling component to handle it
    }
};
