import React from 'react';
import { Container, Typography, Box } from '@mui/material';

export const ExercisesPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center">
        <Typography variant="h4" gutterBottom>
          Vežbe
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Katalog vežbi će biti implementiran uskoro.
        </Typography>
      </Box>
    </Container>
  );
};