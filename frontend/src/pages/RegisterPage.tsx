import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { FitnessCenter, ArrowBack, ArrowForward } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RegisterRequest } from '../types';

const steps = ['Osnovne informacije', 'Lični podaci', 'Zdravstveni podaci'];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading, error, clearError } = useAuth();
  const { showError, showSuccess } = useToast();
  
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
    height: undefined,
    weight: undefined,
    job_type: '',
    role: 'patient',
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      showError(error);
      clearError();
    }
  }, [error, showError, clearError]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleInputChange = (field: keyof RegisterRequest | 'confirmPassword', value: string | number | undefined) => {
    if (field === 'confirmPassword') {
      setConfirmPassword(value as string);
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateStep = (step: number) => {
    const errors: { [key: string]: string } = {};

    switch (step) {
      case 0: // Basic info
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

        if (!confirmPassword) {
          errors.confirmPassword = 'Potvrda lozinke je obavezna';
        } else if (formData.password !== confirmPassword) {
          errors.confirmPassword = 'Lozinke se ne poklapaju';
        }

        if (!agreedToTerms) {
          errors.terms = 'Morate se složiti sa uslovima korišćenja';
        }
        break;

      case 1: // Personal info
        if (!formData.first_name) {
          errors.first_name = 'Ime je obavezno';
        }
        if (!formData.last_name) {
          errors.last_name = 'Prezime je obavezno';
        }
        if (formData.phone && !/^[\d\s+\-()]+$/.test(formData.phone)) {
          errors.phone = 'Nevaljan format telefona';
        }
        break;

      case 2: // Health info (optional for patients)
        if (formData.height && (formData.height < 100 || formData.height > 250)) {
          errors.height = 'Visina mora biti između 100 i 250 cm';
        }
        if (formData.weight && (formData.weight < 30 || formData.weight > 300)) {
          errors.weight = 'Težina mora biti između 30 i 300 kg';
        }
        break;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    try {
      // Remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== undefined && value !== '')
      ) as RegisterRequest;

      await register(cleanedData);
      showSuccess('Nalog je uspešno kreiran! Molimo prijavite se.');
    } catch (err) {
      // Error handling is done by the auth context
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              fullWidth
              label="Email adresa"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={!!formErrors.email}
              helperText={formErrors.email}
              disabled={isLoading}
            />
            <TextField
              required
              fullWidth
              label="Lozinka"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={!!formErrors.password}
              helperText={formErrors.password}
              disabled={isLoading}
            />
            <TextField
              required
              fullWidth
              label="Potvrdi lozinku"
              type="password"
              value={confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              disabled={isLoading}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  disabled={isLoading}
                />
              }
              label={
                <Typography variant="body2">
                  Slažem se sa{' '}
                  <Link href="#" onClick={(e) => e.preventDefault()}>
                    uslovima korišćenja
                  </Link>
                  {' '}i{' '}
                  <Link href="#" onClick={(e) => e.preventDefault()}>
                    politikom privatnosti
                  </Link>
                </Typography>
              }
            />
            {formErrors.terms && (
              <Typography variant="caption" color="error">
                {formErrors.terms}
              </Typography>
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                required
                fullWidth
              label="Ime"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              error={!!formErrors.first_name}
              helperText={formErrors.first_name}
                disabled={isLoading}
              />
              <TextField
                required
                fullWidth
              label="Prezime"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              error={!!formErrors.last_name}
              helperText={formErrors.last_name}
                disabled={isLoading}
              />
            </Box>
            <TextField
              fullWidth
              label="Telefon"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              error={!!formErrors.phone}
              helperText={formErrors.phone || 'Opcionalno'}
              disabled={isLoading}
            />
            <TextField
              fullWidth
              label="Datum rođenja"
              type="date"
              value={formData.birth_date}
              onChange={(e) => handleInputChange('birth_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Opcionalno"
              disabled={isLoading}
            />
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Ovi podaci su opcionalni i pomoći će vam fizioterapeutu da pripremi personalizovane vežbe.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Visina (cm)"
                type="number"
                value={formData.height || ''}
                onChange={(e) => handleInputChange('height', e.target.value ? Number(e.target.value) : undefined)}
                error={!!formErrors.height}
                helperText={formErrors.height || 'Opcionalno'}
                disabled={isLoading}
              />
              <TextField
                fullWidth
                label="Težina (kg)"
                type="number"
                value={formData.weight || ''}
                onChange={(e) => handleInputChange('weight', e.target.value ? Number(e.target.value) : undefined)}
                error={!!formErrors.weight}
                helperText={formErrors.weight || 'Opcionalno'}
                disabled={isLoading}
              />
            </Box>

            <FormControl fullWidth>
              <InputLabel>Tip posla</InputLabel>
              <Select
                value={formData.job_type || ''}
                label="Tip posla"
                onChange={(e) => handleInputChange('job_type', e.target.value)}
                disabled={isLoading}
              >
                <MenuItem value="">Izaberite tip posla</MenuItem>
                <MenuItem value="sedentary">Kancelarijski posao</MenuItem>
                <MenuItem value="standing">Posao koji zahteva stajanje</MenuItem>
                <MenuItem value="physical">Fizički posao</MenuItem>
                <MenuItem value="mixed">Kombinovano</MenuItem>
                <MenuItem value="retired">Penzioner</MenuItem>
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="other">Ostalo</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: 600 }}>
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <FitnessCenter color="primary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography component="h1" variant="h4" fontWeight="bold">
              Pridružite se FisioNet-u
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Napravite nalog i počnite svoju rehabilitaciju
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>



          {/* Step Content */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              {steps[activeStep]}
            </Typography>
            {renderStepContent(activeStep)}
          </Box>

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Nazad
            </Button>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  sx={{ minWidth: 120 }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Registruj se'
                  )}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                >
                  Dalje
                </Button>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Login Link */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Već imate nalog?{' '}
              <Link component={RouterLink} to="/login">
                Prijavite se
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};