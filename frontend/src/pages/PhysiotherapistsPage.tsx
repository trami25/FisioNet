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
  Rating,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  LocationOn,
  Phone,
  Email,
  Star,
  FilterList,
  Schedule,
  Verified,
  CalendarToday,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Physiotherapist } from '../types';
import { useAuth } from '../context/AuthContext';

// Mock data for physiotherapists
const mockPhysiotherapists: Physiotherapist[] = [
  {
    id: '1',
    firstName: 'Dr. Marija',
    lastName: 'Petrović',
    email: 'marija.petrovic@fisionet.rs',
    phone: '+381 11 123 4567',
    profileImage: '/api/placeholder/150/150',
    specializations: ['Sportska rehabilitacija', 'Geriatrija', 'Neurorehabilitacija'],
    certifications: ['Licenca fizioterapeuta', 'Sertifikat za sportsku rehabilitaciju', 'Manual therapy'],
    biography: 'Iskusna fizioterapeutkinja sa preko 10 godina rada u oblasti sportske rehabilitacije. Specijalizovana za rad sa profesionalnim sportistima i rekreativcima.',
    rating: 4.8,
    reviewCount: 127,
    availability: [],
  },
  {
    id: '2',
    firstName: 'Prof. dr Nikola',
    lastName: 'Jovanović',
    email: 'nikola.jovanovic@fisionet.rs',
    phone: '+381 11 234 5678',
    profileImage: '/api/placeholder/150/150',
    specializations: ['Ortopedska rehabilitacija', 'Postoperativna terapija', 'Kičmena rehabilitacija'],
    certifications: ['Doktor medicine', 'Specijalizacija fizijatrist', 'Manualna terapija'],
    biography: 'Profesor doktor medicine sa dugogodišnjim iskustvom u oblasti ortopedske rehabilitacije. Rukovodi timom fizioterapeuta u vodećoj klinici.',
    rating: 4.9,
    reviewCount: 203,
    availability: [],
  },
  {
    id: '3',
    firstName: 'Ana',
    lastName: 'Milić',
    email: 'ana.milic@fisionet.rs',
    phone: '+381 11 345 6789',
    profileImage: '/api/placeholder/150/150',
    specializations: ['Pedijatrijska fizioterapija', 'Respiratorna terapija', 'Razvojna kineziologija'],
    certifications: ['Master fizioterapije', 'Bobath koncept', 'Vojta terapija'],
    biography: 'Specijalizovana za rad sa decom i bebama. Stručnjakinja za razvojne poremećaje i respiratornu terapiju kod najmlađih pacijenata.',
    rating: 4.7,
    reviewCount: 89,
    availability: [],
  },
  {
    id: '4',
    firstName: 'Stefan',
    lastName: 'Todorović',
    email: 'stefan.todorovic@fisionet.rs',
    phone: '+381 11 456 7890',
    profileImage: '/api/placeholder/150/150',
    specializations: ['Kardiovaskularna rehabilitacija', 'Preventivna fizioterapija', 'Aqua terapija'],
    certifications: ['Master fizioterapije', 'Aqua fitness instruktor', 'Kardio rehabilitacija'],
    biography: 'Fokusiran na preventivnu fizioterapiju i kardiovaskularnu rehabilitaciju. Pionir aqua terapije u našoj zemlji.',
    rating: 4.6,
    reviewCount: 156,
    availability: [],
  },
  {
    id: '5',
    firstName: 'Jelena',
    lastName: 'Stojanović',
    email: 'jelena.stojanovic@fisionet.rs',
    phone: '+381 11 567 8901',
    profileImage: '/api/placeholder/150/150',
    specializations: ['Žensko zdravlje', 'Prenatalna i postnatalna terapija', 'Pilates terapija'],
    certifications: ['Specijalizacija ginekološka fizioterapija', 'Pilates instruktor', 'Prenatal yoga'],
    biography: 'Ekspertkinja za žensko zdravlje i reproduktivnu medicinu. Specijalizovana za rad sa trudnicama i novorotkinjama.',
    rating: 4.9,
    reviewCount: 178,
    availability: [],
  },
  {
    id: '6',
    firstName: 'Miloš',
    lastName: 'Nikolić',
    email: 'milos.nikolic@fisionet.rs',
    phone: '+381 11 678 9012',
    profileImage: '/api/placeholder/150/150',
    specializations: ['Neurološka rehabilitacija', 'Stroke rehabilitacija', 'Parkinsova bolest'],
    certifications: ['Master fizioterapije', 'Bobath koncept', 'FES terapija'],
    biography: 'Specijalizovan za neurološku rehabilitaciju i rad sa pacijentima koji su preležali moždani udar. Koristi najsavremenije tehnike.',
    rating: 4.8,
    reviewCount: 134,
    availability: [],
  },
];

