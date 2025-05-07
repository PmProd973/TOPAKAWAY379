import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Paper,
  Typography,
  Button,
  Chip,
  Grid,
  TextField,
  IconButton,
  Stack
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ChevronRight as ChevronRightIcon,
  Edit as EditIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ViewInAr as ViewInArIcon,
  Home as HomeIcon,
  FormatColorFill as FormatColorFillIcon,
  Category as CategoryIcon,
  Straighten as StraightenIcon,
  ViewColumn as ViewColumnIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';

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
        onChange={onChange}
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
const AccordionMenu = ({ furnitureStore }) => {
  const [furnitureType, setFurnitureType] = useState('Bibliothèque');
  const [dimensions, setDimensions] = useState({
    width: 1000,
    height: 2000,
    depth: 600
  });

  // Gestionnaire pour les changements de type de meuble
  const handleFurnitureTypeChange = (type) => {
    setFurnitureType(type);
    // Mettre à jour le store si nécessaire
    if (furnitureStore && furnitureStore.setFurnitureType) {
      furnitureStore.setFurnitureType(type);
    }
  };

  // Gestionnaire pour les changements de dimensions
  const handleDimensionChange = (dimension, value) => {
    setDimensions(prev => ({ ...prev, [dimension]: value }));
    // Mettre à jour le store si nécessaire
    if (furnitureStore) {
      switch(dimension) {
        case 'width':
          if (furnitureStore.setWidth) furnitureStore.setWidth(value);
          break;
        case 'height':
          if (furnitureStore.setHeight) furnitureStore.setHeight(value);
          break;
        case 'depth':
          if (furnitureStore.setDepth) furnitureStore.setDepth(value);
          break;
        default:
          break;
      }
    }
  };

  return (
    <Paper 
      elevation={2}
      sx={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* En-tête avec les boutons annuler/refaire */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          p: 1,
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          bgcolor: '#f5f5f5'
        }}
      >
        <IconButton size="small" sx={{ color: '#1e3a8a' }}>
          <UndoIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" sx={{ color: '#1e3a8a' }}>
          <RedoIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Menu principal avec accordéons */}
      <List sx={{ p: 0, flexGrow: 1, overflow: 'auto' }} component="nav">
        {/* Type de meuble */}
        <AccordionItem number="1" title="Type de meuble" defaultOpen={true}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <FurnitureTypeButton 
              label="Bibliothèque" 
              selected={furnitureType === 'Bibliothèque'} 
              onClick={() => handleFurnitureTypeChange('Bibliothèque')}
            />
            <FurnitureTypeButton 
              label="Bibliothèque tv" 
              selected={furnitureType === 'Bibliothèque tv'}
              onClick={() => handleFurnitureTypeChange('Bibliothèque tv')} 
            />
            <FurnitureTypeButton 
              label="Meuble bas" 
              selected={furnitureType === 'Meuble bas'}
              onClick={() => handleFurnitureTypeChange('Meuble bas')} 
            />
            <FurnitureTypeButton 
              label="Meuble en angle" 
              selected={furnitureType === 'Meuble en angle'}
              onClick={() => handleFurnitureTypeChange('Meuble en angle')} 
            />
            <FurnitureTypeButton 
              label="Dressing fermé" 
              selected={furnitureType === 'Dressing fermé'}
              onClick={() => handleFurnitureTypeChange('Dressing fermé')} 
            />
            <FurnitureTypeButton 
              label="Dressing ouvert" 
              selected={furnitureType === 'Dressing ouvert'}
              onClick={() => handleFurnitureTypeChange('Dressing ouvert')} 
            />
            <FurnitureTypeButton 
              label="Portes Coulissantes" 
              selected={furnitureType === 'Portes Coulissantes'}
              onClick={() => handleFurnitureTypeChange('Portes Coulissantes')} 
            />
            <FurnitureTypeButton 
              label="Claustra" 
              selected={furnitureType === 'Claustra'}
              onClick={() => handleFurnitureTypeChange('Claustra')} 
            />
            <FurnitureTypeButton 
              label="Verrière" 
              selected={furnitureType === 'Verrière'}
              onClick={() => handleFurnitureTypeChange('Verrière')} 
            />
          </Box>
        </AccordionItem>

        {/* Dimensions */}
        <AccordionItem number="2" title="Dimensions">
          <DimensionControl 
            label="Largeur" 
            value={dimensions.width} 
            onChange={(e) => handleDimensionChange('width', e.target.value)} 
          />
          <DimensionControl 
            label="Hauteur" 
            value={dimensions.height} 
            onChange={(e) => handleDimensionChange('height', e.target.value)} 
          />
          <DimensionControl 
            label="Profondeur" 
            value={dimensions.depth} 
            onChange={(e) => handleDimensionChange('depth', e.target.value)} 
          />
        </AccordionItem>

        {/* Colonnes */}
        <AccordionItem number="3" title="Colonnes">
          <Box sx={{ p: 2, textAlign: 'center' }}>
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
                    borderRadius: 1
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
                    borderRadius: 1
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
                    borderRadius: 1
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
                  cursor: 'pointer'
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
                  cursor: 'pointer'
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
                  cursor: 'pointer'
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
                  cursor: 'pointer'
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
          textAlign: 'left'
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

export default AccordionMenu;