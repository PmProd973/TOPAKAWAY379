// src/components/furniture3d/FurnitureDesigner/FurnitureDesignerPanel.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  Divider, 
  Button, 
  IconButton,
  Tooltip,
  Typography,
  Snackbar,
  Alert,
  Drawer,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  PanTool,
  ThreeDRotation, 
  Add as AddIcon,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  ViewInAr as ViewInArIcon,
  Delete as DeleteIcon,
  Save,
  GetApp,
  List,
  RestartAlt,
  Straighten as DimensionIcon,
  ContentCopy as CopyIcon,
  Link as ConnectionIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import Scene3D from './Scene3D';
//import PiecesList from './components/PiecesList';
//import FurnitureLibrary from './components/FurnitureLibrary';
//import MaterialsList from './components/MaterialsList';
//import ParametricDesigner from './components/ParametricWardrobeDesigner'; // Nouveau composant
import FurnitureBuilder from './components/FurnitureBuilder';
import { useFurnitureStore } from './store';
import DisplayOptionsTab from './components/tabs/DisplayOptionsTab';

// Largeur du panneau latéral
const SIDEBAR_WIDTH = 320;

const FurnitureDesignerPanel = ({ projectId, pieces = [], materials = [] }) => {
  const [activeTab, setActiveTab] = useState(0); // 0 = Conception (paramétrique) par défaut
  const [notification, setNotification] = useState({ show: false, message: '', severity: 'info' });
  const [showDimensions, setShowDimensions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const { 
    importPieces, // Correction: utilisé importPieces au lieu de setPieces
    importMaterials, // Correction: utilisé importMaterials au lieu de setMaterials
    editMode, 
    setEditMode,
    selectedObjectId,
    removeObject,
    resetScene,
    sceneObjects,
    canUndo,
    canRedo,
    undo,
    redo,
    cloneObject,
    toggleDimensions,
    calculateTotalDimensions
  } = useFurnitureStore();
  
  // Chargement initial des données
  useEffect(() => {
    // Correction: utilisé les fonctions correctes et vérifié qu'elles existent
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
    // Implémentation de la sauvegarde dans Firestore
    showNotification('Conception sauvegardée avec succès', 'success');
  };
  
  // Fonction pour exporter en GLTF
  const handleExportGLTF = () => {
    // Implémentation de l'export GLTF
    showNotification('Export GLTF en cours de développement', 'info');
  };
  
  // Fonction pour générer la liste des pièces
  const handleGeneratePartsList = () => {
    // Implémentation de la génération de liste de pièces
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
      
      {/* Barre d'outils supérieure */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense" sx={{ minHeight: 48 }}>
          <IconButton 
            edge="start" 
            color="inherit" 
            aria-label="menu"
            onClick={toggleSidebar}
            sx={{ mr: 1 }}
          >
            {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          
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
          
          <Tooltip title="Afficher les dimensions">
            <IconButton 
              color={showDimensions ? 'primary' : 'default'}
              onClick={handleToggleDimensions}
            >
              <DimensionIcon />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          
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
          
          <Tooltip title="Annuler">
            <span>
              <IconButton 
                disabled={!canUndo || typeof canUndo !== 'function' || !canUndo()}
                onClick={typeof undo === 'function' ? undo : undefined}
              >
                <Undo />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Rétablir">
            <span>
              <IconButton 
                disabled={!canRedo || typeof canRedo !== 'function' || !canRedo()}
                onClick={typeof redo === 'function' ? redo : undefined}
              >
                <Redo />
              </IconButton>
            </span>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          
          <Tooltip title="Dupliquer l'objet sélectionné">
            <span>
              <IconButton 
                color="primary" 
                disabled={!selectedObjectId || typeof cloneObject !== 'function'}
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
                disabled={!selectedObjectId || typeof removeObject !== 'function'}
                onClick={handleDeleteSelected}
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          
          <Tooltip title="Sauvegarder la conception">
            <IconButton 
              color="primary"
              onClick={handleSaveDesign}
            >
              <Save />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Exporter en GLTF">
            <IconButton 
              onClick={handleExportGLTF}
            >
              <GetApp />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Liste des pièces">
            <IconButton 
              onClick={handleGeneratePartsList}
            >
              <List />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Réinitialiser la scène">
            <IconButton 
              color="error"
              onClick={handleResetScene}
            >
              <RestartAlt />
            </IconButton>
          </Tooltip>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Button 
            variant="contained" 
            startIcon={<ViewInArIcon />}
            onClick={() => setActiveTab(1)} // Passer à l'onglet Meubles
          >
            Ajouter un meuble
          </Button>
        </Toolbar>
      </AppBar>
      
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
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Conception" /> {/* Nouvel onglet pour conception paramétrique */}
              <Tab label="Pièces" />
              <Tab label="Meubles" />
              <Tab label="Matériaux" />
              <Tab label="Affichage" /> {/* Onglet pour les options d'affichage */}
              <Tab label="Vue" />
            </Tabs>
            
            <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
              {activeTab === 0 && (
                <FurnitureBuilder />
              )}
              
                           
              {activeTab === 4 && (
                <DisplayOptionsTab />
              )}
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