// src/components/furniture3d/FurnitureDesigner/components/tabs/DisplayOptionsTab/index.js
import React from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  FormControlLabel, 
  Checkbox, 
  Select, 
  MenuItem,
  InputLabel,
  Slider,
  Divider,
  Paper,
  TextField,
  InputAdornment,
  Button,
  Grid
} from '@mui/material';
import { useFurnitureStore } from '../../../store/index';
import { ColorPicker } from '../../../common/ColorPicker';

// Mappage des options de mode d'affichage
const viewModes = [
  { value: 'solid', label: 'Solide' },
  { value: 'wireframe', label: 'Filaire' },
  { value: 'realistic', label: 'Réaliste' },
  { value: 'conceptual', label: 'Conceptuel' }
];

const DisplayOptionsTab = () => {
  // Récupérer le store et les fonctions
  const { 
    displayOptions, 
    setDisplayOption, 
    regenerateScene 
  } = useFurnitureStore();
  
  // Gestion du changement d'options - wrapper pour faciliter l'utilisation
  const handleOptionChange = (option, value) => {
    // Appeler la fonction du store
    setDisplayOption(option, value);
  };
  
  // Gestion du changement de couleur de fond
  const handleBackgroundColorChange = (color) => {
    handleOptionChange('backgroundColor', color);
  };
  
  // Gestion du changement d'opacité du meuble
  const handleOpacityChange = (event, newValue) => {
    handleOptionChange('furnitureOpacity', newValue);
  };
  
  // Gestion du changement de la taille de la grille
  const handleGridSizeChange = (event) => {
    const size = parseInt(event.target.value, 10) || 100;
    handleOptionChange('gridSize', size);
  };
  
  // Forcer la régénération de la scène
  const handleForceRegenerate = () => {
    regenerateScene();
  };
  
  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      {/* Mode d'affichage */}
      <Box className="form-section">
        <Typography className="section-title">Mode d'affichage</Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Mode</InputLabel>
          <Select
            value={displayOptions.viewMode || 'solid'}
            onChange={(e) => handleOptionChange('viewMode', e.target.value)}
            label="Mode"
          >
            {viewModes.map((mode) => (
              <MenuItem key={mode.value} value={mode.value}>
                {mode.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Options spécifiques pour le mode conceptuel */}
        {displayOptions.viewMode === 'conceptual' && (
          <Box sx={{ mb: 2, pl: 2, borderLeft: '4px solid #e0e0e0' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>Options du mode conceptuel</Typography>
            
            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid item xs={7}>
                <TextField
                  fullWidth
                  label="Couleur des arêtes"
                  type="color"
                  value={displayOptions.edgeColor || "#000000"}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleOptionChange('edgeColor', e.target.value);
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Épaisseur</InputLabel>
                  <Select
                    value={displayOptions.edgeThickness || 1}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleOptionChange('edgeThickness', e.target.value);
                    }}
                    label="Épaisseur"
                  >
                    <MenuItem value={1}>Fine</MenuItem>
                    <MenuItem value={2}>Moyenne</MenuItem>
                    <MenuItem value={3}>Épaisse</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={displayOptions.showAllEdges || false}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleOptionChange('showAllEdges', e.target.checked);
                  }}
                  size="small"
                />
              }
              label="Afficher toutes les arêtes"
            />
          </Box>
        )}
        
        <FormControlLabel
          control={
            <Checkbox
              checked={displayOptions.showWireframe || false}
              onChange={() => handleOptionChange('showWireframe', !displayOptions.showWireframe)}
            />
          }
          label="Afficher le filaire (même en mode solide)"
        />
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Options de grille et d'axes */}
      <Box className="form-section">
        <Typography className="section-title">Grille et axes</Typography>
        
        <FormControlLabel
          control={
            <Checkbox
              checked={displayOptions.showGrid !== false}
              onChange={() => handleOptionChange('showGrid', !displayOptions.showGrid)}
            />
          }
          label="Afficher la grille"
        />
        
        <FormControlLabel
          control={
            <Checkbox
              checked={displayOptions.showAxes !== false}
              onChange={() => handleOptionChange('showAxes', !displayOptions.showAxes)}
            />
          }
          label="Afficher les axes"
        />
        
        <Box className="dimension-field-container" sx={{ mt: 2 }}>
          <TextField
            label="Taille de la grille"
            type="number"
            value={displayOptions.gridSize || 100}
            onChange={handleGridSizeChange}
            fullWidth
            disabled={displayOptions.showGrid === false}
            InputProps={{
              endAdornment: <InputAdornment position="end">mm</InputAdornment>,
              inputProps: { min: 50, max: 1000 }
            }}
          />
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Options de dimensions */}
      <Box className="form-section">
        <Typography className="section-title">Dimensions et cotations</Typography>
        
        <FormControlLabel
          control={
            <Checkbox
              checked={displayOptions.showDimensions !== false}
              onChange={() => handleOptionChange('showDimensions', !displayOptions.showDimensions)}
            />
          }
          label="Afficher les dimensions des murs"
        />
        
        <FormControlLabel
          control={
            <Checkbox
              checked={displayOptions.showFurnitureDimensions === true}
              onChange={() => handleOptionChange('showFurnitureDimensions', !displayOptions.showFurnitureDimensions)}
            />
          }
          label="Afficher les dimensions du meuble"
        />
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Options d'ombrage et d'éclairage */}
      <Box className="form-section">
        <Typography className="section-title">Ombrage et éclairage</Typography>
        
        <FormControlLabel
          control={
            <Checkbox
              checked={displayOptions.showShadows === true}
              onChange={() => handleOptionChange('showShadows', !displayOptions.showShadows)}
            />
          }
          label="Afficher les ombres"
        />
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Options d'opacité et de couleur */}
      <Box className="form-section">
        <Typography className="section-title">Opacité et couleur</Typography>
        
        <Typography variant="body2" gutterBottom>
          Opacité du meuble: {displayOptions.furnitureOpacity?.toFixed(2) || 1.00}
        </Typography>
        <Slider
          value={displayOptions.furnitureOpacity !== undefined ? displayOptions.furnitureOpacity : 1}
          onChange={handleOpacityChange}
          min={0.1}
          max={1}
          step={0.05}
          valueLabelDisplay="auto"
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Couleur de fond:
          </Typography>
          <ColorPicker
            value={displayOptions.backgroundColor || '#F0F0F0'}
            onChange={handleBackgroundColorChange}
          />
        </Box>
      </Box>
      
      {/* Bouton de régénération */}
      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleForceRegenerate}
          fullWidth
          size="medium"
        >
          Rafraîchir la scène 3D
        </Button>
      </Box>
    </Paper>
  );
};

export default DisplayOptionsTab;