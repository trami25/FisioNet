import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AccessTime,
  CalendarToday,
  Person,
  Phone,
  Email,
  CheckCircle,
  Schedule,
  Edit,
  Add,
  Visibility,
  Assignment,
  Today,
  EventNote,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import { appointmentService } from '../services/appointmentService';
import { NewAppointment, User } from '../types';

dayjs.extend(relativeTime);
dayjs.extend(duration);

interface AppointmentWithPatient extends NewAppointment {
  patient?: User;
  // Dodatna polja za kompatibilnost sa starim kodom
  patientId: string;
  physiotherapistId: string;
  dateTime: string;
  duration: number;
  createdAt: string;
}

interface CountdownProps {
  targetDate: string;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = dayjs();
      const target = dayjs(targetDate);
      const diff = target.diff(now);

      if (diff <= 0) {
        setIsOverdue(true);
        setTimeLeft('Vreme je isteklo');
        return;
      }

      const duration = dayjs.duration(diff);
      const days = duration.days();
      const hours = duration.hours();
      const minutes = duration.minutes();
      const seconds = duration.seconds();

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <AccessTime color={isOverdue ? 'error' : 'primary'} fontSize="small" />
      <Typography
        variant="body2"
        color={isOverdue ? 'error' : 'primary'}
        fontWeight="bold"
      >
        {timeLeft}
      </Typography>
    </Box>
  );
};

