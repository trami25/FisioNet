import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Card, 
  CardContent,
  CardActions,
  Paper,
  Chip
} from '@mui/material';
import { 
  FitnessCenter, 
  Schedule, 
  Forum, 
  People,
  TrendingUp,
  Security,
  Support
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: <FitnessCenter color="primary" sx={{ fontSize: 40 }} />,
      title: 'Vežbe i Terapije',
      description: 'Pristup širokom spektru vežbi i terapijskih programa prilagođenih vašim potrebama.',
      action: () => navigate('/exercises'),
      buttonText: 'Pogledaj vežbe',
    },
    {
      icon: <Schedule color="primary" sx={{ fontSize: 40 }} />,
      title: 'Zakazivanje Termina',
      description: 'Lako zakazivanje termina kod kvalifikovanih fizioterapeuta.',
      action: () => navigate(isAuthenticated ? '/appointments' : '/login'),
      buttonText: 'Zakaži termin',
    },
    {
      icon: <Forum color="primary" sx={{ fontSize: 40 }} />,
      title: 'Forum Zajednice',
      description: 'Podelite iskustva i dobijte savete od drugih korisnika i stručnjaka.',
      action: () => navigate(isAuthenticated ? '/forum' : '/login'),
      buttonText: 'Pridruži se forumu',
    },
    {
      icon: <People color="primary" sx={{ fontSize: 40 }} />,
      title: 'Stručni Tim',
      description: 'Kontakt sa licenciranim fizioterapeutima i medicinskim stručnjacima.',
      action: () => navigate('/physiotherapists'),
      buttonText: 'Upoznaj tim',
    },
  ];

  const benefits = [
    {
      icon: <TrendingUp color="secondary" />,
      title: 'Praćenje Napretka',
      description: 'Pratite svoj napredak kroz detaljne izveštaje i analitiku.',
    },
    {
      icon: <Security color="secondary" />,
      title: 'Sigurnost Podataka',
      description: 'Vaši medicinski podaci su potpuno sigurni i zaštićeni.',
    },
    {
      icon: <Support color="secondary" />,
      title: '24/7 Podrška',
      description: 'Dostupna podrška kad god vam je potrebna.',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #2E7D32 0%, #1976D2 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            Dobrodošli u FisioNet
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 4, opacity: 0.9 }}>
            Vaš partnеr za rehabilitaciju i zdravlje
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, fontSize: '1.1rem', opacity: 0.9 }}>
            Platforma koja povezuje pacijente, fizioterapeute i medicinsko osoblje 
            za bolju rehabilitaciju i praćenje terapija.
          </Typography>
          
          {!isAuthenticated ? (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                color="secondary"
                onClick={() => navigate('/register')}
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                }}
              >
                Registruj se besplatno
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Prijavi se
              </Button>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Zdravo, {user?.firstName}! 👋
              </Typography>
              <Chip 
                label={`${user?.role === 'patient' ? 'Pacijent' : 
                        user?.role === 'physiotherapist' ? 'Fizioterapeut' : 
                        user?.role === 'admin' ? 'Administrator' : 'Moderator'}`}
                color="secondary"
                sx={{ mb: 3 }}
              />
              <Box>
                <Button
                  variant="contained"
                  size="large"
                  color="secondary"
                  onClick={() => navigate('/exercises')}
                  sx={{ 
                    px: 4, 
                    py: 1.5,
                    fontSize: '1.1rem',
                    textTransform: 'none',
                  }}
                >
                  Nastavi sa vežbama
                </Button>
              </Box>
            </Box>
          )}
        </Container>
      </Paper>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
          Kako FisioNet pomaže
        </Typography>
        <Typography 
          variant="body1" 
          textAlign="center" 
          color="text.secondary" 
          sx={{ mb: 6, maxWidth: '800px', mx: 'auto' }}
        >
          Naša platforma pruža sve što vam je potrebno za uspešnu rehabilitaciju 
          i održavanje zdravlja kroz stručno vođene programe.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 4 }}>
          {features.map((feature, index) => (
            <Card
              key={index}
              elevation={2}
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                <Box sx={{ mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button 
                  size="small" 
                  color="primary"
                  onClick={feature.action}
                  sx={{ textTransform: 'none' }}
                >
                  {feature.buttonText}
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ backgroundColor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
            Zašto izabrati FisioNet?
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4, mt: 2 }}>
            {benefits.map((benefit, index) => (
              <Box key={index} sx={{ textAlign: 'center', p: 2 }}>
                <Box sx={{ mb: 2 }}>
                  {benefit.icon}
                </Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  {benefit.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {benefit.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      {!isAuthenticated && (
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <Paper elevation={2} sx={{ p: 6, backgroundColor: 'primary.main', color: 'white' }}>
            <Typography variant="h4" component="h2" gutterBottom>
              Spremni ste da počnete?
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
              Pridružite se hiljadama korisnika koji već koriste FisioNet 
              za svoju rehabilitaciju i održavanje zdravlja.
            </Typography>
            <Button
              variant="contained"
              size="large"
              color="secondary"
              onClick={() => navigate('/register')}
              sx={{ 
                px: 4, 
                py: 1.5,
                fontSize: '1.1rem',
                textTransform: 'none',
              }}
            >
              Registruj se danas
            </Button>
          </Paper>
        </Container>
      )}
    </Box>
  );
};