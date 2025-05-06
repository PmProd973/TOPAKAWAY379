// src/components/furniture3d/FurnitureDesigner/components/tabs/DisplayOptionsTab/index.js
import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Button,
  Grid
} from '@mui/material';
import { useFurnitureStore } from '../../../store';

const DisplayOptionsTab = () => {
  const {
    displayOptions,
    setDisplayOption,
    setCameraPosition,
    furniture,
    regenerateScene
  } = useFurnitureStore();

  // Changement du mode d'affichage (Solide, Filaire, Réaliste)
  const handleViewModeChange = (event) => {
    setDisplayOption('viewMode', event.target.value);
    regenerateScene();
  };

  // Changement de l'opacité du meuble
  const handleOpacityChange = (event, newValue) => {
    setDisplayOption('furnitureOpacity', newValue / 100);
    regenerateScene();
  };

  // Changement des options d'affichage (Grid, Axes, etc.)
  const handleSwitchChange = (option) => (event) => {
    setDisplayOption(option, event.target.checked);
    regenerateScene();
  };

  // Calcul de la distance optimale de la caméra
  const calculateCameraDistance = (furniture) => {
    if (!furniture || !furniture.dimensions) return 3;
    
    const maxDim = Math.max(
      furniture.dimensions.width / 100,
      furniture.dimensions.height / 100,
      furniture.dimensions.depth / 100
    );
    
    return Math.max(maxDim * 2, 3); // minimum 3 unités
  };

  // Définir une vue de caméra
  const setCameraView = (position) => {
    setCameraPosition(position);
    regenerateScene();
  };

  // Centrer la vue sur le meuble
  const handleCenterView = () => {
    const distance = calculateCameraDistance(furniture);
    setCameraView([distance, distance, distance]);
  };

  return (
    <div className="tab-content">
      <Typography variant="h6" gutterBottom>
        Options d'affichage
      </Typography>
      
      {/* Section Vues prédéfinies */}
      <div className="section">
        <div className="section-header">
          <Typography variant="h6">Vues prédéfinies</Typography>
        </div>
        <div className="section-content">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined"
                fullWidth
                className="view-button"
                onClick={() => {
                  const maxDim = Math.max(
                    furniture.dimensions.width / 100,
                    furniture.dimensions.height / 100,
                    furniture.dimensions.depth / 100
                  );
                  setCameraView([0, maxDim * 2, 0]);
                }}
              >
                Vue de dessus
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined"
                fullWidth
                className="view-button"
                onClick={() => {
                  const maxDim = Math.max(
                    furniture.dimensions.width / 100,
                    furniture.dimensions.height / 100,
                    furniture.dimensions.depth / 100
                  );
                  setCameraView([0, furniture.dimensions.height / 200, maxDim * 2]);
                }}
              >
                Vue de face
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined"
                fullWidth
                className="view-button"
                onClick={() => {
                  const maxDim = Math.max(
                    furniture.dimensions.width / 100,
                    furniture.dimensions.height / 100,
                    furniture.dimensions.depth / 100
                  );
                  setCameraView([maxDim * 2, furniture.dimensions.height / 200, 0]);
                }}
              >
                Vue de côté
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined"
                fullWidth
                className="view-button"
                onClick={() => {
                  const maxDim = Math.max(
                    furniture.dimensions.width / 100,
                    furniture.dimensions.height / 100,
                    furniture.dimensions.depth / 100
                  );
                  const distance = maxDim * 2.5;
                  setCameraView([distance, distance, distance]);
                }}
              >
                Vue isométrique
              </Button>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              fullWidth
              onClick={handleCenterView}
            >
              Centrer sur le meuble
            </Button>
          </Box>
        </div>
      </div>

      {/* Section Mode d'affichage */}
      <div className="section">
        <div className="section-header">
          <Typography variant="h6">Mode d'affichage</Typography>
        </div>
        <div className="section-content">
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Style de rendu</InputLabel>
            <Select
              value={displayOptions.viewMode || 'solid'}
              label="Style de rendu"
              onChange={handleViewModeChange}
            >
              <MenuItem value="solid">Solide</MenuItem>
              <MenuItem value="wireframe">Filaire</MenuItem>
              <MenuItem value="realistic">Réaliste</MenuItem>
            </Select>
          </FormControl>

          <Typography gutterBottom>
            Opacité du meuble: {Math.round((displayOptions.furnitureOpacity || 1) * 100)}%
          </Typography>
          <Slider
            value={(displayOptions.furnitureOpacity || 1) * 100}
            onChange={handleOpacityChange}
            min={30}
            max={100}
            valueLabelDisplay="auto"
          />
        </div>
      </div>

      {/* Section Environnement */}
      <div className="section">
        <div className="section-header">
          <Typography variant="h6">Environnement</Typography>
        </div>
        <div className="section-content">
          <FormControlLabel
            control={
              <Switch
                checked={displayOptions.showGrid || true}
                onChange={handleSwitchChange('showGrid')}
              />
            }
            label="Afficher la grille"
          />
          <FormControlLabel
            control={
              <Switch
                checked={displayOptions.showAxes || true}
                onChange={handleSwitchChange('showAxes')}
              />
            }
            label="Afficher les axes"
          />
          <FormControlLabel
            control={
              <Switch
                checked={displayOptions.showDimensions || true}
                onChange={handleSwitchChange('showDimensions')}
              />
            }
            label="Afficher les dimensions"
          />
          <FormControlLabel
            control={
              <Switch
                checked={displayOptions.showShadows || false}
                onChange={handleSwitchChange('showShadows')}
              />
            }
            label="Ombres"
          />
        </div>
      </div>

      {/* Bouton d'actualisation */}
      <Box sx={{ mt: 2 }}>
        <Button 
          variant="contained" 
          color="primary"
          fullWidth
          onClick={regenerateScene}
        >
          Actualiser l'affichage
        </Button>
      </Box>
    </div>
  );
};

export default DisplayOptionsTab;