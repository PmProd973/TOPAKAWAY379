// src/components/furniture3d/FurnitureDesigner/components/tabs/RoomTab/index.js
import React from 'react';
import { 
  Box, 
  Grid, 
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
    toggleDimensionsVisibility
  } = useFurnitureStore();
  
  const handleDimensionChange = (dimension, value) => {
    updateRoomDimensions(dimension, parseInt(value, 10) || 0);
  };
  
  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Configuration de la pièce</Typography>
      
      {/* Dimensions de la pièce */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Dimensions</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
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
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={!room.ceiling.visible} 
                onChange={() => toggleCeilingVisibility()}
              />
            }
            label="Masquer le plafond"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={!room.floor.visible} 
                onChange={() => toggleFloorVisibility()}
              />
            }
            label="Masquer le sol"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={!room.walls.left.visible} 
                onChange={() => toggleWallVisibility('left')}
              />
            }
            label="Masquer le mur de gauche"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={!room.walls.back.visible} 
                onChange={() => toggleWallVisibility('back')}
              />
            }
            label="Masquer le mur du fond"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={!room.walls.right.visible} 
                onChange={() => toggleWallVisibility('right')}
              />
            }
            label="Masquer le mur de droite"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={room.showDimensions} 
                onChange={() => toggleDimensionsVisibility()}
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
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2">Mur gauche</Typography>
          </Grid>
          
          <Grid item xs={2} sm={1}>
            <IconButton 
              onClick={() => toggleWallVisibility('left')}
              color={room.walls.left.visible ? "primary" : "default"}
            >
              {room.walls.left.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Grid>
          
          <Grid item xs={10} sm={4}>
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
          
          <Grid item xs={12} sm={4}>
            <ColorPicker 
              value={room.walls.left.color}
              onChange={(color) => updateWallColor('left', color)}
              label="Couleur"
              disabled={!room.walls.left.visible}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Mur du fond */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2">Mur du fond</Typography>
          </Grid>
          
          <Grid item xs={2} sm={1}>
            <IconButton 
              onClick={() => toggleWallVisibility('back')}
              color={room.walls.back.visible ? "primary" : "default"}
            >
              {room.walls.back.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Grid>
          
          <Grid item xs={10} sm={4}>
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
          
          <Grid item xs={12} sm={4}>
            <ColorPicker 
              value={room.walls.back.color}
              onChange={(color) => updateWallColor('back', color)}
              label="Couleur"
              disabled={!room.walls.back.visible}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Mur de droite */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2">Mur droit</Typography>
          </Grid>
          
          <Grid item xs={2} sm={1}>
            <IconButton 
              onClick={() => toggleWallVisibility('right')}
              color={room.walls.right.visible ? "primary" : "default"}
            >
              {room.walls.right.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Grid>
          
          <Grid item xs={10} sm={4}>
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
          
          <Grid item xs={12} sm={4}>
            <ColorPicker 
              value={room.walls.right.color}
              onChange={(color) => updateWallColor('right', color)}
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
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <Typography variant="subtitle2">Sol</Typography>
          </Grid>
          
          <Grid item xs={2} sm={1}>
            <IconButton 
              onClick={() => toggleFloorVisibility()}
              color={room.floor.visible ? "primary" : "default"}
            >
              {room.floor.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Grid>
          
          <Grid item xs={12} sm={8}>
            <ColorPicker 
              value={room.floor.color}
              onChange={(color) => updateFloorColor(color)}
              label="Couleur du sol"
              disabled={!room.floor.visible}
            />
          </Grid>
        </Grid>
      </Paper>
    </Paper>
  );
};

export default RoomTab;