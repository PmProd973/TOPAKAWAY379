// src/components/furniture3d/FurnitureDesigner/index.js
import React, { useEffect, useState } from 'react';
import { 
  Box, 
  CircularProgress, 
  Alert,
  Typography, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SettingsIcon from '@mui/icons-material/Settings';
import ChairIcon from '@mui/icons-material/Chair';
import HomeIcon from '@mui/icons-material/Home';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import InfoIcon from '@mui/icons-material/Info';

import Scene3D from './Scene3D';
import { useFurnitureStore } from './store';

// Importer les composants d'onglets
import FurnitureTab from './components/tabs/FurnitureTab';
import RoomTab from './components/tabs/RoomTab';
import DisplayOptionsTab from './components/tabs/DisplayOptionsTab';

// Composant pour contenir le contenu d'un onglet
const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      style={{ width: '100%', height: '100%' }}
      {...other}
    >
      {value === index && <Box sx={{ p: 2, height: '100%' }}>{children}</Box>}
    </div>
  );
};

// Largeur du menu latéral
const DRAWER_WIDTH = 280;

const FurnitureDesigner = ({ currentUser, firestore, userSubscription, onSaveProject }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [menuOpen, setMenuOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  const { 
    setUser,
    setSubscription,
    initialize,
    canUndo,
    canRedo,
    undo,
    redo
  } = useFurnitureStore();
  
  // Utiliser les props fournies pour initialiser le store
  useEffect(() => {
    const initializeDesigner = async () => {
      try {
        setLoading(true);
        
        // Vérifier l'authentification
        if (!currentUser) {
          setError("Vous devez être connecté pour accéder à ce module");
          setLoading(false);
          return;
        }
        
        // Définir l'utilisateur dans le store
        setUser(currentUser);
        
        // Vérifier l'abonnement
        if (!userSubscription || !userSubscription.active) {
          setError("Vous devez disposer d'un abonnement actif pour accéder à ce module");
          setLoading(false);
          return;
        }
        
        // Définir l'abonnement dans le store
        setSubscription(userSubscription);
        
        // Initialiser le designer
        initialize();
        
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors de l'initialisation:", err);
        setError("Une erreur s'est produite lors de l'initialisation du module");
        setLoading(false);
      }
    };
    
    initializeDesigner();
  }, [currentUser, userSubscription, setUser, setSubscription, initialize]);

  // Gestion du changement d'onglet
  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
  };
  
  // Toggle le menu
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  // Gérer la sauvegarde
  const handleSave = () => {
    if (onSaveProject) {
      onSaveProject();
    }
  };

  // Toggle mode sombre
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  // Affichage pendant le chargement
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }
  
  // Affichage en cas d'erreur
  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
        p={3}
      >
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  // Menu latéral
  const drawer = (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%'
      }}>
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          bgcolor: darkMode ? '#1e1e1e' : '#f8f8f8',
          color: darkMode ? 'white' : 'inherit'
        }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Conception 3D
          </Typography>
        </Box>
        
        <Divider />
        
        <List sx={{ 
          bgcolor: darkMode ? '#2a2a2a' : 'white',
          color: darkMode ? 'white' : 'inherit',
          flexGrow: 1
        }}>
          <ListItem disablePadding>
            <ListItemButton 
              selected={activeTab === 0} 
              onClick={() => handleTabChange(0)}
              sx={{ 
                mb: 1,
                bgcolor: activeTab === 0 ? (darkMode ? '#3a3a3a' : '#e3f2fd') : 'transparent',
                borderRadius: '4px',
                mx: 1,
                '&:hover': {
                  bgcolor: darkMode ? '#3a3a3a' : '#e3f2fd'
                }
              }}
            >
              <ListItemIcon sx={{ color: darkMode ? 'white' : 'primary.main' }}>
                <ChairIcon />
              </ListItemIcon>
              <ListItemText primary="Meuble" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton 
              selected={activeTab === 1} 
              onClick={() => handleTabChange(1)}
              sx={{ 
                mb: 1,
                bgcolor: activeTab === 1 ? (darkMode ? '#3a3a3a' : '#e3f2fd') : 'transparent',
                borderRadius: '4px',
                mx: 1,
                '&:hover': {
                  bgcolor: darkMode ? '#3a3a3a' : '#e3f2fd'
                }
              }}
            >
              <ListItemIcon sx={{ color: darkMode ? 'white' : 'primary.main' }}>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Pièce" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton 
              selected={activeTab === 2} 
              onClick={() => handleTabChange(2)}
              sx={{ 
                mb: 1,
                bgcolor: activeTab === 2 ? (darkMode ? '#3a3a3a' : '#e3f2fd') : 'transparent',
                borderRadius: '4px',
                mx: 1,
                '&:hover': {
                  bgcolor: darkMode ? '#3a3a3a' : '#e3f2fd'
                }
              }}
            >
              <ListItemIcon sx={{ color: darkMode ? 'white' : 'primary.main' }}>
                <VisibilityIcon />
              </ListItemIcon>
              <ListItemText primary="Affichage" />
            </ListItemButton>
          </ListItem>
        </List>
        
        <Divider />
        
        <List sx={{ 
          bgcolor: darkMode ? '#2a2a2a' : 'white',
          color: darkMode ? 'white' : 'inherit'
        }}>
          <ListItem disablePadding>
            <ListItemButton onClick={toggleDarkMode}>
              <ListItemIcon sx={{ color: darkMode ? 'white' : 'inherit' }}>
                <DarkModeIcon />
              </ListItemIcon>
              <ListItemText primary={darkMode ? "Mode clair" : "Mode sombre"} />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemIcon sx={{ color: darkMode ? 'white' : 'inherit' }}>
                <InfoIcon />
              </ListItemIcon>
              <ListItemText primary="Aide" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );
  
  // Affichage principal du designer
  return (
    <Box sx={{ 
      height: '100%', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: darkMode ? '#121212' : '#fff'
    }}>
      {/* Barre d'outils principale */}
      <AppBar 
        position="static" 
        color={darkMode ? "default" : "primary"} 
        elevation={1} 
        sx={{ 
          zIndex: 20,
          bgcolor: darkMode ? '#1e1e1e' : null,
          color: darkMode ? 'white' : null
        }}
      >
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleMenu}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Conception de meuble 3D
          </Typography>
          
          <IconButton color="inherit" onClick={handleSave}>
            <SaveIcon />
          </IconButton>
          
          <IconButton color="inherit" onClick={undo} disabled={!canUndo()}>
            <UndoIcon />
          </IconButton>
          
          <IconButton color="inherit" onClick={redo} disabled={!canRedo()}>
            <RedoIcon />
          </IconButton>
          
          <IconButton color="inherit">
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Contenu principal avec menu à gauche et scène 3D */}
      <Box sx={{ 
        display: 'flex', 
        flexGrow: 1, 
        width: '100%', 
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Menu latéral */}
        <Drawer
          variant="persistent"
          open={menuOpen}
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              position: 'relative',
              height: '100%'
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Contenu principal (onglets + scène 3D) */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 0, 
            transition: theme => theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            marginLeft: 0,
            height: '100%',
            display: 'flex',
            overflow: 'hidden',
            bgcolor: darkMode ? '#1e1e1e' : '#f5f5f5'
          }}
        >
          {/* Panneau de contenu de l'onglet actif */}
          <Box 
            sx={{ 
              width: '350px',
              maxWidth: '350px',
              height: '100%',
              bgcolor: darkMode ? '#2a2a2a' : 'white',
              boxShadow: '2px 0px 5px rgba(0,0,0,0.1)',
              zIndex: 10,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Paper 
              elevation={0} 
              sx={{ 
                borderRadius: 0,
                bgcolor: darkMode ? '#2a2a2a' : 'white',
                color: darkMode ? 'white' : 'inherit',
                height: '100%',
                overflow: 'auto'
              }}
            >
              <TabPanel value={activeTab} index={0}>
                <FurnitureTab darkMode={darkMode} />
              </TabPanel>
              <TabPanel value={activeTab} index={1}>
                <RoomTab darkMode={darkMode} />
              </TabPanel>
              <TabPanel value={activeTab} index={2}>
                <DisplayOptionsTab darkMode={darkMode} />
              </TabPanel>
            </Paper>
          </Box>
          
          {/* Zone de conception 3D */}
          <Box sx={{ 
            flexGrow: 1, 
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            zIndex: 1,
            bgcolor: darkMode ? '#121212' : '#f0f0f0'
          }}>
            <Scene3D darkMode={darkMode} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FurnitureDesigner;