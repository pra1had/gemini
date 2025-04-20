#!/bin/bash
# Script to start the Spring Boot backend application in development mode

# Change to the backend directory relative to the script's location
cd "$(dirname "$0")"

# Go up one level to the project root to execute the mock script
echo "Attempting to start/restart WireMock..."
cd ..
# Execute the mock script (ensure it's executable: chmod +x mocking/run-mock.sh)
./mocking/run-mock.sh
# Return to the backend directory
cd backend

echo "Starting backend application..."
# Run the Spring Boot application using Maven
mvn spring-boot:run