export const PhysiotherapistSchedulePage: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithPatient | null>(null);
  const [prescriptionDialog, setPrescriptionDialog] = useState(false);
  const [prescription, setPrescription] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const appointmentsData = await appointmentService.getMyAppointments();
      
      // Za sada samo koristimo appointments bez dodatnih patient detalja
      // Jer appointmentService.getPatient() ne postoji
      setAppointments(appointmentsData.map(apt => ({
        ...apt,
        // Mapiramo nova polja na stara polja za kompatibilnost
        patientId: apt.patient_id,
        physiotherapistId: apt.physiotherapist_id,
        dateTime: `${apt.appointment_date} ${apt.start_time}`,
        duration: 20, // default duration
        createdAt: new Date().toISOString(), // placeholder
        patient: undefined // placeholder
      })));
      setError(null);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Greška pri učitavanju termina. Molimo pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      await appointmentService.completeAppointment(selectedAppointment.id, {
        notes: appointmentNotes || selectedAppointment.notes,
      });
      await loadAppointments();
      setPrescriptionDialog(false);
      setSelectedAppointment(null);
      setPrescription('');
      setAppointmentNotes('');
    } catch (error) {
      console.error('Error completing appointment:', error);
      setError('Greška pri završavanju termina.');
    }
  };

  const getStatusColor = (status: NewAppointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: NewAppointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'Zakazan';
      case 'completed':
        return 'Završen';
      case 'cancelled':
        return 'Otkazan';
      default:
        return status;
    }
  };

  const todayAppointments = appointments.filter(
    (apt) => dayjs(apt.dateTime).isSame(dayjs(), 'day') && apt.status === 'scheduled'
  );
  
  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'scheduled' && dayjs(apt.dateTime).isAfter(dayjs().endOf('day'))
  );
  
  const completedAppointments = appointments.filter(
    (apt) => apt.status === 'completed'
  ).sort((a, b) => dayjs(b.dateTime).valueOf() - dayjs(a.dateTime).valueOf());

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Učitavanje raspored...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Moj Raspored
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="fullWidth"
        >
          <Tab
            icon={<Today />}
            label={`Danas (${todayAppointments.length})`}
            iconPosition="start"
          />
          <Tab
            icon={<Schedule />}
            label={`Predstojeći (${upcomingAppointments.length})`}
            iconPosition="start"
          />
          <Tab
            icon={<CheckCircle />}
            label={`Završeni (${completedAppointments.length})`}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Today's Appointments */}
      {tabValue === 0 && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Today color="primary" />
            Danas - {dayjs().format('DD.MM.YYYY')}
          </Typography>

          {todayAppointments.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Nemate termine za danas.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <List>
              {todayAppointments
                .sort((a, b) => dayjs(a.dateTime).valueOf() - dayjs(b.dateTime).valueOf())
                .map((appointment) => (
                <Paper key={appointment.id} sx={{ mb: 2 }}>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemAvatar>
                      <Avatar src={appointment.patient?.profileImage}>
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6">
                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                          </Typography>
                          <Chip
                            size="small"
                            label={getStatusText(appointment.status)}
                            color={getStatusColor(appointment.status)}
                          />
                          <Countdown targetDate={appointment.dateTime} />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            <CalendarToday fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                            {dayjs(appointment.dateTime).format('HH:mm')} - {dayjs(appointment.dateTime).add(appointment.duration, 'minute').format('HH:mm')}
                            ({appointment.duration} min)
                          </Typography>
                          {appointment.notes && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              <EventNote fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                              {appointment.notes}
                            </Typography>
                          )}
                          {appointment.patient?.phone && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              <Phone fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                              {appointment.patient.phone}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Prikaži detalje pacijenta">
                          <IconButton>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Završi termin">
                          <IconButton
                            color="success"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setPrescription(appointment.notes || '');
                              setAppointmentNotes(appointment.notes || '');
                              setPrescriptionDialog(true);
                            }}
                          >
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Paper>
              ))}
            </List>
          )}
        </Box>
      )}

      {/* Upcoming Appointments */}
      {tabValue === 1 && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule color="primary" />
            Predstojeći Termini
          </Typography>

          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Nemate predstojeće termine.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: 3,
              '& > *': {
                flex: '1 1 300px',
                maxWidth: '48%'
              }
            }}>
              {upcomingAppointments
                .sort((a, b) => dayjs(a.dateTime).valueOf() - dayjs(b.dateTime).valueOf())
                .map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar src={appointment.patient?.profileImage}>
                        <Person />
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">
                          {appointment.patient?.firstName} {appointment.patient?.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {dayjs(appointment.dateTime).format('DD.MM.YYYY u HH:mm')}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={getStatusText(appointment.status)}
                        color={getStatusColor(appointment.status)}
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2">
                          Trajanje: {appointment.duration} minuta
                        </Typography>
                      </Box>
                      {appointment.patient?.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Phone fontSize="small" color="action" />
                          <Typography variant="body2">
                            {appointment.patient.phone}
                          </Typography>
                        </Box>
                      )}
                      {appointment.patient?.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Email fontSize="small" color="action" />
                          <Typography variant="body2">
                            {appointment.patient.email}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {appointment.notes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Razlog:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {appointment.notes}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Completed Appointments */}
      {tabValue === 2 && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            Završeni Termini
          </Typography>

          {completedAppointments.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Nemate završene termine.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: 3,
              '& > *': {
                flex: '1 1 300px',
                maxWidth: '48%'
              }
            }}>
              {completedAppointments.map((appointment) => (
                <Card key={appointment.id} sx={{ opacity: 0.9 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar src={appointment.patient?.profileImage}>
                        <Person />
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">
                          {appointment.patient?.firstName} {appointment.patient?.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {dayjs(appointment.dateTime).format('DD.MM.YYYY u HH:mm')}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {dayjs(appointment.dateTime).fromNow()}
                      </Typography>
                    </Box>

                    {appointment.notes && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Razlog:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {appointment.notes}
                        </Typography>
                      </Box>
                    )}

                    {appointment.notes && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom color="success.main">
                          Napomene:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {appointment.notes}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Complete Appointment Dialog */}
      <Dialog 
        open={prescriptionDialog} 
        onClose={() => setPrescriptionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Završi Termin</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Pacijent: {selectedAppointment?.patient?.firstName} {selectedAppointment?.patient?.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Termin: {selectedAppointment && dayjs(selectedAppointment.dateTime).format('DD.MM.YYYY u HH:mm')}
          </Typography>

          <TextField
            label="Napomene o terminu"
            multiline
            rows={3}
            fullWidth
            value={appointmentNotes}
            onChange={(e) => setAppointmentNotes(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />

          <TextField
            label="Preporuka/Terapijski plan"
            multiline
            rows={4}
            fullWidth
            value={prescription}
            onChange={(e) => setPrescription(e.target.value)}
            placeholder="Unesite preporuke za pacijenta, sledeće korake terapije, vežbe za kućnu upotrebu..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrescriptionDialog(false)}>
            Odustani
          </Button>
          <Button 
            onClick={handleCompleteAppointment} 
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
          >
            Završi Termin
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};