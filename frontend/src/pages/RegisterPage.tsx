import React from 'react';
import { Container, Typography, Box } from '@mui/material';

export const RegisterPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box textAlign="center">
        <Typography variant="h4" gutterBottom>
          Registracija
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Stranica za registraciju će biti implementirana uskoro.
        </Typography>
      </Box>
    </Container>
  );
};