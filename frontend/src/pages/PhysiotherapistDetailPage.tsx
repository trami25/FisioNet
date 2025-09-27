import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Avatar,
  Rating,
  Chip,
  Paper,
  Divider,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';

import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Phone,
  Email,
  LocationOn,
  CalendarToday,
  Verified,
  School,
  WorkHistory,
  Star,
  ArrowBack,
  Share,
  Favorite,
  FavoriteBorder,
} from '@mui/icons-material';
import { Physiotherapist } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Mock data for detailed physiotherapist profile
const mockDetailedPhysio: Physiotherapist & {
  education: { degree: string; institution: string; year: string }[];
  experience: { position: string; workplace: string; period: string; description: string }[];
  reviews: { id: string; patientName: string; rating: number; comment: string; date: string }[];
  services: { name: string; duration: string; price: string; description: string }[];
  workingHours: { day: string; hours: string }[];
} = {
  id: '1',
  firstName: 'Dr. Marija',
  lastName: 'Petrović',
  email: 'marija.petrovic@fisionet.rs',
  phone: '+381 11 123 4567',
  profileImage: '/api/placeholder/200/200',
  specializations: ['Sportska rehabilitacija', 'Geriatrija', 'Neurorehabilitacija'],
  certifications: ['Licenca fizioterapeuta', 'Sertifikat za sportsku rehabilitaciju', 'Manual therapy'],
  biography: 'Dr. Marija Petrović je iskusna fizioterapeutkinja sa preko 10 godina rada u oblasti sportske rehabilitacije. Specijalizovana je za rad sa profesionalnim sportistima i rekreativcima. Tokom svoje karijere je pomagala mnogim pacijentima da se vrate svojim aktivnostima nakon povreda. Koristi najsavremenije tehnike i pristupe u rehabilitaciji, uključujući manualnu terapiju, dry needling i funkcionalni trening.',
  rating: 4.8,
  reviewCount: 127,
  availability: [],
  education: [
    {
      degree: 'Doktor medicine - Fizijatar',
      institution: 'Medicinski fakultet, Univerzitet u Beogradu',
      year: '2018'
    },
    {
      degree: 'Master fizioterapije',
      institution: 'Fakultet za sport i fizičko vaspitanje, Univerzitet u Beogradu',
      year: '2014'
    },
    {
      degree: 'Diploma fizioterapeuta',
      institution: 'Visoka zdravstvena škola strukovnih studija u Beogradu',
      year: '2012'
    },
  ],
  experience: [
    {
      position: 'Glavni fizioterapeut',
      workplace: 'Klinika za ortopediju i traumatologiju',
      period: '2019 - sadašnjost',
      description: 'Vođenje tima fizioterapeuta, rad sa složenim slučajevima, mentorstvo mladih kolega.'
    },
    {
      position: 'Fizioterapeut za sportske povrede',
      workplace: 'Sportska ambulanta "ProSport"',
      period: '2016 - 2019',
      description: 'Specijalizovan rad sa profesionalnim i amaterskim sportistima, preventivne programe.'
    },
    {
      position: 'Fizioterapeut',
      workplace: 'Dom zdravlja "Vračar"',
      period: '2012 - 2016',
      description: 'Opšta fizioterapijska praksa, rad sa različitim starosnim grupama i dijagnozama.'
    },
  ],
  reviews: [
    {
      id: '1',
      patientName: 'Marko J.',
      rating: 5,
      comment: 'Izuzetno profesionalna i stručna. Pomogla mi je da se potpuno oporavim nakon povrede kolena. Preporučujem svima!',
      date: '2024-02-15'
    },
    {
      id: '2',
      patientName: 'Ana M.',
      rating: 5,
      comment: 'Dr. Petrović je fantastična! Vrlo pažljiva i objašnjava svaki korak terapije. Osećam se mnogo bolje.',
      date: '2024-02-10'
    },
    {
      id: '3',
      patientName: 'Stefan K.',
      rating: 4,
      comment: 'Odličan pristup i rezultati. Jedino što termini su ponekad teški za dobijanje zbog velike potražnje.',
      date: '2024-02-05'
    },
  ],
  services: [
    {
      name: 'Individualna fizioterapija',
      duration: '60 min',
      price: '3.500 RSD',
      description: 'Personalizovana terapija prilagođena individualnim potrebama pacijenta.'
    },
    {
      name: 'Sportska rehabilitacija',
      duration: '90 min',
      price: '4.500 RSD',
      description: 'Specijalizovana rehabilitacija za sportske povrede i povratak sportu.'
    },
    {
      name: 'Manualna terapija',
      duration: '45 min',
      price: '4.000 RSD',
      description: 'Tehnike manualnih manipulacija za poboljšanje pokretljivosti zglobova.'
    },
    {
      name: 'Funkcionalni trening',
      duration: '60 min',
      price: '3.000 RSD',
      description: 'Vežbe funkcionalnog pokreta za poboljšanje svakodnevnih aktivnosti.'
    },
  ],
  workingHours: [
    { day: 'Ponedeljak', hours: '08:00 - 16:00' },
    { day: 'Utorak', hours: '08:00 - 16:00' },
    { day: 'Sreda', hours: '08:00 - 16:00' },
    { day: 'Četvrtak', hours: '08:00 - 16:00' },
    { day: 'Petak', hours: '08:00 - 14:00' },
    { day: 'Subota', hours: 'Zatvoreno' },
    { day: 'Nedelja', hours: 'Zatvoreno' },
  ],
};

