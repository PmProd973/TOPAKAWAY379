import React, { useState, useEffect } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Tabs, 
  Tab, 
  Typography, 
  IconButton, 
  Divider,
  Paper,
  Button,
  Grid,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';

// Import icons
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SaveIcon from '@mui/icons-material/Save';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import CropFreeIcon from '@mui/icons-material/CropFree';
import Crop169Icon from '@mui/icons-material/Crop169';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PaletteIcon from '@mui/icons-material/Palette';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import HomeIcon from '@mui/icons-material/Home';
import ViewCompactIcon from '@mui/icons-material/ViewCompact';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import GridOnIcon from '@mui/icons-material/GridOn';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AddBoxIcon from '@mui/icons-material/AddBox';
import PhotoSizeSelectActualIcon from '@mui/icons-material/PhotoSizeSelectActual';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import EventNoteIcon from '@mui/icons-material/EventNote';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TuneIcon from '@mui/icons-material/Tune';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Composant pour les boutons du ruban
const RibbonButton = ({ icon, text, onClick, size = 'small', selected, disabled = false }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        mx: 0.5,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'default' : 'pointer',
        bgcolor: selected ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
        borderRadius: 1,
        p: 0.5,
        '&:hover': {
          bgcolor: disabled ? 'transparent' : 'rgba(25, 118, 210, 0.08)'
        }
      }}
      onClick={disabled ? null : onClick}
    >
      <IconButton 
        size={size} 
        color={selected ? "primary" : "default"}
        sx={{ 
          p: size === 'large' ? 1 : 0.5,
          mb: 0.5
        }}
        disabled={disabled}
      >
        {icon}
      </IconButton>
      <Typography variant="caption" align="center" sx={{ fontSize: '0.65rem', lineHeight: 1, maxWidth: size === 'large' ? '80px' : '60px' }}>
        {text}
      </Typography>
    </Box>
  );
};

// Composant pour les groupes du ruban
const RibbonGroup = ({ title, children }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        borderRight: '1px solid #e0e0e0',
        pr: 1,
        mr: 1,
        minWidth: '80px',
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mb: 0.5 }}>
        {children}
      </Box>
      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 'auto' }}>
        {title}
      </Typography>
    </Box>
  );
};

