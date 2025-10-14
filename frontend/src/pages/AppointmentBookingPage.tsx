import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Schedule,
  Person,
  AccessTime,
  CalendarToday,
  Check,
  Warning,
  Info,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Physiotherapist } from '../types';
import { appointmentService } from '../services/appointmentService';

interface TimeSlot {
  time: string;
  available: boolean;
  booked?: boolean;
  reason?: string;
}

interface WorkingHours {
  day: string;
  start: string;
  end: string;
  slots: TimeSlot[];
}

interface AppointmentRequest {
  physiotherapistId: string;
  date: string;
  timeSlots: string[];
  reason: string;
  duration: number; // total duration in minutes
  notes?: string;
}

export const AppointmentBookingPage: React.FC = () => {
  const { id, patientId } = useParams<{ id: string; patientId?: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showError, showSuccess } = useToast();

  // All hooks must be called before any early returns
  const [physiotherapist, setPhysiotherapist] = useState<Physiotherapist | null>(null);
  const [patient, setPatient] = useState<any>(null); // For when physiotherapist books for patient
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours | null>(null);
  const [appointmentReason, setAppointmentReason] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Determine booking mode
  const isPhysioBookingForPatient = user?.role === 'physiotherapist' && patientId;
  const isPatientBooking = user?.role === 'patient' && !patientId;
  const isPatientBookingWithPhysio = user?.role === 'patient' && id; // Patient booking with specific physiotherapist

  // Mock data for demonstration - must be defined before useEffect
  const mockPhysiotherapist: Physiotherapist = {
    id: id || '1',
    firstName: 'Dr. Ana',
    lastName: 'Milosavljević',
    email: 'ana@fisionet.rs',
    phone: '+381 64 123 4567',
    profileImage: '/api/placeholder/150/150',
    specializations: ['Ortopedska rehabilitacija', 'Sportska medicina', 'Neurološka rehabilitacija'],
    certifications: ['Fizioterapeut - Univerzitet u Beogradu', 'Sportska medicina sertifikat', 'Manualna terapija'],
    biography: 'Specialist za ortopedsku rehabilitaciju sa preko 10 godina iskustva...',
    rating: 4.8,
    reviewCount: 127,
    availability: [],
  };

  const generateTimeSlots = (startHour: number, endHour: number, date: Dayjs): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const currentDate = dayjs();
    const isToday = date.isSame(currentDate, 'day');
    const currentHour = currentDate.hour();
    const currentMinute = currentDate.minute();

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 20) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotDateTime = date.hour(hour).minute(minute);
        
        // Check if slot is in the past
        const isPast = isToday && (hour < currentHour || (hour === currentHour && minute <= currentMinute));
        
        // Mock some booked slots
        const isBooked = Math.random() < 0.3; // 30% chance of being booked
        
        slots.push({
          time: timeString,
          available: !isPast && !isBooked,
          booked: isBooked,
          reason: isBooked ? 'Zauzeto' : undefined,
        });
      }
    }
    return slots;
  };

  const mockWorkingHours: WorkingHours = {
    day: selectedDate.format('dddd'),
    start: '08:00',
    end: '16:00',
    slots: generateTimeSlots(8, 16, selectedDate),
  };

  // useEffect must be called before early returns
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load physiotherapist data
        let physioToLoad = mockPhysiotherapist;
        
        if (isPhysioBookingForPatient) {
          // When physio books for patient, use current user (physiotherapist) data
          physioToLoad = {
            ...mockPhysiotherapist,
            id: user?.id || 'physio-001',
            firstName: user?.firstName || 'Milan',
            lastName: user?.lastName || 'Mitrović',
            email: user?.email || 'milan.mitrovic@fisionet.rs',
          };
        } else if (isPatientBookingWithPhysio && id) {
          // When patient books with specific physiotherapist, use physiotherapist ID from params
          physioToLoad = {
            ...mockPhysiotherapist,
            id: id,
          };
        }
        
        // If physiotherapist is booking for patient, load patient data too
        if (isPhysioBookingForPatient && patientId) {
          setPatient({
            id: patientId,
            firstName: 'Nikola',
            lastName: 'Mitrović',
            email: 'nikola.mitrovic@gmail.com'
          });
        }

        setPhysiotherapist(physioToLoad);
        
        // Load real available slots from API
        try {
          const slots = await appointmentService.getAvailableSlots(
            physioToLoad.id, 
            selectedDate.format('YYYY-MM-DD')
          );
          
          setWorkingHours({
            day: selectedDate.format('dddd'),
            start: '08:00',
            end: '16:00',
            slots: slots.map(slot => ({
              time: slot.time,
              available: slot.available,
              booked: slot.booked,
              reason: slot.booked ? 'Zauzeto' : undefined,
            }))
          });
        } catch (slotsError) {
          console.error('Error loading slots:', slotsError);
          // Fallback to mock data if API fails
          setWorkingHours(mockWorkingHours);
          showError('Greška pri učitavanju dostupnih termina. Prikazujem demo podatke.');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        showError('Greška pri učitavanju podataka');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate, isPhysioBookingForPatient, isPatientBookingWithPhysio, patientId, id, user, showError]);

  // Restrict access based on role and context
  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Morate biti ulogovani da biste zakazali termine.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>
          Prijavite se
        </Button>
      </Container>
    );
  }

  if (!isPatientBooking && !isPhysioBookingForPatient && !isPatientBookingWithPhysio) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Nemate dozvolu za pristup ovoj stranici.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Nazad na početnu
        </Button>
      </Container>
    );
  }

  const handleTimeSlotClick = (time: string) => {
    const slot = workingHours?.slots.find(s => s.time === time);
    if (!slot?.available) return;

    setSelectedTimeSlots(prev => {
      if (prev.includes(time)) {
        // Remove slot
        return prev.filter(t => t !== time);
      } else {
        // Add slot and sort
        const newSlots = [...prev, time].sort();
        return newSlots;
      }
    });
  };

  const getConsecutiveSlots = (slots: string[]): string[][] => {
    if (slots.length === 0) return [];
    
    const sortedSlots = slots.sort();
    const groups: string[][] = [];
    let currentGroup: string[] = [sortedSlots[0]];
    
    for (let i = 1; i < sortedSlots.length; i++) {
      const currentTime = dayjs(`2000-01-01 ${sortedSlots[i]}`);
      const previousTime = dayjs(`2000-01-01 ${sortedSlots[i-1]}`);
      
      if (currentTime.diff(previousTime, 'minute') === 20) {
        currentGroup.push(sortedSlots[i]);
      } else {
        groups.push(currentGroup);
        currentGroup = [sortedSlots[i]];
      }
    }
    groups.push(currentGroup);
    
    return groups;
  };

  const handleBookAppointment = async () => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    if (!physiotherapist) {
      showError('Greška: Podaci o fizioterapeutu nisu dostupni');
      return;
    }

    try {
      setLoading(true);

      // Convert selected time slots to appointment datetime
      const appointmentDate = selectedDate.format('YYYY-MM-DD');
      const startTime = selectedTimeSlots[0]; // First selected slot (e.g., "09:00")

      const appointmentData = {
        patient_id: isPhysioBookingForPatient ? patientId! : user.id,
        physiotherapist_id: isPhysioBookingForPatient ? (id || physiotherapist.id) : physiotherapist.id,
        appointment_date: appointmentDate,
        start_time: startTime,
      };

      await appointmentService.createAppointment(appointmentData);
      
      setConfirmDialogOpen(false);
      showSuccess(`Termin je uspešno zakazan${isPhysioBookingForPatient ? ' za pacijenta' : ''}! Dobićete potvrdu na email.`);
      
      if (isPhysioBookingForPatient) {
        navigate('/patients');
      } else {
        navigate('/appointments');
      }
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      showError('Greška pri zakazivanju termina. Molimo pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  };

  const getTotalDuration = () => selectedTimeSlots.length * 20;
  const getTotalCost = () => selectedTimeSlots.length * 2500; // 2500 RSD per 20min slot

  const reasonOptions = [
    'Prva konsultacija',
    'Rehabilitacija nakon povrede',
    'Hronični bolovi u leđima',
    'Sportska povreda',
    'Post-operativna rehabilitacija',
    'Prevencija povreda',
    'Poboljšanje pokretljivosti',
    'Drugo',
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Učitavanje rasporedа...
        </Typography>
      </Container>
    );
  }

  if (!physiotherapist) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6">Fizioterapeut nije pronađen</Typography>
        <Button onClick={() => navigate('/physiotherapists')} sx={{ mt: 2 }}>
          Nazad na listu
        </Button>
      </Container>
    );
  }

  const consecutiveGroups = getConsecutiveSlots(selectedTimeSlots);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => {
              if (isPhysioBookingForPatient) {
                navigate('/patients');
              } else {
                navigate(`/physiotherapists/${id}`);
              }
            }}
            sx={{ mb: 2 }}
          >
            {isPhysioBookingForPatient ? 'Nazad na pacijente' : 'Nazad na profil'}
          </Button>
          
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                src={physiotherapist.profileImage}
                sx={{ width: 80, height: 80 }}
              />
              <Box>
                <Typography variant="h4" gutterBottom>
                  {isPhysioBookingForPatient ? 'Zakazivanje termina za pacijenta' : 'Zakazivanje termina'}
                </Typography>
                <Typography variant="h6" color="primary">
                  {isPhysioBookingForPatient 
                    ? `Fizioterapeut: ${physiotherapist.firstName} ${physiotherapist.lastName}`
                    : `${physiotherapist.firstName} ${physiotherapist.lastName}`
                  }
                </Typography>
                {isPhysioBookingForPatient && patient && (
                  <Typography variant="subtitle1" color="text.secondary">
                    Pacijent: {patient.firstName} {patient.lastName}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  {physiotherapist.specializations.slice(0, 2).map((spec) => (
                    <Chip key={spec} label={spec} size="small" />
                  ))}
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          gap: 4, 
          flexDirection: { xs: 'column', md: 'row' } 
        }}>
          {/* Calendar and Time Selection */}
          <Box sx={{ flex: { md: 2 } }}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
                Izaberite datum i vreme
              </Typography>

              {/* Date Picker */}
              <Box sx={{ mb: 3 }}>
                <DatePicker
                  label="Datum termina"
                  value={selectedDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      setSelectedDate(newValue);
                      setSelectedTimeSlots([]);
                    }
                  }}
                  minDate={dayjs()}
                  maxDate={dayjs().add(3, 'month')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined',
                    },
                  }}
                />
              </Box>

              {/* Working Hours Info */}
              {workingHours && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Radno vreme ({selectedDate.format('dddd, DD.MM.YYYY')}):</strong> {workingHours.start} - {workingHours.end}
                  </Typography>
                  <Typography variant="body2">
                    Svaki termin traje 20 minuta. Možete zakazati uzastopne termine za duže tretmane.
                  </Typography>
                </Alert>
              )}

              {/* Time Slots Grid */}
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Dostupni termini:
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap',
                  gap: 1,
                  maxHeight: '400px',
                  overflowY: 'auto',
                  '& > button': {
                    flex: '0 0 120px',
                    minWidth: '120px'
                  }
                }}>
                  {workingHours?.slots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTimeSlots.includes(slot.time) ? 'contained' : 'outlined'}
                      color={
                        selectedTimeSlots.includes(slot.time) ? 'primary' :
                        !slot.available ? 'error' : 'inherit'
                      }
                      disabled={!slot.available}
                      onClick={() => handleTimeSlotClick(slot.time)}
                      sx={{
                        minHeight: '48px',
                        fontSize: '0.875rem',
                        opacity: slot.available ? 1 : 0.5,
                      }}
                    >
                      {slot.time}
                      {slot.booked && (
                        <Box component="span" sx={{ display: 'block', fontSize: '0.7rem' }}>
                          Zauzeto
                        </Box>
                      )}
                    </Button>
                  ))}
                </Box>
              </Box>

              {/* Selected Slots Summary */}
              {selectedTimeSlots.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Izabrani termini:
                  </Typography>
                  
                  {consecutiveGroups.map((group, index) => (
                    <Alert 
                      key={index} 
                      severity="success" 
                      icon={<Schedule />}
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="body2">
                        <strong>Grupa {index + 1}:</strong> {group[0]} - {
                          dayjs(`2000-01-01 ${group[group.length - 1]}`).add(20, 'minute').format('HH:mm')
                        } ({group.length * 20} minuta)
                      </Typography>
                    </Alert>
                  ))}
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                    <Typography variant="body1" color="primary.contrastText">
                      <strong>Ukupno vreme:</strong> {getTotalDuration()} minuta
                    </Typography>
                    <Typography variant="body1" color="primary.contrastText">
                      <strong>Ukupna cena:</strong> {getTotalCost().toLocaleString()} RSD
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>
          </Box>

          {/* Booking Details */}
          <Box sx={{ flex: { md: 1 }, minWidth: '300px' }}>
            <Paper elevation={2} sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h6" gutterBottom>
                <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                Detalji termina
              </Typography>

              {selectedTimeSlots.length === 0 ? (
                <Alert severity="info">
                  Izaberite termine sa leve strane da biste nastavili sa zakazivanjem.
                </Alert>
              ) : (
                <Box>
                  {/* Reason Selection */}
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Razlog dolaska *</InputLabel>
                    <Select
                      value={appointmentReason}
                      onChange={(e) => setAppointmentReason(e.target.value)}
                      label="Razlog dolaska *"
                    >
                      {reasonOptions.map((reason) => (
                        <MenuItem key={reason} value={reason}>
                          {reason}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Additional Notes */}
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Dodatne napomene"
                    value={appointmentNotes}
                    onChange={(e) => setAppointmentNotes(e.target.value)}
                    placeholder="Opišite svoj problem ili dodatne informacije..."
                    sx={{ mb: 3 }}
                  />

                  {/* Summary */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Pregled termina:
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <CalendarToday />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Datum"
                          secondary={selectedDate.format('dddd, DD.MM.YYYY')}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <AccessTime />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Trajanje"
                          secondary={`${getTotalDuration()} minuta (${selectedTimeSlots.length} termina)`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Person />
                        </ListItemIcon>
                        <ListItemText 
                          primary={isPhysioBookingForPatient ? 'Pacijent' : 'Fizioterapeut'}
                          secondary={isPhysioBookingForPatient 
                            ? `${patient?.firstName} ${patient?.lastName}`
                            : `${physiotherapist.firstName} ${physiotherapist.lastName}`
                          }
                        />
                      </ListItem>
                    </List>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">
                        Ukupno:
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {getTotalCost().toLocaleString()} RSD
                      </Typography>
                    </Box>
                  </Box>

                  {/* Book Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={!appointmentReason}
                    onClick={() => setConfirmDialogOpen(true)}
                    sx={{ mb: 2 }}
                  >
                    {isPhysioBookingForPatient ? 'Zakaži termin za pacijenta' : 'Zakaži termin'}
                  </Button>

                  {!isAuthenticated && (
                    <Alert severity="warning">
                      Morate biti ulogovani da biste zakazali termin.
                    </Alert>
                  )}
                </Box>
              )}
            </Paper>
          </Box>
        </Box>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Potvrda zakazivanja termina
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Molimo vas da proverite sve podatke pre potvrde zakazivanja.
            </Alert>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Detalji termina:</strong>
              </Typography>
              <Typography variant="body2">
                <strong>{isPhysioBookingForPatient ? 'Pacijent' : 'Fizioterapeut'}:</strong> {
                  isPhysioBookingForPatient 
                    ? `${patient?.firstName} ${patient?.lastName}`
                    : `${physiotherapist.firstName} ${physiotherapist.lastName}`
                }
              </Typography>
              <Typography variant="body2">
                <strong>Datum:</strong> {selectedDate.format('dddd, DD.MM.YYYY')}
              </Typography>
              <Typography variant="body2">
                <strong>Vreme:</strong> {selectedTimeSlots.length > 0 && `${selectedTimeSlots[0]} - ${
                  dayjs(`2000-01-01 ${selectedTimeSlots[selectedTimeSlots.length - 1]}`).add(20, 'minute').format('HH:mm')
                }`}
              </Typography>
              <Typography variant="body2">
                <strong>Trajanje:</strong> {getTotalDuration()} minuta
              </Typography>
              <Typography variant="body2">
                <strong>Razlog:</strong> {appointmentReason}
              </Typography>
              <Typography variant="body2">
                <strong>Cena:</strong> {getTotalCost().toLocaleString()} RSD
              </Typography>
            </Box>

            {appointmentNotes && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Napomene:
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {appointmentNotes}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>
              Otkaži
            </Button>
            <Button 
              variant="contained" 
              onClick={handleBookAppointment}
              startIcon={<Check />}
            >
              Potvrdi zakazivanje
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};