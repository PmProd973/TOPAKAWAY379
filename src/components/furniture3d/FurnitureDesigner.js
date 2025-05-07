import React, { useState, useEffect } from 'react';
import { Box, Typography, AppBar, Toolbar, IconButton, Drawer, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SettingsIcon from '@mui/icons-material/Settings';

// Importer uniquement le store et ne pas importer FurnitureDesignerPanel directement
import { useFurnitureStore } from './FurnitureDesigner/store';
import AccordionSidebar from './FurnitureDesigner/AccordionSidebar';
import AuthenticadepFix from './FurnitureDesigner/AuthenticadepFix';

// Utilisez votre composant de visualisation 3D ici - à adapter selon votre structure
// Si celui-ci n'a pas d'export par défaut, utilisez une approche conditionnelle
// import * as FurnitureDesignerComponents from './FurnitureDesigner';
// const { FurnitureDesignerPanel } = FurnitureDesignerComponents;

const FurnitureDesigner = ({ currentUser, firestore, userSubscription, onSaveProject }) => {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [projectData, setProjectData] = useState({
    projectInfo: {
      id: `furniture_${Date.now()}`,
      name: 'Nouveau projet',
      createdAt: new Date()
    },
    furnitureType: 'Bibliothèque',
    dimensions: {
      width: 1000,
      height: 2000,
      depth: 600
    },
    materials: [],
    components: []
  });
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Récupérer le store de meubles
  const furnitureStore = useFurnitureStore();
  
  // Désactiver l'élément authenticadepApp qui cause des problèmes
  useEffect(() => {
    const cleanup = AuthenticadepFix();
    return cleanup;
  }, []);
  
  // Synchroniser les données du projet avec le store
  useEffect(() => {
    if (furnitureStore) {
      // Synchroniser les dimensions de base
      if (furnitureStore.setWidth) furnitureStore.setWidth(projectData.dimensions.width);
      if (furnitureStore.setHeight) furnitureStore.setHeight(projectData.dimensions.height);
      if (furnitureStore.setDepth) furnitureStore.setDepth(projectData.dimensions.depth);
      
      // Synchroniser le type de meuble si la méthode existe
      if (furnitureStore.setFurnitureType) furnitureStore.setFurnitureType(projectData.furnitureType);
    }
  }, [furnitureStore, projectData]);
  
  // Gérer la sauvegarde du projet
  const handleSave = async () => {
    // Récupérer les données actuelles du store
    const currentStoreData = {
      width: furnitureStore.width,
      height: furnitureStore.height,
      depth: furnitureStore.depth
    };
    
    // Mettre à jour les données du projet
    const updatedProjectData = {
      ...projectData,
      dimensions: {
        ...projectData.dimensions,
        ...currentStoreData
      },
      updatedAt: new Date()
    };
    
    // Mettre à jour l'état local
    setProjectData(updatedProjectData);
    
    // Sauvegarder dans Firestore via la fonction parent
    if (onSaveProject) {
      await onSaveProject(updatedProjectData);
    }
  };
  
  // Mettre à jour les données du projet depuis le menu accordéon
  const handleProjectDataUpdate = (newData) => {
    setProjectData(prevData => ({
      ...prevData,
      ...newData
    }));
  };
  
  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Bandeau promotionnel en haut */}
      <Box 
        sx={{ 
          width: '100%', 
          bgcolor: '#e64a19', 
          color: 'white',
          p: 0.5,
          textAlign: 'center',
          fontWeight: 'bold'
        }}
      >
        <Typography variant="body2">
          -20% code MOBIDAYS ❤️
        </Typography>
      </Box>
      
      {/* Barre d'outils principale */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {projectData.projectInfo.name}
          </Typography>
          
          <IconButton color="inherit" onClick={handleSave}>
            <SaveIcon />
          </IconButton>
          
          <IconButton color="inherit">
            <UndoIcon />
          </IconButton>
          
          <IconButton color="inherit">
            <RedoIcon />
          </IconButton>
          
          <IconButton color="inherit">
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Contenu principal */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Menu accordéon dans un tiroir */}
        <Drawer
          variant={isMobile ? "temporary" : "persistent"}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            width: 430,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 430,
              boxSizing: 'border-box',
              position: 'relative',
              height: '100%'
            },
          }}
        >
          <AccordionSidebar 
            furnitureStore={furnitureStore} 
            projectData={projectData}
            onProjectDataUpdate={handleProjectDataUpdate}
          />
        </Drawer>
        
        {/* Zone de conception 3D */}
        <Box sx={{ flexGrow: 1, height: '100%', overflow: 'hidden' }}>
          {/* Ici, nous affichons directement une scène 3D basique au lieu d'utiliser FurnitureDesignerPanel */}
          <div id="scene3d-container" style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0' }}>
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}>
              <Typography variant="h6">
                Zone de visualisation 3D
              </Typography>
              <Typography variant="body2">
                Intégrez ici votre composant de rendu 3D existant
              </Typography>
            </div>
          </div>
        </Box>
      </Box>
      
      {/* Style global pour corriger les problèmes d'affichage */}
      <style>
        {`
          #authenticadepApp {
            display: none !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
            position: absolute !important;
            z-index: -9999 !important;
          }
          
          canvas {
            width: 100% !important;
            height: 100% !important;
            outline: none;
          }
        `}
      </style>
    </Box>
  );
};

export default FurnitureDesigner;