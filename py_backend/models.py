from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Represents a single row of data within a step's grid
# Using a dictionary for flexibility, similar to StepRowData in frontend
StepRowData = Dict[str, Any]

class ScenarioStep(BaseModel):
    """Represents a single step in the scenario flow."""
    # id: str # Frontend specific, not needed in core backend model for persistence? Re-evaluate if needed.
    action_code: str = Field(..., description="The code identifying the action for this step.")
    step_data: List[StepRowData] = Field(default_factory=list, description="Data associated with the step, represented as a list of dictionaries (rows).")

class Scenario(BaseModel):
    """Represents the entire scenario."""
    scenario_name: str = Field(..., description="Unique name for the scenario.")
    component_name: Optional[str] = Field(None, description="Component associated with the scenario (from US-001).")
    tags: List[str] = Field(default_factory=list, description="Optional tags for categorization (from US-001).")
    flow_steps: List[ScenarioStep] = Field(default_factory=list, description="Sequence of steps in the scenario.")

    # Add a simple method to convert incoming JSON (potentially from frontend)
    # This assumes the frontend sends data matching the store structure closely
    @classmethod
    def from_frontend_json(cls, data: Dict[str, Any]) -> 'Scenario':
        # Map frontend keys to backend model keys if they differ
        # Assuming 'scenarioName' -> 'scenario_name', 'flowSteps' -> 'flow_steps' etc.
        # Frontend 'ScenarioStep' has 'id', which we might ignore here unless needed later
        # Frontend 'stepData' seems to match backend 'step_data' structure (List[Dict])
        return cls(
            scenario_name=data.get('scenarioName', 'Unnamed Scenario'),
            component_name=data.get('componentName'), # Assuming frontend sends this
            tags=data.get('tags', []), # Assuming frontend sends this
            flow_steps=[
                ScenarioStep(
                    action_code=step.get('actionCode', ''),
                    step_data=step.get('stepData', [])
                )
                for step in data.get('flowSteps', [])
            ]
        )

    def to_frontend_json(self) -> Dict[str, Any]:
        """Converts the backend model to a JSON structure suitable for the frontend."""
        # Add frontend-specific 'id' to steps if necessary when sending back
        # For now, match the basic structure
        return {
            "scenarioName": self.scenario_name,
            "componentName": self.component_name,
            "tags": self.tags,
            "flowSteps": [
                {
                    "id": f"step-loaded-{i}", # Generate a temporary ID for frontend use
                    "actionCode": step.action_code,
                    "stepData": step.step_data
                }
                for i, step in enumerate(self.flow_steps)
            ]
        }
