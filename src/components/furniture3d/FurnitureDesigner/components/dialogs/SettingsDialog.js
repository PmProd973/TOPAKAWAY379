// src/components/furniture3d/FurnitureDesigner/components/dialogs/SettingsDialog.js
import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  FormControlLabel, 
  Switch, 
  Slider, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select,
  TextField,
  Button,
  Grid
} from '@mui/material';
import ConfigDialog from './ConfigDialog';
import SettingsIcon from '@mui/icons-material/Settings';
import { useFurnitureStore } from '../../store/index';

const SettingsDialog = ({ open, onClose }) => {
  const { regenerateScene } = useFurnitureStore();
  
  // États locaux pour les paramètres
  const [units, setUnits] = useState('mm');
  const [theme, setTheme] = useState('light');
  const [quality, setQuality] = useState('medium');
  const [autoSave, setAutoSave] = useState(false);
  const [autoSaveInterval, setAutoSaveInterval] = useState(5);
  const [gridSize, setGridSize] = useState(100);
  
  // Gérer les changements
  const handleUnitChange = (event) => {
    setUnits(event.target.value);
  };
  
  const handleThemeChange = (event) => {
    setTheme(event.target.value);
  };
  
  const handleQualityChange = (event) => {
    setQuality(event.target.value);
  };
  
  const handleAutoSaveChange = (event) => {
    setAutoSave(event.target.checked);
  };
  
  const handleAutoSaveIntervalChange = (event, newValue) => {
    setAutoSaveInterval(newValue);
  };
  
  const handleGridSizeChange = (event, newValue) => {
    setGridSize(newValue);
  };
  
  // Actions pour le dialogue
  const handleApply = () => {
    // Ici, vous pourriez appliquer les modifications aux paramètres globaux
    console.log("Paramètres appliqués:", {
      units,
      theme,
      quality,
      autoSave,
      autoSaveInterval,
      gridSize
    });
    
    regenerateScene();
    onClose();
  };
  
  // Réinitialiser les paramètres
  const handleReset = () => {
    setUnits('mm');
    setTheme('light');
    setQuality('medium');
    setAutoSave(false);
    setAutoSaveInterval(5);
    setGridSize(100);
  };
  
  return (
    <ConfigDialog
      open={open}
      onClose={onClose}
      title="Paramètres"
      icon={SettingsIcon}
      actions={{
        apply: handleApply,
        cancel: onClose
      }}
    >
      <Box sx={{ height: '100%', overflow: 'auto', p: 1 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main', fontWeight: 500 }}>
          Unités et Affichage
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
              <InputLabel>Unités</InputLabel>
              <Select
                value={units}
                onChange={handleUnitChange}
                label="Unités"
              >
                <MenuItem value="mm">Millimètres (mm)</MenuItem>
                <MenuItem value="cm">Centimètres (cm)</MenuItem>
                <MenuItem value="in">Pouces (in)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
              <InputLabel>Thème</InputLabel>
              <Select
                value={theme}
                onChange={handleThemeChange}
                label="Thème"
              >
                <MenuItem value="light">Clair</MenuItem>
                <MenuItem value="dark">Sombre</MenuItem>
                <MenuItem value="system">Système</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Typography variant="body2" gutterBottom>
          Taille de la grille
        </Typography>
        <Slider
          value={gridSize}
          onChange={handleGridSizeChange}
          min={50}
          max={500}
          step={10}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value} ${units}`}
          sx={{ mb: 3 }}
        />
        
        <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main', fontWeight: 500, mt: 2 }}>
          Performance et Qualité
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
          <InputLabel>Qualité du rendu</InputLabel>
          <Select
            value={quality}
            onChange={handleQualityChange}
            label="Qualité du rendu"
          >
            <MenuItem value="low">Faible (plus rapide)</MenuItem>
            <MenuItem value="medium">Moyenne</MenuItem>
            <MenuItem value="high">Élevée (plus détaillée)</MenuItem>
          </Select>
        </FormControl>
        
        <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main', fontWeight: 500, mt: 2 }}>
          Sauvegarde
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <FormControlLabel
          control={<Switch checked={autoSave} onChange={handleAutoSaveChange} />}
          label="Sauvegarde automatique"
          sx={{ mb: 2, display: 'block' }}
        />
        
        {autoSave && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              Intervalle de sauvegarde automatique (minutes)
            </Typography>
            <Slider
              value={autoSaveInterval}
              onChange={handleAutoSaveIntervalChange}
              min={1}
              max={30}
              step={1}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value} min`}
            />
          </Box>
        )}
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
          <Button 
            variant="outlined" 
            color="inherit" 
            onClick={handleReset}
            sx={{ mr: 2 }}
          >
            Réinitialiser les paramètres
          </Button>
        </Box>
      </Box>
    </ConfigDialog>
  );
};

export default SettingsDialog;