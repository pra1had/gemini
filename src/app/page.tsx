'use client'; // Needs to be a client component for button/link interaction and state
import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { Typography, Button, Container, TextField, List, ListItem, ListItemButton, ListItemText, CircularProgress, Box } from '@mui/material'; // Import necessary MUI components
import Link from 'next/link'; // Use Next.js Link
import Layout from '@/components/Layout'; // Import Layout
import { ScenarioDto } from '@/store/scenarioStore'; // Use ScenarioDto type

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [scenarios, setScenarios] = useState<ScenarioDto[]>([]);
  const [filteredScenarios, setFilteredScenarios] = useState<ScenarioDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch scenarios on mount
  useEffect(() => {
    const fetchScenarios = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:8080/api/scenarios/all');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ScenarioDto[] = await response.json();
        setScenarios(data);
        setFilteredScenarios(data); // Initialize filtered list with all scenarios
      } catch (e) {
        console.error("Failed to fetch scenarios:", e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();
  }, []);

  // Filter scenarios based on search term
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = scenarios.filter(scenario =>
      (scenario.scenarioName?.toLowerCase() || '').includes(lowerCaseSearchTerm)
    );
    setFilteredScenarios(filtered);
  }, [searchTerm, scenarios]);


  return (
    <Layout>
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Search Scenarios
          </Typography>
          <Button
            variant="contained"
            component={Link}
            href="/create"
          >
            Create New Scenario
          </Button>
        </Box>

        {/* Search Input */}
        <TextField
          fullWidth
          label="Search by name or description"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
        />

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Typography color="error" sx={{ my: 3 }}>
            Error fetching scenarios: {error}
          </Typography>
        )}

        {/* Results List */}
        {!loading && !error && (
          <List>
            {filteredScenarios.length > 0 ? (
              filteredScenarios.map((scenario) => (
                <ListItem
                  key={scenario.scenarioId}
                  disablePadding
                  divider
                >
                  <ListItemButton
                    component={Link}
                    href={`/edit/${scenario.scenarioId}`}
                  >
                    <ListItemText
                      primary={`${scenario.scenarioId}: ${scenario.scenarioName || 'Unnamed Scenario'}`}
                      secondary={`${scenario.steps?.length || 0} step(s)`}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            ) : (
              <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>
                {scenarios.length === 0 ? 'No scenarios found.' : 'No scenarios match your search.'}
              </Typography>
            )}
          </List>
        )}

        {/* Remove old placeholder and button position */}
        {/*
        <Typography paragraph>
          Search functionality will be implemented here (Phase 4).
        </Typography>
        <Button
          variant="contained"
          component={Link} // Use Next.js Link component
          href="/create" // Link to the create page
          sx={{ mt: 2 }}
        >
          Create New Scenario
        </Button>
        */}
      </Container>
    </Layout>
  );
}
