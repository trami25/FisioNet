import React from 'react';
import { Container, Typography, Box } from '@mui/material';

export const PhysiotherapistsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center">
        <Typography variant="h4" gutterBottom>
          Fizioterapeuti
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Lista fizioterapeuta će biti implementirana uskoro.
        </Typography>
      </Box>
    </Container>
  );
};