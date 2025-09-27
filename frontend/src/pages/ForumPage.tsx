import React from 'react';
import { Container, Typography, Box } from '@mui/material';

export const ForumPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center">
        <Typography variant="h4" gutterBottom>
          Forum
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Forum zajednice će biti implementiran uskoro.
        </Typography>
      </Box>
    </Container>
  );
};