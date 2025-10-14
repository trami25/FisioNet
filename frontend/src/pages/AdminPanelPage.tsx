import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  Card,
  CardContent,
  SelectChangeEvent,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminService, CreateUserRequest } from '../services/adminService';

export const AdminPanelPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
    height: undefined,
    weight: undefined,
    job_type: '',
    role: 'patient',
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAllUsers();
      setUsers(response.users);
    } catch (error) {
      showToast('Greška pri učitavanju korisnika', 'error');
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  // Proverava da li je korisnik admin
  if (user?.role !== 'admin') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Nemate dozvolu za pristup admin panelu.
        </Alert>
      </Container>
    );
  }

  const handleCreateUser = async () => {
    try {
      await adminService.createUser(formData);
      showToast(`${getRoleLabel(formData.role)} je uspešno kreiran`, 'success');
      setDialogOpen(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      showToast(error.message || 'Greška pri kreiranju korisnika', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovog korisnika?')) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      showToast('Korisnik je uspešno obrisan', 'success');
      loadUsers();
    } catch (error: any) {
      showToast(error.message || 'Greška pri brisanju korisnika', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      birth_date: '',
      height: undefined,
      weight: undefined,
      job_type: '',
      role: 'patient',
    });
    setEditingUser(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'patient': return 'Pacijent';
      case 'physiotherapist': return 'Fizioterapeut';
      case 'admin': return 'Administrator';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'patient': return 'primary';
      case 'physiotherapist': return 'secondary';
      case 'admin': return 'error';
      default: return 'default';
    }
  };

  const handleInputChange = (field: keyof CreateUserRequest) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'height' || field === 'weight' 
        ? value ? parseFloat(value) : undefined 
        : value
    }));
  };

  const handleRoleChange = (event: SelectChangeEvent) => {
    setFormData(prev => ({
      ...prev,
      role: event.target.value as 'patient' | 'physiotherapist' | 'admin'
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Panel
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Upravljanje korisnicima sistema
        </Typography>
      </Box>

      {/* Statistike */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon color="primary" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="h6">
                  {users.filter(u => u.role === 'patient').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pacijenti
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonAddIcon color="secondary" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="h6">
                  {users.filter(u => u.role === 'physiotherapist').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fizioterapeuti
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon color="error" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="h6">
                  {users.filter(u => u.role === 'admin').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Administratori
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon sx={{ mr: 1 }} />
              <Box>
                <Typography variant="h6">{users.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Ukupno korisnika
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tabela korisnika */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Svi korisnici</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
          >
            Dodaj korisnika
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ime</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Telefon</TableCell>
                <TableCell>Uloga</TableCell>
                <TableCell>Datum kreiranja</TableCell>
                <TableCell align="center">Akcije</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getRoleLabel(user.role)} 
                        color={getRoleColor(user.role) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('sr-RS')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUser(user.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Nema korisnika za prikaz
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog za kreiranje/editovanje korisnika */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingUser ? 'Edituj korisnika' : 'Kreiraj novog korisnika'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Ime"
                value={formData.first_name}
                onChange={handleInputChange('first_name')}
                required
              />
              <TextField
                fullWidth
                label="Prezime"
                value={formData.last_name}
                onChange={handleInputChange('last_name')}
                required
              />
            </Box>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              required
            />
            <TextField
              fullWidth
              label="Lozinka"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              required={!editingUser}
              helperText={editingUser ? "Ostavite prazno da zadržite postojeću lozinku" : ""}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Telefon"
                value={formData.phone}
                onChange={handleInputChange('phone')}
              />
              <FormControl fullWidth required>
                <InputLabel>Uloga</InputLabel>
                <Select
                  value={formData.role}
                  label="Uloga"
                  onChange={handleRoleChange}
                >
                  <MenuItem value="patient">Pacijent</MenuItem>
                  <MenuItem value="physiotherapist">Fizioterapeut</MenuItem>
                  <MenuItem value="admin">Administrator</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Datum rođenja"
                type="date"
                value={formData.birth_date}
                onChange={handleInputChange('birth_date')}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Zanimanje"
                value={formData.job_type}
                onChange={handleInputChange('job_type')}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Visina (cm)"
                type="number"
                value={formData.height || ''}
                onChange={handleInputChange('height')}
              />
              <TextField
                fullWidth
                label="Težina (kg)"
                type="number"
                value={formData.weight || ''}
                onChange={handleInputChange('weight')}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Otkaži</Button>
          <Button onClick={handleCreateUser} variant="contained">
            {editingUser ? 'Sačuvaj' : 'Kreiraj'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};