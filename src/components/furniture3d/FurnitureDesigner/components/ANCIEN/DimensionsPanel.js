// Nouveau composant à créer: src/components/furniture3d/FurnitureDesigner/components/DimensionsPanel.js
import React from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Divider,
  Paper
} from '@mui/material';
import { useFurnitureStore } from '../store';

const DimensionsPanel = () => {
  const { 
    selectedObjectId, 
    sceneObjects, 
    updatePieceDimensions 
  } = useFurnitureStore();
  
  // Récupérer l'objet sélectionné
  const selectedObject = sceneObjects.find(obj => obj.id === selectedObjectId);
  
  if (!selectedObject || !selectedObject.piece) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary" align="center">
          Sélectionnez une pièce pour modifier ses dimensions
        </Typography>
      </Box>
    );
  }
  
  const { piece } = selectedObject;
  
  const handleDimensionChange = (dimension, value) => {
    // Valider que c'est un nombre et qu'il est positif
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;
    
    // Mettre à jour la dimension
    updatePieceDimensions(selectedObjectId, {
      ...piece,
      [dimension]: numValue
    });
  };
  
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Dimensions
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="body2" gutterBottom>
          {piece.description || "Pièce sans description"}
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Largeur"
            type="number"
            value={piece.width}
            onChange={(e) => handleDimensionChange('width', e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">mm</InputAdornment>,
            }}
            size="small"
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Longueur"
            type="number"
            value={piece.length}
            onChange={(e) => handleDimensionChange('length', e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">mm</InputAdornment>,
            }}
            size="small"
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Épaisseur"
            type="number"
            value={piece.thickness}
            onChange={(e) => handleDimensionChange('thickness', e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">mm</InputAdornment>,
            }}
            size="small"
          />
        </Box>
      </Paper>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>
        Dimensions totales du meuble
      </Typography>
      
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Typography variant="body2">Largeur totale:</Typography>
          <Typography variant="body2" align="right">850 mm</Typography>
          
          <Typography variant="body2">Hauteur totale:</Typography>
          <Typography variant="body2" align="right">2000 mm</Typography>
          
          <Typography variant="body2">Profondeur totale:</Typography>
          <Typography variant="body2" align="right">400 mm</Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default DimensionsPanel;