// src/components/furniture3d/FurnitureDesigner/components/ParametricWardrobeDesigner.js
import React, { useState, useEffect } from 'react';
import {
  Box, 
  Typography, 
  TextField, 
  InputAdornment, 
  Button, 
  Paper, 
  Grid, 
  FormControlLabel, 
  Checkbox,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButton,
  ToggleButtonGroup,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  RadioGroup,
  Radio,
  FormGroup,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ViewColumn as ViewColumnIcon,
  Layers as LayersIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon,
  ViewList as ShelvesIcon,
  Inbox as DrawerIcon,
  ContentPaste as SeparatorIcon,
  Style as EdgeBandingIcon
} from '@mui/icons-material';
import { useFurnitureStore } from '../store';

const ParametricWardrobeDesigner = () => {
  // États principaux
  const [activeStep, setActiveStep] = useState(0);
  const [mainDimensions, setMainDimensions] = useState({
    width: 2000,
    height: 2200,
    depth: 600,
    material: null,
    color: '#FFFFFF'
  });
  
  const [plinths, setPlinths] = useState({
    enabled: true,
    front: true,
    back: false,
    height: 120,
    frontSetback: 0,
    backSetback: 0
  });
  
  const [decorativeElements, setDecorativeElements] = useState({
    left: { enabled: false, width: 20, frontSetback: 0, backSetback: 0 },
    right: { enabled: false, width: 20, frontSetback: 0, backSetback: 0 },
    top: { enabled: false, height: 20, frontSetback: 0, backSetback: 0 },
    bottom: { enabled: false, height: 20, frontSetback: 0, backSetback: 0 }
  });
  
  const [columns, setColumns] = useState([]);
  const [separators, setSeparators] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneContentDialog, setZoneContentDialog] = useState(false);
  const [separatorDialog, setSeparatorDialog] = useState(false);
  const [edgeBandingDialog, setEdgeBandingDialog] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  
  const [globalSettings, setGlobalSettings] = useState({
    thickness: 18,
    edgeThickness: 1,
    defaultGap: 2,
    backPanelThickness: 8,
    backPanelSetback: 10,
    hasBackPanel: true
  });
  
  const { resetScene, addParametricWardrobe } = useFurnitureStore();
  
  // Initialisation avec une configuration par défaut
  useEffect(() => {
    initializeDefault();
  }, []);
  
  const initializeDefault = () => {
    const defaultColumns = [{
      id: 1,
      width: mainDimensions.width,
      depth: mainDimensions.depth,
      zones: [{
        id: 1,
        content: 'empty',
        heightPercent: 100,
        position: 0
      }]
    }];
    setColumns(defaultColumns);
  };
  
  // Gestion des étapes
  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };
  
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };
  
  // Gestion des dimensions principales
  const handleMainDimensionChange = (field, value) => {
    setMainDimensions(prev => ({
      ...prev,
      [field]: parseInt(value, 10) || 0
    }));
  };
  
  // Gestion des plinthes
  const handlePlinthChange = (field, value) => {
    setPlinths(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Gestion des fileurs
  const handleDecorativeChange = (position, field, value) => {
    setDecorativeElements(prev => ({
      ...prev,
      [position]: {
        ...prev[position],
        [field]: value
      }
    }));
  };
  
  // Gestion des séparations verticales
  const addVerticalSeparator = () => {
    setSeparatorDialog(true);
  };
  
  const createSeparator = (type, count, options) => {
    const newSeparators = [];
    const totalWidth = mainDimensions.width;
    const gap = (options.evenlySpaced && count > 1) ? totalWidth / (count + 1) : 0;
    
    for (let i = 0; i < count; i++) {
      newSeparators.push({
        id: Date.now() + i,
        type: type, // 'simple' ou 'double'
        position: options.evenlySpaced ? gap * (i + 1) : options.positions[i] || 0,
        depth: options.customDepth ? options.depth : mainDimensions.depth,
        alignment: options.alignment || 'center',
        frontSetback: options.frontSetback || 0,
        backSetback: options.backSetback || 0,
        doubleSpacing: type === 'double' ? options.doubleSpacing || 10 : 0
      });
    }
    
    setSeparators(prev => [...prev, ...newSeparators]);
    updateColumnsFromSeparators([...separators, ...newSeparators]);
  };
  
  // Mettre à jour les colonnes basées sur les séparations
  const updateColumnsFromSeparators = (currentSeparators) => {
    const sortedSeparators = [...currentSeparators].sort((a, b) => a.position - b.position);
    const newColumns = [];
    
    let lastPosition = 0;
    sortedSeparators.forEach((separator, index) => {
      if (separator.position > lastPosition) {
        newColumns.push({
          id: Date.now() + index,
          width: separator.position - lastPosition,
          depth: mainDimensions.depth,
          zones: [{
            id: Date.now() + 1000 + index,
            content: 'empty',
            heightPercent: 100,
            position: 0
          }]
        });
      }
      lastPosition = separator.position + (separator.type === 'double' ? separator.doubleSpacing : globalSettings.thickness);
    });
    
    // Dernière colonne
    if (lastPosition < mainDimensions.width) {
      newColumns.push({
        id: Date.now() + 1000,
        width: mainDimensions.width - lastPosition,
        depth: mainDimensions.depth,
        zones: [{
          id: Date.now() + 2000,
          content: 'empty',
          heightPercent: 100,
          position: 0
        }]
      });
    }
    
    setColumns(newColumns);
  };
  
  // Gestion du contenu des zones
  const openZoneContentDialog = (columnId, zoneId) => {
    setSelectedColumn(columnId);
    setSelectedZone(zoneId);
    setZoneContentDialog(true);
  };
  
  const setZoneContent = (contentType) => {
    const column = columns.find(c => c.id === selectedColumn);
    const zone = column.zones.find(z => z.id === selectedZone);
    
    setColumns(prev => prev.map(col => {
      if (col.id === selectedColumn) {
        return {
          ...col,
          zones: col.zones.map(z => {
            if (z.id === selectedZone) {
              return {
                ...z,
                content: contentType,
                settings: getDefaultContentSettings(contentType)
              };
            }
            return z;
          })
        };
      }
      return col;
    }));
    
    setZoneContentDialog(false);
  };
  
  const getDefaultContentSettings = (contentType) => {
    switch (contentType) {
      case 'shelf':
        return {
          count: 1,
          frontSetback: 0,
          backSetback: 0,
          withBackPanel: true
        };
      case 'drawer':
        return {
          frontGap: 2,
          backGap: 2,
          leftGap: 2,
          rightGap: 2,
          sideHeight: 80,
          bottomThickness: 8,
          backThickness: 8
        };
      case 'hanging':
        return {
          barDiameter: 30,
          barPosition: 'top'
        };
      case 'horizontalSeparator':
        return {
          type: 'single',
          spacing: 0, // pour double
          position: 50 // pourcentage
        };
      default:
        return {};
    }
  };
  
  // Ajout de zone horizontale
  const addHorizontalZone = (columnId, afterZoneId) => {
    setColumns(prev => prev.map(col => {
      if (col.id === columnId) {
        const zoneIndex = col.zones.findIndex(z => z.id === afterZoneId);
        const afterZone = col.zones[zoneIndex];
        const remainingHeight = afterZone.heightPercent / 2;
        
        const newZones = [...col.zones];
        newZones[zoneIndex] = {
          ...afterZone,
          heightPercent: remainingHeight
        };
        newZones.splice(zoneIndex + 1, 0, {
          id: Date.now(),
          content: 'empty',
          heightPercent: remainingHeight,
          position: afterZone.position + remainingHeight
        });
        
        return { ...col, zones: newZones };
      }
      return col;
    }));
  };
  
  // Génération du meuble
  const generateWardrobe = () => {
    resetScene();
    
    const wardrobeConfig = {
      mainDimensions,
      plinths,
      decorativeElements,
      columns,
      separators,
      globalSettings
    };
    
    addParametricWardrobe(wardrobeConfig);
  };
  
  // Composants de l'interface
  const SeparatorCreationDialog = () => {
    const [type, setType] = useState('simple');
    const [count, setCount] = useState(1);
    const [evenlySpaced, setEvenlySpaced] = useState(true);
    const [customDepth, setCustomDepth] = useState(false);
    const [depth, setDepth] = useState(mainDimensions.depth);
    const [alignment, setAlignment] = useState('center');
    const [frontSetback, setFrontSetback] = useState(0);
    const [backSetback, setBackSetback] = useState(0);
    const [doubleSpacing, setDoubleSpacing] = useState(10);
    
    return (
      <Dialog open={separatorDialog} onClose={() => setSeparatorDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configurer les séparations verticales</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select value={type} onChange={(e) => setType(e.target.value)} label="Type">
                <MenuItem value="simple">Séparation simple</MenuItem>
                <MenuItem value="double">Séparations doubles</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Nombre de séparations"
              type="number"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10))}
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={evenlySpaced}
                  onChange={(e) => setEvenlySpaced(e.target.checked)}
                />
              }
              label="Espacées régulièrement"
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={customDepth}
                  onChange={(e) => setCustomDepth(e.target.checked)}
                />
              }
              label="Profondeur personnalisée"
              sx={{ mb: 2 }}
            />
            
            {customDepth && (
              <>
                <TextField
                  fullWidth
                  label="Profondeur"
                  type="number"
                  value={depth}
                  onChange={(e) => setDepth(parseInt(e.target.value, 10))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                  }}
                  sx={{ mb: 2 }}
                />
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Alignement</InputLabel>
                  <Select value={alignment} onChange={(e) => setAlignment(e.target.value)} label="Alignement">
                    <MenuItem value="front">Avant</MenuItem>
                    <MenuItem value="center">Centré</MenuItem>
                    <MenuItem value="back">Arrière</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  label="Retrait avant"
                  type="number"
                  value={frontSetback}
                  onChange={(e) => setFrontSetback(parseInt(e.target.value, 10))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                  }}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Retrait arrière"
                  type="number"
                  value={backSetback}
                  onChange={(e) => setBackSetback(parseInt(e.target.value, 10))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                  }}
                  sx={{ mb: 2 }}
                />
              </>
            )}
            
            {type === 'double' && (
              <TextField
                fullWidth
                label="Espacement double séparation"
                type="number"
                value={doubleSpacing}
                onChange={(e) => setDoubleSpacing(parseInt(e.target.value, 10))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSeparatorDialog(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              createSeparator(type, count, {
                evenlySpaced,
                customDepth,
                depth,
                alignment,
                frontSetback,
                backSetback,
                doubleSpacing
              });
              setSeparatorDialog(false);
            }}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  const ZoneContentDialog = () => (
    <Dialog open={zoneContentDialog} onClose={() => setZoneContentDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Choisir le contenu de la zone</DialogTitle>
      <DialogContent>
        <List>
          <ListItemButton onClick={() => setZoneContent('empty')}>
            <ListItemIcon><LayersIcon /></ListItemIcon>
            <ListItemText primary="Vide" />
          </ListItemButton>
          <ListItemButton onClick={() => setZoneContent('shelf')}>
            <ListItemIcon><ShelvesIcon /></ListItemIcon>
            <ListItemText primary="Étagères" />
          </ListItemButton>
          <ListItemButton onClick={() => setZoneContent('drawer')}>
            <ListItemIcon><DrawerIcon /></ListItemIcon>
            <ListItemText primary="Tiroirs" />
          </ListItemButton>
          <ListItemButton onClick={() => setZoneContent('hanging')}>
            <ListItemIcon><ViewColumnIcon /></ListItemIcon>
            <ListItemText primary="Penderie" />
          </ListItemButton>
          <ListItemButton onClick={() => setZoneContent('horizontalSeparator')}>
            <ListItemIcon><SeparatorIcon /></ListItemIcon>
            <ListItemText primary="Séparation horizontale" />
          </ListItemButton>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setZoneContentDialog(false)}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
  
  const EdgeBandingDialog = () => {
    const [edgeBanding, setEdgeBanding] = useState({
      front: true,
      back: false,
      left: true,
      right: true
    });
    
    return (
      <Dialog open={edgeBandingDialog} onClose={() => setEdgeBandingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Placage de chant</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox checked={edgeBanding.front} onChange={(e) => setEdgeBanding(prev => ({...prev, front: e.target.checked}))} />}
                label="Chant avant"
              />
              <FormControlLabel
                control={<Checkbox checked={edgeBanding.back} onChange={(e) => setEdgeBanding(prev => ({...prev, back: e.target.checked}))} />}
                label="Chant arrière"
              />
              <FormControlLabel
                control={<Checkbox checked={edgeBanding.left} onChange={(e) => setEdgeBanding(prev => ({...prev, left: e.target.checked}))} />}
                label="Chant gauche"
              />
              <FormControlLabel
                control={<Checkbox checked={edgeBanding.right} onChange={(e) => setEdgeBanding(prev => ({...prev, right: e.target.checked}))} />}
                label="Chant droit"
              />
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEdgeBandingDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
        Configurateur de Dressing
      </Typography>
      
      <Stepper activeStep={activeStep} orientation="vertical">
        {/* Étape 1: Dimensions principales */}
        <Step>
          <StepLabel>Dimensions principales</StepLabel>
          <StepContent>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Dimensions globales
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Largeur"
                    type="number"
                    value={mainDimensions.width}
                    onChange={(e) => handleMainDimensionChange('width', e.target.value)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                    }}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Hauteur"
                    type="number"
                    value={mainDimensions.height}
                    onChange={(e) => handleMainDimensionChange('height', e.target.value)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                    }}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Profondeur"
                    type="number"
                    value={mainDimensions.depth}
                    onChange={(e) => handleMainDimensionChange('depth', e.target.value)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                    }}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Paper>
            
            <Box sx={{ mb: 1 }}>
              <Button variant="contained" color="primary" onClick={handleNext}>
                Suivant
              </Button>
            </Box>
          </StepContent>
        </Step>
        
        {/* Étape 2: Plinthes et fileurs */}
        <Step>
          <StepLabel>Plinthes et éléments décoratifs</StepLabel>
          <StepContent>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Plinthes
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={plinths.enabled}
                    onChange={(e) => handlePlinthChange('enabled', e.target.checked)}
                  />
                }
                label="Activer les plinthes"
              />
              
              {plinths.enabled && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={plinths.front}
                          onChange={(e) => handlePlinthChange('front', e.target.checked)}
                        />
                      }
                      label="Avant"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={plinths.back}
                          onChange={(e) => handlePlinthChange('back', e.target.checked)}
                        />
                      }
                      label="Arrière"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Hauteur plinthe"
                      type="number"
                      value={plinths.height}
                      onChange={(e) => handlePlinthChange('height', parseInt(e.target.value, 10))}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                      }}
                      size="small"
                    />
                  </Grid>
                </Grid>
              )}
            </Paper>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Fileurs décoratifs
              </Typography>
              
              {Object.entries(decorativeElements).map(([position, settings]) => (
                <Accordion key={position}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{position.charAt(0).toUpperCase() + position.slice(1)}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={settings.enabled}
                          onChange={(e) => handleDecorativeChange(position, 'enabled', e.target.checked)}
                        />
                      }
                      label="Activer"
                    />
                    
                    {settings.enabled && (
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label={['left', 'right'].includes(position) ? "Largeur" : "Hauteur"}
                            type="number"
                            value={['left', 'right'].includes(position) ? settings.width : settings.height}
                            onChange={(e) => handleDecorativeChange(position, 
                              ['left', 'right'].includes(position) ? 'width' : 'height', 
                              parseInt(e.target.value, 10))}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                            }}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Retrait avant"
                            type="number"
                            value={settings.frontSetback}
                            onChange={(e) => handleDecorativeChange(position, 'frontSetback', parseInt(e.target.value, 10))}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                            }}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Retrait arrière"
                            type="number"
                            value={settings.backSetback}
                            onChange={(e) => handleDecorativeChange(position, 'backSetback', parseInt(e.target.value, 10))}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                            }}
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Paper>
            
            <Box sx={{ mb: 1 }}>
              <Button variant="contained" color="primary" onClick={handleNext} sx={{ mr: 1 }}>
                Suivant
              </Button>
              <Button onClick={handleBack}>
                Retour
              </Button>
            </Box>
          </StepContent>
        </Step>
        
        {/* Étape 3: Divisions verticales */}
        <Step>
          <StepLabel>Divisions et colonnes</StepLabel>
          <StepContent>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Séparations verticales
              </Typography>
              
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={addVerticalSeparator}
                sx={{ mb: 2 }}
              >
                Ajouter des séparations
              </Button>
              
              {separators.length > 0 && (
                <List>
                  {separators.map((separator) => (
                    <ListItem key={separator.id}>
                      <ListItemText
                        primary={`${separator.type === 'double' ? 'Double' : 'Simple'} - Position: ${separator.position}mm`}
                        secondary={`Profondeur: ${separator.depth}mm, Alignement: ${separator.alignment}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="delete" onClick={() => {
                          setSeparators(prev => prev.filter(s => s.id !== separator.id));
                          updateColumnsFromSeparators(separators.filter(s => s.id !== separator.id));
                        }}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Colonnes générées
              </Typography>
              
              {columns.map((column, index) => (
                <Paper key={column.id} variant="outlined" sx={{ p: 1, mb: 1 }}>
                  <Typography variant="body2">
                    Colonne {index + 1}: {column.width}mm de large
                  </Typography>
                  <Button 
                    size="small" 
                    startIcon={<LayersIcon />}
                    onClick={() => setSelectedColumn(column.id)}
                  >
                    Gérer les zones
                  </Button>
                </Paper>
              ))}
            </Paper>
            
            <Box sx={{ mb: 1 }}>
              <Button variant="contained" color="primary" onClick={handleNext} sx={{ mr: 1 }}>
                Suivant
              </Button>
              <Button onClick={handleBack}>
                Retour
              </Button>
            </Box>
          </StepContent>
        </Step>
        
        {/* Étape 4: Contenu des zones */}
        <Step>
          <StepLabel>Contenu des zones</StepLabel>
          <StepContent>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Organisation interne
              </Typography>
              
              {columns.map((column, columnIndex) => (
                <Accordion key={column.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Colonne {columnIndex + 1} ({column.width}mm)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {column.zones.map((zone, zoneIndex) => (
                      <Paper key={zone.id} variant="outlined" sx={{ p: 1, mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">
                            Zone {zoneIndex + 1}: {zone.content}
                          </Typography>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => openZoneContentDialog(column.id, zone.id)}
                            >
                              <SettingsIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => addHorizontalZone(column.id, zone.id)}
                            >
                              <AddCircleIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Paper>
            
            <Box sx={{ mb: 1 }}>
              <Button variant="contained" color="primary" onClick={handleNext} sx={{ mr: 1 }}>
                Suivant
              </Button>
              <Button onClick={handleBack}>
                Retour
              </Button>
            </Box>
          </StepContent>
        </Step>
        
        {/* Étape 5: Finition */}
        <Step>
          <StepLabel>Finition et génération</StepLabel>
          <StepContent>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Paramètres globaux
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Épaisseur panneau"
                    type="number"
                    value={globalSettings.thickness}
                    onChange={(e) => setGlobalSettings(prev => ({...prev, thickness: parseInt(e.target.value, 10)}))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                    }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Épaisseur chant"
                    type="number"
                    value={globalSettings.edgeThickness}
                    onChange={(e) => setGlobalSettings(prev => ({...prev, edgeThickness: parseInt(e.target.value, 10)}))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                    }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={globalSettings.hasBackPanel}
                        onChange={(e) => setGlobalSettings(prev => ({...prev, hasBackPanel: e.target.checked}))}
                      />
                    }
                    label="Panneau arrière"
                  />
                </Grid>
              </Grid>
            </Paper>
            
            <Button 
              variant="contained" 
              size="large"
              startIcon={<SaveIcon />}
              onClick={generateWardrobe}
              color="primary"
              fullWidth
            >
              Générer le dressing
            </Button>
            
            <Box sx={{ mt: 2 }}>
              <Button onClick={handleBack}>
                Retour
              </Button>
            </Box>
          </StepContent>
        </Step>
      </Stepper>
      
      <SeparatorCreationDialog />
      <ZoneContentDialog />
      <EdgeBandingDialog />
    </Box>
  );
};

export default ParametricWardrobeDesigner;