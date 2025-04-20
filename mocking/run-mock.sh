#!/bin/bash
# Script to start WireMock, killing any existing process on the specified port first.

PORT=8089
# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Find the PID of the process using the specified port
PID=$(lsof -t -i :$PORT)

# If a PID is found, kill the process
if [ -n "$PID" ]; then
  echo "Found existing process on port $PORT with PID $PID. Killing it..."
  kill -9 $PID
  # Optional: Wait a moment to ensure the port is released
  sleep 1
  echo "Process $PID killed."
else
  echo "No existing process found on port $PORT."
fi

# Now, start the new WireMock instance
echo "Starting WireMock on port $PORT..."
# Change to the script's directory so relative paths (wiremock.jar, --root-dir .) work correctly
cd "$SCRIPT_DIR"
# Start WireMock in the background
java -jar wiremock.jar --port $PORT --root-dir . &
# Capture the process ID (optional, but good practice)
WIREMOCK_PID=$!
echo "WireMock started on port $PORT with PID $WIREMOCK_PID."
# Optionally, wait a moment for WireMock to initialize
# sleep 2
