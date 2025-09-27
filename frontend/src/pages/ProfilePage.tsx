import React from 'react';
import { Container, Typography, Box } from '@mui/material';

export const ProfilePage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box textAlign="center">
        <Typography variant="h4" gutterBottom>
          Profil
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Profil korisnika će biti implementiran uskoro.
        </Typography>
      </Box>
    </Container>
  );
};