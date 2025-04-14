import { Action } from '@/store/scenarioStore'; // Assuming Action type is defined here

const API_BASE_URL = 'http://localhost:5001'; // Backend server address

/**
 * Fetches the list of available actions from the backend.
 */
export const fetchActionList = async (): Promise<Action[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/actions`);
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
 * Checks the health of the backend server.
 */
export const checkBackendHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            console.error("Backend health check failed:", response.status);
            return false;
        }
        const data = await response.json();
        return data.status === 'healthy';
    } catch (error) {
        console.error("Error during backend health check:", error);
        return false;
    }
};


// --- Placeholder functions for future implementation ---

/**
 * Saves scenario data to the backend (temporary persistence).
 * @param scenarioData - The scenario data object to save.
 */
export const saveScenarioTemporary = async (scenarioData: any): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/scenarios/save`, {
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
 * Loads scenario data from the backend (temporary persistence).
 * @param scenarioId - The ID of the scenario to load.
 */
export const loadScenarioTemporary = async (scenarioId: string): Promise<any> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/scenarios/load/${scenarioId}`);
        if (!response.ok) {
             // Consider more specific error handling based on status code (e.g., 404 Not Found)
            const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
        }
        const data = await response.json();
        // The backend placeholder currently returns { message: ..., id: ..., data: ... }
        // Adjust this based on the actual data structure returned by the backend later
        return data.data;
    } catch (error) {
        console.error(`Error loading scenario ${scenarioId}:`, error);
        throw error; // Re-throw to allow calling component to handle it
    }
};
