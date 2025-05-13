// src/components/furniture3d/FurnitureDesignerPopup.js
import React, { useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FurnitureDesigner from './FurnitureDesigner';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const FurnitureDesignerPopup = () => {
  const navigate = useNavigate();
  
  // Vérifier l'authentification
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Si non authentifié, fermer la fenêtre ou rediriger
        window.close();
        // Si la fenêtre ne se ferme pas (certains navigateurs bloquent)
        navigate('/login');
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);
  
  // Récupérer les paramètres depuis l'URL
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('projectId');
  
  const handleClose = () => {
    window.close(); // Ferme la fenêtre popup
  };
  
  return (
    <Box sx={{ 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      backgroundColor: '#f5f5f5'
    }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Conception 3D - Mode plein écran
          </Typography>
          <IconButton color="inherit" onClick={handleClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {projectId && (
          <FurnitureDesigner 
            projectId={projectId}
            standaloneMode={true}
          />
        )}
      </Box>
    </Box>
  );
};

export default FurnitureDesignerPopup;