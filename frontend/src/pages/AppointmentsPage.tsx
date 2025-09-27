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
} from '@mui/material';
import {
  AccessTime,
  CalendarToday,
  Person,
  Phone,
  Email,
  Cancel,
  Edit,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import { appointmentService } from '../services/appointmentService';
import { Appointment, Physiotherapist } from '../types';

dayjs.extend(relativeTime);
dayjs.extend(duration);

interface AppointmentWithPhysiotherapist extends Appointment {
  physiotherapist?: Physiotherapist;
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
      <AccessTime color={isOverdue ? 'error' : 'primary'} />
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

export const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentWithPhysiotherapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithPhysiotherapist | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [newDateTime, setNewDateTime] = useState('');

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const appointmentsData = await appointmentService.getUserAppointments();
      
      // Load physiotherapist details for each appointment
      const appointmentsWithPhysiotherapists = await Promise.all(
        appointmentsData.map(async (appointment) => {
          try {
            const physiotherapist = await appointmentService.getPhysiotherapist(
              appointment.physiotherapistId
            );
            return { ...appointment, physiotherapist };
          } catch (error) {
            console.error('Error loading physiotherapist:', error);
            return appointment;
          }
        })
      );

      setAppointments(appointmentsWithPhysiotherapists);
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

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      await appointmentService.cancelAppointment(selectedAppointment.id);
      await loadAppointments();
      setCancelDialogOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setError('Greška pri otkazivanju termina.');
    }
  };

  const handleRescheduleAppointment = async () => {
    if (!selectedAppointment || !newDateTime) return;

    try {
      await appointmentService.rescheduleAppointment(selectedAppointment.id, newDateTime);
      await loadAppointments();
      setRescheduleDialogOpen(false);
      setSelectedAppointment(null);
      setNewDateTime('');
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      setError('Greška pri pomeranju termina.');
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'rescheduled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'Zakazan';
      case 'completed':
        return 'Završen';
      case 'cancelled':
        return 'Otkazan';
      case 'rescheduled':
        return 'Pomeren';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return <Schedule />;
      case 'completed':
        return <CheckCircle />;
      case 'cancelled':
        return <Cancel />;
      case 'rescheduled':
        return <Edit />;
      default:
        return <Schedule />;
    }
  };

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'scheduled' && dayjs(apt.dateTime).isAfter(dayjs())
  );
  const pastAppointments = appointments.filter(
    (apt) => apt.status === 'completed' || dayjs(apt.dateTime).isBefore(dayjs())
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Učitavanje termina...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Moji Termini
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Upcoming Appointments */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Schedule color="primary" />
          Predstojeci Termini ({upcomingAppointments.length})
        </Typography>

        {upcomingAppointments.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Nemate zakazane termine.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              md: 'repeat(2, 1fr)' 
            }, 
            gap: 3 
          }}>
            {upcomingAppointments.map((appointment) => (
              <Box key={appointment.id}>
                <Card
                  sx={{
                    border: '2px solid',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Chip
                        icon={getStatusIcon(appointment.status)}
                        label={getStatusText(appointment.status)}
                        color={getStatusColor(appointment.status)}
                        size="small"
                      />
                      <Countdown targetDate={appointment.dateTime} />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        src={appointment.physiotherapist?.profileImage}
                        sx={{ width: 60, height: 60 }}
                      >
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {appointment.physiotherapist?.firstName} {appointment.physiotherapist?.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {appointment.physiotherapist?.specializations.join(', ')}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2">
                          {dayjs(appointment.dateTime).format('DD.MM.YYYY u HH:mm')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2">
                          Trajanje: {appointment.duration} minuta
                        </Typography>
                      </Box>
                      {appointment.physiotherapist?.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Phone fontSize="small" color="action" />
                          <Typography variant="body2">
                            {appointment.physiotherapist.phone}
                          </Typography>
                        </Box>
                      )}
                      {appointment.physiotherapist?.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Email fontSize="small" color="action" />
                          <Typography variant="body2">
                            {appointment.physiotherapist.email}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {appointment.notes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Napomene:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {appointment.notes}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<Cancel />}
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setCancelDialogOpen(true);
                        }}
                      >
                        Otkaži
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setNewDateTime(dayjs(appointment.dateTime).format('YYYY-MM-DDTHH:mm'));
                          setRescheduleDialogOpen(true);
                        }}
                      >
                        Pomeri
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Past Appointments */}
      <Box>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle color="success" />
          Prethodnji Termini ({pastAppointments.length})
        </Typography>

        {pastAppointments.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Nemate prethodne termine.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              md: 'repeat(2, 1fr)' 
            }, 
            gap: 3 
          }}>
            {pastAppointments.map((appointment) => (
              <Box key={appointment.id}>
                <Card sx={{ opacity: 0.8 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Chip
                        icon={getStatusIcon(appointment.status)}
                        label={getStatusText(appointment.status)}
                        color={getStatusColor(appointment.status)}
                        size="small"
                      />
                      <Typography variant="body2" color="text.secondary">
                        {dayjs(appointment.dateTime).fromNow()}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        src={appointment.physiotherapist?.profileImage}
                        sx={{ width: 50, height: 50 }}
                      >
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {appointment.physiotherapist?.firstName} {appointment.physiotherapist?.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {dayjs(appointment.dateTime).format('DD.MM.YYYY u HH:mm')}
                        </Typography>
                      </Box>
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

                    {appointment.prescription && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom color="success.main">
                          Preporuka:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {appointment.prescription}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Otkazivanje Termina</DialogTitle>
        <DialogContent>
          <Typography>
            Da li ste sigurni da želite da otkažete termin sa{' '}
            {selectedAppointment?.physiotherapist?.firstName} {selectedAppointment?.physiotherapist?.lastName}
            {' '}zakazanog za{' '}
            {selectedAppointment && dayjs(selectedAppointment.dateTime).format('DD.MM.YYYY u HH:mm')}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Odustani
          </Button>
          <Button onClick={handleCancelAppointment} color="error" variant="contained">
            Otkaži Termin
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onClose={() => setRescheduleDialogOpen(false)}>
        <DialogTitle>Pomeranje Termina</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Pomeranje termina sa{' '}
            {selectedAppointment?.physiotherapist?.firstName} {selectedAppointment?.physiotherapist?.lastName}
          </Typography>
          <TextField
            label="Novo vreme"
            type="datetime-local"
            value={newDateTime}
            onChange={(e) => setNewDateTime(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRescheduleDialogOpen(false)}>
            Odustani
          </Button>
          <Button 
            onClick={handleRescheduleAppointment} 
            variant="contained"
            disabled={!newDateTime}
          >
            Pomeri Termin
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};