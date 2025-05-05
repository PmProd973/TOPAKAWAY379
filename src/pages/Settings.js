// pages/Settings.js
import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { Save as SaveIcon, Upload as UploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useCompany } from '../contexts/CompanyContext';

function Settings() {
  const { companyInfo, loading, error, updateCompanyInfo, uploadLogo, deleteLogo } = useCompany();
  
  const [formData, setFormData] = useState({
    name: companyInfo?.name || '',
    address: companyInfo?.address || '',
    phone: companyInfo?.phone || '',
    email: companyInfo?.email || '',
    website: companyInfo?.website || ''
  });
  
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const [uploading, setUploading] = useState(false);
  
  // Mettre à jour le formulaire lorsque companyInfo change
  React.useEffect(() => {
    if (companyInfo) {
      setFormData({
        name: companyInfo.name || '',
        address: companyInfo.address || '',
        phone: companyInfo.phone || '',
        email: companyInfo.email || '',
        website: companyInfo.website || ''
      });
    }
  }, [companyInfo]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = async () => {
    try {
      const success = await updateCompanyInfo(formData);
      
      if (success) {
        setNotification({
          open: true,
          message: 'Paramètres sauvegardés avec succès',
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: 'Erreur lors de la sauvegarde des paramètres',
          severity: 'error'
        });
      }
    } catch (err) {
      setNotification({
        open: true,
        message: `Erreur: ${err.message}`,
        severity: 'error'
      });
    }
  };
  
  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setUploading(true);
      
      const url = await uploadLogo(file);
      
      if (url) {
        setNotification({
          open: true,
          message: 'Logo téléchargé avec succès',
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: 'Erreur lors du téléchargement du logo',
          severity: 'error'
        });
      }
    } catch (err) {
      setNotification({
        open: true,
        message: `Erreur: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setUploading(false);
      // Réinitialiser l'input
      event.target.value = null;
    }
  };
  
  const handleDeleteLogo = async () => {
    try {
      const success = await deleteLogo();
      
      if (success) {
        setNotification({
          open: true,
          message: 'Logo supprimé avec succès',
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: 'Erreur lors de la suppression du logo',
          severity: 'error'
        });
      }
    } catch (err) {
      setNotification({
        open: true,
        message: `Erreur: ${err.message}`,
        severity: 'error'
      });
    }
  };
  
  if (loading && !companyInfo) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Paramètres de l'entreprise
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Logo de l'entreprise
        </Typography>
        
        <Grid container spacing={3} alignItems="center">
          <Grid xs={12} md={6}>
            {companyInfo?.logo?.url ? (
              <Box sx={{ 
                p: 2, 
                border: '1px solid #eee', 
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'center',
                bgcolor: '#f5f5f5'
              }}>
                <img 
                  src={companyInfo.logo.url} 
                  alt="Logo de l'entreprise" 
                  style={{ maxWidth: '100%', maxHeight: '150px' }}
                />
              </Box>
            ) : (
              <Box sx={{ 
                p: 2, 
                border: '1px dashed #ccc', 
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '150px',
                bgcolor: '#f9f9f9'
              }}>
                <Typography color="text.secondary">
                  Aucun logo défini
                </Typography>
              </Box>
            )}
          </Grid>
          
          <Grid xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
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
            </Box>
            
            {companyInfo?.logo?.url && (
              <Button
                variant="outlined"
                color="error"
                fullWidth
                startIcon={<DeleteIcon />}
                onClick={handleDeleteLogo}
                disabled={uploading || loading}
              >
                Supprimer le logo
              </Button>
            )}
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Formats recommandés: PNG ou SVG avec fond transparent
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Informations de l'entreprise
        </Typography>
        
        <Grid container spacing={3}>
          <Grid xs={12}>
            <TextField
              fullWidth
              label="Nom de l'entreprise"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid xs={12}>
            <TextField
              fullWidth
              label="Adresse"
              name="address"
              value={formData.address}
              onChange={handleChange}
              multiline
              rows={2}
            />
          </Grid>
          
          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="Téléphone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid xs={12}>
            <TextField
              fullWidth
              label="Site web"
              name="website"
              value={formData.website}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Sauvegarde..." : "Enregistrer"}
          </Button>
        </Box>
      </Paper>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Settings;