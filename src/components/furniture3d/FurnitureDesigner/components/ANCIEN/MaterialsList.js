// Mettez à jour le composant MaterialsList.js
import React, { useState } from 'react';
import { 
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useFurnitureStore } from '../store';

const MaterialsList = ({ materials = [] }) => {
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const handleEditMaterial = (material) => {
    setSelectedMaterial(material);
    setDialogOpen(true);
  };
  
  const handleAddMaterial = () => {
    setSelectedMaterial({
      id: '',
      name: 'Nouveau matériau',
      color: '#CCCCCC',
      thickness: 18,
      roughness: 0.7,
      metalness: 0.1
    });
    setDialogOpen(true);
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Matériaux
        </Typography>
        <Button 
          startIcon={<AddIcon />}
          size="small"
          onClick={handleAddMaterial}
        >
          Ajouter
        </Button>
      </Box>
      
      {materials.length === 0 ? (
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Aucun matériau disponible.
          </Typography>
        </Paper>
      ) : (
        <List disablePadding>
          {materials.map((material, index) => (
            <Paper 
              key={material.id || index} 
              sx={{ mb: 1 }}
            >
              <ListItem>
                <Box 
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    bgcolor: material.color || '#CCCCCC',
                    mr: 1,
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 1
                  }}
                />
                <ListItemText 
                  primary={material.name || `Matériau ${index + 1}`}
                  secondary={`${material.thickness}mm - ${material.description || ''}`}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Modifier">
                    <IconButton 
                      edge="end"
                      onClick={() => handleEditMaterial(material)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            </Paper>
          ))}
        </List>
      )}
      
      {/* Dialog d'édition */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {selectedMaterial && selectedMaterial.id ? 'Modifier le matériau' : 'Ajouter un matériau'}
        </DialogTitle>
        <DialogContent>
          {/* Formulaire d'édition */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained">Enregistrer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaterialsList;