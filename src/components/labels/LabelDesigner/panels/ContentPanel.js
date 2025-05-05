// panels/ContentPanel.js
import React from 'react';
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Divider
} from '@mui/material';

const ContentPanel = ({ config, onChange, subscriptionLevel }) => {
  // Fonction pour gérer les changements
  const handleChange = (field) => (event) => {
    const checked = event.target.checked;
    onChange(`content.${field}`, checked);
  };
  
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Informations à afficher
      </Typography>
      
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={config.content.showDescription}
              onChange={handleChange('showDescription')}
            />
          }
          label="Description de la pièce"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={config.content.showDimensions}
              onChange={handleChange('showDimensions')}
            />
          }
          label="Dimensions"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={config.content.showMaterial}
              onChange={handleChange('showMaterial')}
            />
          }
          label="Matériau"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={config.content.showPanelNumber}
              onChange={handleChange('showPanelNumber')}
            />
          }
          label="Numéro de panneau"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={config.content.showEdges}
              onChange={handleChange('showEdges')}
            />
          }
          label="Informations de chants"
        />
        
        <Divider sx={{ my: 1 }} />
        
        <FormControlLabel
          control={
            <Switch
              checked={config.content.showPieceId}
              onChange={handleChange('showPieceId')}
            />
          }
          label="Identifiant de pièce"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={config.content.showDate}
              onChange={handleChange('showDate')}
            />
          }
          label="Date"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={config.content.showQuantity}
              onChange={handleChange('showQuantity')}
            />
          }
          label="Quantité"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={config.content.showClientName}
              onChange={handleChange('showClientName')}
            />
          }
          label="Nom du client"
        />
      </FormGroup>
    </Box>
  );
};

export default ContentPanel;