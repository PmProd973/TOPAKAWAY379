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
  IconButton,
  Drawer
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useFurnitureStore } from './store';
import MainToolbar from './MainToolbar';
import Scene3D from './Scene3D';

// Composant accordéon qui s'intègre avec le système existant
const AccordionItem = ({ number, title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <ListItem 
        disablePadding 
        onClick={() => setOpen(!open)}
        sx={{ 
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)', 
          bgcolor: '#1e3a8a',
          color: 'white',
          '&:hover': {
            bgcolor: '#152967',
          }
        }}
      >
        <ListItemButton sx={{ py: 1 }}>
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
            primaryTypographyProps={{ fontWeight: 'bold' }} 
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

// Composant principal qui intègre MainToolbar, le menu accordéon et Scene3D
const FurnitureDesignerPanel = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTab, setCurrentTab] = useState('MEUBLE');
  const [tabContent, setTabContent] = useState(null);
  
  // Récupérer le store
  const furnitureStore = useFurnitureStore();
  
  // Récupérer les dimensions du meuble
  const { width, height, depth } = furnitureStore.furniture.dimensions;
  
  // Accéder au prix à partir du furnitureStore si disponible
  // Cette partie dépend de comment vous stockez cette information
  const price = "2 225,99 €"; // À remplacer par la valeur réelle de votre store
  
  // Gestion du changement d'onglet
  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    // Ici, vous pouvez mettre à jour le contenu de l'onglet en fonction du tab
    // Cette logique dépend de votre implémentation actuelle
  };
  
  // Mise à jour des dimensions
  const handleDimensionChange = (dimension, value) => {
    if (furnitureStore) {
      furnitureStore.updateFurnitureDimensions(dimension, parseInt(value, 10));
    }
  };
  
  // Types de meubles disponibles (à adapter selon vos besoins)
  const furnitureTypes = [
    { id: 'wardrobe', label: 'Bibliothèque' },
    { id: 'bookcase', label: 'Bibliothèque tv' },
    { id: 'cabinet', label: 'Meuble bas' },
    { id: 'corner', label: 'Meuble en angle' },
    { id: 'closet', label: 'Dressing fermé' },
    { id: 'open_closet', label: 'Dressing ouvert' },
    { id: 'sliding_doors', label: 'Portes Coulissantes' },
    { id: 'claustra', label: 'Claustra' },
    { id: 'window', label: 'Verrière' }
  ];
  
  // Gestion du changement de type de meuble
  const handleFurnitureTypeChange = (type) => {
    if (furnitureStore) {
      furnitureStore.updateFurnitureType(type);
    }
  };
  
  // Désactiver l'élément authenticadepApp
  useEffect(() => {
    // Cette fonction est déjà présente dans votre Scene3D.js
    const disableAuthenticadepApp = () => {
      const authenticadepApp = document.getElementById('authenticadepApp');
      if (authenticadepApp) {
        authenticadepApp.style.display = 'none';
        authenticadepApp.style.height = '0';
        authenticadepApp.style.width = '0';
        authenticadepApp.style.overflow = 'hidden';
        authenticadepApp.style.position = 'absolute';
        authenticadepApp.style.zIndex = '-9999';
      }
      
      const potentialOverlays = document.querySelectorAll('div[style*="position: fixed"]');
      potentialOverlays.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.width > 1000 && rect.height > 900) {
          element.style.display = 'none';
          element.style.zIndex = '-9999';
        }
      });
    };
    
    disableAuthenticadepApp();
    
    // Ajouter un style global pour s'assurer que l'élément reste désactivé
    const style = document.createElement('style');
    style.innerHTML = `
      #authenticadepApp {
        display: none !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
        position: absolute !important;
        z-index: -9999 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        bgcolor: '#f0f0f0',
      }}
    >
      {/* Bandeau promotionnel en haut */}
      <Box 
        sx={{ 
          width: '100%', 
          bgcolor: '#e64a19', 
          color: 'white',
          p: 0.5,
          textAlign: 'center',
          fontWeight: 'bold'
        }}
      >
        <Typography variant="body2">
          -20% code MOBIDAYS ❤️
        </Typography>
      </Box>
      
      {/* MainToolbar existant (importé) */}
      <MainToolbar />
      
      {/* Contenu principal */}
      <Box 
        sx={{ 
          display: 'flex',
          flexGrow: 1,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Panneau latéral avec accordéon */}
        <Box 
          sx={{
            width: 430,
            flexShrink: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #e0e0e0',
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="subtitle1" sx={{ p: 2, fontWeight: 'bold' }}>
            Configuration du meuble
          </Typography>
          
          <List sx={{ width: '100%', flexGrow: 1, overflow: 'auto' }}>
            {/* Type de meuble */}
            <AccordionItem number="1" title="Type de meuble" defaultOpen={true}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {furnitureTypes.map((type) => (
                  <Button 
                    key={type.id}
                    variant={furnitureStore.furniture.type === type.id ? "contained" : "outlined"}
                    color={furnitureStore.furniture.type === type.id ? "primary" : "inherit"}
                    size="small"
                    onClick={() => handleFurnitureTypeChange(type.id)}
                    sx={{
                      borderRadius: '20px',
                      textTransform: 'none',
                      m: 0.5
                    }}
                  >
                    {type.label}
                  </Button>
                ))}
              </Box>
            </AccordionItem>
            
            {/* Dimensions */}
            <AccordionItem number="2" title="Dimensions">
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography>Largeur</Typography>
                </Grid>
                <Grid item xs={8}>
                  <TextField 
                    size="small" 
                    value={width} 
                    onChange={(e) => handleDimensionChange('width', e.target.value)}
                    fullWidth 
                    InputProps={{
                      endAdornment: <Typography variant="caption">mm</Typography>
                    }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Typography>Hauteur</Typography>
                </Grid>
                <Grid item xs={8}>
                  <TextField 
                    size="small" 
                    value={height} 
                    onChange={(e) => handleDimensionChange('height', e.target.value)}
                    fullWidth 
                    InputProps={{
                      endAdornment: <Typography variant="caption">mm</Typography>
                    }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Typography>Profondeur</Typography>
                </Grid>
                <Grid item xs={8}>
                  <TextField 
                    size="small" 
                    value={depth} 
                    onChange={(e) => handleDimensionChange('depth', e.target.value)}
                    fullWidth 
                    InputProps={{
                      endAdornment: <Typography variant="caption">mm</Typography>
                    }}
                  />
                </Grid>
              </Grid>
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
                      onClick={() => furnitureStore.updateConstructionOption('socleSupports', 2)}
                    >
                      <Typography>||</Typography>
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
                      onClick={() => furnitureStore.updateConstructionOption('socleSupports', 3)}
                    >
                      <Typography>|||</Typography>
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
                      onClick={() => furnitureStore.updateConstructionOption('socleSupports', 4)}
                    >
                      <Typography>||||</Typography>
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
                    onClick={() => furnitureStore.setFurnitureMaterial('8B4513')}
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
                    onClick={() => furnitureStore.setFurnitureMaterial('D2B48C')}
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
                    onClick={() => furnitureStore.setFurnitureMaterial('FFFFFF')}
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
                    onClick={() => furnitureStore.setFurnitureMaterial('808080')}
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
              borderTop: '1px solid #e0e0e0',
              textAlign: 'left'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {price}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              La livraison est incluse !
            </Typography>
          </Box>
        </Box>
        
        {/* Zone de visualisation 3D */}
        <Box 
          sx={{ 
            flexGrow: 1,
            position: 'relative',
            height: '100%'
          }}
        >
          <Scene3D />
        </Box>
      </Box>
      
      {/* Styles globaux */}
      <style>
        {`
          canvas {
            width: 100% !important;
            height: 100% !important;
            outline: none;
          }
        `}
      </style>
    </Box>
  );
};

export default FurnitureDesignerPanel;