export const PhysiotherapistsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // All hooks must be called before any early returns
  const [physiotherapists, setPhysiotherapists] = useState<Physiotherapist[]>(mockPhysiotherapists);
  const [filteredPhysiotherapists, setFilteredPhysiotherapists] = useState<Physiotherapist[]>(mockPhysiotherapists);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPhysio, setSelectedPhysio] = useState<Physiotherapist | null>(null);

  // Get all unique specializations - must be before useEffect
  const allSpecializations = Array.from(
    new Set(physiotherapists.flatMap(p => p.specializations))
  ).sort();

  // Filter physiotherapists based on search and filters - useEffect must be before early returns
  useEffect(() => {
    let filtered = physiotherapists;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(physio =>
        `${physio.firstName} ${physio.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        physio.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Specialization filter
    if (selectedSpecialization) {
      filtered = filtered.filter(physio =>
        physio.specializations.includes(selectedSpecialization)
      );
    }

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter(physio => physio.rating >= minRating);
    }

    setFilteredPhysiotherapists(filtered);
  }, [physiotherapists, searchTerm, selectedSpecialization, minRating]);

  // Restrict access to patients only for booking appointments
  if (!isAuthenticated || user?.role !== 'patient') {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Samo pacijenti mogu da pregledaju fizioterapeute za zakazivanje termina.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Nazad na početnu
        </Button>
      </Container>
    );
  }

  const handleBookAppointment = (physio: Physiotherapist) => {
    // Navigate to appointment booking page
    navigate(`/physiotherapists/${physio.id}/book`);
  };

  const handleViewProfile = (physio: Physiotherapist) => {
    setSelectedPhysio(physio);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSpecialization('');
    setMinRating(0);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Naši Fizioterapeuti
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Pronađite stručnjaka koji odgovara vašim potrebama
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
          Svi naši fizioterapeuti su licencirani stručnjaci sa dugogodišnjim iskustvom 
          u različitim oblastima rehabilitacije i fizioterapije.
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Pretražite po imenu ili specijalizaciji..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: '300px' }}
          />
          
          <Tooltip title="Filteri">
            <IconButton 
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? 'primary' : 'default'}
            >
              <FilterList />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Advanced Filters */}
        {showFilters && (
          <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Specijalizacija</InputLabel>
                <Select
                  value={selectedSpecialization}
                  label="Specijalizacija"
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                >
                  <MenuItem value="">Sve specijalizacije</MenuItem>
                  {allSpecializations.map((spec) => (
                    <MenuItem key={spec} value={spec}>
                      {spec}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Min. ocena</InputLabel>
                <Select
                  value={minRating}
                  label="Min. ocena"
                  onChange={(e) => setMinRating(Number(e.target.value))}
                >
                  <MenuItem value={0}>Sve ocene</MenuItem>
                  <MenuItem value={4}>4+ zvezdice</MenuItem>
                  <MenuItem value={4.5}>4.5+ zvezdice</MenuItem>
                  <MenuItem value={4.8}>4.8+ zvezdice</MenuItem>
                </Select>
              </FormControl>

              <Button 
                variant="outlined" 
                onClick={clearFilters}
                sx={{ textTransform: 'none' }}
              >
                Obriši filtere
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Results Summary */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Pronađeno {filteredPhysiotherapists.length} fizioterapeuta
        </Typography>
      </Box>

      {/* Physiotherapists Grid */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {filteredPhysiotherapists.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Nema rezultata
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pokušajte sa drugačijim kriterijumima pretrage.
            </Typography>
          </Paper>
        ) : (
          filteredPhysiotherapists.map((physio) => (
            <Card key={physio.id} elevation={2} sx={{ transition: 'all 0.2s', '&:hover': { boxShadow: 4 } }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                  {/* Avatar */}
                  <Avatar
                    src={physio.profileImage}
                    sx={{ 
                      width: 120, 
                      height: 120,
                      border: '3px solid',
                      borderColor: 'primary.main'
                    }}
                  >
                    {physio.firstName[0]}{physio.lastName[0]}
                  </Avatar>

                  {/* Info */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h5" component="h2" fontWeight="bold">
                        {physio.firstName} {physio.lastName}
                      </Typography>
                      <Verified color="primary" fontSize="small" />
                    </Box>

                    {/* Rating */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Rating value={physio.rating} precision={0.1} readOnly size="small" />
                      <Typography variant="body2" color="text.secondary">
                        {physio.rating} ({physio.reviewCount} recenzija)
                      </Typography>
                    </Box>

                    {/* Specializations */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Specijalizacije:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {physio.specializations.slice(0, 3).map((spec, index) => (
                          <Chip 
                            key={index} 
                            label={spec} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        ))}
                        {physio.specializations.length > 3 && (
                          <Chip 
                            label={`+${physio.specializations.length - 3} još`} 
                            size="small" 
                            variant="outlined" 
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Biography */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {physio.biography && physio.biography.length > 150 
                        ? `${physio.biography.substring(0, 150)}...`
                        : physio.biography || 'No biography available'
                      }
                    </Typography>

                    {/* Contact Info */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Phone fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {physio.phone}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Email fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {physio.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: '140px' }}>
                    <Button
                      variant="contained"
                      startIcon={<CalendarToday />}
                      onClick={() => handleBookAppointment(physio)}
                      sx={{ textTransform: 'none' }}
                    >
                      Zakaži termin
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => handleViewProfile(physio)}
                      sx={{ textTransform: 'none' }}
                    >
                      Pogledaj profil
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {/* Physiotherapist Profile Dialog */}
      <Dialog
        open={!!selectedPhysio}
        onClose={() => setSelectedPhysio(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedPhysio && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={selectedPhysio.profileImage}
                  sx={{ width: 60, height: 60 }}
                >
                  {selectedPhysio.firstName[0]}{selectedPhysio.lastName[0]}
                </Avatar>
                <Box>
                  <Typography variant="h5">
                    {selectedPhysio.firstName} {selectedPhysio.lastName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Rating value={selectedPhysio.rating} precision={0.1} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary">
                      {selectedPhysio.rating} ({selectedPhysio.reviewCount} recenzija)
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ py: 2 }}>
                {/* Biography */}
                <Typography variant="h6" gutterBottom>
                  O fizioterapeutu
                </Typography>
                <Typography variant="body1" paragraph>
                  {selectedPhysio.biography}
                </Typography>

                <Divider sx={{ my: 3 }} />

                {/* Specializations */}
                <Typography variant="h6" gutterBottom>
                  Specijalizacije
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                  {selectedPhysio.specializations.map((spec, index) => (
                    <Chip 
                      key={index} 
                      label={spec} 
                      color="primary" 
                      variant="outlined" 
                    />
                  ))}
                </Box>

                {/* Certifications */}
                <Typography variant="h6" gutterBottom>
                  Sertifikati i kvalifikacije
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {selectedPhysio.certifications.map((cert, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Verified color="primary" fontSize="small" />
                      <Typography variant="body2">{cert}</Typography>
                    </Box>
                  ))}
                </Box>

                {/* Contact */}
                <Typography variant="h6" gutterBottom>
                  Kontakt informacije
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone fontSize="small" color="primary" />
                    <Typography variant="body2">{selectedPhysio.phone}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email fontSize="small" color="primary" />
                    <Typography variant="body2">{selectedPhysio.email}</Typography>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedPhysio(null)}>Zatvori</Button>
              <Button
                variant="contained"
                startIcon={<CalendarToday />}
                onClick={() => {
                  setSelectedPhysio(null);
                  handleBookAppointment(selectedPhysio);
                }}
              >
                Zakaži termin
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};