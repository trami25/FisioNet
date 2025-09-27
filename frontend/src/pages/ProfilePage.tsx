import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  Button,
  TextField,
  Tab,
  Tabs,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit,
  PhotoCamera,
  Save,
  Cancel,
  TrendingUp,
  FitnessCenter,
  Schedule,
  EmojiEvents,
  Settings,
  Security,
  Notifications,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>(user || {});
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Morate biti ulogovani da biste pristupili profilu.
        </Alert>
      </Container>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditData(user);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field: keyof User, value: string | number) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      // TODO: Call API to update user profile
      updateUser({ ...user, ...editData } as User);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const mockStats = {
    exercisesCompleted: 47,
    weeklyGoal: 5,
    currentStreak: 12,
    totalWorkoutTime: 1280, // minutes
  };

  const mockAchievements = [
    { title: 'Prva nedelja', description: 'Završili ste prvih 7 vežbi', icon: '🎯' },
    { title: 'Upornost', description: '30 dana uzastopno', icon: '🔥' },
    { title: 'Snaga', description: '100 strength vežbi', icon: '💪' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #2E7D32 0%, #1976D2 50%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, color: 'white' }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={user.profileImage}
              sx={{ width: 120, height: 120, border: '4px solid white' }}
            >
              {user.firstName[0]}{user.lastName[0]}
            </Avatar>
            <IconButton
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: 'white',
                color: 'primary.main',
                '&:hover': { backgroundColor: 'grey.100' },
              }}
              onClick={() => setAvatarDialogOpen(true)}
            >
              <PhotoCamera />
            </IconButton>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
              {user.role === 'patient' ? 'Pacijent' : 
               user.role === 'physiotherapist' ? 'Fizioterapeut' : 
               user.role === 'admin' ? 'Administrator' : 'Moderator'}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8 }}>
              Član od {new Date(user.createdAt).toLocaleDateString('sr-RS')}
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="secondary"
            startIcon={isEditing ? <Cancel /> : <Edit />}
            onClick={handleEditToggle}
            sx={{ alignSelf: 'flex-start' }}
          >
            {isEditing ? 'Otkaži' : 'Uredi profil'}
          </Button>
        </Box>
      </Paper>

      {/* Success Alert */}
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Profil je uspešno ažuriran!
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="profile tabs">
          <Tab label="Osnovne informacije" />
          <Tab label="Statistike" />
          <Tab label="Dostignuća" />
          <Tab label="Podešavanja" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Lični podaci</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Ime"
                    value={isEditing ? editData.firstName || '' : user.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
                    fullWidth
                  />
                  <TextField
                    label="Prezime"
                    value={isEditing ? editData.lastName || '' : user.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!isEditing}
                    fullWidth
                  />
                </Box>
                <TextField
                  label="Email"
                  value={user.email}
                  disabled
                  fullWidth
                  helperText="Email se ne može menjati"
                />
                <TextField
                  label="Telefon"
                  value={isEditing ? editData.phone || '' : user.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  fullWidth
                />
                <TextField
                  label="Datum rođenja"
                  type="date"
                  value={isEditing ? editData.birthDate || '' : user.birthDate || ''}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  disabled={!isEditing}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </CardContent>
          </Card>

          {user.role === 'patient' && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Zdravstveni podaci</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Visina (cm)"
                    type="number"
                    value={isEditing ? editData.height || '' : user.height || ''}
                    onChange={(e) => handleInputChange('height', Number(e.target.value))}
                    disabled={!isEditing}
                    fullWidth
                  />
                  <TextField
                    label="Težina (kg)"
                    type="number"
                    value={isEditing ? editData.weight || '' : user.weight || ''}
                    onChange={(e) => handleInputChange('weight', Number(e.target.value))}
                    disabled={!isEditing}
                    fullWidth
                  />
                </Box>
                <TextField
                  label="Tip posla"
                  value={isEditing ? editData.jobType || '' : user.jobType || ''}
                  onChange={(e) => handleInputChange('jobType', e.target.value)}
                  disabled={!isEditing}
                  fullWidth
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          )}

          {isEditing && (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={handleEditToggle}>
                Otkaži
              </Button>
              <Button variant="contained" startIcon={<Save />} onClick={handleSave}>
                Sačuvaj izmene
              </Button>
            </Box>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Weekly Progress */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Nedeljni cilj</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(mockStats.exercisesCompleted / mockStats.weeklyGoal) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {mockStats.exercisesCompleted}/{mockStats.weeklyGoal}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Odličan napredak! Još malo do nedeljnog cilja.
              </Typography>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {mockStats.currentStreak}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Dana uzastopno
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <FitnessCenter color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {mockStats.exercisesCompleted}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vežbi završeno
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Schedule color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {Math.floor(mockStats.totalWorkoutTime / 60)}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ukupno vremena
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h6" gutterBottom>
            Vaša dostignuća
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {mockAchievements.map((achievement, index) => (
              <Card key={index}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4">{achievement.icon}</Typography>
                    <Box>
                      <Typography variant="h6">{achievement.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {achievement.description}
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 'auto' }}>
                      <EmojiEvents color="warning" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Settings color="primary" />
                <Typography variant="h6">Opšta podešavanja</Typography>
              </Box>
              {/* Settings options would go here */}
              <Typography variant="body2" color="text.secondary">
                Opšta podešavanja će biti implementirana uskoro.
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Notifications color="primary" />
                <Typography variant="h6">Obaveštenja</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Podešavanja obaveštenja će biti implementirana uskoro.
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Security color="primary" />
                <Typography variant="h6">Sigurnost</Typography>
              </Box>
              <Button variant="outlined" sx={{ mt: 1 }}>
                Promeni lozinku
              </Button>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Avatar Upload Dialog */}
      <Dialog open={avatarDialogOpen} onClose={() => setAvatarDialogOpen(false)}>
        <DialogTitle>Promena profilne slike</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Funkcionalnost uploadovanja slike će biti implementirana uskoro.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvatarDialogOpen(false)}>Zatvori</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};