// Composant principal du ruban
const RibbonToolbar = ({ useFurnitureStore, onTabChange }) => {
  // Récupération du store - Toujours appelé, même si null ou undefined
  const furnitureStore = useFurnitureStore();
  
  const [currentTab, setCurrentTab] = useState('MEUBLE');
  const [viewMode, setViewMode] = useState('solid');
  const [showGrid, setShowGrid] = useState(true);
  
  // Fonction pour changer d'onglet
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    if (onTabChange) {
      onTabChange(newValue);
    }
  };

  // Fonction pour mettre à jour les dimensions du meuble
  const updateDimension = (dimension, value) => {
    if (furnitureStore) {
      switch(dimension) {
        case 'width':
          furnitureStore.setWidth(value);
          break;
        case 'height':
          furnitureStore.setHeight(value);
          break;
        case 'depth':
          furnitureStore.setDepth(value);
          break;
        default:
          break;
      }
    } else {
      console.log(`Mise à jour de ${dimension} à ${value}`);
    }
  };

  // Fonctions connectées au store
  const changeView = (view) => {
    if (furnitureStore) {
      furnitureStore.changeView(view);
    } else {
      console.log(`Changement de vue vers: ${view}`);
    }
  };

  const toggleViewMode = (mode) => {
    setViewMode(mode);
    if (furnitureStore) {
      furnitureStore.setDisplayMode(mode);
    } else {
      console.log(`Mode d'affichage défini sur: ${mode}`);
    }
  };

  const toggleGrid = () => {
    setShowGrid(!showGrid);
    if (furnitureStore) {
      furnitureStore.setShowGrid(!showGrid);
    } else {
      console.log(`Grille ${!showGrid ? 'activée' : 'désactivée'}`);
    }
  };

  // Contenu du ruban pour l'onglet FICHIER
  const FileRibbon = () => (
    <Box sx={{ display: 'flex', p: 1 }}>
      <RibbonGroup title="Projet">
        <RibbonButton icon={<AddBoxIcon />} text="Nouveau" onClick={() => console.log('Nouveau')} size="large" />
        <RibbonButton icon={<FolderOpenIcon />} text="Ouvrir" onClick={() => console.log('Ouvrir')} size="large" />
      </RibbonGroup>
      
      <RibbonGroup title="Enregistrer">
        <RibbonButton icon={<SaveIcon />} text="Enregistrer" onClick={() => console.log('Enregistrer')} />
        <RibbonButton icon={<PhotoSizeSelectActualIcon />} text="Exporter Image" onClick={() => console.log('Exporter')} />
      </RibbonGroup>
      
      <RibbonGroup title="Historique">
        <RibbonButton icon={<UndoIcon />} text="Annuler" onClick={() => console.log('Annuler')} />
        <RibbonButton icon={<RedoIcon />} text="Rétablir" onClick={() => console.log('Rétablir')} />
      </RibbonGroup>
    </Box>
  );

  // Contenu du ruban pour l'onglet MEUBLE
  const FurnitureRibbon = () => (
    <Box sx={{ display: 'flex', p: 1 }}>
      <RibbonGroup title="Dimensions">
        <RibbonButton 
          icon={<SquareFootIcon />} 
          text="Largeur" 
          onClick={() => {
            const value = prompt('Entrez la largeur (mm):', furnitureStore ? furnitureStore.width : '1000');
            if (value) updateDimension('width', parseInt(value, 10));
          }}
        />
        <RibbonButton 
          icon={<SquareFootIcon />} 
          text="Hauteur" 
          onClick={() => {
            const value = prompt('Entrez la hauteur (mm):', furnitureStore ? furnitureStore.height : '2000');
            if (value) updateDimension('height', parseInt(value, 10));
          }}
        />
        <RibbonButton 
          icon={<SquareFootIcon />} 
          text="Profondeur" 
          onClick={() => {
            const value = prompt('Entrez la profondeur (mm):', furnitureStore ? furnitureStore.depth : '600');
            if (value) updateDimension('depth', parseInt(value, 10));
          }}
        />
      </RibbonGroup>
      
      <RibbonGroup title="Type">
        <RibbonButton icon={<ViewQuiltIcon />} text="Armoire" onClick={() => console.log('Armoire')} />
        <RibbonButton icon={<TableRowsIcon />} text="Étagère" onClick={() => console.log('Étagère')} />
        <RibbonButton icon={<EventNoteIcon />} text="Bureau" onClick={() => console.log('Bureau')} />
      </RibbonGroup>
      
      <RibbonGroup title="Composants">
        <RibbonButton icon={<ViewCompactIcon />} text="Portes" onClick={() => console.log('Portes')} />
        <RibbonButton icon={<ViewCompactIcon />} text="Tiroirs" onClick={() => console.log('Tiroirs')} />
      </RibbonGroup>
    </Box>
  );

  // Contenu du ruban pour l'onglet PIÈCE
  const RoomRibbon = () => (
    <Box sx={{ display: 'flex', p: 1 }}>
      <RibbonGroup title="Dimensions">
        <RibbonButton icon={<SquareFootIcon />} text="Largeur" onClick={() => console.log('Largeur Pièce')} />
        <RibbonButton icon={<SquareFootIcon />} text="Longueur" onClick={() => console.log('Longueur Pièce')} />
        <RibbonButton icon={<SquareFootIcon />} text="Hauteur" onClick={() => console.log('Hauteur Pièce')} />
      </RibbonGroup>
      
      <RibbonGroup title="Éléments">
        <RibbonButton icon={<WallpaperIcon />} text="Murs" onClick={() => console.log('Murs')} />
        <RibbonButton icon={<WallpaperIcon />} text="Sol" onClick={() => console.log('Sol')} />
      </RibbonGroup>
    </Box>
  );

  // Contenu du ruban pour l'onglet AFFICHAGE
  const DisplayRibbon = () => (
    <Box sx={{ display: 'flex', p: 1 }}>
      <RibbonGroup title="Vues">
        <RibbonButton 
          icon={<CropFreeIcon />} 
          text="Face" 
          onClick={() => changeView('front')} 
        />
        <RibbonButton 
          icon={<CropFreeIcon />} 
          text="Dessus" 
          onClick={() => changeView('top')} 
        />
        <RibbonButton 
          icon={<CropFreeIcon />} 
          text="Côté" 
          onClick={() => changeView('side')} 
        />
        <RibbonButton 
          icon={<HomeIcon />} 
          text="Accueil" 
          onClick={() => changeView('home')} 
        />
      </RibbonGroup>
      
      <RibbonGroup title="Mode">
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => newMode && toggleViewMode(newMode)}
          size="small"
          sx={{ mb: 0.5 }}
        >
          <ToggleButton value="solid" aria-label="Solide">
            <ViewInArIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="realistic" aria-label="Réaliste">
            <VisibilityIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
          {viewMode === 'solid' ? 'Solide' : 'Réaliste'}
        </Typography>
      </RibbonGroup>
      
      <RibbonGroup title="Environnement">
        <RibbonButton 
          icon={<GridOnIcon />} 
          text="Grille" 
          onClick={toggleGrid} 
          selected={showGrid}
        />
        <RibbonButton 
          icon={<LightbulbIcon />} 
          text="Lumières" 
          onClick={() => console.log('Lumières')} 
        />
        <RibbonButton 
          icon={<FormatColorFillIcon />} 
          text="Fond" 
          onClick={() => console.log('Fond')} 
        />
      </RibbonGroup>
      
      <RibbonGroup title="Caméra">
        <RibbonButton 
          icon={<CameraAltIcon />} 
          text="Capture" 
          onClick={() => console.log('Capture')} 
        />
        <RibbonButton 
          icon={<RotateLeftIcon />} 
          text="Réinitialiser" 
          onClick={() => changeView('reset')} 
        />
      </RibbonGroup>
    </Box>
  );

  // Contenu du ruban pour l'onglet AIDE
  const HelpRibbon = () => (
    <Box sx={{ display: 'flex', p: 1 }}>
      <RibbonGroup title="Support">
        <RibbonButton 
          icon={<HelpOutlineIcon />} 
          text="Guide" 
          onClick={() => console.log('Guide')} 
          size="large" 
        />
        <RibbonButton 
          icon={<TuneIcon />} 
          text="Paramètres" 
          onClick={() => console.log('Paramètres')} 
        />
      </RibbonGroup>
    </Box>
  );

  // Fonction pour obtenir le contenu du ruban en fonction de l'onglet sélectionné
  const getRibbonContent = () => {
    switch (currentTab) {
      case 'FICHIER':
        return <FileRibbon />;
      case 'MEUBLE':
        return <FurnitureRibbon />;
      case 'PIÈCE':
        return <RoomRibbon />;
      case 'AFFICHAGE':
        return <DisplayRibbon />;
      case 'AIDE':
        return <HelpRibbon />;
      default:
        return <FurnitureRibbon />;
    }
  };

  return (
    <Box sx={{ 
      width: '100%', 
      position: 'relative',
      zIndex: 1000, 
      boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.1)',
    }}>
      {/* Barre d'outils supérieure avec actions rapides */}
      <Toolbar 
        variant="dense" 
        sx={{ 
          minHeight: '36px', 
          bgcolor: '#f5f5f5', 
          borderBottom: '1px solid #e0e0e0',
          px: 1
        }}
      >
        <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          Conception de meuble 3D
        </Typography>
        
        <IconButton size="small" sx={{ ml: 1 }}>
          <UndoIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" sx={{ ml: 1 }}>
          <RedoIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" sx={{ ml: 1 }}>
          <SaveIcon fontSize="small" />
        </IconButton>
      </Toolbar>
      
      {/* Onglets du menu principal */}
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        sx={{ 
          minHeight: '36px',
          bgcolor: '#f5f5f5',
          '& .MuiTab-root': {
            minHeight: '36px',
            py: 0.5,
            px: 2,
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }
        }}
      >
        <Tab label="FICHIER" value="FICHIER" />
        <Tab label="MEUBLE" value="MEUBLE" />
        <Tab label="PIÈCE" value="PIÈCE" />
        <Tab label="AFFICHAGE" value="AFFICHAGE" />
        <Tab label="AIDE" value="AIDE" />
      </Tabs>
      
      {/* Contenu du ruban */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: '#f8f8f8'
        }}
      >
        {getRibbonContent()}
      </Paper>
    </Box>
  );
};

export default RibbonToolbar;