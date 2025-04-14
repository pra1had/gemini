import CreateEditPageComponent from '@/components/CreateEditPageComponent';

interface EditScenarioPageProps {
  params: {
    scenarioId: string; // Next.js passes route params via `params` prop
  };
}

export default function EditScenarioPage({ params }: EditScenarioPageProps) {
  // Render the shared component, passing the scenarioId for edit mode
  return <CreateEditPageComponent scenarioId={params.scenarioId} />;
}

// Optional: Add dynamic metadata based on scenarioId later
export async function generateMetadata({ params }: EditScenarioPageProps) {
  return {
    title: `Edit Scenario ${params.scenarioId} | Scenario Workbench`,
  };
}
