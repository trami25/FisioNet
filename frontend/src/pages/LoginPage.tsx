import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { FitnessCenter } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.email) {
      errors.email = 'Email je obavezan';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email format nije valjan';
    }

    if (!formData.password) {
      errors.password = 'Lozinka je obavezna';
    } else if (formData.password.length < 6) {
      errors.password = 'Lozinka mora imati najmanje 6 karaktera';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await login(formData.email, formData.password);
    } catch (err) {
      // Error handling is done by the auth context
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          marginBottom: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <FitnessCenter color="primary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography component="h1" variant="h4" fontWeight="bold">
              FisioNet
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Prijavite se na vaš nalog
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email adresa"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
              disabled={isLoading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Lozinka"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              error={!!formErrors.password}
              helperText={formErrors.password}
              disabled={isLoading}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Prijavi se'
              )}
            </Button>

            <Divider sx={{ my: 3 }}>ili</Divider>

            {/* Demo Accounts */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" textAlign="center" gutterBottom>
                Demo nalozi za testiranje:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setFormData({ email: 'patient@test.com', password: 'password' })}
                  disabled={isLoading}
                >
                  Pacijent
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setFormData({ email: 'physio@test.com', password: 'password' })}
                  disabled={isLoading}
                >
                  Fizioterapeut
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setFormData({ email: 'admin@test.com', password: 'password' })}
                  disabled={isLoading}
                >
                  Admin
                </Button>
              </Box>
            </Box>

            {/* Links */}
            <Box sx={{ textAlign: 'center' }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                sx={{ display: 'block', mb: 1 }}
              >
                Zaboravili ste lozinku?
              </Link>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Nemate nalog?
                </Typography>
                <Link component={RouterLink} to="/register" variant="body2">
                  Registrujte se
                </Link>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};