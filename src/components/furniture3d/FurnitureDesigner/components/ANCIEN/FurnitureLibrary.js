// src/components/furniture3d/FurnitureDesigner/components/FurnitureLibrary.js
import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  CardMedia, 
  Button 
} from '@mui/material';
import { ViewInAr as ViewInArIcon } from '@mui/icons-material';
import { useFurnitureStore } from '../store';

// Définition des meubles prédéfinis
const furnitureTemplates = [
  {
    id: 'shelf-simple',
    name: 'Étagère simple',
    description: 'Étagère à 4 tablettes',
    image: null, // Remplacer par un chemin d'image réel
    type: 'shelf',
    dimensions: { width: 80, height: 200, depth: 40 }
  },
  {
    id: 'cabinet-basic',
    name: 'Armoire basse',
    description: 'Armoire basse avec porte',
    image: null, // Remplacer par un chemin d'image réel
    type: 'cabinet',
    dimensions: { width: 100, height: 80, depth: 50 }
  }
];

const FurnitureLibrary = () => {
  const { addFurnitureTemplate } = useFurnitureStore();
  
  const handleAddFurniture = (template) => {
    // Ajouter le meuble à la scène à une position par défaut
    console.log(`Ajout du meuble ${template.id}`);
    // TODO: Implémenter cette fonction dans store.js
    // addFurnitureTemplate(template.id, [0, 0, 0], [0, 0, 0]);
  };
  
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Bibliothèque de meubles
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Sélectionnez un meuble pour l'ajouter à votre scène 3D.
      </Typography>
      
      <Grid container spacing={2}>
        {furnitureTemplates.map((template) => (
          <Grid item xs={6} key={template.id}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ 
                height: 100, 
                bgcolor: '#e0e0e0', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ViewInArIcon sx={{ fontSize: 40, color: '#757575' }} />
              </Box>
              <CardContent sx={{ pb: 1 }}>
                <Typography variant="subtitle2" component="div">
                  {template.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {template.dimensions.width} × {template.dimensions.height} × {template.dimensions.depth} mm
                </Typography>
                <Button 
                  size="small" 
                  variant="contained" 
                  fullWidth 
                  sx={{ mt: 1 }}
                  onClick={() => handleAddFurniture(template)}
                >
                  Ajouter
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FurnitureLibrary;