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
  Divider,
  Button,
  Alert,
  Link,
  CircularProgress
} from '@mui/material';
import { Upload as UploadIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useCompany } from '../../../../contexts/CompanyContext';

/**
 * Panneau de configuration du logo pour les étiquettes
 */
const LogoPanel = ({ config, onChange }) => {
  // Utiliser le contexte d'entreprise pour accéder au logo
  const { companyInfo, loading: companyLoading, uploadLogo } = useCompany();
  const [uploading, setUploading] = React.useState(false);
  
  // Vérifier si le logo est disponible
  const hasLogo = companyInfo && companyInfo.logo && companyInfo.logo.url;
  
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
  
  // Fonction pour gérer le téléchargement du logo
  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setUploading(true);
      // Si uploadLogo est disponible dans le contexte d'entreprise
      if (uploadLogo) {
        await uploadLogo(file);
      } else {
        console.warn("La fonction uploadLogo n'est pas disponible");
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement du logo:", error);
    } finally {
      setUploading(false);
      // Réinitialiser l'input file
      event.target.value = null;
    }
  };
  
  // Si les informations d'entreprise sont en cours de chargement
  if (companyLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Logo de l'entreprise
      </Typography>
      
      {!hasLogo ? (
        <Paper sx={{ p: 2, textAlign: 'center', mb: 2 }}>
          <Typography color="text.secondary" paragraph>
            Aucun logo d'entreprise n'a été défini. Vous pouvez télécharger un logo ci-dessous.
          </Typography>
          
          <Button
            variant="outlined"
            component="label"
            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
            disabled={uploading}
          >
            {uploading ? "Téléchargement..." : "Télécharger un logo"}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploading}
            />
          </Button>
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Formats recommandés: PNG ou SVG avec fond transparent. Taille maximum: 2MB.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ mb: 2 }}>
          {/* Prévisualisation du logo */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="subtitle2">Votre logo</Typography>
              
              <Button
                variant="outlined"
                component="label"
                size="small"
                startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
                disabled={uploading}
              >
                {uploading ? "..." : "Changer"}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
              </Button>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              p: 2, 
              bgcolor: '#f5f5f5', 
              borderRadius: 1 
            }}>
              <img 
                src={companyInfo.logo.url} 
                alt="Logo de l'entreprise" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100px', 
                  objectFit: 'contain' 
                }} 
              />
            </Box>
          </Paper>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Configuration de l'affichage du logo */}
          <Typography variant="subtitle2" gutterBottom>
            Affichage sur les étiquettes
          </Typography>
          
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
                  <MenuItem value="center">Centré (filigrane)</MenuItem>
                </Select>
              </FormControl>
              
              <Typography variant="subtitle2" gutterBottom>
                Dimensions du logo
              </Typography>
              
              <Grid container spacing={2}>
                <Grid xs={6}>
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
                <Grid xs={6}>
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
              
              {config.logo.position === 'center' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Transparence (filigrane)
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid xs={9}>
                      <TextField
                        fullWidth
                        label="Opacité (%)"
                        type="number"
                        value={config.logo.opacity || 30}
                        onChange={handleSizeChange('opacity')}
                        inputProps={{ min: 5, max: 100, step: 5 }}
                        size="small"
                      />
                    </Grid>
                    <Grid xs={3}>
                      <Box 
                        sx={{ 
                          height: 30, 
                          borderRadius: 1, 
                          bgcolor: '#ddd', 
                          opacity: (config.logo.opacity || 30) / 100 
                        }} 
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
      
      <Alert severity="info" sx={{ mt: 2 }}>
        Pour configurer les informations de votre entreprise, rendez-vous dans les{' '}
        <Link href="/settings" underline="hover">paramètres de votre compte</Link>.
      </Alert>
    </Box>
  );
};

export default LogoPanel;