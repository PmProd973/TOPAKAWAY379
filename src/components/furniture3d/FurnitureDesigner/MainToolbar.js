// src/components/furniture3d/FurnitureDesigner/MainToolbar.js
import React, { useState } from 'react';
import { 
  AppBar, 
  Tabs, 
  Tab, 
  Box,
  Toolbar,
  Typography,
  IconButton
} from '@mui/material';
import {
  SaveOutlined,
  HelpOutlineOutlined,
  UndoOutlined,
  RedoOutlined
} from '@mui/icons-material';
import { useFurnitureStore } from './store';

// Import des composants pour les onglets
import RoomTab from './components/tabs/RoomTab';
import FurnitureTab from './components/tabs/FurnitureTab';
import DisplayOptionsTab from './components/tabs/DisplayOptionsTab';

const MainToolbar = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const { canUndo, canRedo, undo, redo } = useFurnitureStore();
  
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
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
      position: 'relative',
      backgroundColor: 'background.paper',
      borderBottom: 1,
      borderColor: 'divider'
    }}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar variant="dense">
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Conception de meuble 3D
          </Typography>
          
          <IconButton 
            title="Annuler"
            disabled={!canUndo()}
            onClick={undo}
          >
            <UndoOutlined />
          </IconButton>
          
          <IconButton 
            title="Rétablir"
            disabled={!canRedo()}
            onClick={redo}
          >
            <RedoOutlined />
          </IconButton>
          
          <IconButton title="Sauvegarder">
            <SaveOutlined />
          </IconButton>
          
          <IconButton title="Aide">
            <HelpOutlineOutlined />
          </IconButton>
        </Toolbar>
        
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
      </AppBar>
      
      {/* Contenu des onglets directement intégré */}
      <Box sx={{ py: 2 }}>
        {getTabContent()}
      </Box>
    </Box>
  );
};

export default MainToolbar;