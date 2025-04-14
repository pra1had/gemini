#!/bin/bash
# Script to activate the virtual environment and start the Flask development server

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Define the path to the virtual environment activation script
VENV_ACTIVATE="$SCRIPT_DIR/venv/bin/activate"

# Check if the activation script exists
if [ ! -f "$VENV_ACTIVATE" ]; then
    echo "Error: Virtual environment activation script not found at $VENV_ACTIVATE"
    echo "Please ensure the virtual environment exists. Run 'python3 -m venv venv' in the backend directory."
    exit 1
fi

# Activate the virtual environment
echo "Activating virtual environment..."
source "$VENV_ACTIVATE"

# Check if activation was successful (optional, depends on shell behavior)
# if [ -z "$VIRTUAL_ENV" ]; then
#     echo "Error: Failed to activate virtual environment."
#     exit 1
# fi

# Ensure we are in the project root directory (one level up from script dir)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Start the Flask application as a module from the project root
echo "Starting Flask development server as module 'backend.app' from $(pwd)..."
python -m backend.app

# Deactivate environment when script exits (optional, usually handled by shell)
# echo "Deactivating virtual environment..."
# deactivate
