import os
import yaml
from flask import Flask, jsonify, request
from flask_cors import CORS

# --- Configuration Loading ---
CONFIG_PATH = 'config.yaml'
config = {}

def load_config():
    """Loads configuration from the YAML file."""
    global config
    try:
        with open(CONFIG_PATH, 'r') as f:
            config = yaml.safe_load(f)
        print("Configuration loaded successfully.")
    except FileNotFoundError:
        print(f"Error: Configuration file not found at {CONFIG_PATH}")
        # Handle error appropriately, maybe exit or use defaults
        config = {} # Ensure config is an empty dict if file not found
    except yaml.YAMLError as e:
        print(f"Error parsing configuration file: {e}")
        config = {}

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app) # Enable CORS for all routes, allowing frontend access

# --- Placeholder User Identification ---
def get_current_user_role():
    """
    Placeholder function to get the current user's role.
    Replace with actual user identification logic in Phase 4.
    Reads from config for now.
    """
    # In a real app, you'd get the user from the request header, session, token, etc.
    user_identifier = "placeholder_user" # Simulate a logged-in user
    return config.get('auth', {}).get('user_roles', {}).get(user_identifier, None) # Default to None if not found

# --- API Endpoints ---

@app.route('/health', methods=['GET'])
def health_check():
    """Basic health check endpoint."""
    return jsonify({"status": "healthy"}), 200

@app.route('/api/actions', methods=['GET'])
def get_actions():
    """
    Phase 2: Endpoint to return the list of available Actions.
    Requires implementing the OpenAPI spec reading logic.
    """
    # --- Placeholder Logic ---
    # TODO: Implement logic to read OpenAPI specs based on config['openapi_sources']
    # TODO: Parse specs and generate the structured Action List
    print("Fetching actions...")
    # Example using the local JSON directly for now
    action_list_path = config.get('openapi_sources', [{}])[0].get('path')
    if action_list_path:
        try:
            # Construct the effective path relative to the project root
            base_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(base_dir)
            effective_path = os.path.join(project_root, action_list_path.lstrip('../'))
            print(f"  [Debug] action_list_path from config: {action_list_path}")
            print(f"  [Debug] base_dir (app.py location): {base_dir}")
            print(f"  [Debug] project_root (calculated): {project_root}")
            print(f"  [Debug] effective_path calculated: {effective_path}")

            # Check if the *effective* path exists
            path_exists = os.path.exists(effective_path)
            print(f"  [Debug] os.path.exists(effective_path) check result: {path_exists}")
            if not path_exists:
                 print(f"Action list file not found at calculated path: {effective_path}")
                 return jsonify({"error": "Action list source file not found"}), 404

            # The 'effective_path' calculated above (relative to project root) is the correct one to use.
            # Remove the redundant/incorrect recalculation block below.

            print(f"Attempting to read actions from: {effective_path}")
            with open(effective_path, 'r') as f: # Use the correct effective_path
                # Assuming the source is JSON as per the default config
                import json
                actions = json.load(f) # Use json.load for .json files
            # If supporting YAML specs later, check file extension or add robust parsing
            return jsonify(actions), 200
        except FileNotFoundError:
             print(f"Action list file not found at calculated path: {effective_path}")
             return jsonify({"error": "Action list source file not found"}), 404
        except json.JSONDecodeError as e:
            print(f"Error parsing action list JSON file: {e}")
            return jsonify({"error": "Failed to parse action list source"}), 500
        except Exception as e:
            print(f"Error reading/parsing action list file: {e}")
            return jsonify({"error": "Failed to load action list"}), 500
    else:
        print(f"Action list path not configured correctly in config.yaml")
        return jsonify({"error": "Action list source not configured"}), 404
    # --- End Placeholder ---

@app.route('/api/scenarios/save', methods=['POST'])
def save_scenario():
    """
    Phase 2/3: Endpoint to save scenario data (temporary persistence).
    Phase 4: Will trigger Git PR workflow.
    Requires role check.
    """
    role = get_current_user_role()
    if role not in ['PO', 'QA']:
        return jsonify({"error": "Unauthorized"}), 403

    scenario_data = request.json
    # --- Placeholder Logic ---
    # TODO: Implement temporary storage (e.g., save scenario_data to a file/memory)
    # TODO: In Phase 3, generate Markdown here before saving temporarily
    # TODO: In Phase 4, replace with Git commit/PR logic
    print(f"Received scenario data to save (temporary): {scenario_data.get('name', 'N/A')}")
    # Example: Save to a temporary file named after the scenario
    # scenario_name = scenario_data.get('name', 'untitled_scenario')
    # temp_dir = config.get('temporary_storage_path', './temp_scenarios')
    # os.makedirs(temp_dir, exist_ok=True)
    # file_path = os.path.join(temp_dir, f"{scenario_name}.json") # Saving as JSON temporarily
    # try:
    #     with open(file_path, 'w') as f:
    #         json.dump(scenario_data, f, indent=2)
    #     print(f"Scenario temporarily saved to {file_path}")
    #     return jsonify({"message": "Scenario saved temporarily", "id": scenario_name}), 200
    # except Exception as e:
    #     print(f"Error saving scenario temporarily: {e}")
    #     return jsonify({"error": "Failed to save scenario temporarily"}), 500
    return jsonify({"message": "Save endpoint placeholder hit", "id": scenario_data.get('name', 'N/A')}), 200
    # --- End Placeholder ---

@app.route('/api/scenarios/load/<scenario_id>', methods=['GET'])
def load_scenario(scenario_id):
    """
    Phase 2/3: Endpoint to load scenario data (temporary persistence).
    Phase 4: Will load from Git.
    Requires role check (any role can load).
    """
    role = get_current_user_role()
    if not role: # Allow any authenticated role (PO, QA, Dev)
         # If role check needs to be stricter, adjust here
        pass # For now, allow if any role is assigned

    # --- Placeholder Logic ---
    # TODO: Implement loading from temporary storage
    # TODO: In Phase 3, parse Markdown here after loading temporarily
    # TODO: In Phase 4, replace with Git load logic
    print(f"Received request to load scenario (temporary): {scenario_id}")
    # Example: Load from temporary file
    # temp_dir = config.get('temporary_storage_path', './temp_scenarios')
    # file_path = os.path.join(temp_dir, f"{scenario_id}.json") # Loading JSON temporarily
    # try:
    #     with open(file_path, 'r') as f:
    #         scenario_data = json.load(f)
    #     print(f"Scenario loaded temporarily from {file_path}")
    #     return jsonify(scenario_data), 200
    # except FileNotFoundError:
    #     print(f"Temporary scenario file not found: {file_path}")
    #     return jsonify({"error": "Scenario not found"}), 404
    # except Exception as e:
    #     print(f"Error loading scenario temporarily: {e}")
    #     return jsonify({"error": "Failed to load scenario temporarily"}), 500
    return jsonify({"message": "Load endpoint placeholder hit", "id": scenario_id, "data": {"name": scenario_id, "steps": []}}), 200
    # --- End Placeholder ---


# --- Error Handling ---
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not Found"}), 404

@app.errorhandler(500)
def internal_error(error):
    # Log the error details here
    print(f"Server Error: {error}")
    return jsonify({"error": "Internal Server Error"}), 500

# --- Main Execution ---
if __name__ == '__main__':
    load_config()
    # Add logic to check for essential config values if needed
    port = int(os.environ.get('PORT', 5001)) # Use port 5001 for backend dev server
    print(f"Starting Flask server on port {port}...")
    app.run(debug=True, port=port)
