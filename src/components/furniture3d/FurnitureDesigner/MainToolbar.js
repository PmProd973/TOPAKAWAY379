// src/components/furniture3d/FurnitureDesigner/MainToolbar.js
import React, { useState } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Paper,
  Button,
  Grid,
  Tooltip
} from '@mui/material';
import {
  SaveOutlined,
  HelpOutlineOutlined,
  UndoOutlined,
  RedoOutlined,
  ViewInAr,
  Settings,
  ThreeDRotation,
  CameraAlt,
  Grid3x3,
  CropSquare,
  Height,
  Straighten,
  FlipToBack,
  Visibility,
  VisibilityOff,
  Refresh,
  CheckBoxOutlineBlank
} from '@mui/icons-material';
import { useFurnitureStore } from './store';

// Import des composants pour les onglets (si nécessaires pour le contenu)
import RoomTab from './components/tabs/RoomTab';
import FurnitureTab from './components/tabs/FurnitureTab';
import DisplayOptionsTab from './components/tabs/DisplayOptionsTab';

const MainToolbar = () => {
  // État pour l'onglet sélectionné
  const [currentTab, setCurrentTab] = useState(2); // MEUBLE par défaut
  const { canUndo, canRedo, undo, redo, setDisplayOption, regenerateScene, furniture, setCameraPosition } = useFurnitureStore();

  // Liste des onglets principaux
  const tabs = [
    { label: "FICHIER", value: 0 },
    { label: "PIÈCE", value: 1 },
    { label: "MEUBLE", value: 2 },
    { label: "SÉPARATIONS", value: 3 },
    { label: "INTÉRIEUR", value: 4 },
    { label: "FAÇADE", value: 5 },
    { label: "FORME", value: 6 },
    { label: "MATÉRIAUX", value: 7 },
    { label: "AFFICHAGE", value: 8 },
    { label: "AIDE", value: 9 }
  ];

  // Changement d'onglet
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Calcul des dimensions optimales pour la caméra
  const calculateMaxDim = () => {
    if (!furniture || !furniture.dimensions) return 3;
    
    return Math.max(
      furniture.dimensions.width / 100,
      furniture.dimensions.height / 100,
      furniture.dimensions.depth / 100
    );
  };

  // Fonction d'action pour les boutons du ruban
  const handleRibbonAction = (action) => {
    switch(action) {
      case 'vue-dessus':
        setCameraPosition([0, calculateMaxDim() * 2, 0]);
        break;
      case 'vue-face':
        setCameraPosition([0, furniture.dimensions.height / 200, calculateMaxDim() * 2]);
        break;
      case 'vue-cote':
        setCameraPosition([calculateMaxDim() * 2, furniture.dimensions.height / 200, 0]);
        break;
      case 'vue-iso':
        const distance = calculateMaxDim() * 2.5;
        setCameraPosition([distance, distance, distance]);
        break;
      case 'centrer':
        const centerDistance = calculateMaxDim() * 2;
        setCameraPosition([centerDistance, centerDistance, centerDistance]);
        break;
      case 'mode-solide':
        setDisplayOption('viewMode', 'solid');
        break;
      case 'mode-filaire':
        setDisplayOption('viewMode', 'wireframe');
        break;
      case 'mode-realiste':
        setDisplayOption('viewMode', 'realistic');
        break;
      case 'grid-toggle':
        setDisplayOption('showGrid', !furniture.displayOptions?.showGrid);
        break;
      case 'axes-toggle':
        setDisplayOption('showAxes', !furniture.displayOptions?.showAxes);
        break;
      case 'dimensions-toggle':
        setDisplayOption('showDimensions', !furniture.displayOptions?.showDimensions);
        break;
      case 'refresh':
        regenerateScene();
        break;
      default:
        console.log(`Action: ${action}`);
    }
    regenerateScene();
  };

  // Contenu du ruban pour chaque onglet
  const getRibbonContent = () => {
    switch (currentTab) {
      case 0: // FICHIER
        return (
          <Grid container spacing={1} p={1}>
            <Grid item>
              <RibbonGroup title="Projet">
                <RibbonButton icon={<SaveOutlined />} label="Nouveau" onClick={() => handleRibbonAction('nouveau')} />
                <RibbonButton icon={<SaveOutlined />} label="Ouvrir" onClick={() => handleRibbonAction('ouvrir')} />
                <RibbonButton icon={<SaveOutlined />} label="Enregistrer" onClick={() => handleRibbonAction('enregistrer')} />
              </RibbonGroup>
            </Grid>
            <Grid item>
              <RibbonGroup title="Exporter">
                <RibbonButton icon={<SaveOutlined />} label="PDF" onClick={() => handleRibbonAction('export-pdf')} />
                <RibbonButton icon={<SaveOutlined />} label="GLTF" onClick={() => handleRibbonAction('export-gltf')} />
              </RibbonGroup>
            </Grid>
          </Grid>
        );
        
      case 1: // PIÈCE
        return (
          <Grid container spacing={1} p={1}>
            <Grid item>
              <RibbonGroup title="Dimensions">
                <RibbonButton icon={<Straighten />} label="Largeur" onClick={() => handleRibbonAction('piece-largeur')} />
                <RibbonButton icon={<Height />} label="Hauteur" onClick={() => handleRibbonAction('piece-hauteur')} />
                <RibbonButton icon={<Straighten />} label="Profondeur" onClick={() => handleRibbonAction('piece-profondeur')} />
              </RibbonGroup>
            </Grid>
            <Grid item>
              <RibbonGroup title="Murs">
                <RibbonButton icon={<CheckBoxOutlineBlank />} label="Gauche" onClick={() => handleRibbonAction('mur-gauche')} />
                <RibbonButton icon={<CheckBoxOutlineBlank />} label="Droit" onClick={() => handleRibbonAction('mur-droit')} />
                <RibbonButton icon={<CheckBoxOutlineBlank />} label="Fond" onClick={() => handleRibbonAction('mur-fond')} />
              </RibbonGroup>
            </Grid>
            <Grid item>
              <RibbonGroup title="Sol/Plafond">
                <RibbonButton icon={<Grid3x3 />} label="Sol" onClick={() => handleRibbonAction('sol')} />
                <RibbonButton icon={<Grid3x3 />} label="Plafond" onClick={() => handleRibbonAction('plafond')} />
              </RibbonGroup>
            </Grid>
          </Grid>
        );
        
      case 2: // MEUBLE
        return (
          <Grid container spacing={1} p={1}>
            <Grid item>
              <RibbonGroup title="Dimensions">
                <RibbonButton icon={<Straighten />} label="Largeur" onClick={() => handleRibbonAction('meuble-largeur')} />
                <RibbonButton icon={<Height />} label="Hauteur" onClick={() => handleRibbonAction('meuble-hauteur')} />
                <RibbonButton icon={<Straighten />} label="Profondeur" onClick={() => handleRibbonAction('meuble-profondeur')} />
              </RibbonGroup>
            </Grid>
            <Grid item>
              <RibbonGroup title="Type">
                <RibbonButton icon={<ViewInAr />} label="Armoire" onClick={() => handleRibbonAction('type-armoire')} />
                <RibbonButton icon={<ViewInAr />} label="Étagère" onClick={() => handleRibbonAction('type-etagere')} />
                <RibbonButton icon={<ViewInAr />} label="Bureau" onClick={() => handleRibbonAction('type-bureau')} />
              </RibbonGroup>
            </Grid>
            <Grid item>
              <RibbonGroup title="Construction">
                <RibbonButton icon={<Settings />} label="Options" onClick={() => handleRibbonAction('construction-options')} />
                <RibbonButton icon={<FlipToBack />} label="Panneau" onClick={() => handleRibbonAction('panneau-arriere')} />
              </RibbonGroup>
            </Grid>
            <Grid item>
              <RibbonGroup title="Position">
                <RibbonButton icon={<ThreeDRotation />} label="Rotation" onClick={() => handleRibbonAction('rotation')} />
                <RibbonButton icon={<Straighten />} label="Décalage" onClick={() => handleRibbonAction('decalage')} />
              </RibbonGroup>
            </Grid>
          </Grid>
        );
        
      case 8: // AFFICHAGE
        return (
          <Grid container spacing={1} p={1}>
            <Grid item>
              <RibbonGroup title="Vues prédéfinies">
                <RibbonButton icon={<CameraAlt />} label="Dessus" onClick={() => handleRibbonAction('vue-dessus')} />
                <RibbonButton icon={<CameraAlt />} label="Face" onClick={() => handleRibbonAction('vue-face')} />
                <RibbonButton icon={<CameraAlt />} label="Côté" onClick={() => handleRibbonAction('vue-cote')} />
                <RibbonButton icon={<CameraAlt />} label="Isométrique" onClick={() => handleRibbonAction('vue-iso')} />
                <RibbonButton icon={<CameraAlt />} label="Centrer" onClick={() => handleRibbonAction('centrer')} big />
              </RibbonGroup>
            </Grid>
            <Grid item>
              <RibbonGroup title="Mode d'affichage">
                <RibbonButton icon={<ViewInAr />} label="Solide" onClick={() => handleRibbonAction('mode-solide')} />
                <RibbonButton icon={<ThreeDRotation />} label="Filaire" onClick={() => handleRibbonAction('mode-filaire')} />
                <RibbonButton icon={<ViewInAr />} label="Réaliste" onClick={() => handleRibbonAction('mode-realiste')} />
              </RibbonGroup>
            </Grid>
            <Grid item>
              <RibbonGroup title="Environnement">
                <RibbonButton icon={<Grid3x3 />} label="Grille" onClick={() => handleRibbonAction('grid-toggle')} toggle />
                <RibbonButton icon={<Straighten />} label="Axes" onClick={() => handleRibbonAction('axes-toggle')} toggle />
                <RibbonButton icon={<Height />} label="Dimensions" onClick={() => handleRibbonAction('dimensions-toggle')} toggle />
              </RibbonGroup>
            </Grid>
            <Grid item>
              <RibbonGroup title="Actions">
                <RibbonButton icon={<Refresh />} label="Actualiser" onClick={() => handleRibbonAction('refresh')} big />
              </RibbonGroup>
            </Grid>
          </Grid>
        );
        
      default:
        return (
          <Box p={1}>
            <Typography>Contenu du ruban pour l'onglet {tabs.find(t => t.value === currentTab)?.label} à implémenter</Typography>
          </Box>
        );
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
      <Toolbar variant="dense" sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
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
      
      {/* Menu principal */}
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        indicatorColor="primary"
        textColor="primary"
        sx={{ 
          minHeight: 36,
          backgroundColor: '#f0f0f0',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
        }}
      >
        {tabs.map((tab) => (
          <Tab 
            key={tab.value} 
            label={tab.label} 
            value={tab.value}
            sx={{ 
              minHeight: 36, 
              py: 0.5,
              px: 2,
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}
          />
        ))}
      </Tabs>
      
      {/* Ruban contextuellement adapté à l'onglet */}
      <Paper 
        elevation={0} 
        sx={{ 
          backgroundColor: '#f8f8f8',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        {getRibbonContent()}
      </Paper>
    </Box>
  );
};

// Composant pour un groupe de boutons dans le ruban
const RibbonGroup = ({ title, children }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        px: 1,
        height: '100%',
        borderRight: '1px solid rgba(0, 0, 0, 0.08)',
        minWidth: 'max-content'
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
        {children}
      </Box>
      <Typography 
        variant="caption" 
        sx={{ 
          color: 'rgba(0, 0, 0, 0.6)',
          fontSize: '0.65rem',
          fontWeight: 'medium',
          whiteSpace: 'nowrap'
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

// Composant pour un bouton du ruban
const RibbonButton = ({ icon, label, onClick, big = false, toggle = false }) => {
  const [active, setActive] = useState(false);
  
  const handleClick = () => {
    if (toggle) {
      setActive(!active);
    }
    onClick();
  };
  
  return (
    <Tooltip title={label} placement="bottom">
      <Button
        variant={active && toggle ? "contained" : "outlined"}
        color={active && toggle ? "primary" : "default"}
        size="small"
        onClick={handleClick}
        sx={{
          minWidth: big ? 60 : 40,
          maxWidth: big ? 80 : 60,
          height: big ? 60 : 40,
          p: 0.5,
          borderRadius: 1,
          flexDirection: 'column',
          textTransform: 'none',
          lineHeight: 1,
          '& .MuiButton-startIcon': {
            margin: 0
          },
          '& .MuiSvgIcon-root': {
            fontSize: big ? '1.5rem' : '1.2rem'
          }
        }}
        startIcon={icon}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            mt: 0.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%'
          }}
        >
          {label}
        </Typography>
      </Button>
    </Tooltip>
  );
};

export default MainToolbar;