export const PhysiotherapistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [physio, setPhysio] = useState(mockDetailedPhysio);
  const [tabValue, setTabValue] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // In a real app, fetch physiotherapist data by ID
    // For now, we use mock data
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBookAppointment = () => {
    navigate(`/physiotherapists/${physio.id}/book`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${physio.firstName} ${physio.lastName} - FisioNet`,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // In a real app, save to backend
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/physiotherapists')}
        sx={{ mb: 3, textTransform: 'none' }}
      >
        Nazad na listu fizioterapeuta
      </Button>

      {/* Header Card */}
      <Card elevation={3} sx={{ mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            {/* Avatar */}
            <Avatar
              src={physio.profileImage}
              sx={{ 
                width: 150, 
                height: 150,
                border: '4px solid',
                borderColor: 'primary.main'
              }}
            >
              {physio.firstName[0]}{physio.lastName[0]}
            </Avatar>

            {/* Info */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h4" component="h1" fontWeight="bold">
                  {physio.firstName} {physio.lastName}
                </Typography>
                <Verified color="primary" />
              </Box>

              {/* Rating */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Rating value={physio.rating} precision={0.1} readOnly />
                <Typography variant="body1" fontWeight="bold">
                  {physio.rating}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ({physio.reviewCount} recenzija)
                </Typography>
              </Box>

              {/* Specializations */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Specijalizacije:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {physio.specializations.map((spec, index) => (
                    <Chip 
                      key={index} 
                      label={spec} 
                      color="primary" 
                      variant="outlined" 
                    />
                  ))}
                </Box>
              </Box>

              {/* Contact Info */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone fontSize="small" color="primary" />
                  <Typography variant="body2">{physio.phone}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email fontSize="small" color="primary" />
                  <Typography variant="body2">{physio.email}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: '160px' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<CalendarToday />}
                onClick={handleBookAppointment}
                sx={{ textTransform: 'none' }}
              >
                Zakaži termin
              </Button>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title={isFavorite ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}>
                  <IconButton onClick={toggleFavorite} color="primary">
                    {isFavorite ? <Favorite /> : <FavoriteBorder />}
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Podeli profil">
                  <IconButton onClick={handleShare} color="primary">
                    <Share />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper elevation={2}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="O fizioterapeutu" />
          <Tab label="Obrazovanje i iskustvo" />
          <Tab label="Usluge i cene" />
          <Tab label="Recenzije" />
          <Tab label="Radno vreme" />
        </Tabs>

        {/* About Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Biografija
            </Typography>
            <Typography variant="body1" paragraph>
              {physio.biography}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Sertifikati i kvalifikacije
            </Typography>
            <List>
              {physio.certifications.map((cert, index) => (
                <ListItem key={index}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Verified />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={cert} />
                </ListItem>
              ))}
            </List>
          </Box>
        </TabPanel>

        {/* Education & Experience Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Obrazovanje
            </Typography>
            <Timeline>
              {physio.education.map((edu, index) => (
                <TimelineItem key={index}>
                  <TimelineOppositeContent color="text.secondary">
                    {edu.year}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color="primary">
                      <School />
                    </TimelineDot>
                    {index < physio.education.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="h6" component="span">
                      {edu.degree}
                    </Typography>
                    <Typography color="text.secondary">
                      {edu.institution}
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" gutterBottom>
              Radno iskustvo
            </Typography>
            <Timeline>
              {physio.experience.map((exp, index) => (
                <TimelineItem key={index}>
                  <TimelineOppositeContent color="text.secondary">
                    {exp.period}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color="secondary">
                      <WorkHistory />
                    </TimelineDot>
                    {index < physio.experience.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="h6" component="span">
                      {exp.position}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      {exp.workplace}
                    </Typography>
                    <Typography variant="body2">
                      {exp.description}
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Box>
        </TabPanel>

        {/* Services Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Usluge i cenovnik
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {physio.services.map((service, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Typography variant="h6">
                        {service.name}
                      </Typography>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" color="primary">
                          {service.price}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {service.duration}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {service.description}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        </TabPanel>

        {/* Reviews Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recenzije pacijenata
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {physio.reviews.map((review) => (
                <Card key={review.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {review.patientName}
                        </Typography>
                        <Rating value={review.rating} size="small" readOnly />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(review.date).toLocaleDateString('sr-RS')}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {review.comment}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        </TabPanel>

        {/* Working Hours Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Radno vreme
            </Typography>
            <List>
              {physio.workingHours.map((schedule, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={schedule.day}
                    secondary={schedule.hours}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontWeight: schedule.hours === 'Zatvoreno' ? 'normal' : 'bold',
                      },
                      '& .MuiListItemText-secondary': {
                        color: schedule.hours === 'Zatvoreno' ? 'text.disabled' : 'text.secondary',
                      },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};