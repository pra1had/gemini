import CreateEditPageComponent from '@/components/CreateEditPageComponent';

export default function CreateScenarioPage() {
  // Render the shared component without a scenarioId for create mode
  return <CreateEditPageComponent />;
}

// Optional: Add metadata for the page
export const metadata = {
  title: 'Create Scenario | Scenario Workbench',
};
