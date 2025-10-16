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
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { CreateExerciseRequest, UpdateExerciseRequest } from '../types';
import { useNavigate } from 'react-router-dom';
import { Exercise, ExerciseFilter } from '../types';
import { exerciseService } from '../services/exerciseService';
import ImageCarousel from '../components/ImageCarousel';

export const ExercisesPage: React.FC = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const [filters, setFilters] = useState<ExerciseFilter>({
    search: '',
    category: '',
    difficultyLevel: '',
    targetMuscle: '',
  });

  // Mock data for demo purposes
  const mockExercises: Exercise[] = [
    {
      id: 1,
      title: 'Push-ups',
      description: 'Klasična vežba za jačanje gornjeg dela tela koja angažuje grudi, ramena i triceps.',
      category: 'Strength',
      difficulty_level: 'Beginner',
      duration_minutes: 10,
      equipment_needed: [],
      instructions: [
        'Postavite se u poziciju za sklekove',
        'Spustite telo do poda',
        'Gurnite se nazad u početnu poziciju',
        'Ponovite pokret'
      ],
      image_url: 'https://via.placeholder.com/300x200?text=Push-ups',
      youtube_url: 'https://youtube.com/watch?v=example',
      target_muscles: ['Chest', 'Arms', 'Shoulders'],
      created_at: Date.now() / 1000,
      is_specialized: false,
    },
    {
      id: 2,
      title: 'Squats',
      description: 'Odlična vežba za jačanje nogu i gluteusa, poboljšava funkcionalnu snagu.',
      category: 'Strength',
      difficulty_level: 'Beginner',
      duration_minutes: 15,
      equipment_needed: [],
      instructions: [
        'Stanite sa nogama na širini ramena',
        'Spustite se u čučanj',
        'Držite leđa ravno',
        'Vratite se u početnu poziciju'
      ],
      image_url: 'https://via.placeholder.com/300x200?text=Squats',
      youtube_url: 'https://youtube.com/watch?v=example2',
      target_muscles: ['Legs', 'Glutes'],
      created_at: Date.now() / 1000,
      is_specialized: false,
    },
    {
      id: 3,
      title: 'Yoga Flow',
      description: 'Nežan tok joga pokreta za poboljšanje fleksibilnosti i smanjenje stresa.',
      category: 'Flexibility',
      difficulty_level: 'Intermediate',
      duration_minutes: 20,
      equipment_needed: ['Yoga Mat'],
      instructions: [
        'Počnite u Mountain Pose',
        'Pređite u Downward Dog',
        'Izvršite Sun Salutation',
        'Završite u Child\'s Pose'
      ],
      image_url: 'https://via.placeholder.com/300x200?text=Yoga+Flow',
      youtube_url: 'https://youtube.com/watch?v=example3',
      target_muscles: ['Full Body'],
      created_at: Date.now() / 1000,
      is_specialized: false,
    },
    {
      id: 4,
      title: 'Balance Board Training',
      description: 'Vežbe za poboljšanje ravnoteže i stabilnosti kora.',
      category: 'Balance',
      difficulty_level: 'Advanced',
      duration_minutes: 12,
      equipment_needed: ['Balance Board'],
      instructions: [
        'Stanite na balance board',
        'Održite ravnotežu 30 sekundi',
        'Dodajte pokrete ruku',
        'Povećajte složenost'
      ],
      image_url: 'https://via.placeholder.com/300x200?text=Balance+Training',
      target_muscles: ['Core', 'Legs'],
      created_at: Date.now() / 1000,
      is_specialized: false,
    },
  ];

  const mockCategories = ['Strength', 'Flexibility', 'Balance', 'Cardio', 'Rehabilitation'];

  useEffect(() => {
    loadExercises();
    loadCategories();
  }, []);

  const { isAuthenticated, user } = useAuth();

  // Create / Edit modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Partial<Exercise> | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const loadExercises = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await exerciseService.getAllExercises(filters);
      setExercises(data);
    } catch (err: any) {
      console.error('Failed to load exercises:', err);
      setError(err.response?.data?.error || 'Failed to load exercises');
      // Fallback to mock data in case of error
      setExercises(mockExercises);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // Use mock categories for now
      setCategories(mockCategories);
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

  const toggleFavorite = (exerciseId: number) => {
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

  const openCreateForm = () => {
    setCurrentExercise({
      title: '',
      description: '',
      category: '',
      difficulty_level: 'Beginner',
      duration_minutes: 10,
      equipment_needed: [],
      instructions: [],
      image_url: '',
      video_url: '',
      youtube_url: '',
      target_muscles: [],
      is_specialized: false,
    });
    setImages(['']);
    setIsFormOpen(true);
  };

  const openEditForm = (exercise: Exercise) => {
    setCurrentExercise({ ...exercise });
    // parse image_url as array if stored as JSON
    let imgs: string[] = [];
    if (exercise.image_url) {
      const s = exercise.image_url.trim();
      if (s.startsWith('[')) {
        try { imgs = JSON.parse(s); } catch { imgs = [s]; }
      } else {
        imgs = [s];
      }
    }
    setImages(imgs.length ? imgs : ['']);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setCurrentExercise(null);
    setImages([]);
    setSelectedFiles([]);
  };

  const submitForm = async () => {
    if (!currentExercise) return;
    try {
      let createdOrUpdatedId: number | null = null;

      if (currentExercise.id) {
        const payload: UpdateExerciseRequest = {
          title: currentExercise.title,
          description: currentExercise.description,
          category: currentExercise.category,
          difficulty_level: currentExercise.difficulty_level,
          duration_minutes: currentExercise.duration_minutes,
          equipment_needed: currentExercise.equipment_needed,
          instructions: currentExercise.instructions,
          image_url: images.length ? JSON.stringify(images.filter(Boolean)) : currentExercise.image_url,
          video_url: currentExercise.video_url,
          target_muscles: currentExercise.target_muscles,
          youtube_url: currentExercise.youtube_url,
        };
        const updated = await exerciseService.updateExercise(currentExercise.id, payload);
        createdOrUpdatedId = updated.id;
      } else {
        const payload: CreateExerciseRequest = {
          title: currentExercise.title as string,
          description: currentExercise.description as string,
          category: currentExercise.category as string,
          difficulty_level: currentExercise.difficulty_level as string,
          duration_minutes: currentExercise.duration_minutes,
          equipment_needed: currentExercise.equipment_needed || [],
          instructions: currentExercise.instructions || [],
          image_url: images.length ? JSON.stringify(images.filter(Boolean)) : currentExercise.image_url,
          video_url: currentExercise.video_url,
          youtube_url: currentExercise.youtube_url,
          target_muscles: currentExercise.target_muscles || [],
          is_specialized: currentExercise.is_specialized,
        };
        const created = await exerciseService.createExercise(payload);
        createdOrUpdatedId = created.id;
      }

      // If files were selected, upload them to the exercise images endpoint
      if (selectedFiles.length && createdOrUpdatedId) {
        try {
          await exerciseService.uploadExerciseImages(createdOrUpdatedId, selectedFiles);
        } catch (uploadErr) {
          console.error('Image upload failed', uploadErr);
          // non-fatal: continue to reload exercises but show an error
          setError('Saved exercise but failed to upload images');
        }
      }

      await loadExercises();
  closeForm();
  setSelectedFiles([]);
    } catch (err: any) {
      console.error('Failed to save exercise', err);
      setError(err.response?.data?.error || 'Failed to save exercise');
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteTargetId(id);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await exerciseService.deleteExercise(deleteTargetId);
      setConfirmOpen(false);
      setDeleteTargetId(null);
      await loadExercises();
    } catch (err: any) {
      console.error('Failed to delete exercise', err);
      setError(err.response?.data?.error || 'Failed to delete exercise');
    } finally {
      setIsDeleting(false);
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

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = !filters.search || 
      exercise.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      exercise.description.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesCategory = !filters.category || exercise.category === filters.category;
    const matchesDifficulty = !filters.difficultyLevel || exercise.difficulty_level === filters.difficultyLevel;
    const matchesTargetMuscle = !filters.targetMuscle || 
      exercise.target_muscles.some((muscle: string) => muscle.toLowerCase().includes(filters.targetMuscle!.toLowerCase()));

    return matchesSearch && matchesCategory && matchesDifficulty && matchesTargetMuscle;
  });

  return (
    <>
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
              {(isAuthenticated && (user?.role === 'admin' || user?.role === 'physiotherapist')) && (
                <Button variant="contained" color="primary" onClick={openCreateForm} sx={{ ml: 'auto' }}>
                  Nova vežba
                </Button>
              )}
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
            <Card key={exercise.id} sx={{ display: 'flex', height: { xs: 220, sm: 250 }, alignItems: 'stretch', transition: 'transform 0.2s', overflow: 'hidden', position: 'relative', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}>
              {/* Image */}
              <Box sx={{ width: { xs: 150, sm: 200, md: 300 }, height: { xs: 220, sm: 250 }, maxWidth: { xs: 150, sm: 200, md: 300 }, flexBasis: { xs: '150px', sm: '200px', md: '300px' }, flex: '0 0 auto' }}>
                {exercise.images && exercise.images.length > 0 ? (
                  <ImageCarousel images={exercise.images} alt={exercise.title} />
                ) : (
                  <CardMedia component="img" image={exercise.image_url || `https://via.placeholder.com/300x250?text=${encodeURIComponent(exercise.title)}`} alt={exercise.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </Box>

              {/* Content */}
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <CardContent sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h5" component="h2" fontWeight="bold" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>
                      {exercise.title}
                    </Typography>
                    <IconButton
                      onClick={() => toggleFavorite(exercise.id)}
                      color={favorites.has(exercise.id) ? 'error' : 'default'}
                    >
                      {favorites.has(exercise.id) ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                  </Box>

                  {/* description removed per request */}

                  {/* Tags */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={exercise.difficulty_level === 'Beginner' ? 'Početnik' : 
                            exercise.difficulty_level === 'Intermediate' ? 'Napredni' : 'Ekspert'}
                      color={getDifficultyColor(exercise.difficulty_level) as any}
                      size="small"
                    />
                    <Chip
                      label={exercise.category}
                      variant="outlined"
                      size="small"
                    />
                    {exercise.duration_minutes && (
                      <Chip
                        icon={<AccessTime />}
                        label={`${exercise.duration_minutes} min`}
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Box>

                  {/* Target Muscles */}
                  <Typography variant="caption" color="text.secondary">
                    Ciljna grupa: {exercise.target_muscles.join(', ')}
                  </Typography>
                </CardContent>

                <CardActions sx={{ px: 3, pb: 2, mt: 'auto' }}>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={() => navigate(`/exercises/${exercise.id}`)}
                    sx={{ textTransform: 'none' }}
                  >
                    Pogledaj vežbu
                  </Button>
                  {exercise.youtube_url && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => window.open(exercise.youtube_url, '_blank')}
                      sx={{ textTransform: 'none' }}
                    >
                      Video
                    </Button>
                  )}
                  {(isAuthenticated && (user?.role === 'admin' || user?.role === 'physiotherapist')) && (
                    <>
                      <Button variant="outlined" size="small" onClick={() => openEditForm(exercise)} sx={{ textTransform: 'none' }}>
                        Izmeni
                      </Button>
                      <Button variant="outlined" size="small" color="error" onClick={() => confirmDelete(exercise.id)} sx={{ textTransform: 'none' }}>
                        Obriši
                      </Button>
                    </>
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
    
  {/* Create / Edit Dialog */}
    <Dialog open={isFormOpen} onClose={closeForm} fullWidth maxWidth="md">
      <DialogTitle>{currentExercise?.id ? 'Izmeni vežbu' : 'Nova vežba'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Naslov" value={currentExercise?.title || ''} onChange={(e) => setCurrentExercise((prev: Partial<Exercise> | null) => prev ? ({ ...prev, title: e.target.value }) : prev)} fullWidth />
          <TextField label="Opis" value={currentExercise?.description || ''} onChange={(e) => setCurrentExercise((prev: Partial<Exercise> | null) => prev ? ({ ...prev, description: e.target.value }) : prev)} fullWidth multiline rows={3} />
          <TextField label="Kategorija" value={currentExercise?.category || ''} onChange={(e) => setCurrentExercise((prev: Partial<Exercise> | null) => prev ? ({ ...prev, category: e.target.value }) : prev)} fullWidth />
          <FormControl>
            <InputLabel>Nivo</InputLabel>
            <Select value={currentExercise?.difficulty_level || 'Beginner'} label="Nivo" onChange={(e) => setCurrentExercise((prev: Partial<Exercise> | null) => prev ? ({ ...prev, difficulty_level: e.target.value as string }) : prev)}>
              <MenuItem value="Beginner">Početnik</MenuItem>
              <MenuItem value="Intermediate">Napredni</MenuItem>
              <MenuItem value="Advanced">Ekspert</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Trajanje (min)" type="number" value={currentExercise?.duration_minutes || 0} onChange={(e) => setCurrentExercise((prev: Partial<Exercise> | null) => prev ? ({ ...prev, duration_minutes: parseInt(e.target.value || '0') }) : prev)} />
          <TextField label="Ciljna grupa (comma separated)" value={(currentExercise?.target_muscles || []).join(', ')} onChange={(e) => setCurrentExercise((prev: Partial<Exercise> | null) => prev ? ({ ...prev, target_muscles: e.target.value.split(',').map((s:string)=>s.trim()) }) : prev)} fullWidth />
          <TextField label="Image URL" value={currentExercise?.image_url || ''} onChange={(e) => setCurrentExercise((prev: Partial<Exercise> | null) => prev ? ({ ...prev, image_url: e.target.value }) : prev)} fullWidth />
          {/* Multiple images input */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {images.map((img, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1 }}>
                <TextField label={`Image ${idx+1} URL`} value={img} onChange={(e) => setImages(prev => { const next = [...prev]; next[idx] = e.target.value; return next; })} fullWidth />
                <Button color="error" onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}>Remove</Button>
              </Box>
            ))}
            <Button onClick={() => setImages(prev => [...prev, ''])}>Add another image</Button>
          </Box>
          {/* File upload */}
          <Box>
            <Typography variant="subtitle2">Upload images</Typography>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : [];
                setSelectedFiles(files);
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              {selectedFiles.map((f, i) => (
                <Box key={i} sx={{ width: 80, height: 80, overflow: 'hidden', borderRadius: 1 }}>
                  <img src={URL.createObjectURL(f)} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
              ))}
            </Box>
          </Box>
          <TextField label="YouTube URL" value={currentExercise?.youtube_url || ''} onChange={(e) => setCurrentExercise((prev: Partial<Exercise> | null) => prev ? ({ ...prev, youtube_url: e.target.value }) : prev)} fullWidth />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeForm}>Otkaži</Button>
        <Button variant="contained" onClick={submitForm}>Sačuvaj</Button>
      </DialogActions>
    </Dialog>

    {/* Confirm Delete Dialog */}
    <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
      <DialogTitle>Potvrdite brisanje</DialogTitle>
      <DialogContent>
        <Typography>Da li ste sigurni da želite da obrišete ovu vežbu? Ova operacija je nepovratna.</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmOpen(false)}>Otkaži</Button>
        <Button color="error" variant="contained" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Brisanje...' : 'Obriši'}</Button>
      </DialogActions>
    </Dialog>
    </>
  );
};