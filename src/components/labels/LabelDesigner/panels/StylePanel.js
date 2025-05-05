// panels/StylePanel.js
import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Slider,
  Divider,
  IconButton
} from '@mui/material';


// Simulons une palette de couleurs
const colorOptions = [
  { name: 'Bleu', value: '#1976d2' },
  { name: 'Vert', value: '#2e7d32' },
  { name: 'Rouge', value: '#d32f2f' },
  { name: 'Orange', value: '#ed6c02' },
  { name: 'Violet', value: '#9c27b0' },
  { name: 'Gris', value: '#616161' },
  { name: 'Noir', value: '#000000' }
];

const ColorSelector = ({ label, value, onChange }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" gutterBottom>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {colorOptions.map((color) => (
          <IconButton 
            key={color.value}
            sx={{ 
              width: 30, 
              height: 30, 
              bgcolor: color.value, 
              border: value === color.value ? '2px solid black' : '1px solid #ccc',
              '&:hover': { bgcolor: color.value }
            }}
            onClick={() => onChange(color.value)}
          />
        ))}
      </Box>
    </Box>
  );
};

const StylePanel = ({ config, onChange, subscriptionLevel, canUseAdvancedStyling = true }) => {
  // Fonction pour gérer les changements de valeurs
  const handleChange = (field) => (value) => {
    onChange(`style.${field}`, value);
  };
  
  // Fonction pour gérer les changements d'input
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    onChange(`style.${field}`, value);
  };
  
  // Fonction pour gérer les changements de nombre
  const handleNumberChange = (field) => (event) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0) {
      onChange(`style.${field}`, value);
    }
  };
  
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Couleurs
      </Typography>
      
      <ColorSelector
        label="Couleur principale"
        value={config.style.mainColor}
        onChange={handleChange('mainColor')}
      />
      
      {canUseAdvancedStyling && (
        <>
          <ColorSelector
            label="Couleur secondaire"
            value={config.style.secondaryColor || '#f5f5f5'}
            onChange={handleChange('secondaryColor')}
          />
          
          <ColorSelector
            label="Couleur du texte"
            value={config.style.textColor || '#000000'}
            onChange={handleChange('textColor')}
          />
        </>
      )}
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>
        Typographie
      </Typography>
      
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="font-family-label">Police</InputLabel>
        <Select
          labelId="font-family-label"
          value={config.style.fontFamily || 'Arial, sans-serif'}
          label="Police"
          onChange={handleInputChange('fontFamily')}
        >
          <MenuItem value="Arial, sans-serif">Arial</MenuItem>
          <MenuItem value="'Times New Roman', serif">Times New Roman</MenuItem>
          <MenuItem value="'Courier New', monospace">Courier New</MenuItem>
          <MenuItem value="'Roboto', sans-serif">Roboto</MenuItem>
          <MenuItem value="'Open Sans', sans-serif">Open Sans</MenuItem>
        </Select>
      </FormControl>
      
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Taille de police"
            type="number"
            value={config.style.fontSize}
            onChange={handleNumberChange('fontSize')}
            inputProps={{ min: 6, max: 14, step: 1 }}
            size="small"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Taille titres"
            type="number"
            value={config.style.headerFontSize || (config.style.fontSize + 2)}
            onChange={handleNumberChange('headerFontSize')}
            inputProps={{ min: 8, max: 16, step: 1 }}
            size="small"
          />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>
        Bordures
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Épaisseur (px)"
            type="number"
            value={config.style.borderWidth}
            onChange={handleNumberChange('borderWidth')}
            inputProps={{ min: 0, max: 3, step: 1 }}
            size="small"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Rayon d'angle (px)"
            type="number"
            value={config.style.borderRadius || 0}
            onChange={handleNumberChange('borderRadius')}
            inputProps={{ min: 0, max: 10, step: 1 }}
            size="small"
          />
        </Grid>
      </Grid>
      
      {canUseAdvancedStyling && (
        <Box sx={{ mt: 2 }}>
          <ColorSelector
            label="Couleur de bordure"
            value={config.style.borderColor || config.style.mainColor}
            onChange={handleChange('borderColor')}
          />
        </Box>
      )}
    </Box>
  );
};

export default StylePanel;
