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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
      appointmentReminders: true,
      exerciseReminders: true,
      forumUpdates: false,
    },
    privacy: {
      profileVisible: true,
      showEmail: false,
      showPhone: false,
    },
    preferences: {
      language: 'sr',
      theme: 'light',
      timezone: 'Europe/Belgrade',
    },
  });

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Molimo odaberite sliku (PNG, JPG, JPEG)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Slika ne sme biti veća od 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) return;

    try {
      // TODO: Upload to server
      // For now, just use the preview URL as the profile image
      const updatedUser = { ...user, profileImage: previewUrl };
      updateUser(updatedUser);
      
      setAvatarDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Neuspešno otpremanje slike. Pokušajte ponovo.');
    }
  };

  const handleSettingChange = (category: string, setting: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value,
      },
    }));
  };

  const handleSettingsSave = async () => {
    try {
      // TODO: Save settings to API
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
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
          {/* Notification Settings */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Notifications color="primary" />
                <Typography variant="h6">Obaveštenja</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body1">Email obaveštenja</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Primajte obaveštenja na email adresu
                    </Typography>
                  </Box>
                  <Button
                    variant={settings.notifications.email ? "contained" : "outlined"}
                    size="small"
                    onClick={() => handleSettingChange('notifications', 'email', !settings.notifications.email)}
                  >
                    {settings.notifications.email ? 'Uključeno' : 'Isključeno'}
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body1">Push obaveštenja</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Primajte obaveštenja na telefon/računar
                    </Typography>
                  </Box>
                  <Button
                    variant={settings.notifications.push ? "contained" : "outlined"}
                    size="small"
                    onClick={() => handleSettingChange('notifications', 'push', !settings.notifications.push)}
                  >
                    {settings.notifications.push ? 'Uključeno' : 'Isključeno'}
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body1">SMS obaveštenja</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Primajte obaveštenja na telefon putem SMS-a
                    </Typography>
                  </Box>
                  <Button
                    variant={settings.notifications.sms ? "contained" : "outlined"}
                    size="small"
                    onClick={() => handleSettingChange('notifications', 'sms', !settings.notifications.sms)}
                  >
                    {settings.notifications.sms ? 'Uključeno' : 'Isključeno'}
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body1">Podsetnici za termine</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Podsetnik 24h pre zakazanog termina
                    </Typography>
                  </Box>
                  <Button
                    variant={settings.notifications.appointmentReminders ? "contained" : "outlined"}
                    size="small"
                    onClick={() => handleSettingChange('notifications', 'appointmentReminders', !settings.notifications.appointmentReminders)}
                  >
                    {settings.notifications.appointmentReminders ? 'Uključeno' : 'Isključeno'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Security color="primary" />
                <Typography variant="h6">Privatnost</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body1">Javni profil</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Drugi korisnici mogu da vide vaš profil
                    </Typography>
                  </Box>
                  <Button
                    variant={settings.privacy.profileVisible ? "contained" : "outlined"}
                    size="small"
                    onClick={() => handleSettingChange('privacy', 'profileVisible', !settings.privacy.profileVisible)}
                  >
                    {settings.privacy.profileVisible ? 'Javno' : 'Privatno'}
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body1">Prikaži email</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Email adresa je vidljiva drugim korisnicima
                    </Typography>
                  </Box>
                  <Button
                    variant={settings.privacy.showEmail ? "contained" : "outlined"}
                    size="small"
                    onClick={() => handleSettingChange('privacy', 'showEmail', !settings.privacy.showEmail)}
                  >
                    {settings.privacy.showEmail ? 'Vidljivo' : 'Skriveno'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Security color="primary" />
                <Typography variant="h6">Sigurnost</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  sx={{ alignSelf: 'flex-start' }}
                  onClick={() => alert('Funkcionalnost menjanja lozinke će biti implementirana uskoro')}
                >
                  Promeni lozinku
                </Button>
                <Button 
                  variant="outlined" 
                  color="error"
                  sx={{ alignSelf: 'flex-start' }}
                  onClick={() => alert('Funkcionalnost brisanja naloga će biti implementirana uskoro')}
                >
                  Obriši nalog
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Save Settings Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Save />}
              onClick={handleSettingsSave}
              sx={{ px: 4 }}
            >
              Sačuvaj podešavanja
            </Button>
          </Box>
        </Box>
      </TabPanel>

      {/* Avatar Upload Dialog */}
      <Dialog 
        open={avatarDialogOpen} 
        onClose={() => {
          setAvatarDialogOpen(false);
          setSelectedFile(null);
          setPreviewUrl('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Promena profilne slike</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 2 }}>
            {/* Current/Preview Avatar */}
            <Avatar
              src={previewUrl || user.profileImage}
              sx={{ width: 150, height: 150, border: '3px solid', borderColor: 'primary.main' }}
            >
              {user.firstName[0]}{user.lastName[0]}
            </Avatar>
            
            {/* File Upload */}
            <Box sx={{ textAlign: 'center' }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="avatar-upload"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="avatar-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                  sx={{ mb: 2 }}
                >
                  Odaberi sliku
                </Button>
              </label>
              <Typography variant="body2" color="text.secondary">
                Podržani formati: PNG, JPG, JPEG (max 5MB)
              </Typography>
            </Box>

            {/* Preview Info */}
            {selectedFile && (
              <Box sx={{ textAlign: 'center' }}>
                <Chip 
                  label={`${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`}
                  color="primary" 
                  variant="outlined" 
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => {
              setAvatarDialogOpen(false);
              setSelectedFile(null);
              setPreviewUrl('');
            }}
          >
            Otkaži
          </Button>
          <Button
            onClick={handleAvatarUpload}
            variant="contained"
            disabled={!selectedFile}
            startIcon={<Save />}
          >
            Sačuvaj
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};