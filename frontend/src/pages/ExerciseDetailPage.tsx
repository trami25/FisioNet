import React from 'react';
import { Container, Typography, Box } from '@mui/material';

export const ExerciseDetailPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box textAlign="center">
        <Typography variant="h4" gutterBottom>
          Detalji Vežbe
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Detaljna stranica vežbe će biti implementirana uskoro.
        </Typography>
      </Box>
    </Container>
  );
};