import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Phone,
  Email,
  CalendarToday,
  Person,
  Chat,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usersService } from '../services/usersService';

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  
  const [patients, setPatients] = useState<User[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load patients from API
  const loadPatients = async () => {
    if (!isAuthenticated || user?.role !== 'physiotherapist') {
      return;
    }

    setLoading(true);
    try {
      const response = await usersService.getPatients();
      setPatients(response.users);
      setFilteredPatients(response.users);
      showToast(`Učitano ${response.users.length} pacijenata`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Greška pri učitavanju pacijenata', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [isAuthenticated, user]);

  // Filter patients based on search term
  useEffect(() => {
    let filtered = patients;

    if (searchTerm) {
      filtered = filtered.filter(patient =>
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.jobType && patient.jobType.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredPatients(filtered);
  }, [patients, searchTerm]);

  const handleViewProfile = (patient: User) => {
    navigate(`/profile/${patient.id}`);
  };

  const handleStartChat = (patient: User) => {
    navigate(`/chat/${patient.id}`);
  };

  const handleScheduleAppointment = (patient: User) => {
    // Navigate to booking page where physiotherapist books for patient
    navigate(`/patients/${patient.id}/book/${user?.id}`);
  };

  // Show access restriction for non-physiotherapists
  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">
          Morate biti prijavljeni da biste videli listu pacijenata.
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={() => navigate('/login')}>
            Prijavite se
          </Button>
        </Box>
      </Container>
    );
  }

  if (user?.role !== 'physiotherapist' && user?.role !== 'admin') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          Samo fizioterapeuti ili administratori mogu da pristupe listi pacijenata.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Moji pacijenti
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Pregled svih pacijenata u sistemu
        </Typography>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Pretražite po imenu, emailu ili zanimanju..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 600 }}
        />
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Results */}
      {!loading && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {filteredPatients.length} pacijenata pronađeno
          </Typography>

          {filteredPatients.length === 0 ? (
            <Alert severity="info">
              {patients.length === 0 
                ? "Trenutno nema registrovanih pacijenata."
                : "Nema rezultata za vašu pretragu. Pokušajte sa drugim ključnim rečima."
              }
            </Alert>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 3,
              '& > *': {
                flex: '1 1 300px',
                maxWidth: 400
              }
            }}>
              {filteredPatients.map((patient) => (
                <Card key={patient.id} sx={{ display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Profile section */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        src={patient.profileImage}
                        sx={{ width: 60, height: 60, mr: 2 }}
                      >
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="h3">
                          {patient.firstName} {patient.lastName}
                        </Typography>
                        {patient.jobType && (
                          <Chip 
                            label={patient.jobType} 
                            size="small" 
                            color="secondary"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Contact info */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {patient.email}
                        </Typography>
                      </Box>
                      {patient.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {patient.phone}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Additional info */}
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Registrovan: {new Date(patient.createdAt).toLocaleDateString('sr-RS')}
                      </Typography>
                      {patient.birthDate && (
                        <Typography variant="body2" color="text.secondary">
                          Rođen: {new Date(patient.birthDate).toLocaleDateString('sr-RS')}
                        </Typography>
                      )}
                      {(patient.height || patient.weight) && (
                        <Typography variant="body2" color="text.secondary">
                          {patient.height && `Visina: ${patient.height}cm`}
                          {patient.height && patient.weight && ', '}
                          {patient.weight && `Težina: ${patient.weight}kg`}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Tooltip title="Pogledaj profil">
                      <IconButton
                        size="small"
                        onClick={() => handleViewProfile(patient)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Pošalji poruku">
                      <IconButton
                        size="small"
                        onClick={() => handleStartChat(patient)}
                      >
                        <Chat />
                      </IconButton>
                    </Tooltip>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CalendarToday />}
                      onClick={() => handleScheduleAppointment(patient)}
                      sx={{ ml: 'auto' }}
                    >
                      Zakaži termin
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          )}
        </>
      )}
    </Container>
  );
};