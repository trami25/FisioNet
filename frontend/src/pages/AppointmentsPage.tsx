import React from 'react';
import { Container, Typography, Box } from '@mui/material';

export const AppointmentsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center">
        <Typography variant="h4" gutterBottom>
          Termini
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upravljanje terminima će biti implementirano uskoro.
        </Typography>
      </Box>
    </Container>
  );
};