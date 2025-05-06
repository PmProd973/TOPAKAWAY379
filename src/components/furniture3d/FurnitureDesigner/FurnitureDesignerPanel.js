// src/components/furniture3d/FurnitureDesigner/FurnitureDesignerPanel.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Drawer,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ViewInAr as ViewInArIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import Scene3D from './Scene3D';
import FurnitureBuilder from './components/FurnitureBuilder';
import { useFurnitureStore } from './store';
import DisplayOptionsTab from './components/tabs/DisplayOptionsTab';
import MainToolbar from './MainToolbar';

// Largeur du panneau latéral
const SIDEBAR_WIDTH = 320;

const FurnitureDesignerPanel = ({ projectId, pieces = [], materials = [] }) => {
  const [notification, setNotification] = useState({ show: false, message: '', severity: 'info' });
  const [showDimensions, setShowDimensions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const { 
    importPieces,
    importMaterials,
    selectedObjectId,
    removeObject,
    resetScene,
    sceneObjects,
    cloneObject,
    toggleDimensions,
    calculateTotalDimensions
  } = useFurnitureStore();
  
  // Chargement initial des données
  useEffect(() => {
    if (pieces.length > 0 && typeof importPieces === 'function') {
      importPieces(pieces);
    }
    if (materials.length > 0 && typeof importMaterials === 'function') {
      importMaterials(materials);
    }
  }, [pieces, materials, importPieces, importMaterials]);

  // Fonction pour supprimer l'objet sélectionné
  const handleDeleteSelected = () => {
    if (selectedObjectId) {
      removeObject(selectedObjectId);
      showNotification('Objet supprimé', 'success');
    }
  };
  
  // Fonction pour dupliquer l'objet sélectionné
  const handleCloneSelected = () => {
    if (selectedObjectId) {
      const newId = cloneObject(selectedObjectId);
      if (newId) {
        showNotification('Objet dupliqué', 'success');
      }
    }
  };
  
  // Fonction pour sauvegarder la conception actuelle
  const handleSaveDesign = () => {
    showNotification('Conception sauvegardée avec succès', 'success');
  };
  
  // Fonction pour exporter en GLTF
  const handleExportGLTF = () => {
    showNotification('Export GLTF en cours de développement', 'info');
  };
  
  // Fonction pour générer la liste des pièces
  const handleGeneratePartsList = () => {
    showNotification('Liste des pièces générée', 'success');
  };
  
  // Fonction pour réinitialiser la scène
  const handleResetScene = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser la scène ? Toutes les modifications seront perdues.')) {
      resetScene();
      showNotification('Scène réinitialisée', 'success');
    }
  };
  
  // Fonction pour basculer l'affichage des dimensions
  const handleToggleDimensions = () => {
    if (typeof toggleDimensions === 'function') {
      toggleDimensions();
    }
    setShowDimensions(!showDimensions);
  };
  
  // Fonction utilitaire pour afficher des notifications
  const showNotification = (message, severity = 'info') => {
    setNotification({
      show: true,
      message,
      severity
    });
  };
  
  // Fermer la notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };
  
  // Basculer l'état du panneau latéral
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Obtenir les dimensions totales du meuble
  const totalDimensions = calculateTotalDimensions ? calculateTotalDimensions() : { width: 0, height: 0, depth: 0 };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Notifications */}
      <Snackbar 
        open={notification.show} 
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
      
      {/* Utiliser MainToolbar directement */}
      <MainToolbar />
      
      {/* Conteneur principal flex avec panneau latéral et zone 3D */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Panneau latéral */}
        <Drawer
          variant="persistent"
          anchor="left"
          open={sidebarOpen}
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: SIDEBAR_WIDTH,
              position: 'relative',
              boxSizing: 'border-box',
              border: 'none',
              borderRight: '1px solid rgba(0, 0, 0, 0.12)'
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Afficher le contenu des onglets sélectionnés */}
            <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
              {/* Le contenu des onglets sera géré par MainToolbar */}
            </Box>
            
            {/* Statut */}
            <Box sx={{ 
              p: 1, 
              borderTop: 1, 
              borderColor: 'divider', 
              bgcolor: '#f5f5f5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="caption" color="text.secondary">
                {selectedObjectId ? 'Objet sélectionné' : 'Aucune sélection'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {sceneObjects.length} objets | {totalDimensions.width.toFixed(0)} × {totalDimensions.height.toFixed(0)} × {totalDimensions.depth.toFixed(0)} mm
              </Typography>
            </Box>
          </Box>
        </Drawer>
        
        {/* Zone de visualisation 3D */}
        <Box sx={{ 
          flexGrow: 1, 
          height: '100%',
          transition: 'all 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
          ml: sidebarOpen ? 0 : -SIDEBAR_WIDTH
        }}>
          <Scene3D showDimensions={showDimensions} />
        </Box>
      </Box>
    </Box>
  );
};

export default FurnitureDesignerPanel;