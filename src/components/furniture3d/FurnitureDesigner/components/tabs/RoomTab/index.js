// src/components/furniture3d/FurnitureDesigner/components/tabs/RoomTab/index.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  FormControlLabel, 
  Checkbox,
  Divider,
  InputAdornment,
  Paper,
  IconButton,
  Button
} from '@mui/material';
import { ColorPicker } from '../../../common/ColorPicker';
import { useFurnitureStore } from '../../../store/index';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Restore as RestoreIcon,
  Save as SaveIcon
} from '@mui/icons-material';

// Flags pour contrôler l'affichage des boutons de test/debug
const SHOW_APPLY_DIMENSIONS_BUTTON = false; // Bouton "Appliquer les dimensions"
const SHOW_REGENERATE_BUTTON = false;      // Bouton "Régénérer la scène"
const SHOW_RESET_BUTTON = false;           // Bouton "Réinitialiser tous les paramètres"

const RoomTab = () => {
  // État local complètement indépendant
  const [localValues, setLocalValues] = useState({
    width: 0,
    height: 0,
    depth: 0,
    'walls.left.thickness': 0,
    'walls.right.thickness': 0,
    'walls.back.thickness': 0
  });
  
  // État initial pour permettre de réinitialiser
  const initialValues = useRef(null);
  
  // Récupération manuelle du store (sans réactivité automatique)
  const furnitureStore = useFurnitureStore();
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
  } = furnitureStore;
  
  // Capture manuelle de l'état initial une seule fois
  useEffect(() => {
    // Charger les valeurs initiales une seule fois au montage
    if (!initialValues.current) {
      const values = {
        width: room.width,
        height: room.height,
        depth: room.depth,
        'walls.left.thickness': room.walls.left.thickness,
        'walls.right.thickness': room.walls.right.thickness,
        'walls.back.thickness': room.walls.back.thickness
      };
      
      setLocalValues(values);
      initialValues.current = { ...values };
      
      console.log("État initial chargé:", values);
    }
  }, []); // Dépendance vide = exécution uniquement au montage
  
  // Mettre à jour uniquement l'état local
  const handleInputChange = (field, e) => {
    const value = e.target.value;
    console.log(`Modification locale de ${field} à ${value}`);
    
    setLocalValues(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Mettre à jour le store SANS déclencher de régénération
  const handleInputBlur = (field) => {
    const value = parseInt(localValues[field], 10) || 0;
    console.log(`Mise à jour du store pour ${field} à ${value} (sans régénération)`);
    
    // Mise à jour du store SANS régénération (false)
    updateRoomDimensions(field, value, false);
  };
  
  // Appliquer toutes les modifications avec une seule régénération
  const handleApplyChanges = () => {
    console.log("Application de toutes les modifications avec régénération");
    
    // Mettre à jour le store pour chaque champ modifié (sans régénération)
    Object.entries(localValues).forEach(([field, value]) => {
      const parsedValue = parseInt(value, 10) || 0;
      updateRoomDimensions(field, parsedValue, false);
    });
    
    // Régénérer la scène UNE SEULE FOIS après toutes les mises à jour
    regenerateScene();
    
    // Mettre à jour l'état initial pour qu'il corresponde aux nouvelles valeurs
    initialValues.current = { ...localValues };
  };
  
  // Réinitialiser les valeurs
  const handleResetValues = () => {
    if (initialValues.current) {
      console.log("Réinitialisation des valeurs");
      
      // Réinitialiser l'état local
      setLocalValues({ ...initialValues.current });
      
      // Réinitialiser le store (sans régénération individuelle)
      Object.entries(initialValues.current).forEach(([field, value]) => {
        updateRoomDimensions(field, value, false);
      });
      
      // Régénérer une seule fois
      regenerateScene();
    }
  };
  
  // Fonctions pour les toggles (inchangées)
  const handleToggleWallVisibility = (wallName) => {
    toggleWallVisibility(wallName, true);
  };
  
  const handleToggleFloorVisibility = () => {
    toggleFloorVisibility(true);
  };
  
  const handleToggleCeilingVisibility = () => {
    toggleCeilingVisibility(true);
  };
  
  const handleToggleDimensionsVisibility = () => {
    toggleDimensionsVisibility(true);
  };
  
  // Mise à jour des couleurs (inchangées)
  const handleWallColorChange = (wallName, color) => {
    updateWallColor(wallName, color, true);
  };
  
  const handleFloorColorChange = (color) => {
    updateFloorColor(color, true);
  };
  
  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Configuration de la pièce</Typography>
        <Box>
          <IconButton 
            color="primary" 
            onClick={handleApplyChanges}
            title="Appliquer les modifications"
            sx={{ mr: 1 }}
          >
            <SaveIcon />
          </IconButton>
          <IconButton 
            color="secondary" 
            onClick={handleResetValues}
            title="Réinitialiser"
          >
            <RestoreIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Dimensions de la pièce - Layout vertical */}
      <Box className="form-section">
        <Typography className="section-title">Dimensions</Typography>
        
        <Box className="dimension-field-container">
          <TextField
            fullWidth
            label="Largeur"
            type="number"
            value={localValues.width}
            onChange={(e) => handleInputChange('width', e)}
            onBlur={() => handleInputBlur('width')}
            InputProps={{ 
              endAdornment: <InputAdornment position="end">mm</InputAdornment> 
            }}
          />
        </Box>
        
        <Box className="dimension-field-container">
          <TextField
            fullWidth
            label="Hauteur"
            type="number"
            value={localValues.height}
            onChange={(e) => handleInputChange('height', e)}
            onBlur={() => handleInputBlur('height')}
            InputProps={{ 
              endAdornment: <InputAdornment position="end">mm</InputAdornment> 
            }}
          />
        </Box>
        
        <Box className="dimension-field-container">
          <TextField
            fullWidth
            label="Profondeur"
            type="number"
            value={localValues.depth}
            onChange={(e) => handleInputChange('depth', e)}
            onBlur={() => handleInputBlur('depth')}
            InputProps={{ 
              endAdornment: <InputAdornment position="end">mm</InputAdornment> 
            }}
          />
        </Box>
        
        {/* Bouton d'application des dimensions */}
        {SHOW_APPLY_DIMENSIONS_BUTTON && (
          <Button 
            variant="outlined"
            color="primary"
            fullWidth
            onClick={handleApplyChanges}
            sx={{ mt: 2 }}
          >
            Appliquer les dimensions
          </Button>
        )}
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Options d'affichage */}
      <Box className="form-section">
        <Typography className="section-title">Options d'affichage</Typography>
        
        <FormControlLabel
          control={
            <Checkbox 
              checked={!room.ceiling.visible} 
              onChange={handleToggleCeilingVisibility}
            />
          }
          label="Masquer le plafond"
        />
        
        <FormControlLabel
          control={
            <Checkbox 
              checked={!room.floor.visible} 
              onChange={handleToggleFloorVisibility}
            />
          }
          label="Masquer le sol"
        />
        
        <FormControlLabel
          control={
            <Checkbox 
              checked={!room.walls.left.visible} 
              onChange={() => handleToggleWallVisibility('left')}
            />
          }
          label="Masquer le mur de gauche"
        />
        
        <FormControlLabel
          control={
            <Checkbox 
              checked={!room.walls.back.visible} 
              onChange={() => handleToggleWallVisibility('back')}
            />
          }
          label="Masquer le mur du fond"
        />
        
        <FormControlLabel
          control={
            <Checkbox 
              checked={!room.walls.right.visible} 
              onChange={() => handleToggleWallVisibility('right')}
            />
          }
          label="Masquer le mur de droite"
        />
        
        <FormControlLabel
          control={
            <Checkbox 
              checked={room.showDimensions} 
              onChange={handleToggleDimensionsVisibility}
            />
          }
          label="Afficher les dimensions"
        />
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Configuration des murs */}
      <Box className="form-section">
        <Typography className="section-title">Configuration des murs</Typography>
        
        {/* Mur de gauche */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>Mur gauche</Typography>
            <IconButton 
              onClick={() => handleToggleWallVisibility('left')}
              color={room.walls.left.visible ? "primary" : "default"}
            >
              {room.walls.left.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Box>
          
          <Box className="dimension-field-container">
            <TextField 
              label="Épaisseur" 
              type="number" 
              value={localValues['walls.left.thickness']}
              onChange={(e) => handleInputChange('walls.left.thickness', e)}
              onBlur={() => handleInputBlur('walls.left.thickness')}
              InputProps={{ 
                endAdornment: <InputAdornment position="end">mm</InputAdornment> 
              }}
              fullWidth
              disabled={!room.walls.left.visible}
            />
          </Box>
          
          <ColorPicker 
            value={room.walls.left.color}
            onChange={(color) => handleWallColorChange('left', color)}
            label="Couleur"
            disabled={!room.walls.left.visible}
          />
        </Paper>
        
        {/* Mur du fond */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>Mur du fond</Typography>
            <IconButton 
              onClick={() => handleToggleWallVisibility('back')}
              color={room.walls.back.visible ? "primary" : "default"}
            >
              {room.walls.back.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Box>
          
          <Box className="dimension-field-container">
            <TextField 
              label="Épaisseur" 
              type="number" 
              value={localValues['walls.back.thickness']}
              onChange={(e) => handleInputChange('walls.back.thickness', e)}
              onBlur={() => handleInputBlur('walls.back.thickness')}
              InputProps={{ 
                endAdornment: <InputAdornment position="end">mm</InputAdornment> 
              }}
              fullWidth
              disabled={!room.walls.back.visible}
            />
          </Box>
          
          <ColorPicker 
            value={room.walls.back.color}
            onChange={(color) => handleWallColorChange('back', color)}
            label="Couleur"
            disabled={!room.walls.back.visible}
          />
        </Paper>
        
        {/* Mur de droite */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>Mur droit</Typography>
            <IconButton 
              onClick={() => handleToggleWallVisibility('right')}
              color={room.walls.right.visible ? "primary" : "default"}
            >
              {room.walls.right.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Box>
          
          <Box className="dimension-field-container">
            <TextField 
              label="Épaisseur" 
              type="number" 
              value={localValues['walls.right.thickness']}
              onChange={(e) => handleInputChange('walls.right.thickness', e)}
              onBlur={() => handleInputBlur('walls.right.thickness')}
              InputProps={{ 
                endAdornment: <InputAdornment position="end">mm</InputAdornment> 
              }}
              fullWidth
              disabled={!room.walls.right.visible}
            />
          </Box>
          
          <ColorPicker 
            value={room.walls.right.color}
            onChange={(color) => handleWallColorChange('right', color)}
            label="Couleur"
            disabled={!room.walls.right.visible}
          />
        </Paper>
      </Box>
      
      {/* Configuration du sol */}
      <Box className="form-section">
        <Typography className="section-title">Configuration du sol</Typography>
        
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>Sol</Typography>
            <IconButton 
              onClick={handleToggleFloorVisibility}
              color={room.floor.visible ? "primary" : "default"}
            >
              {room.floor.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Box>
          
          <ColorPicker 
            value={room.floor.color}
            onChange={handleFloorColorChange}
            label="Couleur du sol"
            disabled={!room.floor.visible}
          />
        </Paper>
      </Box>
      
      {/* Boutons d'actions */}
      <Box sx={{ mt: 3 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleApplyChanges}
          fullWidth
        >
          Appliquer toutes les modifications
        </Button>
        
        {SHOW_REGENERATE_BUTTON && (
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={() => regenerateScene()}
            fullWidth
            sx={{ mt: 2 }}
          >
            Régénérer la scène
          </Button>
        )}
        
        {/* Bouton de réinitialisation */}
        {SHOW_RESET_BUTTON && (
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleResetValues}
            fullWidth
            sx={{ mt: 2 }}
          >
            Réinitialiser tous les paramètres
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default RoomTab;