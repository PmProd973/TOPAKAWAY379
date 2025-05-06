// src/components/furniture3d/FurnitureDesigner/MainToolbar.js
import React, { useState } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Toolbar,
  Typography,
  IconButton,
  Divider,
  Tooltip
} from '@mui/material';
import {
  SaveOutlined,
  HelpOutlineOutlined,
  UndoOutlined,
  RedoOutlined,
  PanTool,
  ThreeDRotation,
  Add as AddIcon,
  ZoomIn,
  ZoomOut,
  Straighten as DimensionIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  RestartAlt,
  GetApp,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useFurnitureStore } from './store';

// Import des composants pour les onglets
import RoomTab from './components/tabs/RoomTab';
import FurnitureTab from './components/tabs/FurnitureTab';
import DisplayOptionsTab from './components/tabs/DisplayOptionsTab';

const MainToolbar = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const { 
    canUndo, 
    canRedo, 
    undo, 
    redo,
    editMode,
    setEditMode,
    selectedObjectId,
    removeObject,
    cloneObject,
    toggleDimensions
  } = useFurnitureStore();
  
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // Fonction pour supprimer l'objet sélectionné
  const handleDeleteSelected = () => {
    if (selectedObjectId) {
      removeObject(selectedObjectId);
    }
  };
  
  // Fonction pour dupliquer l'objet sélectionné
  const handleCloneSelected = () => {
    if (selectedObjectId) {
      cloneObject(selectedObjectId);
    }
  };
  
  // Liste des onglets
  const tabs = [
    { label: "FICHIER", disabled: false },
    { label: "PIÈCE", disabled: false },
    { label: "MEUBLE", disabled: false },
    { label: "SÉPARATIONS", disabled: true },
    { label: "INTÉRIEUR", disabled: true },
    { label: "FAÇADE", disabled: true },
    { label: "FORME", disabled: true },
    { label: "MATÉRIAUX", disabled: true },
    { label: "AFFICHAGE", disabled: false },
    { label: "AIDE", disabled: false }
  ];
  
  // Contenu de l'onglet actuellement sélectionné
  const getTabContent = () => {
    switch (currentTab) {
      case 0: // FICHIER
        return <Box p={2}>Contenu de l'onglet FICHIER (à implémenter)</Box>;
      case 1: // PIÈCE
        return <RoomTab />;
      case 2: // MEUBLE
        return <FurnitureTab />;
      case 8: // AFFICHAGE
        return <DisplayOptionsTab />;
      case 9: // AIDE
        return <Box p={2}>Contenu de l'onglet AIDE (à implémenter)</Box>;
      default:
        return <Box p={2}>Onglet non disponible pour le moment</Box>;
    }
  };
  
  return (
    <Box sx={{ 
      flexGrow: 0,
      backgroundColor: 'background.paper',
      borderBottom: 1,
      borderColor: 'divider'
    }}>
      {/* Barre d'outils principale */}
      <Toolbar variant="dense" sx={{ minHeight: 48 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Conception de meuble 3D
        </Typography>
        
        {/* Contrôles de mode d'édition */}
        <Tooltip title="Mode sélection">
          <IconButton 
            color={editMode === 'select' ? 'primary' : 'default'} 
            onClick={() => setEditMode('select')}
          >
            <PanTool />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Mode déplacement">
          <IconButton 
            color={editMode === 'move' ? 'primary' : 'default'}
            onClick={() => setEditMode('move')}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Mode rotation">
          <IconButton 
            color={editMode === 'rotate' ? 'primary' : 'default'}
            onClick={() => setEditMode('rotate')}
          >
            <ThreeDRotation />
          </IconButton>
        </Tooltip>
        
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        
        <Tooltip title="Afficher les dimensions">
          <IconButton onClick={toggleDimensions}>
            <DimensionIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Zoom avant">
          <IconButton>
            <ZoomIn />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Zoom arrière">
          <IconButton>
            <ZoomOut />
          </IconButton>
        </Tooltip>
        
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        
        <Tooltip title="Dupliquer l'objet sélectionné">
          <span>
            <IconButton 
              color="primary" 
              disabled={!selectedObjectId}
              onClick={handleCloneSelected}
            >
              <CopyIcon />
            </IconButton>
          </span>
        </Tooltip>
        
        <Tooltip title="Supprimer l'objet sélectionné">
          <span>
            <IconButton 
              color="error" 
              disabled={!selectedObjectId}
              onClick={handleDeleteSelected}
            >
              <DeleteIcon />
            </IconButton>
          </span>
        </Tooltip>
        
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        
        <Tooltip title="Annuler">
          <span>
            <IconButton 
              disabled={!canUndo || typeof canUndo !== 'function' || !canUndo()}
              onClick={typeof undo === 'function' ? undo : undefined}
            >
              <UndoOutlined />
            </IconButton>
          </span>
        </Tooltip>
        
        <Tooltip title="Rétablir">
          <span>
            <IconButton 
              disabled={!canRedo || typeof canRedo !== 'function' || !canRedo()}
              onClick={typeof redo === 'function' ? redo : undefined}
            >
              <RedoOutlined />
            </IconButton>
          </span>
        </Tooltip>
        
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        
        <Tooltip title="Sauvegarder">
          <IconButton>
            <SaveOutlined />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Exporter">
          <IconButton>
            <GetApp />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Réinitialiser">
          <IconButton color="error">
            <RestartAlt />
          </IconButton>
        </Tooltip>
        
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        
        <Tooltip title="Aide">
          <IconButton>
            <HelpOutlineOutlined />
          </IconButton>
        </Tooltip>
      </Toolbar>
      
      {/* Onglets */}
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        indicatorColor="primary"
        textColor="primary"
        sx={{ minHeight: 'auto' }}
      >
        {tabs.map((tab, index) => (
          <Tab 
            key={index} 
            label={tab.label} 
            disabled={tab.disabled}
            sx={{ minHeight: 'auto', py: 1 }}
          />
        ))}
      </Tabs>
      
      {/* Contenu des onglets directement intégré */}
      <Box sx={{ py: 2 }}>
        {getTabContent()}
      </Box>
    </Box>
  );
};

export default MainToolbar;