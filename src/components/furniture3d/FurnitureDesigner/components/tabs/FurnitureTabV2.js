// src/components/furniture3d/FurnitureDesigner/components/tabs/FurnitureTabV2.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Button,
  Alert,
  Grid,
  Switch,
  Divider
} from '@mui/material';
import { useFurnitureStore } from '../../store/index';

// Fonction debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const FurnitureTabV2 = () => {
  const {
    furniture,
    constructionV2,
    totalDimensions,
    useNewConstructionSystem,
    toggleConstructionSystem,
    setAssemblyType,
    updateConstructionV2,
    setTotalDimensions,
    toggleCladding,
    regenerateScene
  } = useFurnitureStore();

  const [localDimensions, setLocalDimensions] = useState(totalDimensions);
  const [internalDimensions, setInternalDimensions] = useState({
    width: 0,
    height: 0,
    depth: 0
  });

  // Créer des versions debouncées des fonctions
  const debouncedUpdateConstructionV2 = useCallback(
    debounce((section, property, value) => {
      updateConstructionV2(section, property, value);
    }, 500),
    [updateConstructionV2]
  );

  const debouncedSetTotalDimensions = useCallback(
    debounce((dimensions) => {
      setTotalDimensions(dimensions);
    }, 500),
    [setTotalDimensions]
  );

  // Mise à jour des dimensions totales depuis le store
  useEffect(() => {
    setLocalDimensions(totalDimensions);
  }, [totalDimensions]);

  // Calculer les dimensions internes
  useEffect(() => {
    const cladding = constructionV2.cladding;
    const reduction = {
      width: 0,
      height: 0,
      depth: 0
    };
    
    if (cladding.left.enabled) reduction.width += cladding.left.thickness;
    if (cladding.right.enabled) reduction.width += cladding.right.thickness;
    if (cladding.top.enabled) reduction.height += cladding.top.thickness;
    if (cladding.bottom.enabled) reduction.height += cladding.bottom.thickness;
    
    setInternalDimensions({
      width: localDimensions.width - reduction.width,
      height: localDimensions.height - reduction.height,
      depth: localDimensions.depth - reduction.depth
    });
  }, [localDimensions, constructionV2.cladding]);

  const handleDimensionChange = (dimension, value) => {
    const newDimensions = {
      ...localDimensions,
      [dimension]: parseInt(value) || 0
    };
    setLocalDimensions(newDimensions);
  };

  const applyDimensions = () => {
    debouncedSetTotalDimensions(localDimensions);
  };

  // Gérer les changements de débordement
  const handleOverhangChange = (side, direction, value) => {
    const currentOverhang = constructionV2.cladding[side].overhang || {
      front: 0,
      back: 0,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    };
    
    debouncedUpdateConstructionV2('cladding', side, {
      ...constructionV2.cladding[side],
      overhang: {
        ...currentOverhang,
        [direction]: parseInt(value) || 0
      }
    });
  };

  // Gérer les changements d'épaisseur
  const handleThicknessChange = (side, value) => {
    debouncedUpdateConstructionV2('cladding', side, {
      ...constructionV2.cladding[side],
      thickness: parseInt(value) || 18
    });
  };

  // Activer/désactiver un panneau d'habillage
  const togglePanelCladding = (side, enabled) => {
    if (enabled) {
      // Désactiver le fileur correspondant si nécessaire
      const currentType = constructionV2.cladding[side].type;
      if (enabled && currentType === 'filler') {
        updateConstructionV2('cladding', side, {
          ...constructionV2.cladding[side],
          type: 'panel'
        });
      }
    }
    toggleCladding(side, enabled);
  };

  // Activer/désactiver un fileur
  const toggleFillerCladding = (side, enabled) => {
    if (enabled) {
      // Toujours définir le type comme 'filler' lors de l'activation
      updateConstructionV2('cladding', side, {
        ...constructionV2.cladding[side],
        type: 'filler'
      });
    }
    toggleCladding(side, enabled);
  };

  // Initialiser les propriétés de plinthe si elles n'existent pas
  useEffect(() => {
    console.log("Initialisation des plinthes:", {
      frontPlinth: constructionV2.base.frontPlinth,
      backPlinth: constructionV2.base.backPlinth,
      sidesExtendToFloor: constructionV2.base.sidesExtendToFloor,
      baseInset: constructionV2.base.baseInset,
      socle: constructionV2.base.socle
    });
    
    if (!constructionV2.base.frontPlinth) {
      console.log("Création frontPlinth");
      updateConstructionV2('base', 'frontPlinth', {
        enabled: false,
        thickness: 18,
        leftInset: 0,
        rightInset: 0
      });
    }
    
    if (!constructionV2.base.backPlinth) {
      console.log("Création backPlinth");
      updateConstructionV2('base', 'backPlinth', {
        enabled: false,
        thickness: 18,
        leftInset: 0,
        rightInset: 0
      });
    }
    
    if (constructionV2.base.sidesExtendToFloor === undefined) {
      console.log("Initialisation sidesExtendToFloor");
      updateConstructionV2('base', 'sidesExtendToFloor', false);
    }
    
    // Initialiser baseInset si non défini
    if (!constructionV2.base.baseInset) {
      console.log("Initialisation baseInset");
      updateConstructionV2('base', 'baseInset', {
        front: 0,
        back: 0,
        left: 0,
        right: 0
      });
    }
    
    // Initialiser socle si non défini
    if (!constructionV2.base.socle) {
      console.log("Initialisation socle");
      updateConstructionV2('base', 'socle', {
        enabled: false,
        sides: {
          enabled: true,
          thickness: 18
        },
        verticalSeparations: {
          enabled: false,
          count: 0,
          thickness: 18,
          autoDistribute: true,
          positions: []
        },
        topCoverage: {
          type: 'panel',
          thickness: 18,
          traverseWidth: 80
        }
      });
    }
  }, []);

  // Vérifier si des plinthes sont activées
  const hasPlinths = 
    (constructionV2.base.frontPlinth && constructionV2.base.frontPlinth.enabled) || 
    (constructionV2.base.backPlinth && constructionV2.base.backPlinth.enabled) ||
    (constructionV2.base.baseType === 'socle' && constructionV2.base.socle && constructionV2.base.socle.enabled);

  return (
    <Paper elevation={0} sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Configuration du meuble</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={useNewConstructionSystem}
              onChange={(e) => {
                e.stopPropagation();
                toggleConstructionSystem();
              }}
              color="primary"
            />
          }
          label="Nouveau système"
        />
      </Box>

      {!useNewConstructionSystem ? (
        <Alert severity="info">
          Le nouveau système de construction est désactivé. 
          Activez-le pour accéder aux options simplifiées d'assemblage et d'habillage.
        </Alert>
      ) : (
        <>
          {/* Dimensions totales */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              Dimensions totales (enveloppe extérieure)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Largeur"
                  type="number"
                  value={localDimensions.width}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleDimensionChange('width', e.target.value);
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">mm</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Hauteur"
                  type="number"
                  value={localDimensions.height}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleDimensionChange('height', e.target.value);
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">mm</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Profondeur"
                  type="number"
                  value={localDimensions.depth}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleDimensionChange('depth', e.target.value);
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">mm</InputAdornment>
                  }}
                />
              </Grid>
            </Grid>
            
            <Button 
              variant="contained" 
              onClick={(e) => {
                e.stopPropagation();
                applyDimensions();
              }}
              sx={{ mt: 2 }}
              fullWidth
            >
              Appliquer les dimensions
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Type d'assemblage */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              Type d'assemblage
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Assemblage</InputLabel>
              <Select
                value={constructionV2.basic.assemblyType}
                onChange={(e) => {
                  e.stopPropagation();
                  setAssemblyType(e.target.value);
                }}
                label="Assemblage"
              >
                <MenuItem value="overlap">Chevauchement (côtés sur dessus/dessous)</MenuItem>
                <MenuItem value="flush">Affleurant (dessus/dessous sur côtés)</MenuItem>
                <MenuItem value="miter">Onglet 45°</MenuItem>
              </Select>
            </FormControl>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              {constructionV2.basic.assemblyType === 'overlap' && 
                "Les côtés dépassent et viennent sur le dessus et le dessous. Plus simple à assembler."}
              {constructionV2.basic.assemblyType === 'flush' && 
                "Le dessus et le dessous vont d'un bord à l'autre. Finition moderne."}
              {constructionV2.basic.assemblyType === 'miter' && 
                "Assemblage à 45° pour une finition premium. Nécessite plus de précision."}
            </Alert>
            
            <TextField
              fullWidth
              label="Épaisseur des panneaux"
              type="number"
              value={constructionV2.basic.panelThickness}
              onChange={(e) => {
                e.stopPropagation();
                debouncedUpdateConstructionV2('basic', 'panelThickness', parseInt(e.target.value) || 18);
              }}
              InputProps={{
                endAdornment: <InputAdornment position="end">mm</InputAdornment>
              }}
              sx={{ mt: 2 }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* PLINTHES - Section modifiée avec les retraits avant/arrière */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              Plinthes
            </Typography>
            
            {/* RETRAITS COMMUNS AUX PLINTHES ET SOCLE */}
            <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Retraits généraux du socle</Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Hauteur du socle"
                    type="number"
                    value={constructionV2.base.baseHeight || 80}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateConstructionV2('base', 'baseHeight', parseInt(e.target.value) || 80);
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>
                    }}
                  />
                </Grid>
              </Grid>
              
              {/* Retraits globaux */}
              <Typography variant="body2" sx={{ mb: 1 }}>Retraits globaux</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Retrait avant"
                    type="number"
                    size="small"
                    value={constructionV2.base.baseInset?.front || 0}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateConstructionV2('base', 'baseInset', {
                        ...constructionV2.base.baseInset || {},
                        front: parseInt(e.target.value) || 0
                      });
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Retrait arrière"
                    type="number"
                    size="small"
                    value={constructionV2.base.baseInset?.back || 0}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateConstructionV2('base', 'baseInset', {
                        ...constructionV2.base.baseInset || {},
                        back: parseInt(e.target.value) || 0
                      });
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Retrait gauche"
                    type="number"
                    size="small"
                    value={constructionV2.base.baseInset?.left || 0}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateConstructionV2('base', 'baseInset', {
                        ...constructionV2.base.baseInset || {},
                        left: parseInt(e.target.value) || 0
                      });
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Retrait droit"
                    type="number"
                    size="small"
                    value={constructionV2.base.baseInset?.right || 0}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateConstructionV2('base', 'baseInset', {
                        ...constructionV2.base.baseInset || {},
                        right: parseInt(e.target.value) || 0
                      });
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
            
            {/* Plinthe avant */}
            <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={constructionV2.base.frontPlinth?.enabled || false}
                    onChange={(e) => {
                      e.stopPropagation();
                      
                      console.log("Toggle plinthe avant:", e.target.checked);
                      
                      // Assurer que l'objet frontPlinth existe
                      const frontPlinth = constructionV2.base.frontPlinth || {
                        thickness: 18,
                        leftInset: 0,
                        rightInset: 0
                      };
                      
                      // Mise à jour directe sans debounce
                      updateConstructionV2('base', 'frontPlinth', {
                        ...frontPlinth,
                        enabled: e.target.checked
                      });
                      
                      // Activer hasBase immédiatement si nécessaire
                      if (e.target.checked) {
                        updateConstructionV2('base', 'hasBase', true);
                        if (!constructionV2.base.baseType) {
                          updateConstructionV2('base', 'baseType', 'plinth');
                        }
                        
                        // Initialiser baseInset si nécessaire
                        if (!constructionV2.base.baseInset) {
                          updateConstructionV2('base', 'baseInset', {
                            front: 0,
                            back: 0,
                            left: 0,
                            right: 0
                          });
                        }
                      } else if (!constructionV2.base.backPlinth?.enabled) {
                        // Si les deux plinthes sont désactivées
                        updateConstructionV2('base', 'hasBase', false);
                      }
                      
                      // Forcer la régénération de la scène
                      setTimeout(() => regenerateScene(), 300);
                    }}
                  />
                }
                label="Plinthe avant"
              />
              
              {constructionV2.base.frontPlinth?.enabled && (
                <>
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Épaisseur"
                        type="number"
                        value={constructionV2.base.frontPlinth?.thickness || 18}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateConstructionV2('base', 'frontPlinth', {
                            ...constructionV2.base.frontPlinth,
                            thickness: parseInt(e.target.value) || 18
                          });
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>Retraits latéraux</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Gauche"
                        type="number"
                        size="small"
                        value={constructionV2.base.frontPlinth?.leftInset || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateConstructionV2('base', 'frontPlinth', {
                            ...constructionV2.base.frontPlinth,
                            leftInset: parseInt(e.target.value) || 0
                          });
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Droit"
                        type="number"
                        size="small"
                        value={constructionV2.base.frontPlinth?.rightInset || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateConstructionV2('base', 'frontPlinth', {
                            ...constructionV2.base.frontPlinth,
                            rightInset: parseInt(e.target.value) || 0
                          });
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
            
            {/* Plinthe arrière */}
            <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={constructionV2.base.backPlinth?.enabled || false}
                    onChange={(e) => {
                      e.stopPropagation();
                      
                      console.log("Toggle plinthe arrière:", e.target.checked);
                      
                      // Assurer que l'objet backPlinth existe
                      const backPlinth = constructionV2.base.backPlinth || {
                        thickness: 18,
                        leftInset: 0,
                        rightInset: 0
                      };
                      
                      // Mise à jour directe sans debounce
                      updateConstructionV2('base', 'backPlinth', {
                        ...backPlinth,
                        enabled: e.target.checked
                      });
                      
                      // Activer hasBase immédiatement si nécessaire
                      if (e.target.checked) {
                        updateConstructionV2('base', 'hasBase', true);
                        if (!constructionV2.base.baseType) {
                          updateConstructionV2('base', 'baseType', 'plinth');
                        }
                        
                        // Initialiser baseInset si nécessaire
                        if (!constructionV2.base.baseInset) {
                          updateConstructionV2('base', 'baseInset', {
                            front: 0,
                            back: 0,
                            left: 0,
                            right: 0
                          });
                        }
                      } else if (!constructionV2.base.frontPlinth?.enabled) {
                        // Si les deux plinthes sont désactivées
                        updateConstructionV2('base', 'hasBase', false);
                      }
                      
                      // Forcer la régénération de la scène
                      setTimeout(() => regenerateScene(), 300);
                    }}
                  />
                }
                label="Plinthe arrière"
              />
              
              {constructionV2.base.backPlinth?.enabled && (
                <>
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Épaisseur"
                        type="number"
                        value={constructionV2.base.backPlinth?.thickness || 18}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateConstructionV2('base', 'backPlinth', {
                            ...constructionV2.base.backPlinth,
                            thickness: parseInt(e.target.value) || 18
                          });
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>Retraits latéraux</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Gauche"
                        type="number"
                        size="small"
                        value={constructionV2.base.backPlinth?.leftInset || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateConstructionV2('base', 'backPlinth', {
                            ...constructionV2.base.backPlinth,
                            leftInset: parseInt(e.target.value) || 0
                          });
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Droit"
                        type="number"
                        size="small"
                        value={constructionV2.base.backPlinth?.rightInset || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateConstructionV2('base', 'backPlinth', {
                            ...constructionV2.base.backPlinth,
                            rightInset: parseInt(e.target.value) || 0
                          });
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
            
            {/* Socle complet */}
            <Box sx={{ mt: 3, mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={constructionV2.base.baseType === 'socle' && 
                            constructionV2.base.socle?.enabled === true}
                    onChange={(e) => {
                      e.stopPropagation();
                      
                      // Mettre à jour le type de base
                      updateConstructionV2('base', 'baseType', e.target.checked ? 'socle' : 'plinth');
                      
                      // Initialiser ou désactiver le socle
                      if (e.target.checked) {
                        if (!constructionV2.base.socle) {
                          updateConstructionV2('base', 'socle', {
                            enabled: true,
                            sides: {
                              enabled: true,
                              thickness: 18
                            },
                            verticalSeparations: {
                              enabled: false,
                              count: 0,
                              thickness: 18,
                              autoDistribute: true,
                              positions: []
                            },
                            topCoverage: {
                              type: 'panel',
                              thickness: 18,
                              traverseWidth: 80
                            }
                          });
                        } else {
                          updateConstructionV2('base', 'socle', {
                            ...constructionV2.base.socle,
                            enabled: true
                          });
                        }
                        
                        // Activer hasBase
                        updateConstructionV2('base', 'hasBase', true);
                      } else if (constructionV2.base.socle) {
                        updateConstructionV2('base', 'socle', {
                          ...constructionV2.base.socle,
                          enabled: false
                        });
                        
                        // Désactiver hasBase si aucune plinthe n'est activée
                        if (!constructionV2.base.frontPlinth?.enabled && 
                            !constructionV2.base.backPlinth?.enabled) {
                          updateConstructionV2('base', 'hasBase', false);
                        }
                      }
                      
                      // Régénérer la scène
                      setTimeout(() => regenerateScene(), 300);
                    }}
                  />
                }
                label="Socle complet"
              />
              
              {constructionV2.base.baseType === 'socle' && constructionV2.base.socle?.enabled && (
                <>
                  {/* Configuration des côtés du socle */}
                  <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>Côtés du socle</Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={constructionV2.base.socle?.sides?.enabled || false}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateConstructionV2('base', 'socle', {
                            ...constructionV2.base.socle,
                            sides: {
                              ...constructionV2.base.socle.sides,
                              enabled: e.target.checked
                            }
                          });
                        }}
                      />
                    }
                    label="Ajouter des côtés"
                  />
                  
                  {constructionV2.base.socle?.sides?.enabled && (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Épaisseur"
                          type="number"
                          size="small"
                          value={constructionV2.base.socle?.sides?.thickness || 18}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateConstructionV2('base', 'socle', {
                              ...constructionV2.base.socle,
                              sides: {
                                ...constructionV2.base.socle.sides,
                                thickness: parseInt(e.target.value) || 18
                              }
                            });
                          }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Grid>
                    </Grid>
                  )}
                  
                  {/* Séparations verticales */}
                  <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>Séparations verticales</Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={constructionV2.base.socle?.verticalSeparations?.enabled || false}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateConstructionV2('base', 'socle', {
                            ...constructionV2.base.socle,
                            verticalSeparations: {
                              ...constructionV2.base.socle.verticalSeparations,
                              enabled: e.target.checked
                            }
                          });
                        }}
                      />
                    }
                    label="Ajouter des séparations"
                  />
                  
                  {constructionV2.base.socle?.verticalSeparations?.enabled && (
                    <>
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Nombre"
                            type="number"
                            size="small"
                            value={constructionV2.base.socle?.verticalSeparations?.count || 0}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateConstructionV2('base', 'socle', {
                                ...constructionV2.base.socle,
                                verticalSeparations: {
                                  ...constructionV2.base.socle.verticalSeparations,
                                  count: parseInt(e.target.value) || 0
                                }
                              });
                            }}
                            InputProps={{
                              inputProps: { min: 0, max: 10 }
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Épaisseur"
                            type="number"
                            size="small"
                            value={constructionV2.base.socle?.verticalSeparations?.thickness || 18}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateConstructionV2('base', 'socle', {
                                ...constructionV2.base.socle,
                                verticalSeparations: {
                                  ...constructionV2.base.socle.verticalSeparations,
                                  thickness: parseInt(e.target.value) || 18
                                }
                              });
                            }}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">mm</InputAdornment>
                            }}
                          />
                        </Grid>
                      </Grid>
                      
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={constructionV2.base.socle?.verticalSeparations?.autoDistribute || false}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateConstructionV2('base', 'socle', {
                                ...constructionV2.base.socle,
                                verticalSeparations: {
                                  ...constructionV2.base.socle.verticalSeparations,
                                  autoDistribute: e.target.checked
                                }
                              });
                            }}
                          />
                        }
                        label="Distribution automatique"
                      />
                    </>
                  )}
                  
                  {/* Type de couverture supérieure */}
                  <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>Couverture supérieure</Typography>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={constructionV2.base.socle?.topCoverage?.type || 'panel'}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateConstructionV2('base', 'socle', {
                          ...constructionV2.base.socle,
                          topCoverage: {
                            ...constructionV2.base.socle.topCoverage,
                            type: e.target.value
                          }
                        });
                      }}
                      label="Type"
                    >
                      <MenuItem value="panel">Panneau complet</MenuItem>
                      <MenuItem value="traverses">Traverses avant/arrière</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Épaisseur"
                        type="number"
                        size="small"
                        value={constructionV2.base.socle?.topCoverage?.thickness || 18}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateConstructionV2('base', 'socle', {
                            ...constructionV2.base.socle,
                            topCoverage: {
                              ...constructionV2.base.socle.topCoverage,
                              thickness: parseInt(e.target.value) || 18
                            }
                          });
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                    
                    {constructionV2.base.socle?.topCoverage?.type === 'traverses' && (
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Largeur traverses"
                          type="number"
                          size="small"
                          value={constructionV2.base.socle?.topCoverage?.traverseWidth || 80}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateConstructionV2('base', 'socle', {
                              ...constructionV2.base.socle,
                              topCoverage: {
                                ...constructionV2.base.socle.topCoverage,
                                traverseWidth: parseInt(e.target.value) || 80
                              }
                            });
                          }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </>
              )}
            </Box>
            
            {/* Option "Côtés jusqu'au sol" - conditionnelle à l'activation des plinthes */}
            {hasPlinths && (
              <Box sx={{ mt: 3, mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={constructionV2.base.sidesExtendToFloor || false}
                      onChange={(e) => {
                        e.stopPropagation();
                        const sidesExtend = e.target.checked;
                        
                        // Log pour debug
                        console.log("Côtés jusqu'au sol:", sidesExtend);
                        
                        // Mettre à jour l'option directement sans debounce
                        updateConstructionV2('base', 'sidesExtendToFloor', sidesExtend);
                        
                        // Si activé, désactiver l'habillage bas car incompatible
                        if (sidesExtend && constructionV2.cladding.bottom.enabled) {
                          toggleCladding('bottom', false);
                        }
                        
                        // Forcer la régénération de la scène
                        setTimeout(() => regenerateScene(), 300);
                      }}
                    />
                  }
                  label="Côtés jusqu'au sol"
                />
                
                {constructionV2.base.sidesExtendToFloor && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Lorsque les côtés vont jusqu'au sol, le dessous du meuble est posé entre les côtés.
                    L'habillage bas n'est pas disponible dans cette configuration.
                  </Alert>
                )}
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Panneaux d'habillage - SÉPARÉ DES FILEURS */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              Panneaux d'habillage
            </Typography>
            
            {/* Panneau gauche */}
            <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={constructionV2.cladding.left.enabled && constructionV2.cladding.left.type === 'panel'}
                    onChange={(e) => {
                      e.stopPropagation();
                      // Si activé, s'assurer que le type est 'panel'
                      if (e.target.checked) {
                        updateConstructionV2('cladding', 'left', {
                          ...constructionV2.cladding.left,
                          type: 'panel'
                        });
                        toggleCladding('left', true);
                      } else {
                        toggleCladding('left', false);
                      }
                    }}
                  />
                }
                label="Panneau gauche"
              />
              
              {constructionV2.cladding.left.enabled && constructionV2.cladding.left.type === 'panel' && (
                <>
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Épaisseur"
                        type="number"
                        value={constructionV2.cladding.left.thickness}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleThicknessChange('left', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  {/* Débordements */}
                  <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>Débordements</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Avant"
                        type="number"
                        size="small"
                        value={constructionV2.cladding.left.overhang?.front || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleOverhangChange('left', 'front', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Arrière"
                        type="number"
                        size="small"
                        value={constructionV2.cladding.left.overhang?.back || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleOverhangChange('left', 'back', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Haut"
                        type="number"
                        size="small"
                        value={constructionV2.cladding.left.overhang?.top || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleOverhangChange('left', 'top', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Bas"
                        type="number"
                        size="small"
                        value={constructionV2.cladding.left.overhang?.bottom || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleOverhangChange('left', 'bottom', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
            
            {/* Panneau droit */}
            <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={constructionV2.cladding.right.enabled && constructionV2.cladding.right.type === 'panel'}
                    onChange={(e) => {
                      e.stopPropagation();
                      // Si activé, s'assurer que le type est 'panel'
                      if (e.target.checked) {
                        updateConstructionV2('cladding', 'right', {
                          ...constructionV2.cladding.right,
                          type: 'panel'
                        });
                        toggleCladding('right', true);
                      } else {
                        toggleCladding('right', false);
                      }
                    }}
                  />
                }
                label="Panneau droit"
              />
              
              {constructionV2.cladding.right.enabled && constructionV2.cladding.right.type === 'panel' && (
                <>
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Épaisseur"
                        type="number"
                        value={constructionV2.cladding.right.thickness}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleThicknessChange('right', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  {/* Débordements */}
                  <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>Débordements</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Avant"
                        type="number"
                        size="small"
                        value={constructionV2.cladding.right.overhang?.front || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleOverhangChange('right', 'front', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Arrière"
                        type="number"
                        size="small"
                        value={constructionV2.cladding.right.overhang?.back || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleOverhangChange('right', 'back', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Haut"
                        type="number"
                        size="small"
                        value={constructionV2.cladding.right.overhang?.top || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleOverhangChange('right', 'top', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Bas"
                        type="number"
                        size="small"
                        value={constructionV2.cladding.right.overhang?.bottom || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleOverhangChange('right', 'bottom', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
            
            {/* Panneau supérieur - MODIFIÉ pour vérifier le type 'panel' */}
            <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={constructionV2.cladding.top.enabled && constructionV2.cladding.top.type === 'panel'}
                    onChange={(e) => {
                      e.stopPropagation();
                      // Si activé, s'assurer que le type est 'panel'
                      if (e.target.checked) {
                        updateConstructionV2('cladding', 'top', {
                          ...constructionV2.cladding.top,
                          type: 'panel'
                        });
                        toggleCladding('top', true);
                      } else {
                        toggleCladding('top', false);
                      }
                    }}
                  />
                }
                label="Panneau supérieur"
              />
              
              {constructionV2.cladding.top.enabled && constructionV2.cladding.top.type === 'panel' && (
                <>
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Épaisseur"
                        type="number"
                        value={constructionV2.cladding.top.thickness}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleThicknessChange('top', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  {/* Débordements */}
                  <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>Débordements</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Avant"
                        type="number"
                        size="small"
                        value={constructionV2.cladding.top.overhang?.front || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleOverhangChange('top', 'front', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Arrière"
                        type="number"
                        size="small"
                        value={constructionV2.cladding.top.overhang?.back || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleOverhangChange('top', 'back', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Gauche"
                        type="number"
                        size="small"
                        value={constructionV2.cladding.top.overhang?.left || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleOverhangChange('top', 'left', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Droite"
                        type="number"
                        size="small"
                        value={constructionV2.cladding.top.overhang?.right || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleOverhangChange('top', 'right', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
            
            {/* Panneau inférieur - désactivé si les côtés vont jusqu'au sol */}
            <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={constructionV2.cladding.bottom.enabled}
                    disabled={constructionV2.base.sidesExtendToFloor || false}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleCladding('bottom', e.target.checked);
                    }}
                  />
                }
                label="Panneau inférieur"
              />
              
              {constructionV2.base.sidesExtendToFloor && (
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', ml: 4, mt: 0.5 }}>
                  Non disponible quand les côtés vont jusqu'au sol
                </Typography>
              )}
              
              {constructionV2.cladding.bottom.enabled && !constructionV2.base.sidesExtendToFloor && (
                <>
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Épaisseur"
                        type="number"
                        value={constructionV2.cladding.bottom.thickness}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleThicknessChange('bottom', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  {/* Débordements */}
                  <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>Débordements</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Avant"
                        type="number"
                        size="small"
                        value={constructionV2.cladding.bottom.overhang?.front || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleOverhangChange('bottom', 'front', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Arrière"
                        type="number"
                        size="small"
                        value={constructionV2.cladding.bottom.overhang?.back || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleOverhangChange('bottom', 'back', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Gauche"
                        type="number"
                        size="small"
                        value={constructionV2.cladding.bottom.overhang?.left || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleOverhangChange('bottom', 'left', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Droite"
                        type="number"
                        size="small"
                        value={constructionV2.cladding.bottom.overhang?.right || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleOverhangChange('bottom', 'right', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Fileurs - NOUVELLE SECTION SÉPARÉE */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              Fileurs
            </Typography>
            
            {/* Fileur gauche */}
            <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={constructionV2.cladding.left.enabled && constructionV2.cladding.left.type === 'filler'}
                    onChange={(e) => {
                      e.stopPropagation();
                      // Si activé, s'assurer que le type est 'filler'
                      if (e.target.checked) {
                        updateConstructionV2('cladding', 'left', {
                          ...constructionV2.cladding.left,
                          type: 'filler'
                        });
                        toggleCladding('left', true);
                      } else {
                        toggleCladding('left', false);
                      }
                    }}
                  />
                }
                label="Fileur gauche"
              />
              
              {constructionV2.cladding.left.enabled && constructionV2.cladding.left.type === 'filler' && (
                <>
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Épaisseur"
                        type="number"
                        value={constructionV2.cladding.left.thickness}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleThicknessChange('left', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  {/* Débordements */}
                  <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>Débordements</Typography>

                  {/* Débordements principaux - Haut/Bas */}
                  <Box sx={{ p: 1, bgcolor: '#f8f8f8', borderRadius: 1, mb: 1 }}>
                    <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 1 }}>
                      Débordements principaux pour fileur latéral
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Haut"
                          type="number"
                          size="small"
                          value={constructionV2.cladding.left.overhang?.top || 0}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleOverhangChange('left', 'top', e.target.value);
                          }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Bas"
                          type="number"
                          size="small"
                          value={constructionV2.cladding.left.overhang?.bottom || 0}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleOverhangChange('left', 'bottom', e.target.value);
                          }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Débordements secondaires - Avant/Arrière */}
                  <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                      Débordements secondaires
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Avant"
                          type="number"
                          size="small"
                          value={constructionV2.cladding.left.overhang?.front || 0}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleOverhangChange('left', 'front', e.target.value);
                          }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Arrière"
                          type="number"
                          size="small"
                          value={constructionV2.cladding.left.overhang?.back || 0}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleOverhangChange('left', 'back', e.target.value);
                          }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </Box>
            
            {/* Fileur droit */}
            <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={constructionV2.cladding.right.enabled && constructionV2.cladding.right.type === 'filler'}
                    onChange={(e) => {
                      e.stopPropagation();
                      // Si activé, s'assurer que le type est 'filler'
                      if (e.target.checked) {
                        updateConstructionV2('cladding', 'right', {
                          ...constructionV2.cladding.right,
                          type: 'filler'
                        });
                        toggleCladding('right', true);
                      } else {
                        toggleCladding('right', false);
                      }
                    }}
                  />
                }
                label="Fileur droit"
              />
              
              {constructionV2.cladding.right.enabled && constructionV2.cladding.right.type === 'filler' && (
                <>
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Épaisseur"
                        type="number"
                        value={constructionV2.cladding.right.thickness}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleThicknessChange('right', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  {/* Débordements */}
                  <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>Débordements</Typography>

                  {/* Débordements principaux - Haut/Bas */}
                  <Box sx={{ p: 1, bgcolor: '#f8f8f8', borderRadius: 1, mb: 1 }}>
                    <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 1 }}>
                      Débordements principaux pour fileur latéral
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Haut"
                          type="number"
                          size="small"
                          value={constructionV2.cladding.right.overhang?.top || 0}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleOverhangChange('right', 'top', e.target.value);
                          }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Bas"
                          type="number"
                          size="small"
                          value={constructionV2.cladding.right.overhang?.bottom || 0}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleOverhangChange('right', 'bottom', e.target.value);
                          }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Débordements secondaires - Avant/Arrière */}
                  <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                      Débordements secondaires
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Avant"
                          type="number"
                          size="small"
                          value={constructionV2.cladding.right.overhang?.front || 0}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleOverhangChange('right', 'front', e.target.value);
                          }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Arrière"
                          type="number"
                          size="small"
                          value={constructionV2.cladding.right.overhang?.back || 0}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleOverhangChange('right', 'back', e.target.value);
                          }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </Box>
            
            {/* NOUVEAU: Fileur supérieur */}
            <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={constructionV2.cladding.top.enabled && constructionV2.cladding.top.type === 'filler'}
                    onChange={(e) => {
                      e.stopPropagation();
                      // Si activé, s'assurer que le type est 'filler'
                      if (e.target.checked) {
                        updateConstructionV2('cladding', 'top', {
                          ...constructionV2.cladding.top,
                          type: 'filler'
                        });
                        toggleCladding('top', true);
                      } else {
                        toggleCladding('top', false);
                      }
                    }}
                  />
                }
                label="Fileur supérieur"
              />
              
              {constructionV2.cladding.top.enabled && constructionV2.cladding.top.type === 'filler' && (
                <>
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Épaisseur"
                        type="number"
                        value={constructionV2.cladding.top.thickness}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleThicknessChange('top', e.target.value);
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">mm</InputAdornment>
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  {/* Débordements */}
                  <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>Débordements</Typography>

                  {/* Débordements principaux - Gauche/Droite */}
                  <Box sx={{ p: 1, bgcolor: '#f8f8f8', borderRadius: 1, mb: 1 }}>
                    <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 1 }}>
                      Débordements principaux pour fileur supérieur
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Gauche"
                          type="number"
                          size="small"
                          value={constructionV2.cladding.top.overhang?.left || 0}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleOverhangChange('top', 'left', e.target.value);
                          }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Droite"
                          type="number"
                          size="small"
                          value={constructionV2.cladding.top.overhang?.right || 0}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleOverhangChange('top', 'right', e.target.value);
                          }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Débordements secondaires - Avant/Arrière */}
                  <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                      Débordements secondaires
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Avant"
                          type="number"
                          size="small"
                          value={constructionV2.cladding.top.overhang?.front || 0}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleOverhangChange('top', 'front', e.target.value);
                          }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Arrière"
                          type="number"
                          size="small"
                          value={constructionV2.cladding.top.overhang?.back || 0}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleOverhangChange('top', 'back', e.target.value);
                          }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Dimensions calculées */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              Dimensions calculées
            </Typography>
            <Alert severity="success">
              <Typography>
                <strong>Dimensions totales:</strong> {localDimensions.width} × {localDimensions.height} × {localDimensions.depth} mm
              </Typography>
              <Typography>
                <strong>Meuble principal:</strong> {internalDimensions.width} × {internalDimensions.height} × {internalDimensions.depth} mm
              </Typography>
            </Alert>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default FurnitureTabV2;