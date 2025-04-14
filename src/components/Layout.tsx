'use client'; // Layout components often need client-side interactivity
import React from 'react';
import { AppBar, Toolbar, Typography, Container } from '@mui/material';
import Link from 'next/link'; // Use Next.js Link

// No explicit children prop type needed in Next.js App Router layout components usually
// interface LayoutProps {
//   children: React.ReactNode;
// }

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {/* Link to home page */}
          <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Scenario Workbench
            </Typography>
          </Link>
          {/* Add navigation buttons or user info here later */}
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ mt: 4, mb: 4 }}>
        {children}
      </Container>
      {/* Add a footer here later if needed */}
    </>
  );
};

export default Layout;
