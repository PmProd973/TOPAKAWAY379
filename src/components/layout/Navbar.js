import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Tooltip,
  Badge,
  InputBase,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';

const Navbar = ({ user, toggleSidebar }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchAnchorEl, setSearchAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSearchOpen = (event) => {
    setSearchAnchorEl(event.currentTarget);
  };

  const handleSearchClose = () => {
    setSearchAnchorEl(null);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
    handleMenuClose();
  };

  const getUserInitials = () => {
    if (!user || !user.displayName) return 'U';
    return user.displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const isMenuOpen = Boolean(anchorEl);

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="open drawer"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            display: { xs: 'none', sm: 'block' },
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
          }}
        >
          OptiCoupe
        </Typography>

        {/* Barre de recherche */}
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ position: 'relative' }}>
          <Tooltip title="Rechercher">
            <IconButton color="inherit" onClick={handleSearchOpen}>
              <SearchIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={searchAnchorEl}
            open={Boolean(searchAnchorEl)}
            onClose={handleSearchClose}
            PaperProps={{
              sx: { width: 300, maxWidth: '100%', mt: 1.5 },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ p: 1 }}>
              <InputBase
                autoFocus
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={handleSearchChange}
                fullWidth
                sx={{
                  p: '5px 10px',
                  borderRadius: 1,
                  bgcolor: (theme) => alpha(theme.palette.common.black, 0.05),
                }}
                startAdornment={<SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />}
              />
            </Box>
          </Menu>
        </Box>

        <Box sx={{ display: 'flex' }}>
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge badgeContent={0} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Menu utilisateur */}
          <Tooltip title="Mon compte">
            <IconButton
              edge="end"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {getUserInitials()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Menu déroulant utilisateur */}
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { width: 200, maxWidth: '100%', mt: 1.5 },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem component={RouterLink} to="/profile" onClick={handleMenuClose}>
          <PersonIcon sx={{ mr: 2 }} />
          Mon profil
        </MenuItem>
        <MenuItem component={RouterLink} to="/settings" onClick={handleMenuClose}>
          <SettingsIcon sx={{ mr: 2 }} />
          Paramètres
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 2 }} />
          Déconnexion
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Navbar;