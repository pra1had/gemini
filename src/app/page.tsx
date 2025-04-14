'use client'; // Needs to be a client component for button/link interaction
import React from 'react';
import { Typography, Button, Container } from '@mui/material';
import Link from 'next/link'; // Use Next.js Link
import Layout from '@/components/Layout'; // Import Layout

export default function SearchPage() {
  return (
    <Layout>
      <Container> {/* Added Container for consistent padding */}
        <Typography variant="h4" gutterBottom>
          Search Scenarios
        </Typography>
        {/* Placeholder for search/filter controls and results list */}
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
      </Container>
    </Layout>
  );
}
