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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usersService } from '../services/usersService';

export const PhysiotherapistsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  
  const [physiotherapists, setPhysiotherapists] = useState<User[]>([]);
  const [filteredPhysiotherapists, setFilteredPhysiotherapists] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load physiotherapists from API
  const loadPhysiotherapists = async () => {
    if (!isAuthenticated || user?.role !== 'patient') {
      return;
    }

    setLoading(true);
    try {
      const response = await usersService.getPhysiotherapists();
      setPhysiotherapists(response.users);
      setFilteredPhysiotherapists(response.users);
      showToast(`Učitano ${response.users.length} fizioterapeuta`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Greška pri učitavanju fizioterapeuta', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhysiotherapists();
  }, [isAuthenticated, user]);

  // Filter physiotherapists based on search term
  useEffect(() => {
    let filtered = physiotherapists;

    if (searchTerm) {
      filtered = filtered.filter(physio =>
        `${physio.firstName} ${physio.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        physio.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (physio.jobType && physio.jobType.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredPhysiotherapists(filtered);
  }, [physiotherapists, searchTerm]);

  const handleBookAppointment = (physiotherapist: User) => {
    navigate(`/appointment-booking/${physiotherapist.id}`);
  };

  const handleViewProfile = (physiotherapist: User) => {
    navigate(`/profile/${physiotherapist.id}`);
  };

  // Show access restriction for non-patients
  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">
          Morate biti prijavljeni da biste videli listu fizioterapeuta.
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={() => navigate('/login')}>
            Prijavite se
          </Button>
        </Box>
      </Container>
    );
  }

  if (user?.role !== 'patient') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          Samo pacijenti mogu da pristupe listi fizioterapeuta.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Fizioterapeuti
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Pronađite i zakažite termin sa kvalifikovanim fizioterapeutima
        </Typography>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Pretražite po imenu, emailu ili specijalizaciji..."
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
            {filteredPhysiotherapists.length} fizioterapeuta pronađeno
          </Typography>

          {filteredPhysiotherapists.length === 0 ? (
            <Alert severity="info">
              {physiotherapists.length === 0 
                ? "Trenutno nema dostupnih fizioterapeuta."
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
              {filteredPhysiotherapists.map((physiotherapist) => (
                <Card key={physiotherapist.id} sx={{ display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Profile section */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        src={physiotherapist.profileImage}
                        sx={{ width: 60, height: 60, mr: 2 }}
                      >
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="h3">
                          {physiotherapist.firstName} {physiotherapist.lastName}
                        </Typography>
                        {physiotherapist.jobType && (
                          <Chip 
                            label={physiotherapist.jobType} 
                            size="small" 
                            color="primary"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                        {physiotherapist.yearsOfExperience && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {physiotherapist.yearsOfExperience} godina iskustva
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Specializations */}
                    {physiotherapist.specializations && physiotherapist.specializations.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Specijalizacije:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {physiotherapist.specializations.slice(0, 3).map((spec, index) => (
                            <Chip 
                              key={index}
                              label={spec.name} 
                              size="small" 
                              variant="outlined"
                              color="secondary"
                            />
                          ))}
                          {physiotherapist.specializations.length > 3 && (
                            <Chip 
                              label={`+${physiotherapist.specializations.length - 3}`}
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Bio preview */}
                    {physiotherapist.bio && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {physiotherapist.bio.length > 100 
                            ? `${physiotherapist.bio.substring(0, 100)}...`
                            : physiotherapist.bio
                          }
                        </Typography>
                      </Box>
                    )}

                    {/* Contact info */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {physiotherapist.email}
                        </Typography>
                        </Box>
                        {physiotherapist.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {physiotherapist.phone}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Additional info */}
                      {physiotherapist.birthDate && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Član od: {new Date(physiotherapist.createdAt).toLocaleDateString('sr-RS')}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        size="small"
                        onClick={() => handleViewProfile(physiotherapist)}
                      >
                        Profil
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<CalendarToday />}
                        onClick={() => handleBookAppointment(physiotherapist)}
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