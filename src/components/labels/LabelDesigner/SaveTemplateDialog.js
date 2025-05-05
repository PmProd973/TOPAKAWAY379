// SaveTemplateDialog.js
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  CircularProgress,
  Typography,
  Box,
  Divider,
  Alert
} from '@mui/material';
import { Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';

/**
 * Boîte de dialogue pour sauvegarder un modèle d'étiquette
 */
const SaveTemplateDialog = ({ 
  open, 
  onClose, 
  onSave, 
  loading = false,
  existingTemplates = []
}) => {
  // États du formulaire
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState('');

  // Réinitialiser le formulaire lorsqu'il s'ouvre
  React.useEffect(() => {
    if (open) {
      setTemplateName('');
      setDescription('');
      setIsDefault(false);
      setError('');
    }
  }, [open]);
  
  // Vérifier si le nom existe déjà
  const nameExists = React.useMemo(() => {
    return existingTemplates.some(
      template => template.name.toLowerCase() === templateName.trim().toLowerCase()
    );
  }, [templateName, existingTemplates]);
  
  // Gérer l'enregistrement
  const handleSave = () => {
    // Validation
    if (!templateName.trim()) {
      setError('Veuillez saisir un nom pour le modèle');
      return;
    }
    
    if (nameExists) {
      setError('Un modèle porte déjà ce nom. Veuillez choisir un nom différent.');
      return;
    }
    
    onSave({
      name: templateName.trim(),
      description: description.trim(),
      isDefault
    });
  };
  
  // Fermer le dialogue
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      fullWidth 
      maxWidth="sm"
      aria-labelledby="save-template-dialog-title"
    >
      <DialogTitle id="save-template-dialog-title">
        Enregistrer le modèle d'étiquette
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Sauvegardez votre modèle d'étiquette actuel pour le réutiliser ultérieurement.
          </Typography>
        </Box>
        
        <TextField
          autoFocus
          margin="dense"
          label="Nom du modèle"
          fullWidth
          value={templateName}
          onChange={(e) => {
            setTemplateName(e.target.value);
            setError('');
          }}
          error={!!error}
          helperText={error}
          disabled={loading}
          sx={{ mb: 2 }}
          placeholder="Ex: Modèle standard 90x50"
        />
        
        <TextField
          margin="dense"
          label="Description (optionnelle)"
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          multiline
          rows={2}
          sx={{ mb: 2 }}
          placeholder="Ex: Étiquettes avec logo en haut à droite et dimensions"
        />
        
        <Divider sx={{ my: 2 }} />
        
        <FormControlLabel
          control={
            <Switch
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              disabled={loading}
              color="primary"
            />
          }
          label="Définir comme modèle par défaut"
        />
        
        {nameExists && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Attention : un modèle avec ce nom existe déjà. Veuillez choisir un nom différent.
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          startIcon={<CloseIcon />}
        >
          Annuler
        </Button>
        <Button 
          onClick={handleSave} 
          color="primary" 
          variant="contained"
          disabled={loading || !templateName.trim() || nameExists}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveTemplateDialog;