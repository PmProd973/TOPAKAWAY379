// src/components/furniture3d/FurnitureDesigner/components/tabs/RoomTab/index.js
import React from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  FormControlLabel, 
  Checkbox,
  Divider,
  InputAdornment,
  Paper,
  Slider,
  Button,
  IconButton 
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { ColorPicker } from '../../../common/ColorPicker';
import { useFurnitureStore } from '../../../store';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

const RoomTab = () => {
  const { 
    room, 
    updateRoomDimensions, 
    toggleWallVisibility, 
    updateWallColor,
    toggleFloorVisibility,
    updateFloorColor,
    toggleCeilingVisibility,
    toggleDimensionsVisibility,
    regenerateScene
  } = useFurnitureStore();
  
  const handleDimensionChange = (dimension, value) => {
    console.log(`Changement de dimension '${dimension}' à ${value}`);
    const numValue = parseInt(value, 10) || 0;
    
    // Vérifier si la valeur a réellement changé
    if (dimension.includes('.')) {
      // Cas des dimensions imbriquées (walls.left.thickness)
      const props = dimension.split('.');
      let current = room;
      for (let i = 0; i < props.length - 1; i++) {
        current = current[props[i]];
      }
      
      if (current[props[props.length - 1]] === numValue) {
        console.log("Valeur inchangée, pas de mise à jour");
        return;
      }
    } else if (room[dimension] === numValue) {
      console.log("Valeur inchangée, pas de mise à jour");
      return;
    }
    
    updateRoomDimensions(dimension, numValue, true);
  };
  
  // Gestion spécifique pour les toggles avec plus de logging
  const handleToggleWallVisibility = (wallName) => {
    console.log(`Toggle de la visibilité du mur ${wallName}: ${room.walls[wallName].visible ? 'visible' : 'invisible'} -> ${!room.walls[wallName].visible ? 'visible' : 'invisible'}`);
    toggleWallVisibility(wallName, true);
  };
  
  const handleToggleFloorVisibility = () => {
    console.log(`Toggle de la visibilité du sol: ${room.floor.visible ? 'visible' : 'invisible'} -> ${!room.floor.visible ? 'visible' : 'invisible'}`);
    toggleFloorVisibility(true);
  };
  
  const handleToggleCeilingVisibility = () => {
    console.log(`Toggle de la visibilité du plafond: ${room.ceiling.visible ? 'visible' : 'invisible'} -> ${!room.ceiling.visible ? 'visible' : 'invisible'}`);
    toggleCeilingVisibility(true);
  };
  
  const handleToggleDimensionsVisibility = () => {
    console.log(`Toggle de la visibilité des dimensions: ${room.showDimensions ? 'visible' : 'invisible'} -> ${!room.showDimensions ? 'visible' : 'invisible'}`);
    toggleDimensionsVisibility(true);
  };
  
  // Mise à jour des couleurs avec plus de logging
  const handleWallColorChange = (wallName, color) => {
    console.log(`Changement de couleur du mur ${wallName} à ${color}`);
    updateWallColor(wallName, color, true);
  };
  
  const handleFloorColorChange = (color) => {
    console.log(`Changement de couleur du sol à ${color}`);
    updateFloorColor(color, true);
  };
  
  // Forcer la régénération de la scène
  const handleForceRegenerate = () => {
    console.log("Forçage de la régénération de la scène");
    regenerateScene();
  };
  
  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Configuration de la pièce</Typography>
      
      {/* Dimensions de la pièce */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Dimensions</Typography>
        <Grid container spacing={2} sx={{ width: '100%' }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Largeur"
              type="number"
              value={room.width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              InputProps={{ 
                endAdornment: <InputAdornment position="end">mm</InputAdornment> 
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Hauteur"
              type="number"
              value={room.height}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              InputProps={{ 
                endAdornment: <InputAdornment position="end">mm</InputAdornment> 
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Profondeur"
              type="number"
              value={room.depth}
              onChange={(e) => handleDimensionChange('depth', e.target.value)}
              InputProps={{ 
                endAdornment: <InputAdornment position="end">mm</InputAdornment> 
              }}
            />
          </Grid>
        </Grid>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Options d'affichage */}
      <Typography variant="subtitle1" gutterBottom>Options d'affichage</Typography>
      
      <Grid container spacing={2} sx={{ mb: 3, width: '100%' }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={!room.ceiling.visible} 
                onChange={handleToggleCeilingVisibility}
              />
            }
            label="Masquer le plafond"
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={!room.floor.visible} 
                onChange={handleToggleFloorVisibility}
              />
            }
            label="Masquer le sol"
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={!room.walls.left.visible} 
                onChange={() => handleToggleWallVisibility('left')}
              />
            }
            label="Masquer le mur de gauche"
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={!room.walls.back.visible} 
                onChange={() => handleToggleWallVisibility('back')}
              />
            }
            label="Masquer le mur du fond"
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={!room.walls.right.visible} 
                onChange={() => handleToggleWallVisibility('right')}
              />
            }
            label="Masquer le mur de droite"
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={room.showDimensions} 
                onChange={handleToggleDimensionsVisibility}
              />
            }
            label="Afficher les dimensions"
          />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Configuration des murs */}
      <Typography variant="subtitle1" gutterBottom>Configuration des murs</Typography>
      
      {/* Mur de gauche */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
        <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Typography variant="subtitle2">Mur gauche</Typography>
          </Grid>
          
          <Grid size={{ xs: 2, sm: 1 }}>
            <IconButton 
              onClick={() => handleToggleWallVisibility('left')}
              color={room.walls.left.visible ? "primary" : "default"}
            >
              {room.walls.left.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Grid>
          
          <Grid size={{ xs: 10, sm: 4 }}>
            <TextField 
              label="Épaisseur" 
              type="number" 
              value={room.walls.left.thickness}
              onChange={(e) => handleDimensionChange('walls.left.thickness', e.target.value)}
              InputProps={{ 
                endAdornment: <InputAdornment position="end">mm</InputAdornment> 
              }}
              fullWidth
              disabled={!room.walls.left.visible}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 4 }}>
            <ColorPicker 
              value={room.walls.left.color}
              onChange={(color) => handleWallColorChange('left', color)}
              label="Couleur"
              disabled={!room.walls.left.visible}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Mur du fond */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
        <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Typography variant="subtitle2">Mur du fond</Typography>
          </Grid>
          
          <Grid size={{ xs: 2, sm: 1 }}>
            <IconButton 
              onClick={() => handleToggleWallVisibility('back')}
              color={room.walls.back.visible ? "primary" : "default"}
            >
              {room.walls.back.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Grid>
          
          <Grid size={{ xs: 10, sm: 4 }}>
            <TextField 
              label="Épaisseur" 
              type="number" 
              value={room.walls.back.thickness}
              onChange={(e) => handleDimensionChange('walls.back.thickness', e.target.value)}
              InputProps={{ 
                endAdornment: <InputAdornment position="end">mm</InputAdornment> 
              }}
              fullWidth
              disabled={!room.walls.back.visible}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 4 }}>
            <ColorPicker 
              value={room.walls.back.color}
              onChange={(color) => handleWallColorChange('back', color)}
              label="Couleur"
              disabled={!room.walls.back.visible}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Mur de droite */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
        <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Typography variant="subtitle2">Mur droit</Typography>
          </Grid>
          
          <Grid size={{ xs: 2, sm: 1 }}>
            <IconButton 
              onClick={() => handleToggleWallVisibility('right')}
              color={room.walls.right.visible ? "primary" : "default"}
            >
              {room.walls.right.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Grid>
          
          <Grid size={{ xs: 10, sm: 4 }}>
            <TextField 
              label="Épaisseur" 
              type="number" 
              value={room.walls.right.thickness}
              onChange={(e) => handleDimensionChange('walls.right.thickness', e.target.value)}
              InputProps={{ 
                endAdornment: <InputAdornment position="end">mm</InputAdornment> 
              }}
              fullWidth
              disabled={!room.walls.right.visible}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 4 }}>
            <ColorPicker 
              value={room.walls.right.color}
              onChange={(color) => handleWallColorChange('right', color)}
              label="Couleur"
              disabled={!room.walls.right.visible}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Configuration du sol */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" gutterBottom>Configuration du sol</Typography>
      
      <Paper variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
        <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Typography variant="subtitle2">Sol</Typography>
          </Grid>
          
          <Grid size={{ xs: 2, sm: 1 }}>
            <IconButton 
              onClick={handleToggleFloorVisibility}
              color={room.floor.visible ? "primary" : "default"}
            >
              {room.floor.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 8 }}>
            <ColorPicker 
              value={room.floor.color}
              onChange={handleFloorColorChange}
              label="Couleur du sol"
              disabled={!room.floor.visible}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Bouton de forçage de la régénération */}
      <Box sx={{ mt: 3 }}>
        <Button 
          variant="contained" 
          color="primary" 
          fullWidth
          onClick={handleForceRegenerate}
        >
          Régénérer la scène
        </Button>
      </Box>
    </Paper>
  );
};

export default RoomTab;