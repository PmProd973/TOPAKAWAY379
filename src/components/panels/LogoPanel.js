// panels/LogoPanel.js
import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  TextField,
  Grid,
  Paper,
  Divider
} from '@mui/material';

const LogoPanel = ({ config, onChange, companyInfo }) => {
  // Simuler companyInfo pour le développement
  const mockCompanyInfo = {
    logo: {
      url: '/placeholder-logo.png'
    }
  };
  
  // Utiliser des données réelles ou simulées
  const effectiveCompanyInfo = companyInfo || mockCompanyInfo;
  
  // Vérifier si le logo est disponible
  const hasLogo = effectiveCompanyInfo && effectiveCompanyInfo.logo;
  
  // Fonction pour gérer l'activation/désactivation du logo
  const handleLogoEnabledChange = (event) => {
    onChange('logo.enabled', event.target.checked);
  };
  
  // Fonction pour gérer la position du logo
  const handlePositionChange = (event) => {
    onChange('logo.position', event.target.value);
  };
  
  // Fonction pour gérer les dimensions du logo
  const handleSizeChange = (field) => (event) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0) {
      onChange(`logo.${field}`, value);
    }
  };
  
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Logo de l'entreprise
      </Typography>
      
      {!hasLogo ? (
        <Paper sx={{ p: 2, textAlign: 'center', mb: 2 }}>
          <Typography color="text.secondary">
            Aucun logo d'entreprise n'a été défini. Vous pouvez ajouter un logo dans les paramètres de votre compte.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ mb: 2 }}>
          <Paper sx={{ p: 2, mb: 2, textAlign: 'center' }}>
            <img 
              src={effectiveCompanyInfo.logo.url} 
              alt="Logo de l'entreprise" 
              style={{ maxWidth: '100%', maxHeight: '80px' }} 
            />
          </Paper>
          
          <FormControlLabel
            control={
              <Switch
                checked={config.logo.enabled}
                onChange={handleLogoEnabledChange}
              />
            }
            label="Afficher le logo sur les étiquettes"
          />
          
          {config.logo.enabled && (
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel id="logo-position-label">Position du logo</InputLabel>
                <Select
                  labelId="logo-position-label"
                  value={config.logo.position}
                  label="Position du logo"
                  onChange={handlePositionChange}
                >
                  <MenuItem value="topRight">En haut à droite</MenuItem>
                  <MenuItem value="topLeft">En haut à gauche</MenuItem>
                  <MenuItem value="bottomRight">En bas à droite</MenuItem>
                  <MenuItem value="bottomLeft">En bas à gauche</MenuItem>
                </Select>
              </FormControl>
              
              <Typography variant="subtitle2" gutterBottom>
                Dimensions du logo
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Largeur (mm)"
                    type="number"
                    value={config.logo.width}
                    onChange={handleSizeChange('width')}
                    inputProps={{ min: 5, max: 50, step: 1 }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Hauteur (mm)"
                    type="number"
                    value={config.logo.height}
                    onChange={handleSizeChange('height')}
                    inputProps={{ min: 5, max: 50, step: 1 }}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default LogoPanel;