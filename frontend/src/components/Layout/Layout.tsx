import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  Tooltip
} from '@mui/material';
import { 
  FitnessCenter,
  AccountCircle,
  NotificationsNone,
  Message,
  ExitToApp,
  Person,
  Settings
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={1}>
        <Container maxWidth="lg">
          <Toolbar>
            {/* Logo and Brand */}
            <FitnessCenter sx={{ mr: 1 }} />
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                mr: 4,
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 600,
              }}
            >
              FisioNet
            </Typography>

            {/* Navigation Links */}
            <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
              <Button
                color="inherit"
                component={Link}
                to="/exercises"
                sx={{ textTransform: 'none' }}
              >
                Vežbe
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/physiotherapists"
                sx={{ textTransform: 'none' }}
              >
                Fizioterapeuti
              </Button>
              {isAuthenticated && (
                <>
                  {user?.role === 'physiotherapist' ? (
                    <Button
                      color="inherit"
                      component={Link}
                      to="/schedule"
                      sx={{ textTransform: 'none' }}
                    >
                      Moj Raspored
                    </Button>
                  ) : (
                    <Button
                      color="inherit"
                      component={Link}
                      to="/appointments"
                      sx={{ textTransform: 'none' }}
                    >
                      Termini
                    </Button>
                  )}
                  <Button
                    color="inherit"
                    component={Link}
                    to="/forum"
                    sx={{ textTransform: 'none' }}
                  >
                    Forum
                  </Button>
                </>
              )}
            </Box>

            {/* User Actions */}
            {isAuthenticated ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Notifications */}
                <Tooltip title="Obaveštenja">
                  <IconButton color="inherit">
                    <Badge badgeContent={3} color="error">
                      <NotificationsNone />
                    </Badge>
                  </IconButton>
                </Tooltip>

                {/* Messages */}
                <Tooltip title="Poruke">
                  <IconButton color="inherit" component={Link} to="/chat">
                    <Badge badgeContent={2} color="error">
                      <Message />
                    </Badge>
                  </IconButton>
                </Tooltip>

                {/* User Menu */}
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                >
                  {user?.profileImage ? (
                    <Avatar 
                      src={user.profileImage} 
                      sx={{ width: 32, height: 32 }}
                    />
                  ) : (
                    <AccountCircle />
                  )}
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={handleProfile}>
                    <Person sx={{ mr: 1 }} />
                    Profil
                  </MenuItem>
                  <MenuItem onClick={handleClose}>
                    <Settings sx={{ mr: 1 }} />
                    Podešavanja
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <ExitToApp sx={{ mr: 1 }} />
                    Odjavi se
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  color="inherit"
                  variant="outlined"
                  component={Link}
                  to="/login"
                  sx={{ textTransform: 'none' }}
                >
                  Prijavi se
                </Button>
                <Button
                  color="secondary"
                  variant="contained"
                  component={Link}
                  to="/register"
                  sx={{ textTransform: 'none' }}
                >
                  Registruj se
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content */}
      <Box component="main" sx={{ minHeight: 'calc(100vh - 64px)' }}>
        {children}
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: 'grey.100',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary">
            © 2025 FisioNet. Sva prava zadržana.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Platforma za fizioterapiju i rehabilitaciju
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};