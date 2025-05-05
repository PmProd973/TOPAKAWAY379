// src/components/furniture3d/FurnitureDesigner/components/tabs/DisplayOptionsTab/index.js
import React from 'react';
import {
  Box,
  Grid,
  Typography,
  FormControlLabel,
  Checkbox,
  Divider,
  Paper,
  Slider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button
} from '@mui/material';
import { useFurnitureStore } from '../../../store';

const DisplayOptionsTab = () => {
  const {
    displayOptions,
    setDisplayOption,
    regenerateScene
  } = useFurnitureStore();

  // Liste des couleurs de fond disponibles
  const backgroundColors = [
    { value: '#F0F0F0', label: 'Gris clair' },
    { value: '#FFFFFF', label: 'Blanc' },
    { value: '#E0E0E0', label: 'Gris' },
    { value: '#D0D0D0', label: 'Gris foncé' },
    { value: '#000000', label: 'Noir' },
    { value: '#E6F7FF', label: 'Bleu ciel' },
  ];

  // Liste des modes d'affichage
  const viewModes = [
    { value: 'solid', label: 'Solide' },
    { value: 'wireframe', label: 'Fil de fer' },
    { value: 'realistic', label: 'Réaliste' }
  ];

  // Gestion du changement d'opacité
  const handleOpacityChange = (event, newValue) => {
    setDisplayOption('furnitureOpacity', newValue / 100);
  };

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Options d'affichage</Typography>

      {/* Mode d'affichage */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Mode d'affichage</Typography>
        <FormControl fullWidth>
          <InputLabel>Mode</InputLabel>
          <Select
            value={displayOptions.viewMode || 'solid'}
            onChange={(e) => setDisplayOption('viewMode', e.target.value)}
            label="Mode"
          >
            {viewModes.map((mode) => (
              <MenuItem key={mode.value} value={mode.value}>
                {mode.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Opacité du meuble - Nouvelle option */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Opacité du meuble</Typography>
        <Box sx={{ px: 1 }}>
          <Slider
            value={(displayOptions.furnitureOpacity || 1) * 100}
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
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          Ajustez l'opacité pour voir l'intérieur du meuble
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Options d'éléments à afficher */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Éléments à afficher</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={displayOptions.showGrid || false}
                  onChange={(e) => setDisplayOption('showGrid', e.target.checked)}
                />
              }
              label="Afficher la grille"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={displayOptions.showAxes || false}
                  onChange={(e) => setDisplayOption('showAxes', e.target.checked)}
                />
              }
              label="Afficher les axes"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={displayOptions.showDimensions || false}
                  onChange={(e) => setDisplayOption('showDimensions', e.target.checked)}
                />
              }
              label="Afficher les dimensions"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={displayOptions.showShadows || false}
                  onChange={(e) => setDisplayOption('showShadows', e.target.checked)}
                />
              }
              label="Afficher les ombres"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={displayOptions.showWireframe || false}
                  onChange={(e) => setDisplayOption('showWireframe', e.target.checked)}
                />
              }
              label="Afficher le fil de fer"
            />
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Couleur d'arrière-plan */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Couleur d'arrière-plan</Typography>
        <FormControl fullWidth>
          <InputLabel>Couleur de fond</InputLabel>
          <Select
            value={displayOptions.backgroundColor || '#F0F0F0'}
            onChange={(e) => setDisplayOption('backgroundColor', e.target.value)}
            label="Couleur de fond"
          >
            {backgroundColors.map((color) => (
              <MenuItem 
                key={color.value} 
                value={color.value}
                sx={{ 
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Box 
                  sx={{ 
                    width: 20, 
                    height: 20, 
                    bgcolor: color.value,
                    mr: 1,
                    border: '1px solid #ccc'
                  }} 
                />
                {color.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => regenerateScene()}
        >
          Appliquer les changements
        </Button>
      </Box>
    </Paper>
  );
};

export default DisplayOptionsTab;