import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Search,
  FilterList,
  PlayArrow,
  Favorite,
  FavoriteBorder,
  AccessTime,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Exercise, ExerciseFilter } from '../types';
import { exerciseService } from '../services/exerciseService';

export const ExercisesPage: React.FC = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<ExerciseFilter>({
    search: '',
    category: '',
    difficultyLevel: '',
    targetMuscle: '',
  });

  // Mock data for demo purposes
  const mockExercises: Exercise[] = [
    {
      id: '1',
      title: 'Push-ups',
      description: 'Klasična vežba za jačanje gornjeg dela tela koja angažuje grudi, ramena i triceps.',
      category: 'Strength',
      difficultyLevel: 'Beginner',
      durationMinutes: 10,
      equipmentNeeded: [],
      instructions: [
        'Postavite se u poziciju za sklekove',
        'Spustite telo do poda',
        'Gurnite se nazad u početnu poziciju',
        'Ponovite pokret'
      ],
      imageUrl: 'https://via.placeholder.com/300x200?text=Push-ups',
      youtubeUrl: 'https://youtube.com/watch?v=example',
      targetMuscles: ['Chest', 'Arms', 'Shoulders'],
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      title: 'Squats',
      description: 'Odlična vežba za jačanje nogu i gluteusa, poboljšava funkcionalnu snagu.',
      category: 'Strength',
      difficultyLevel: 'Beginner',
      durationMinutes: 15,
      equipmentNeeded: [],
      instructions: [
        'Stanite sa nogama na širini ramena',
        'Spustite se u čučanj',
        'Držite leđa ravno',
        'Vratite se u početnu poziciju'
      ],
      imageUrl: 'https://via.placeholder.com/300x200?text=Squats',
      youtubeUrl: 'https://youtube.com/watch?v=example2',
      targetMuscles: ['Legs', 'Glutes'],
      createdAt: '2024-01-02T00:00:00Z',
    },
    {
      id: '3',
      title: 'Yoga Flow',
      description: 'Nežan tok joga pokreta za poboljšanje fleksibilnosti i smanjenje stresa.',
      category: 'Flexibility',
      difficultyLevel: 'Intermediate',
      durationMinutes: 20,
      equipmentNeeded: ['Yoga Mat'],
      instructions: [
        'Počnite u Mountain Pose',
        'Pređite u Downward Dog',
        'Izvršite Sun Salutation',
        'Završite u Child\'s Pose'
      ],
      imageUrl: 'https://via.placeholder.com/300x200?text=Yoga+Flow',
      youtubeUrl: 'https://youtube.com/watch?v=example3',
      targetMuscles: ['Full Body'],
      createdAt: '2024-01-03T00:00:00Z',
    },
    {
      id: '4',
      title: 'Balance Board Training',
      description: 'Vežbe za poboljšanje ravnoteže i stabilnosti kora.',
      category: 'Balance',
      difficultyLevel: 'Advanced',
      durationMinutes: 12,
      equipmentNeeded: ['Balance Board'],
      instructions: [
        'Stanite na balance board',
        'Održite ravnotežu 30 sekundi',
        'Dodajte pokrete ruku',
        'Povećajte složenost'
      ],
      imageUrl: 'https://via.placeholder.com/300x200?text=Balance+Training',
      targetMuscles: ['Core', 'Legs'],
      createdAt: '2024-01-04T00:00:00Z',
    },
  ];

  const mockCategories = ['Strength', 'Flexibility', 'Balance', 'Cardio', 'Rehabilitation'];

  useEffect(() => {
    loadExercises();
    loadCategories();
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    setError(null);
    try {
      // For demo, use mock data
      setTimeout(() => {
        setExercises(mockExercises);
        setLoading(false);
      }, 1000);
      
      // Uncomment when backend is ready:
      // const response = await exerciseService.getAllExercises(filters);
      // if (response.success && response.data) {
      //   setExercises(response.data);
      // } else {
      //   setError(response.error || 'Failed to load exercises');
      // }
    } catch (err) {
      setError('Failed to load exercises');
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // For demo, use mock data
      setCategories(mockCategories);
      
      // Uncomment when backend is ready:
      // const response = await exerciseService.getCategories();
      // if (response.success && response.data) {
      //   setCategories(response.data);
      // }
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const handleFilterChange = (key: keyof ExerciseFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleFavorite = (exerciseId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(exerciseId)) {
        newFavorites.delete(exerciseId);
      } else {
        newFavorites.add(exerciseId);
      }
      return newFavorites;
    });
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'success';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'error';
      default: return 'default';
    }
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = !filters.search || 
      exercise.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      exercise.description.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesCategory = !filters.category || exercise.category === filters.category;
    const matchesDifficulty = !filters.difficultyLevel || exercise.difficultyLevel === filters.difficultyLevel;
    const matchesTargetMuscle = !filters.targetMuscle || 
      exercise.targetMuscles.some(muscle => muscle.toLowerCase().includes(filters.targetMuscle!.toLowerCase()));

    return matchesSearch && matchesCategory && matchesDifficulty && matchesTargetMuscle;
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Katalog Vežbi
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Pronađite savršene vežbe za vašu rehabilitaciju i fitnes rutinu
        </Typography>

        {/* Search and Filters */}
        <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Search Bar */}
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Pretražite vežbe..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />

            {/* Filter Row */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Kategorija</InputLabel>
                <Select
                  value={filters.category || ''}
                  label="Kategorija"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <MenuItem value="">Sve</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Nivo</InputLabel>
                <Select
                  value={filters.difficultyLevel || ''}
                  label="Nivo"
                  onChange={(e) => handleFilterChange('difficultyLevel', e.target.value)}
                >
                  <MenuItem value="">Svi</MenuItem>
                  <MenuItem value="Beginner">Početnik</MenuItem>
                  <MenuItem value="Intermediate">Napredni</MenuItem>
                  <MenuItem value="Advanced">Ekspert</MenuItem>
                </Select>
              </FormControl>

              <TextField
                placeholder="Ciljna grupa mišića"
                value={filters.targetMuscle || ''}
                onChange={(e) => handleFilterChange('targetMuscle', e.target.value)}
                sx={{ minWidth: 180 }}
              />
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results Info */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Učitavanje...' : `Pronađeno ${filteredExercises.length} vežbi`}
        </Typography>
        <Button
          startIcon={<FilterList />}
          variant="outlined"
          size="small"
          onClick={() => {/* TODO: Open advanced filters */}}
        >
          Napredni filteri
        </Button>
      </Box>

      {/* Exercises Grid */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {loading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} sx={{ display: 'flex', height: 200 }}>
              <Skeleton variant="rectangular" width={300} height={200} />
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, p: 2 }}>
                <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 1 }} />
                <Skeleton variant="text" sx={{ mb: 1 }} />
                <Skeleton variant="text" sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Skeleton variant="rectangular" width={80} height={32} />
                  <Skeleton variant="rectangular" width={100} height={32} />
                </Box>
              </Box>
            </Card>
          ))
        ) : (
          // Exercise cards
          filteredExercises.map((exercise) => (
            <Card key={exercise.id} sx={{ display: 'flex', height: 250, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}>
              {/* Image */}
              <CardMedia
                component="img"
                sx={{ width: 300, objectFit: 'cover' }}
                image={exercise.imageUrl || `https://via.placeholder.com/300x250?text=${encodeURIComponent(exercise.title)}`}
                alt={exercise.title}
              />

              {/* Content */}
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <CardContent sx={{ flex: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                      {exercise.title}
                    </Typography>
                    <IconButton
                      onClick={() => toggleFavorite(exercise.id)}
                      color={favorites.has(exercise.id) ? 'error' : 'default'}
                    >
                      {favorites.has(exercise.id) ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                    {exercise.description}
                  </Typography>

                  {/* Tags */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={exercise.difficultyLevel === 'Beginner' ? 'Početnik' : 
                            exercise.difficultyLevel === 'Intermediate' ? 'Napredni' : 'Ekspert'}
                      color={getDifficultyColor(exercise.difficultyLevel) as any}
                      size="small"
                    />
                    <Chip
                      label={exercise.category}
                      variant="outlined"
                      size="small"
                    />
                    {exercise.durationMinutes && (
                      <Chip
                        icon={<AccessTime />}
                        label={`${exercise.durationMinutes} min`}
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Box>

                  {/* Target Muscles */}
                  <Typography variant="caption" color="text.secondary">
                    Ciljna grupa: {exercise.targetMuscles.join(', ')}
                  </Typography>
                </CardContent>

                <CardActions sx={{ px: 3, pb: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={() => navigate(`/exercises/${exercise.id}`)}
                    sx={{ textTransform: 'none' }}
                  >
                    Pogledaj vežbu
                  </Button>
                  {exercise.youtubeUrl && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => window.open(exercise.youtubeUrl, '_blank')}
                      sx={{ textTransform: 'none' }}
                    >
                      Video
                    </Button>
                  )}
                </CardActions>
              </Box>
            </Card>
          ))
        )}
      </Box>

      {/* Empty State */}
      {!loading && filteredExercises.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <TrendingUp sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Nema rezultata
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pokušajte sa drugačijim filterima ili pretragom
          </Typography>
        </Box>
      )}
    </Container>
  );
};