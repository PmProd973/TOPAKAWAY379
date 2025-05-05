// panels/LayoutPanel.js
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
  Divider
} from '@mui/material';

const LayoutPanel = ({ config, onChange, subscriptionLevel }) => {
  // Fonction pour gérer les changements de valeurs numériques
  const handleNumberChange = (field) => (event) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0) {
      onChange(`layout.${field}`, value);
    }
  };
  
  // Fonction pour gérer les changements de sélection
  const handleSelectChange = (field) => (event) => {
    onChange(`layout.${field}`, event.target.value);
  };
  
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Dimensions et orientation
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Largeur (mm)"
            type="number"
            value={config.layout.width}
            onChange={handleNumberChange('width')}
            inputProps={{ min: 30, step: 5 }}
            size="small"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Hauteur (mm)"
            type="number"
            value={config.layout.height}
            onChange={handleNumberChange('height')}
            inputProps={{ min: 20, step: 5 }}
            size="small"
          />
        </Grid>
      </Grid>
      
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="orientation-label">Orientation</InputLabel>
        <Select
          labelId="orientation-label"
          value={config.layout.orientation}
          label="Orientation"
          onChange={handleSelectChange('orientation')}
        >
          <MenuItem value="landscape">Paysage</MenuItem>
          <MenuItem value="portrait">Portrait</MenuItem>
        </Select>
      </FormControl>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>
        Format de page
      </Typography>
      
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="page-size-label">Format</InputLabel>
        <Select
          labelId="page-size-label"
          value={config.layout.pageSize}
          label="Format"
          onChange={handleSelectChange('pageSize')}
        >
          <MenuItem value="a4">A4</MenuItem>
          <MenuItem value="a5">A5</MenuItem>
          <MenuItem value="letter">Letter</MenuItem>
          <MenuItem value="legal">Legal</MenuItem>
        </Select>
      </FormControl>
      
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Étiquettes par ligne"
            type="number"
            value={config.layout.labelsPerRow}
            onChange={handleNumberChange('labelsPerRow')}
            inputProps={{ min: 1, max: 4, step: 1 }}
            size="small"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Espacement (mm)"
            type="number"
            value={config.layout.spacing || 5}
            onChange={handleNumberChange('spacing')}
            inputProps={{ min: 0, max: 20, step: 1 }}
            size="small"
          />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>
        Marges de page (mm)
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Marge haut"
            type="number"
            value={config.layout.marginTop}
            onChange={handleNumberChange('marginTop')}
            inputProps={{ min: 0, step: 1 }}
            size="small"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Marge bas"
            type="number"
            value={config.layout.marginBottom}
            onChange={handleNumberChange('marginBottom')}
            inputProps={{ min: 0, step: 1 }}
            size="small"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Marge gauche"
            type="number"
            value={config.layout.marginLeft}
            onChange={handleNumberChange('marginLeft')}
            inputProps={{ min: 0, step: 1 }}
            size="small"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Marge droite"
            type="number"
            value={config.layout.marginRight}
            onChange={handleNumberChange('marginRight')}
            inputProps={{ min: 0, step: 1 }}
            size="small"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default LayoutPanel;