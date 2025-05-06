// src/components/furniture3d/FurnitureDesigner/components/ViewOptions.js
import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  FormControlLabel, 
  Switch,
  Slider,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  CenterFocusStrong as CenterIcon,
  Visibility as VisibilityIcon,
  GridOn as GridIcon,
  SquareFoot as MeasureIcon,
  Opacity as OpacityIcon
} from '@mui/icons-material';
import { useFurnitureStore } from '../store';

const ViewOptions = () => {
  const { 
    setCameraPosition,
    gridSize,
    setGridSize,
    snapToGrid,
    toggleSnapToGrid,
    snapToObjects,
    toggleSnapToObjects,
    snapThreshold,
    setSnapThreshold,
    showGrid,
    toggleGrid,
    showAxes,
    toggleAxes,
    viewMode,
    setViewMode,
    showDimensions,
    toggleDimensions,
    calculateTotalDimensions,
    displayOptions,
    setDisplayOption
  } = useFurnitureStore();
  
  const setCameraView = (position) => {
    setCameraPosition(position);
  };
  
  const handleViewChange = (mode) => {
    setViewMode(mode);
  };
  
  const handleCenterView = () => {
    const totalDimensions = calculateTotalDimensions();
    const cameraDistance = Math.max(totalDimensions.width, totalDimensions.height, totalDimensions.depth) / 10;
    const isometricPosition = [cameraDistance, cameraDistance, cameraDistance];
    setCameraPosition(isometricPosition);
  };
  
  // Gestion du changement d'opacité
  const handleOpacityChange = (event, newValue) => {
    setDisplayOption('furnitureOpacity', newValue / 100);
  };
  
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
        Options de vue
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Contrôlez la caméra et l'affichage de la scène 3D.
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Vues prédéfinies
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => setCameraView([0, 1000, 0])}
          >
            Vue de dessus
          </Button>
          
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => setCameraView([0, 0, 1000])}
          >
            Vue de face
          </Button>
          
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => setCameraView([1000, 0, 0])}
          >
            Vue de côté
          </Button>
          
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => setCameraView([1000, 1000, 1000])}
          >
            Vue isométrique
          </Button>
        </Box>
        
        <Button 
          variant="contained" 
          fullWidth 
          color="primary"
          startIcon={<CenterIcon />}
          onClick={handleCenterView}
          sx={{ mb: 1 }}
        >
          Centrer sur le meuble
        </Button>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>
        Options d'alignement
      </Typography>
      
      <FormControlLabel
        control={
          <Switch 
            checked={snapToGrid} 
            onChange={toggleSnapToGrid}
            size="small"
          />
        }
        label={<Typography variant="body2">Aligner sur la grille</Typography>}
      />
      
      {snapToGrid && (
        <Box sx={{ px: 2, mt: 1, mb: 2 }}>
          <Typography id="grid-size-slider" gutterBottom variant="caption">
            Taille de la grille: {gridSize} unités
          </Typography>
          <Slider
            value={gridSize}
            onChange={(e, newValue) => setGridSize(newValue)}
            aria-labelledby="grid-size-slider"
            step={1}
            marks
            min={1}
            max={20}
            size="small"
          />
        </Box>
      )}
      
      <FormControlLabel
        control={
          <Switch 
            checked={snapToObjects} 
            onChange={toggleSnapToObjects}
            size="small"
          />
        }
        label={<Typography variant="body2">Aligner sur les objets</Typography>}
      />
      
      {snapToObjects && (
        <Box sx={{ px: 2, mt: 1, mb: 2 }}>
          <Typography id="snap-threshold-slider" gutterBottom variant="caption">
            Distance d'alignement: {snapThreshold} unités
          </Typography>
          <Slider
            value={snapThreshold}
            onChange={(e, newValue) => setSnapThreshold(newValue)}
            aria-labelledby="snap-threshold-slider"
            step={1}
            marks
            min={5}
            max={30}
            size="small"
          />
        </Box>
      )}
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>
        Options d'affichage
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Tooltip title="Afficher/masquer la grille">
          <IconButton 
            color={showGrid ? "primary" : "default"}
            onClick={toggleGrid}
            size="small"
          >
            <GridIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Afficher/masquer les axes">
          <IconButton 
            color={showAxes ? "primary" : "default"}
            onClick={toggleAxes}
            size="small"
          >
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Afficher/masquer les dimensions">
          <IconButton 
            color={showDimensions ? "primary" : "default"}
            onClick={toggleDimensions}
            size="small"
          >
            <MeasureIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Nouvelle section pour l'opacité du meuble */}
      <Box sx={{ mt: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center">
          <OpacityIcon fontSize="small" sx={{ mr: 1 }} />
          Opacité du meuble
        </Typography>
        <Box sx={{ px: 1 }}>
          <Slider
            value={(displayOptions?.furnitureOpacity || 1) * 100}
            onChange={handleOpacityChange}
            aria-labelledby="opacity-slider"
            valueLabelDisplay="auto"
            step={5}
            marks={[
              { value: 20, label: '20%' },
              { value: 50, label: '50%' },
              { value: 100, label: '100%' }
            ]}
            min={20}
            max={100}
            size="small"
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          Ajustez l'opacité pour voir l'intérieur du meuble
        </Typography>
      </Box>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Mode d'affichage
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
          <Paper 
            sx={{ 
              p: 1, 
              textAlign: 'center', 
              cursor: 'pointer',
              bgcolor: viewMode === 'solid' ? '#e3f2fd' : 'inherit',
              border: viewMode === 'solid' ? '1px solid #1976d2' : '1px solid #e0e0e0'
            }}
            onClick={() => handleViewChange('solid')}
          >
            <Typography variant="body2">Solide</Typography>
          </Paper>
          
          <Paper 
            sx={{ 
              p: 1, 
              textAlign: 'center', 
              cursor: 'pointer',
              bgcolor: viewMode === 'wireframe' ? '#e3f2fd' : 'inherit',
              border: viewMode === 'wireframe' ? '1px solid #1976d2' : '1px solid #e0e0e0'
            }}
            onClick={() => handleViewChange('wireframe')}
          >
            <Typography variant="body2">Filaire</Typography>
          </Paper>
          
          <Paper 
            sx={{ 
              p: 1, 
              textAlign: 'center', 
              cursor: 'pointer',
              bgcolor: viewMode === 'realistic' ? '#e3f2fd' : 'inherit',
              border: viewMode === 'realistic' ? '1px solid #1976d2' : '1px solid #e0e0e0'
            }}
            onClick={() => handleViewChange('realistic')}
          >
            <Typography variant="body2">Réaliste</Typography>
          </Paper>
        </Box>
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Astuce: En mode sélection, cliquez sur un objet pour le sélectionner, 
          puis utilisez les outils de transformation pour le déplacer ou le faire pivoter. 
          Cliquez dans le vide pour désélectionner.
        </Typography>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Navigation
        </Typography>
        <Typography variant="caption" color="text.secondary">
          • Rotation: clic gauche + glisser
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          • Panoramique: clic droit + glisser
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          • Zoom: molette de souris
        </Typography>
      </Box>
    </Box>
  );
};

export default ViewOptions;