// pages/Conception3DPage.js
import React from 'react';
import { Box } from '@mui/material';
import FurnitureDesignerPanel from '../components/furniture3d/FurnitureDesigner/FurnitureDesignerPanel';

const Conception3DPage = () => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'hidden',
      // Important: Retirer tout padding pour que la scène 3D occupe tout l'espace
      p: 0,
      // Ajuster pour la barre de navigation principale
      pt: { xs: '56px', sm: '64px' }, // Hauteur de la barre de navigation
      // Si vous avez une sidebar, ajoutez aussi ml pour la largeur de la sidebar
      ml: { sm: '240px' }, // Largeur de la sidebar
      backgroundColor: '#f0f0f0'
    }}>
      <FurnitureDesignerPanel />
    </Box>
  );
};

export default Conception3DPage;