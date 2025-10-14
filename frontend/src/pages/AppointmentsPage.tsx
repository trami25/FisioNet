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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import { NewAppointment, Physiotherapist } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

dayjs.extend(relativeTime);
dayjs.extend(duration);

interface AppointmentWithPhysiotherapist extends NewAppointment {
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
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [appointments, setAppointments] = useState<AppointmentWithPhysiotherapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithPhysiotherapist | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Move all hooks before early returns
  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const appointmentsData = await appointmentService.getMyAppointments();
      
      // Load physiotherapist details for each appointment
      const appointmentsWithPhysiotherapists = await Promise.all(
        appointmentsData.map(async (appointment) => {
          try {
            // For now, we'll just use the appointment data without loading full physiotherapist details
            // You can implement this by calling a user service to get physiotherapist details
            return { ...appointment, physiotherapist: undefined };
          } catch (error) {
            console.error('Error loading physiotherapist:', error);
            return appointment;
          }
        })
      );

      setAppointments(appointmentsWithPhysiotherapists);
    } catch (error) {
      console.error('Error loading appointments:', error);
      showError('Greška pri učitavanju termina. Molimo pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Categorize appointments by time
  const categorizeAppointments = (appointments: AppointmentWithPhysiotherapist[]) => {
    const now = dayjs();
    const today = now.startOf('day');
    const tomorrow = today.add(1, 'day');
    
    const upcoming = appointments.filter(apt => {
      const aptDate = dayjs(apt.appointment_date);
      return aptDate.isAfter(tomorrow) && apt.status !== 'cancelled' && apt.status !== 'completed';
    });
    
    const todayAppointments = appointments.filter(apt => {
      const aptDate = dayjs(apt.appointment_date);
      return aptDate.isSame(today, 'day') && apt.status !== 'cancelled' && apt.status !== 'completed';
    });
    
    const past = appointments.filter(apt => {
      const aptDate = dayjs(apt.appointment_date);
      return aptDate.isBefore(today) || apt.status === 'completed' || apt.status === 'cancelled';
    });

    return { upcoming, today: todayAppointments, past };
  };

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
      showSuccess('Termin je uspešno otkazan.');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      showError('Greška pri otkazivanju termina.');
    }
  };

  // Only allow authenticated users
  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Molimo prijavite se za pristup terminima.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>
          Prijaví se
        </Button>
      </Container>
    );
  }

  // Redirect physiotherapists to their dedicated schedule page
  if (user?.role === 'physiotherapist') {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Kao fizioterapeut, koristite svoju stranicu rasporedo za upravljanje terminima.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/physiotherapist-schedule')}>
          Idí na raspored
        </Button>
      </Container>
    );
  }

  // Patients can only cancel appointments, not reschedule them

  const getStatusColor = (status: NewAppointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'confirmed':
        return 'success';
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
      case 'confirmed':
        return 'Potvrđen';
      case 'completed':
        return 'Završen';
      case 'cancelled':
        return 'Otkazan';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: NewAppointment['status']) => {
    switch (status) {
      case 'scheduled':
        return <Schedule />;
      case 'confirmed':
        return <CheckCircle />;
      case 'completed':
        return <CheckCircle />;
      case 'cancelled':
        return <Cancel />;
      default:
        return <Schedule />;
    }
  };

  // Helper function to convert appointment date/time to dayjs object
  const getAppointmentDateTime = (appointment: AppointmentWithPhysiotherapist) => {
    return dayjs(`${appointment.appointment_date} ${appointment.start_time}`);
  };

  // Helper function to calculate duration in minutes
  const getAppointmentDuration = (appointment: AppointmentWithPhysiotherapist) => {
    const start = dayjs(`${appointment.appointment_date} ${appointment.start_time}`);
    const end = dayjs(`${appointment.appointment_date} ${appointment.end_time}`);
    return end.diff(start, 'minute');
  };

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'scheduled' && getAppointmentDateTime(apt).isAfter(dayjs())
  );
  const pastAppointments = appointments.filter(
    (apt) => apt.status === 'completed' || getAppointmentDateTime(apt).isBefore(dayjs())
  );

  // Get categorized appointments
  const { upcoming, today, past } = categorizeAppointments(appointments);

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

      {/* Today's Appointments */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTime color="warning" />
          Danas ({today.length})
        </Typography>

        {today.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Nemate termine za danas.
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
            {today.map((appointment) => (
              <Box key={appointment.id}>
                <Card
                  sx={{
                    border: '2px solid',
                    borderColor: 'warning.main',
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
                      <Countdown targetDate={getAppointmentDateTime(appointment).toISOString()} />
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
                          Fizioterapeut ID: {appointment.physiotherapist_id}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarToday fontSize="small" />
                      <Typography variant="body2">
                        {getAppointmentDateTime(appointment).format('dddd, DD.MM.YYYY')}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AccessTime fontSize="small" />
                      <Typography variant="body2">
                        {appointment.start_time} - {appointment.end_time} ({getAppointmentDuration(appointment)} min)
                      </Typography>
                    </Box>

                    {appointment.notes && (
                      <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                        Napomene: {appointment.notes}
                      </Typography>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      {appointment.status === 'scheduled' && (
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
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Upcoming Appointments */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Schedule color="primary" />
          Predstojeći Termini ({upcoming.length})
        </Typography>

        {upcoming.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Nemate zakazane termine.
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
            {upcoming.map((appointment) => (
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
                      <Countdown targetDate={getAppointmentDateTime(appointment).toISOString()} />
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
                          {getAppointmentDateTime(appointment).format('DD.MM.YYYY u HH:mm')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2">
                          Trajanje: {getAppointmentDuration(appointment)} minuta
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

                    {user?.role === 'patient' && (
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
                      </Box>
                    )}
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
          Prošli Termini ({past.length})
        </Typography>

        {past.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Nemate prošle termine.
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
            {past.map((appointment) => (
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
                        {getAppointmentDateTime(appointment).fromNow()}
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
                          {getAppointmentDateTime(appointment).format('DD.MM.YYYY u HH:mm')}
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
            {selectedAppointment && getAppointmentDateTime(selectedAppointment).format('DD.MM.YYYY u HH:mm')}?
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


    </Container>
  );
};