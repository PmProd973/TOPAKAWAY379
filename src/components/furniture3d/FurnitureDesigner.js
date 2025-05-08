// src/components/furniture3d/FurnitureDesigner.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Paper,
  useMediaQuery, 
  useTheme, 
  Tabs, 
  Tab,
  Collapse
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SettingsIcon from '@mui/icons-material/Settings';

// Importer le store
import { useFurnitureStore } from './FurnitureDesigner/store';
import AuthenticadepFix from './FurnitureDesigner/AuthenticadepFix';
import Scene3D from './FurnitureDesigner/Scene3D';

// Importer les composants d'onglets
import FurnitureTab from './FurnitureDesigner/components/tabs/FurnitureTab';
import RoomTab from './FurnitureDesigner/components/tabs/RoomTab';
import DisplayOptionsTab from './FurnitureDesigner/components/tabs/DisplayOptionsTab';

// Composant pour contenir le contenu d'un onglet
const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      style={{ width: '100%' }}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
};

const FurnitureDesigner = ({ currentUser, firestore, userSubscription, onSaveProject }) => {
  const [menuOpen, setMenuOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
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

  // Effet combiné pour l'initialisation du store
  useEffect(() => {
    if (furnitureStore) {
      console.log("Initialisation du store furnitureStore");
      
      // Utiliser un flag pour éviter les multiples mises à jour
      let needsUpdate = false;
      
      // Fournir des valeurs par défaut seulement si elles diffèrent des valeurs actuelles
      if (furnitureStore.room.width !== 4000) {
        try {
          furnitureStore.updateRoomDimensions('width', 4000, false);
        } catch (e) {
          console.error("Erreur lors de la mise à jour de la largeur de la pièce:", e);
          furnitureStore.updateRoomDimensions('width', 4000);
        }
        needsUpdate = true;
      }
      
      if (furnitureStore.room.height !== 2500) {
        try {
          furnitureStore.updateRoomDimensions('height', 2500, false);
        } catch (e) {
          console.error("Erreur lors de la mise à jour de la hauteur de la pièce:", e);
          furnitureStore.updateRoomDimensions('height', 2500);
        }
        needsUpdate = true;
      }
      
      if (furnitureStore.room.depth !== 3000) {
        try {
          furnitureStore.updateRoomDimensions('depth', 3000, false);
        } catch (e) {
          console.error("Erreur lors de la mise à jour de la profondeur de la pièce:", e);
          furnitureStore.updateRoomDimensions('depth', 3000);
        }
        needsUpdate = true;
      }
      
      if (furnitureStore.furniture.dimensions.width !== 1200) {
        try {
          furnitureStore.updateFurnitureDimensions('width', 1200, false);
        } catch (e) {
          console.error("Erreur lors de la mise à jour de la largeur du meuble:", e);
          furnitureStore.updateFurnitureDimensions('width', 1200);
        }
        needsUpdate = true;
      }
      
      if (furnitureStore.furniture.dimensions.height !== 2000) {
        try {
          furnitureStore.updateFurnitureDimensions('height', 2000, false);
        } catch (e) {
          console.error("Erreur lors de la mise à jour de la hauteur du meuble:", e);
          furnitureStore.updateFurnitureDimensions('height', 2000);
        }
        needsUpdate = true;
      }
      
      if (furnitureStore.furniture.dimensions.depth !== 600) {
        try {
          furnitureStore.updateFurnitureDimensions('depth', 600, false);
        } catch (e) {
          console.error("Erreur lors de la mise à jour de la profondeur du meuble:", e);
          furnitureStore.updateFurnitureDimensions('depth', 600);
        }
        needsUpdate = true;
      }
      
      // S'assurer que les options d'affichage sont correctement initialisées
      const displayOptions = furnitureStore.displayOptions || {};
      
      if (displayOptions.showGrid === undefined) {
        try {
          furnitureStore.setDisplayOption('showGrid', true, false);
          needsUpdate = true;
        } catch (e) {
          console.error("Erreur lors de l'initialisation de showGrid:", e);
        }
      }
      
      if (displayOptions.showAxes === undefined) {
        try {
          furnitureStore.setDisplayOption('showAxes', true, false);
          needsUpdate = true;
        } catch (e) {
          console.error("Erreur lors de l'initialisation de showAxes:", e);
        }
      }
      
      if (displayOptions.showDimensions === undefined) {
        try {
          furnitureStore.setDisplayOption('showDimensions', true, false);
          needsUpdate = true;
        } catch (e) {
          console.error("Erreur lors de l'initialisation de showDimensions:", e);
        }
      }
      
      if (displayOptions.furnitureOpacity === undefined) {
        try {
          furnitureStore.setDisplayOption('furnitureOpacity', 1.0, false);
          needsUpdate = true;
        } catch (e) {
          console.error("Erreur lors de l'initialisation de furnitureOpacity:", e);
        }
      }
      
      // N'appeler regenerateScene qu'une seule fois si nécessaire
      if (needsUpdate) {
        console.log("Mise à jour nécessaire, régénération de la scène");
        setTimeout(() => {
          try {
            furnitureStore.regenerateScene();
          } catch (e) {
            console.error("Erreur lors de la régénération de la scène:", e);
          }
        }, 200);
      }
    }
  }, [furnitureStore]);
  
  // Désactiver l'élément authenticadepApp qui cause des problèmes
  useEffect(() => {
    console.log("Application du correctif AuthenticadepFix depuis FurnitureDesigner");
    const cleanup = AuthenticadepFix();
    
    // Réappliquer le correctif après un délai pour s'assurer qu'il fonctionne
    const reapplyTimer = setTimeout(() => {
      AuthenticadepFix();
    }, 2000);
    
    return () => {
      clearTimeout(reapplyTimer);
      if (cleanup) cleanup();
    };
  }, []);
  
  // Gérer la sauvegarde du projet
  const handleSave = async () => {
    console.log("Sauvegarde du projet");
    
    // Récupérer les données actuelles du store
    const currentStoreData = {
      width: furnitureStore.furniture.dimensions.width,
      height: furnitureStore.furniture.dimensions.height,
      depth: furnitureStore.furniture.dimensions.depth
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
      try {
        console.log("Appel de la fonction onSaveProject");
        await onSaveProject(updatedProjectData);
      } catch (error) {
        console.error("Erreur lors de la sauvegarde du projet:", error);
      }
    }
  };
  
  // Mettre à jour les données du projet depuis le menu
  const handleProjectDataUpdate = (newData) => {
    console.log("Mise à jour des données du projet:", newData);
    setProjectData(prevData => ({
      ...prevData,
      ...newData
    }));
  };
  
  // Gestion du changement d'onglet
  const handleTabChange = (event, newValue) => {
    console.log(`Changement d'onglet: ${activeTab} -> ${newValue}`);
    setActiveTab(newValue);
  };
  
  // Toggle le menu
  const toggleMenu = () => {
    console.log(`Toggle du menu: ${menuOpen} -> ${!menuOpen}`);
    setMenuOpen(!menuOpen);
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
            onClick={toggleMenu}
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
          
          <IconButton color="inherit" onClick={furnitureStore.undo} disabled={!furnitureStore.canUndo()}>
            <UndoIcon />
          </IconButton>
          
          <IconButton color="inherit" onClick={furnitureStore.redo} disabled={!furnitureStore.canRedo()}>
            <RedoIcon />
          </IconButton>
          
          <IconButton color="inherit">
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Bandeau d'onglets et panneau de configuration en haut */}
      <Collapse in={menuOpen}>
        <Paper sx={{ width: '100%' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              width: '100%'
            }}
          >
            <Tab label="Meuble" />
            <Tab label="Pièce" />
            <Tab label="Affichage" />
          </Tabs>
          
          {/* Contenu de l'onglet actif sans accordéon */}
          <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
            <TabPanel value={activeTab} index={0}>
              <FurnitureTab />
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              <RoomTab />
            </TabPanel>
            <TabPanel value={activeTab} index={2}>
              <DisplayOptionsTab />
            </TabPanel>
          </Box>
        </Paper>
      </Collapse>
      
      {/* Zone de conception 3D */}
      <Box sx={{ 
        flexGrow: 1, 
        width: '100%', 
        overflow: 'hidden',
        position: 'relative', 
        zIndex: 1,
        className: 'scene-container' // Ajout d'une classe pour le correctif
      }}>
        <Scene3D />
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
          
          .scene-container {
            z-index: 5 !important;
            position: relative !important;
          }
        `}
      </style>
    </Box>
  );
};

export default FurnitureDesigner;