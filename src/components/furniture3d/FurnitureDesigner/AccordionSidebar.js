import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Collapse,
  Typography,
  Button,
  Grid,
  TextField,
  Paper,
  IconButton,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';

// Composant pour les éléments de menu dépliables
const AccordionItem = ({ number, title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <ListItem 
        disablePadding 
        onClick={() => setOpen(!open)}
        sx={{ 
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)', 
          bgcolor: open ? '#1e3a8a' : '#1e3a8a',
          color: 'white',
          '&:hover': {
            bgcolor: '#152967',
          }
        }}
      >
        <ListItemButton sx={{ py: 1, px: 2 }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: 'white',
              color: '#1e3a8a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1,
              fontWeight: 'bold'
            }}
          >
            {number}
          </Box>
          <ListItemText 
            primary={title} 
            primaryTypographyProps={{ 
              sx: { 
                fontWeight: 'bold',
                fontSize: '0.9rem'
              } 
            }} 
          />
          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemButton>
      </ListItem>
      <Collapse in={open} timeout="auto">
        <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          {children}
        </Box>
      </Collapse>
    </>
  );
};

// Composant pour les boutons de type de meuble
const FurnitureTypeButton = ({ label, selected = false, onClick }) => (
  <Button
    variant={selected ? "contained" : "outlined"}
    color={selected ? "primary" : "inherit"}
    size="small"
    onClick={onClick}
    sx={{
      borderRadius: '20px',
      textTransform: 'none',
      m: 0.5,
      bgcolor: selected ? '#1e3a8a' : 'transparent',
      borderColor: selected ? '#1e3a8a' : 'rgba(0, 0, 0, 0.23)',
      '&:hover': {
        bgcolor: selected ? '#152967' : 'rgba(0, 0, 0, 0.08)',
        borderColor: selected ? '#152967' : 'rgba(0, 0, 0, 0.23)'
      }
    }}
  >
    {label}
  </Button>
);

// Composant de contrôle des dimensions
const DimensionControl = ({ label, value, unit = 'mm', onChange }) => (
  <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
    <Grid item xs={4}>
      <Typography variant="body2">{label}</Typography>
    </Grid>
    <Grid item xs={6}>
      <TextField
        size="small"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        InputProps={{
          endAdornment: <Typography variant="caption">{unit}</Typography>,
        }}
        fullWidth
      />
    </Grid>
    <Grid item xs={2}>
      <IconButton size="small">
        <EditIcon fontSize="small" />
      </IconButton>
    </Grid>
  </Grid>
);

