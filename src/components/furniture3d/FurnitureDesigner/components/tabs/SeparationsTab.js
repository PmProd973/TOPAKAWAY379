// src/components/furniture3d/FurnitureDesigner/components/tabs/SeparationsTab.js
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControlLabel,
  Checkbox,
  TextField,
  Button,
  Grid,
  IconButton,
  InputAdornment,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useFurnitureStore } from '../../store/index';

const SeparationsTab = () => {
  const {
    constructionV2,
    toggleVerticalSupports,
    addVerticalSupport,
    removeVerticalSupport,
    distributeVerticalSupports,
    updateConstructionV2
  } = useFurnitureStore();

  return (
    <Paper elevation={0} sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Séparations
      </Typography>

      {/* Séparations verticales */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
          Séparations verticales
        </Typography>
        
        <FormControlLabel
          control={
            <Checkbox
              checked={constructionV2.base.verticalSupports.enabled}
              onChange={(e) => toggleVerticalSupports(e.target.checked)}
            />
          }
          label="Utiliser des montants verticaux filants"
        />
        
        {constructionV2.base.verticalSupports.enabled && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Positions des montants (mm depuis la gauche)
            </Typography>
            
            {constructionV2.base.verticalSupports.positions.map((position, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  fullWidth
                  type="number"
                  value={position}
                  onChange={(e) => {
                    const newPositions = [...constructionV2.base.verticalSupports.positions];
                    newPositions[index] = parseInt(e.target.value) || 0;
                    updateConstructionV2('base', 'verticalSupports', {
                      ...constructionV2.base.verticalSupports,
                      positions: newPositions
                    });
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">mm</InputAdornment>
                  }}
                />
                <IconButton
                  color="error"
                  onClick={() => removeVerticalSupport(index)}
                  disabled={constructionV2.base.verticalSupports.positions.length <= 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => addVerticalSupport()}
              sx={{ mt: 1 }}
            >
              Ajouter un montant
            </Button>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Distribution automatique
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Nombre de montants"
                    value={constructionV2.base.verticalSupports.count || 2}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 2;
                      updateConstructionV2('base', 'verticalSupports', {
                        ...constructionV2.base.verticalSupports,
                        count
                      });
                    }}
                    InputProps={{
                      inputProps: { min: 1, max: 10 }
                    }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Button
                    variant="contained"
                    onClick={() => distributeVerticalSupports(constructionV2.base.verticalSupports.count || 2)}
                  >
                    Distribuer
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Séparations horizontales (à implémenter) */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
          Séparations horizontales
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          Fonctionnalité à venir...
        </Typography>
      </Box>
    </Paper>
  );
};

export default SeparationsTab;