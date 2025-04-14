import os
import yaml
import json # Keep for potential JSON operations if needed elsewhere
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import io # For sending file data

# --- Local Imports ---
from backend.models import Scenario # Import the Scenario model
from backend.services import markdown_service # Import the markdown service
from backend.services import excel_service # Import the excel service

# --- Configuration Loading ---
# Determine the absolute path to the config file relative to this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, 'config.yaml')
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
    # --- Phase 3 Logic: Save as Markdown temporarily ---
    try:
        # 1. Parse incoming JSON to Scenario object
        # Assuming frontend sends data compatible with Scenario.from_frontend_json
        scenario = Scenario.from_frontend_json(scenario_data)
        scenario_name = scenario.scenario_name # Use name from parsed object

        # 2. Generate Markdown content
        markdown_content = markdown_service.generate_markdown(scenario)

        # 3. Get temporary storage path and ensure directory exists
        temp_dir = config.get('temporary_storage_path', './temp_scenarios')
        # Ensure path is relative to project root if needed (assuming config path is relative)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(base_dir)
        effective_temp_dir = os.path.join(project_root, temp_dir)
        os.makedirs(effective_temp_dir, exist_ok=True)

        # 4. Define file path (using scenario_name, ensure it's filename-safe later if needed)
        # Replace spaces or invalid chars if necessary for filename
        safe_filename = scenario_name.replace(" ", "_").replace("/", "_") + ".md"
        file_path = os.path.join(effective_temp_dir, safe_filename)

        # 5. Save Markdown content to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(markdown_content)

        print(f"Scenario temporarily saved as Markdown to {file_path}")
        # Return the name used for the file as the ID
        return jsonify({"message": "Scenario saved temporarily as Markdown", "id": scenario_name}), 200

    except Exception as e:
        print(f"Error saving scenario as Markdown temporarily: {e}")
        # Consider more specific error handling (e.g., validation errors)
        return jsonify({"error": "Failed to save scenario temporarily"}), 500
    # --- End Phase 3 Logic ---

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

    # --- Phase 3 Logic: Load from temporary Markdown file ---
    try:
        # 1. Get temporary storage path
        temp_dir = config.get('temporary_storage_path', './temp_scenarios')
        base_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(base_dir)
        effective_temp_dir = os.path.join(project_root, temp_dir)

        # 2. Construct file path (assuming scenario_id is the original name)
        # Use the same safe filename logic as in save
        safe_filename = scenario_id.replace(" ", "_").replace("/", "_") + ".md"
        file_path = os.path.join(effective_temp_dir, safe_filename)

        # 3. Read Markdown content from file
        with open(file_path, 'r', encoding='utf-8') as f:
            markdown_content = f.read()

        # 4. Parse Markdown content into Scenario object (using placeholder parser)
        scenario = markdown_service.parse_markdown(markdown_content)
        # Ensure the loaded scenario name matches the requested ID, override if parser is basic
        if scenario.scenario_name == "Parsed Scenario (Placeholder)":
             scenario.scenario_name = scenario_id # Use the ID if parser didn't find it

        print(f"Scenario loaded temporarily from Markdown file: {file_path}")

        # 5. Convert Scenario object to frontend JSON format
        scenario_json = scenario.to_frontend_json()
        return jsonify(scenario_json), 200

    except FileNotFoundError:
        print(f"Temporary scenario Markdown file not found: {file_path}")
        return jsonify({"error": "Scenario not found"}), 404
    except Exception as e:
        print(f"Error loading scenario from Markdown temporarily: {e}")
        return jsonify({"error": "Failed to load scenario temporarily"}), 500
    # --- End Phase 3 Logic ---


# --- Error Handling ---
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not Found"}), 404

@app.errorhandler(500)
def internal_error(error):
    # Log the error details here
    print(f"Server Error: {error}")
    return jsonify({"error": "Internal Server Error"}), 500


@app.route('/api/scenarios/export/excel/<scenario_id>', methods=['GET'])
def export_scenario_excel(scenario_id):
    """
    Phase 3: Endpoint to generate and return a scenario as a standard Excel file.
    Loads from temporary Markdown storage.
    Requires role check (any role can export).
    """
    role = get_current_user_role()
    if not role: # Allow any authenticated role
        pass # Adjust if stricter check needed

    try:
        # 1. Load scenario from temporary Markdown (reuse logic from load_scenario)
        temp_dir = config.get('temporary_storage_path', './temp_scenarios')
        base_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(base_dir)
        effective_temp_dir = os.path.join(project_root, temp_dir)
        safe_filename = scenario_id.replace(" ", "_").replace("/", "_") + ".md"
        file_path = os.path.join(effective_temp_dir, safe_filename)

        with open(file_path, 'r', encoding='utf-8') as f:
            markdown_content = f.read()

        scenario = markdown_service.parse_markdown(markdown_content)
        # Ensure correct name
        if scenario.scenario_name == "Parsed Scenario (Placeholder)":
             scenario.scenario_name = scenario_id

        # 2. Generate Excel file content (bytes)
        excel_bytes = excel_service.generate_excel(scenario)

        # 3. Send the file back to the client
        output_filename = f"{scenario_id}.xlsx"
        return send_file(
            io.BytesIO(excel_bytes),
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=output_filename
        )

    except FileNotFoundError:
        print(f"Temporary scenario Markdown file not found for export: {file_path}")
        return jsonify({"error": "Scenario not found for export"}), 404
    except Exception as e:
        print(f"Error exporting scenario to Excel: {e}")
        return jsonify({"error": "Failed to export scenario to Excel"}), 500


# --- Main Execution ---
if __name__ == '__main__':
    load_config()
    # Add logic to check for essential config values if needed
    port = int(os.environ.get('PORT', 5001)) # Use port 5001 for backend dev server
    print(f"Starting Flask server on port {port}...")
    app.run(debug=True, port=port)
