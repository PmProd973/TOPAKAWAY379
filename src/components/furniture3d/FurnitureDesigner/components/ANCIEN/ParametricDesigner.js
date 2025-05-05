// src/components/furniture3d/FurnitureDesigner/components/ParametricDesigner.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, 
  Typography, 
  TextField, 
  InputAdornment, 
  Button, 
  Paper, 
  Grid, 
  FormControlLabel, 
  Checkbox,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Slider,
  Tooltip as MuiTooltip
} from '@mui/material';
import { 
  ViewInAr as ViewInArIcon, 
  RestartAlt as ResetIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useFurnitureStore } from '../store';

const ParametricDesigner = () => {
  const { resetScene, addParametricFurniture } = useFurnitureStore();
  
  const [furnitureType, setFurnitureType] = useState('shelf');
  const [dimensions, setDimensions] = useState({
    width: 800,
    height: 1800,
    depth: 400
  });
  
  const [options, setOptions] = useState({
    shelfCount: 3,
    hasBackPanel: true,
    hasPlinths: true,
    plinthHeight: 80,
    thickness: 18,
    backThickness: 8
  });
  
  // Référence pour le debounce
  const debounceTimeoutRef = useRef(null);
  
  // Fonction pour générer le meuble avec debounce
  const generateFurniture = (type = furnitureType, dims = dimensions, opts = options, immediate = false) => {
    // Annuler le timeout précédent si présent
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Si demande immédiate ou si aucune fonction addParametricFurniture n'est disponible
    if (immediate || typeof addParametricFurniture !== 'function') {
      if (typeof addParametricFurniture === 'function') {
        resetScene();
        addParametricFurniture(type, [0, 0, 0], dims, opts);
      } else {
        console.warn('La fonction addParametricFurniture n\'est pas encore implémentée dans le store');
      }
      return;
    }
    
    // Sinon, attendre un peu avant de générer (pour éviter les mises à jour trop fréquentes)
    debounceTimeoutRef.current = setTimeout(() => {
      resetScene();
      addParametricFurniture(type, [0, 0, 0], dims, opts);
      debounceTimeoutRef.current = null;
    }, 300); // 300ms de délai
  };
  
  // Générer un meuble au chargement initial
  useEffect(() => {
    // Générer un meuble initial après le montage du composant
    generateFurniture(furnitureType, dimensions, options, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Nettoyer le timeout lors du démontage
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);
  
  const handleDimensionChange = (dimension, value) => {
    const newValue = parseInt(value, 10) || 0;
    setDimensions(prev => {
      const newDimensions = { ...prev, [dimension]: newValue };
      generateFurniture(furnitureType, newDimensions, options);
      return newDimensions;
    });
  };
  
  const handleOptionChange = (option, value) => {
    setOptions(prev => {
      const newOptions = { ...prev, [option]: value };
      generateFurniture(furnitureType, dimensions, newOptions);
      return newOptions;
    });
  };
  
  const handleTypeChange = (event) => {
    const newType = event.target.value;
    setFurnitureType(newType);
    generateFurniture(newType, dimensions, options);
  };
  
  const handleReset = () => {
    const defaultDimensions = {
      width: 800,
      height: 1800,
      depth: 400
    };
    
    const defaultOptions = {
      shelfCount: 3,
      hasBackPanel: true,
      hasPlinths: true,
      plinthHeight: 80,
      thickness: 18,
      backThickness: 8
    };
    
    setDimensions(defaultDimensions);
    setOptions(defaultOptions);
    
    // Régénérer immédiatement avec les valeurs par défaut
    generateFurniture(furnitureType, defaultDimensions, defaultOptions, true);
  };
  
  const handleRefresh = () => {
    // Régénérer le meuble immédiatement avec les valeurs actuelles
    generateFurniture(furnitureType, dimensions, options, true);
  };
  
  // Appliquer un préréglage
  const applyPreset = (presetType, presetDimensions, presetOptions = {}) => {
    setFurnitureType(presetType);
    setDimensions(presetDimensions);
    setOptions(prev => ({...prev, ...presetOptions}));
    
    // Générer immédiatement avec les nouvelles valeurs
    generateFurniture(presetType, presetDimensions, {...options, ...presetOptions}, true);
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Conception paramétrique
        </Typography>
        <MuiTooltip title="Réinitialiser les paramètres">
          <Button 
            size="small"
            startIcon={<ResetIcon />}
            onClick={handleReset}
          >
            Réinitialiser
          </Button>
        </MuiTooltip>
      </Box>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Type de meuble
        </Typography>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="furniture-type-label">Type</InputLabel>
          <Select
            labelId="furniture-type-label"
            value={furnitureType}
            label="Type"
            onChange={handleTypeChange}
          >
            <MenuItem value="shelf">Bibliothèque / Étagère</MenuItem>
            <MenuItem value="cabinet">Armoire basse</MenuItem>
            <MenuItem value="wardrobe">Armoire haute</MenuItem>
            <MenuItem value="desk">Bureau</MenuItem>
          </Select>
        </FormControl>
        
        <Typography variant="subtitle2" gutterBottom>
          Dimensions
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Largeur"
              type="number"
              value={dimensions.width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">mm</InputAdornment>,
              }}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Hauteur"
              type="number"
              value={dimensions.height}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">mm</InputAdornment>,
              }}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Profondeur"
              type="number"
              value={dimensions.depth}
              onChange={(e) => handleDimensionChange('depth', e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">mm</InputAdornment>,
              }}
              size="small"
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Options spécifiques selon le type de meuble */}
      {furnitureType === 'shelf' && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Options d'étagère
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography id="shelf-count-slider" gutterBottom variant="body2">
              Nombre d'étagères: {options.shelfCount}
            </Typography>
            <Slider
              value={options.shelfCount}
              onChange={(e, newValue) => handleOptionChange('shelfCount', newValue)}
              aria-labelledby="shelf-count-slider"
              step={1}
              marks
              min={0}
              max={10}
            />
          </Box>
        </Paper>
      )}
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Options générales
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Épaisseur des panneaux"
              type="number"
              value={options.thickness}
              onChange={(e) => handleOptionChange('thickness', parseInt(e.target.value, 10) || 0)}
              InputProps={{
                endAdornment: <InputAdornment position="end">mm</InputAdornment>,
              }}
              size="small"
              sx={{ mb: 2 }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.hasBackPanel}
                  onChange={(e) => handleOptionChange('hasBackPanel', e.target.checked)}
                />
              }
              label="Panneau arrière"
            />
          </Grid>
          
          {options.hasBackPanel && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Épaisseur du panneau arrière"
                type="number"
                value={options.backThickness}
                onChange={(e) => handleOptionChange('backThickness', parseInt(e.target.value, 10) || 0)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                }}
                size="small"
              />
            </Grid>
          )}
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.hasPlinths}
                  onChange={(e) => handleOptionChange('hasPlinths', e.target.checked)}
                />
              }
              label="Plinthes"
            />
          </Grid>
          
          {options.hasPlinths && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hauteur des plinthes"
                type="number"
                value={options.plinthHeight}
                onChange={(e) => handleOptionChange('plinthHeight', parseInt(e.target.value, 10) || 0)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                }}
                size="small"
              />
            </Grid>
          )}
        </Grid>
      </Paper>
      
      {/* Options spécifiques au type de meuble */}
      {furnitureType === 'cabinet' && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Options d'armoire
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={options.hasDoors === true}
                onChange={(e) => handleOptionChange('hasDoors', e.target.checked)}
              />
            }
            label="Ajouter des portes"
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={options.hasDrawers === true}
                onChange={(e) => handleOptionChange('hasDrawers', e.target.checked)}
              />
            }
            label="Ajouter des tiroirs"
          />
        </Paper>
      )}
      
      {/* Préréglages rapides */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Préréglages rapides
        </Typography>
        
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Button 
              size="small" 
              variant="outlined" 
              fullWidth
              onClick={() => applyPreset('shelf', { width: 800, height: 2000, depth: 300 }, { shelfCount: 5 })}
            >
              Bibliothèque haute
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button 
              size="small" 
              variant="outlined" 
              fullWidth
              onClick={() => applyPreset('shelf', { width: 1200, height: 800, depth: 350 }, { shelfCount: 1 })}
            >
              Étagère basse
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button 
              size="small" 
              variant="outlined" 
              fullWidth
              onClick={() => applyPreset('cabinet', { width: 600, height: 720, depth: 580 }, { hasDoors: true })}
            >
              Meuble cuisine
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button 
              size="small" 
              variant="outlined" 
              fullWidth
              onClick={() => applyPreset('wardrobe', { width: 1200, height: 2000, depth: 600 })}
            >
              Armoire 2 portes
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <MuiTooltip title="Les modifications sont appliquées automatiquement">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InfoIcon color="info" fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Mise à jour en temps réel
            </Typography>
          </Box>
        </MuiTooltip>
        
        <Button 
          variant="outlined" 
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Rafraîchir la vue
        </Button>
      </Box>
    </Box>
  );
};

export default ParametricDesigner;