// Composant principal du menu accordéon
const AccordionSidebar = ({ furnitureStore, projectData, onProjectDataUpdate }) => {
  const [localFurnitureType, setLocalFurnitureType] = useState('Bibliothèque');
  const [dimensions, setDimensions] = useState({
    width: 1000,
    height: 2000,
    depth: 600
  });
  
  // Synchroniser avec les données du projet si disponibles
  useEffect(() => {
    if (projectData) {
      setLocalFurnitureType(projectData.furnitureType || 'Bibliothèque');
      setDimensions({
        width: projectData.dimensions?.width || 1000,
        height: projectData.dimensions?.height || 2000,
        depth: projectData.dimensions?.depth || 600
      });
    }
  }, [projectData]);
  
  // Synchroniser avec les données du store si disponibles
  useEffect(() => {
    if (furnitureStore) {
      setDimensions({
        width: furnitureStore.width || 1000,
        height: furnitureStore.height || 2000,
        depth: furnitureStore.depth || 600
      });
    }
  }, [furnitureStore?.width, furnitureStore?.height, furnitureStore?.depth]);

  // Gestionnaire pour les changements de type de meuble
  const handleFurnitureTypeChange = (type) => {
    setLocalFurnitureType(type);
    
    // Mettre à jour le store si disponible
    if (furnitureStore && furnitureStore.setFurnitureType) {
      furnitureStore.setFurnitureType(type);
    }
    
    // Mettre à jour les données du projet
    if (onProjectDataUpdate) {
      onProjectDataUpdate({ furnitureType: type });
    }
  };

  // Gestionnaire pour les changements de dimensions
  const handleDimensionChange = (dimension, value) => {
    const numericValue = parseInt(value, 10) || 0;
    
    // Mettre à jour l'état local
    setDimensions(prev => ({ ...prev, [dimension]: numericValue }));
    
    // Mettre à jour le store si disponible
    if (furnitureStore) {
      switch(dimension) {
        case 'width':
          if (furnitureStore.setWidth) furnitureStore.setWidth(numericValue);
          break;
        case 'height':
          if (furnitureStore.setHeight) furnitureStore.setHeight(numericValue);
          break;
        case 'depth':
          if (furnitureStore.setDepth) furnitureStore.setDepth(numericValue);
          break;
        default:
          break;
      }
    }
    
    // Mettre à jour les données du projet
    if (onProjectDataUpdate) {
      onProjectDataUpdate({
        dimensions: {
          ...dimensions,
          [dimension]: numericValue
        }
      });
    }
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0
      }}
    >
      {/* En-tête du panneau */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          p: 1,
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          bgcolor: '#f5f5f5'
        }}
      >
        <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          Configuration du meuble
        </Typography>
      </Box>

      {/* Menu principal avec accordéons */}
      <List sx={{ p: 0, flexGrow: 1, overflow: 'auto' }} component="nav">
        {/* Type de meuble */}
        <AccordionItem number="1" title="Type de meuble" defaultOpen={true}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <FurnitureTypeButton 
              label="Bibliothèque" 
              selected={localFurnitureType === 'Bibliothèque'} 
              onClick={() => handleFurnitureTypeChange('Bibliothèque')}
            />
            <FurnitureTypeButton 
              label="Bibliothèque tv" 
              selected={localFurnitureType === 'Bibliothèque tv'}
              onClick={() => handleFurnitureTypeChange('Bibliothèque tv')} 
            />
            <FurnitureTypeButton 
              label="Meuble bas" 
              selected={localFurnitureType === 'Meuble bas'}
              onClick={() => handleFurnitureTypeChange('Meuble bas')} 
            />
            <FurnitureTypeButton 
              label="Meuble en angle" 
              selected={localFurnitureType === 'Meuble en angle'}
              onClick={() => handleFurnitureTypeChange('Meuble en angle')} 
            />
            <FurnitureTypeButton 
              label="Dressing fermé" 
              selected={localFurnitureType === 'Dressing fermé'}
              onClick={() => handleFurnitureTypeChange('Dressing fermé')} 
            />
            <FurnitureTypeButton 
              label="Dressing ouvert" 
              selected={localFurnitureType === 'Dressing ouvert'}
              onClick={() => handleFurnitureTypeChange('Dressing ouvert')} 
            />
            <FurnitureTypeButton 
              label="Portes Coulissantes" 
              selected={localFurnitureType === 'Portes Coulissantes'}
              onClick={() => handleFurnitureTypeChange('Portes Coulissantes')} 
            />
            <FurnitureTypeButton 
              label="Claustra" 
              selected={localFurnitureType === 'Claustra'}
              onClick={() => handleFurnitureTypeChange('Claustra')} 
            />
            <FurnitureTypeButton 
              label="Verrière" 
              selected={localFurnitureType === 'Verrière'}
              onClick={() => handleFurnitureTypeChange('Verrière')} 
            />
          </Box>
        </AccordionItem>

        {/* Dimensions */}
        <AccordionItem number="2" title="Dimensions">
          <DimensionControl 
            label="Largeur" 
            value={dimensions.width} 
            onChange={(value) => handleDimensionChange('width', value)} 
          />
          <DimensionControl 
            label="Hauteur" 
            value={dimensions.height} 
            onChange={(value) => handleDimensionChange('height', value)} 
          />
          <DimensionControl 
            label="Profondeur" 
            value={dimensions.depth} 
            onChange={(value) => handleDimensionChange('depth', value)} 
          />
        </AccordionItem>

        {/* Colonnes */}
        <AccordionItem number="3" title="Colonnes">
          <Box sx={{ p: 1, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Configuration des colonnes
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box 
                  sx={{ 
                    border: '1px solid #ccc', 
                    height: 80, 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <ViewColumnIcon />
                </Box>
                <Typography variant="caption">2 Colonnes</Typography>
              </Grid>
              <Grid item xs={4}>
                <Box 
                  sx={{ 
                    border: '1px solid #ccc', 
                    height: 80, 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <ViewColumnIcon />
                </Box>
                <Typography variant="caption">3 Colonnes</Typography>
              </Grid>
              <Grid item xs={4}>
                <Box 
                  sx={{ 
                    border: '1px solid #ccc', 
                    height: 80, 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <ViewColumnIcon />
                </Box>
                <Typography variant="caption">4 Colonnes</Typography>
              </Grid>
            </Grid>
          </Box>
        </AccordionItem>

        {/* Couleurs */}
        <AccordionItem number="4" title="Couleurs">
          <Typography variant="body2" sx={{ mb: 2 }}>
            Sélection des couleurs
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={3}>
              <Box 
                sx={{ 
                  bgcolor: '#8B4513', 
                  width: '100%', 
                  height: 40, 
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 0 0 2px #1e3a8a'
                  }
                }}
              />
              <Typography variant="caption" align="center" display="block">
                Châtaigne
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Box 
                sx={{ 
                  bgcolor: '#D2B48C', 
                  width: '100%', 
                  height: 40, 
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 0 0 2px #1e3a8a'
                  }
                }}
              />
              <Typography variant="caption" align="center" display="block">
                Chêne
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Box 
                sx={{ 
                  bgcolor: '#FFFFFF', 
                  width: '100%', 
                  height: 40, 
                  borderRadius: 1,
                  border: '1px solid #ccc',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 0 0 2px #1e3a8a'
                  }
                }}
              />
              <Typography variant="caption" align="center" display="block">
                Blanc
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Box 
                sx={{ 
                  bgcolor: '#808080', 
                  width: '100%', 
                  height: 40, 
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 0 0 2px #1e3a8a'
                  }
                }}
              />
              <Typography variant="caption" align="center" display="block">
                Gris
              </Typography>
            </Grid>
          </Grid>
        </AccordionItem>
      </List>

      {/* Prix en bas de page */}
      <Box 
        sx={{ 
          p: 2, 
          borderTop: '1px solid rgba(0, 0, 0, 0.12)',
          bgcolor: '#f5f5f5',
          textAlign: 'left',
          mt: 'auto' // Pour pousser le prix au bas du panneau
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          2 225,99 €
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          La livraison est incluse !
        </Typography>
      </Box>
    </Paper>
  );
};

export default AccordionSidebar;