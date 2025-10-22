import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  Card,
  CardContent,
  Alert,
  Skeleton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  PlayArrow,
  Favorite,
  FavoriteBorder,
  Share,
  AccessTime,
  CheckCircle,
  ArrowBack,
  YouTube,
  FitnessCenter,
  Warning,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { Exercise } from '../types';
import { exerciseService } from '../services/exerciseService';
import ImageCarousel from '../components/ImageCarousel';
import { useAuth } from '../context/AuthContext';

export const ExerciseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Mock exercise data for demo
  const mockExercise: Exercise = {
    id: parseInt(id || '1'),
    title: 'Push-ups',
    description: 'Klasična vežba za jačanje gornjeg dela tela koja angažuje grudi, ramena i triceps. Ova vežba je odlična za početnike jer se može prilagoditi različitim nivoima fitnesa.',
    category: 'Strength',
    difficulty_level: 'Beginner',
    duration_minutes: 10,
    equipment_needed: [],
    instructions: [
      'Počnite u poziciji planke sa rukama postavljenim nešto šire od ramena',
      'Držite telo u ravnoj liniji od glave do pete',
      'Spustite telo kontrolisano prema podu, savijajući laktove',
      'Zaustavite se kada su grudi blizu poda',
      'Gurnite se nazad u početnu poziciju',
      'Izdahnite dok se gurate naviše',
      'Ponovite pokret u kontrolisanom tempu',
      'Napravite pauzu između serija ako je potrebno'
    ],
    image_url: 'https://via.placeholder.com/600x300?text=Push-ups+Exercise',
    youtube_url: 'https://youtube.com/watch?v=example',
    target_muscles: ['Chest', 'Arms', 'Shoulders', 'Core'],
    created_at: Date.now() / 1000,
    is_specialized: false,
  };

  useEffect(() => {
    loadExercise();
  }, [id]);

  const loadExercise = async () => {
    if (!id) {
      setError('ID vežbe nije pronađen');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await exerciseService.getExerciseById(parseInt(id));
      setExercise(data);
    } catch (err: any) {
      console.error('Failed to load exercise:', err);
      setError(err.response?.data?.error || 'Failed to load exercise');
      // Fallback to mock data
      setExercise(mockExercise);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExercise = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsStarted(true);
    setShowInstructions(true);
  };

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsFavorite(!isFavorite);
  };

  const handleShare = async () => {
    if (navigator.share && exercise) {
      try {
        await navigator.share({
          title: exercise.title,
          text: exercise.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Sharing failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link je kopiran u clipboard!');
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'success';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/exercises')}
          sx={{ mb: 3 }}
        >
          Nazad na vežbe
        </Button>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Skeleton variant="rectangular" width="100%" height={300} />
          <Skeleton variant="text" sx={{ fontSize: '2rem' }} />
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rectangular" width={100} height={32} />
            <Skeleton variant="rectangular" width={120} height={32} />
            <Skeleton variant="rectangular" width={80} height={32} />
          </Box>
        </Box>
      </Container>
    );
  }

  if (error || !exercise) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/exercises')}
          sx={{ mb: 3 }}
        >
          Nazad na vežbe
        </Button>
        
        <Alert severity="error">
          {error || 'Vežba nije pronađena'}
        </Alert>
      </Container>
    );
  }

  // Prepend backend base URL to image paths if needed
  const EXERCISE_API_URL = process.env.REACT_APP_EXERCISE_API_URL || 'http://localhost:8005';
  const getImageUrls = (images?: string[]) => {
    if (!images) return [];
    return images.map(url => url.startsWith('/static/') ? `${EXERCISE_API_URL}${url}` : url);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/exercises')}
        sx={{ mb: 3 }}
      >
        Nazad na vežbe
      </Button>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Exercise Image */}
        <Paper elevation={2} sx={{ overflow: 'hidden' }}>
          {exercise.images && exercise.images.length > 0 ? (
            <ImageCarousel images={getImageUrls(exercise.images)} alt={exercise.title} height={400} />
          ) : (
            <img
              src={`https://via.placeholder.com/800x400?text=${encodeURIComponent(exercise.title)}`}
              alt={exercise.title}
              style={{ width: '100%', height: '400px', objectFit: 'cover' }}
            />
          )}
        </Paper>

        {/* Main Content */}
        <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Left Column - Details */}
          <Box sx={{ flex: 1 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                {exercise.title}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                {exercise.description}
              </Typography>

              {/* Tags */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                <Chip
                  label={exercise.difficulty_level === 'Beginner' ? 'Početnik' : 
                        exercise.difficulty_level === 'Intermediate' ? 'Napredni' : 'Ekspert'}
                  color={getDifficultyColor(exercise.difficulty_level) as any}
                />
                <Chip label={exercise.category} variant="outlined" />
                {exercise.duration_minutes && (
                  <Chip
                    icon={<AccessTime />}
                    label={`${exercise.duration_minutes} min`}
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>

            {/* Exercise Details */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Target Muscles */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Ciljna grupa mišića
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {exercise.target_muscles.map((muscle, index) => (
                      <Chip key={index} label={muscle} size="small" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
              </Card>

              {/* Equipment */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Potrebna oprema
                  </Typography>
                  {exercise.equipment_needed.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {exercise.equipment_needed.map((equipment, index) => (
                        <Chip key={index} label={equipment} size="small" />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Nije potrebna oprema
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* Safety Notes */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Warning color="warning" />
                    <Typography variant="h6">
                      Napomene o bezbednosti
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    • Uvek se zagrejte pre početka vežbanja<br/>
                    • Prestanite sa vežbanjem ako osetite bol<br/>
                    • Održavajte pravilnu formu tokom celog pokreta<br/>
                    • Konsultujte se sa fizioterapeutom ako imate sumnje
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Right Column - Actions */}
          <Box sx={{ width: { xs: '100%', md: '300px' } }}>
            <Paper elevation={2} sx={{ p: 3, position: 'sticky', top: 20 }}>
              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={handleStartExercise}
                  fullWidth
                >
                  {isStarted ? 'Nastavi vežbu' : 'Započni vežbu'}
                </Button>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={isFavorite ? <Favorite /> : <FavoriteBorder />}
                    onClick={handleToggleFavorite}
                    color={isFavorite ? 'error' : 'primary'}
                    sx={{ flex: 1 }}
                  >
                    {isFavorite ? 'Ukloni' : 'Dodaj u omiljene'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleShare}
                    startIcon={<Share />}
                  >
                    Podeli
                  </Button>
                </Box>

                {exercise.youtube_url && (
                  <Button
                    variant="outlined"
                    startIcon={<YouTube />}
                    onClick={() => window.open(exercise.youtube_url, '_blank')}
                    fullWidth
                    color="error"
                  >
                    Pogledaj na YouTube
                  </Button>
                )}
              </Box>

              {/* Exercise Stats */}
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Informacije
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Nivo:
                  </Typography>
                  <Typography variant="body2">
                    {exercise.difficulty_level === 'Beginner' ? 'Početnik' : 
                     exercise.difficulty_level === 'Intermediate' ? 'Napredni' : 'Ekspert'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Trajanje:
                  </Typography>
                  <Typography variant="body2">
                    {exercise.duration_minutes} min
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Kategorija:
                  </Typography>
                  <Typography variant="body2">
                    {exercise.category}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>

      {/* Instructions Dialog */}
      <Dialog
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FitnessCenter color="primary" />
            Instrukcije za vežbu: {exercise.title}
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {exercise.instructions.map((instruction, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckCircle color="primary" />
                </ListItemIcon>
                <ListItemText primary={instruction} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInstructions(false)}>
            Zatvori
          </Button>
          <Button variant="contained" onClick={() => setShowInstructions(false)}>
            Započni vežbu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Quick Start */}
      {isAuthenticated && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 20, right: 20 }}
          onClick={handleStartExercise}
        >
          <PlayArrow />
        </Fab>
      )}
    </Container>
  );
};