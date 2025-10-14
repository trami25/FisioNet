import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tooltip,
} from '@mui/material';
import {
  Person,
  Edit,
  Phone,
  Email,
  CalendarToday,
  School,
  Work,
  Height,
  FitnessCenter,
  Add,
  Delete,
  WorkspacePremium,
  Star,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { UserProfile, Specialization, Certification, UpdateProfileRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileService } from '../services/profileService';

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UpdateProfileRequest>({});

  // Check if current user can edit this profile
  const canEdit = currentUser && userId && (
    currentUser.id.toString() === userId || 
    currentUser.role === 'admin'
  );

  // Load user profile
  const loadProfile = async () => {
    if (!userId || !isAuthenticated) return;

    setLoading(true);
    try {
      const profileData = await profileService.getUserProfile(userId);
      setProfile(profileData);
    } catch (error: any) {
      showToast(error.message || 'Greška pri učitavanju profila', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId, isAuthenticated]);

  const handleEditProfile = () => {
    if (!profile) return;
    
    setEditingProfile({
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      birth_date: profile.birth_date,
      height: profile.height,
      weight: profile.weight,
      job_type: profile.job_type,
      specializations: profile.specializations || [],
      certifications: profile.certifications || [],
      years_of_experience: profile.years_of_experience,
      education: profile.education,
      bio: profile.bio,
    });
    setEditDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      const updatedProfile = await profileService.updateProfile(editingProfile);
      setProfile(updatedProfile);
      setEditDialogOpen(false);
      showToast('Profil je uspešno ažuriran', 'success');
    } catch (error: any) {
      showToast(error.message || 'Greška pri ažuriranju profila', 'error');
    }
  };

  const addSpecialization = () => {
    setEditingProfile(prev => ({
      ...prev,
      specializations: [
        ...(prev.specializations || []),
        { name: '', description: '' }
      ]
    }));
  };

  const updateSpecialization = (index: number, field: keyof Specialization, value: string) => {
    setEditingProfile(prev => ({
      ...prev,
      specializations: prev.specializations?.map((spec, i) => 
        i === index ? { ...spec, [field]: value } : spec
      )
    }));
  };

  const removeSpecialization = (index: number) => {
    setEditingProfile(prev => ({
      ...prev,
      specializations: prev.specializations?.filter((_, i) => i !== index)
    }));
  };

  const addCertification = () => {
    setEditingProfile(prev => ({
      ...prev,
      certifications: [
        ...(prev.certifications || []),
        { name: '', issuer: '', date_obtained: '', expiry_date: '' }
      ]
    }));
  };

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    setEditingProfile(prev => ({
      ...prev,
      certifications: prev.certifications?.map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const removeCertification = (index: number) => {
    setEditingProfile(prev => ({
      ...prev,
      certifications: prev.certifications?.filter((_, i) => i !== index)
    }));
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">
          Morate biti prijavljeni da biste videli profil.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Profil nije pronađen.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Profil korisnika
        </Typography>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={handleEditProfile}
          >
            Izmeni profil
          </Button>
        )}
      </Box>

      {/* Basic Info */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              src={profile.profile_image}
              sx={{ width: 80, height: 80, mr: 3 }}
            >
              <Person sx={{ fontSize: 40 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" component="h2">
                {profile.first_name} {profile.last_name}
              </Typography>
              <Chip 
                label={profile.role === 'physiotherapist' ? 'Fizioterapeut' : 
                      profile.role === 'patient' ? 'Pacijent' : 'Admin'} 
                color={profile.role === 'physiotherapist' ? 'primary' : 
                       profile.role === 'admin' ? 'error' : 'default'}
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>

          {/* Contact Info */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Email sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1">{profile.email}</Typography>
            </Box>
            {profile.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1">{profile.phone}</Typography>
              </Box>
            )}
            {profile.birth_date && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1">
                  {new Date(profile.birth_date).toLocaleDateString('sr-RS')}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Physical Info */}
          {(profile.height || profile.weight) && (
            <Box sx={{ mb: 2 }}>
              {profile.height && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Height sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1">Visina: {profile.height} cm</Typography>
                </Box>
              )}
              {profile.weight && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FitnessCenter sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1">Težina: {profile.weight} kg</Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Job Type */}
          {profile.job_type && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Work sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1">Zanimanje: {profile.job_type}</Typography>
            </Box>
          )}

          {/* Bio */}
          {profile.bio && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>O meni</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {profile.bio}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Physiotherapist-specific info */}
      {profile.role === 'physiotherapist' && (
        <>
          {/* Education & Experience */}
          {(profile.education || profile.years_of_experience) && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Obrazovanje i iskustvo
                </Typography>
                {profile.education && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <School sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">{profile.education}</Typography>
                  </Box>
                )}
                {profile.years_of_experience && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Star sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      {profile.years_of_experience} godina iskustva
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Specializations */}
          {profile.specializations && profile.specializations.length > 0 && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Specijalizacije
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.specializations.map((spec, index) => (
                    <Tooltip key={index} title={spec.description || ''}>
                      <Chip label={spec.name} variant="outlined" />
                    </Tooltip>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Certifications */}
          {profile.certifications && profile.certifications.length > 0 && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sertifikati
                </Typography>
                <List>
                  {profile.certifications.map((cert, index) => (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Avatar>
                          <WorkspacePremium />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={cert.name}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Izdavač: {cert.issuer}
                            </Typography>
                            <Typography variant="body2">
                              Datum: {new Date(cert.date_obtained).toLocaleDateString('sr-RS')}
                              {cert.expiry_date && (
                                <> - {new Date(cert.expiry_date).toLocaleDateString('sr-RS')}</>
                              )}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Edit Profile Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Izmeni profil</DialogTitle>
        <DialogContent sx={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Basic Info */}
            <TextField
              label="Ime"
              value={editingProfile.first_name || ''}
              onChange={(e) => setEditingProfile(prev => ({ ...prev, first_name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Prezime"
              value={editingProfile.last_name || ''}
              onChange={(e) => setEditingProfile(prev => ({ ...prev, last_name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Telefon"
              value={editingProfile.phone || ''}
              onChange={(e) => setEditingProfile(prev => ({ ...prev, phone: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Datum rođenja"
              type="date"
              value={editingProfile.birth_date || ''}
              onChange={(e) => setEditingProfile(prev => ({ ...prev, birth_date: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Visina (cm)"
                type="number"
                value={editingProfile.height || ''}
                onChange={(e) => setEditingProfile(prev => ({ ...prev, height: parseFloat(e.target.value) || undefined }))}
                fullWidth
              />
              <TextField
                label="Težina (kg)"
                type="number"
                value={editingProfile.weight || ''}
                onChange={(e) => setEditingProfile(prev => ({ ...prev, weight: parseFloat(e.target.value) || undefined }))}
                fullWidth
              />
            </Box>
            <TextField
              label="Zanimanje"
              value={editingProfile.job_type || ''}
              onChange={(e) => setEditingProfile(prev => ({ ...prev, job_type: e.target.value }))}
              fullWidth
            />

            {/* Physiotherapist specific fields */}
            {profile?.role === 'physiotherapist' && (
              <>
                <TextField
                  label="Obrazovanje"
                  value={editingProfile.education || ''}
                  onChange={(e) => setEditingProfile(prev => ({ ...prev, education: e.target.value }))}
                  fullWidth
                  multiline
                  rows={2}
                />
                <TextField
                  label="Godine iskustva"
                  type="number"
                  value={editingProfile.years_of_experience || ''}
                  onChange={(e) => setEditingProfile(prev => ({ ...prev, years_of_experience: parseInt(e.target.value) || undefined }))}
                  fullWidth
                />
                <TextField
                  label="O meni"
                  value={editingProfile.bio || ''}
                  onChange={(e) => setEditingProfile(prev => ({ ...prev, bio: e.target.value }))}
                  fullWidth
                  multiline
                  rows={3}
                />

                <Divider />

                {/* Specializations */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Specijalizacije</Typography>
                    <IconButton onClick={addSpecialization}>
                      <Add />
                    </IconButton>
                  </Box>
                  {editingProfile.specializations?.map((spec, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        label="Naziv"
                        value={spec.name}
                        onChange={(e) => updateSpecialization(index, 'name', e.target.value)}
                        fullWidth
                      />
                      <TextField
                        label="Opis"
                        value={spec.description || ''}
                        onChange={(e) => updateSpecialization(index, 'description', e.target.value)}
                        fullWidth
                      />
                      <IconButton onClick={() => removeSpecialization(index)}>
                        <Delete />
                      </IconButton>
                    </Box>
                  ))}
                </Box>

                <Divider />

                {/* Certifications */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Sertifikati</Typography>
                    <IconButton onClick={addCertification}>
                      <Add />
                    </IconButton>
                  </Box>
                  {editingProfile.certifications?.map((cert, index) => (
                    <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                          label="Naziv sertifikata"
                          value={cert.name}
                          onChange={(e) => updateCertification(index, 'name', e.target.value)}
                          fullWidth
                        />
                        <IconButton onClick={() => removeCertification(index)}>
                          <Delete />
                        </IconButton>
                      </Box>
                      <TextField
                        label="Izdavač"
                        value={cert.issuer}
                        onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                      />
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          label="Datum izdavanja"
                          type="date"
                          value={cert.date_obtained}
                          onChange={(e) => updateCertification(index, 'date_obtained', e.target.value)}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          label="Datum isteka (opcionalno)"
                          type="date"
                          value={cert.expiry_date || ''}
                          onChange={(e) => updateCertification(index, 'expiry_date', e.target.value)}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Otkaži
          </Button>
          <Button onClick={handleSaveProfile} variant="contained">
            Sačuvaj
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};