// src/components/furniture3d/FurnitureDesigner/components/FurnitureBuilder.js
import React, { useState, useEffect } from 'react';
import {
  Box, 
  Typography, 
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Divider,
  Grid,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ShelvesIcon,
  Settings as SettingsIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useFurnitureStore } from '../store';

const FurnitureBuilder = ({ 
  availableMaterials = [],  // Matériaux disponibles dans l'app
  availableEdgeBanding = [], // Chants disponibles
  availableHardware = [],   // Quincaillerie disponible
  onSaveFurniture = null    // Callback pour sauvegarde
}) => {
  // États pour la construction du meuble
  const [activeStep, setActiveStep] = useState(0);
  const [furnitureType, setFurnitureType] = useState('wardrobe'); // wardrobe, shelf, desk, etc.
  const [mainDimensions, setMainDimensions] = useState({
    width: 1000,    // Largeur en mm
    height: 2000,   // Hauteur en mm 
    depth: 500,     // Profondeur en mm
    material: null, // Matériau sélectionné
  });
  
  const [constructionOptions, setConstructionOptions] = useState({
    hasPlinths: true,         // Plinthes
    hasBackPanel: true,       // Panneau arrière
    panelThickness: 18,       // Épaisseur panneau standard
    backPanelThickness: 8,    // Épaisseur panneau arrière
    hasDecorations: false,    // Éléments décoratifs
    useBeams: false,          // Utilisation de tasseaux
  });
  
  const [internalLayout, setInternalLayout] = useState({
    verticalSeparators: [],   // Séparations verticales
    horizontalSeparators: [], // Séparations horizontales
    shelves: [],              // Étagères
    drawers: [],              // Tiroirs
    hangingRods: []           // Tringles à vêtements
  });
  
  const [accessories, setAccessories] = useState({
    handles: [],              // Poignées
    hinges: [],               // Charnières
    adjustableLegs: []        // Pieds réglables
  });
  
  const { resetScene, generateFurniture } = useFurnitureStore();
  
  // Étapes du configurateur
  const steps = [
    {
      label: 'Type et dimensions',
      component: <TypeAndDimensionsStep 
                    furnitureType={furnitureType}
                    setFurnitureType={setFurnitureType}
                    mainDimensions={mainDimensions}
                    setMainDimensions={setMainDimensions}
                    availableMaterials={availableMaterials}
                 />
    },
    {
      label: 'Construction',
      component: <ConstructionStep 
                    constructionOptions={constructionOptions}
                    setConstructionOptions={setConstructionOptions}
                 />
    },
    {
      label: 'Aménagement intérieur',
      component: <InternalLayoutStep 
                    internalLayout={internalLayout}
                    setInternalLayout={setInternalLayout}
                    mainDimensions={mainDimensions}
                    constructionOptions={constructionOptions}
                 />
    },
    {
      label: 'Finitions',
      component: <FinishingStep 
                    accessories={accessories}
                    setAccessories={setAccessories}
                    availableHardware={availableHardware}
                    availableEdgeBanding={availableEdgeBanding}
                 />
    }
  ];
  
  // Navigation dans les étapes
  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };
  
  // Génération du meuble
  const handleGenerateFurniture = () => {
    // Réinitialisation de la scène
    resetScene();
    
    // Construction du modèle complet à envoyer au store
    const furnitureModel = {
      type: furnitureType,
      dimensions: mainDimensions,
      options: constructionOptions,
      layout: internalLayout,
      accessories: accessories
    };
    
    // Appel à la fonction de génération du store
    generateFurniture(furnitureModel);
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configurateur de meuble
      </Typography>
      
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>{step.label}</StepLabel>
            <StepContent>
              {step.component}
              
              <Box sx={{ mt: 2 }}>
                {index < steps.length - 1 ? (
                  <Button variant="contained" onClick={handleNext}>
                    Suivant
                  </Button>
                ) : (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<SaveIcon />}
                    onClick={handleGenerateFurniture}
                  >
                    Générer le meuble
                  </Button>
                )}
                
                {index > 0 && (
                  <Button 
                    onClick={handleBack}
                    sx={{ ml: 1 }}
                  >
                    Retour
                  </Button>
                )}
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

// Sous-composants pour chaque étape
const TypeAndDimensionsStep = ({ 
  furnitureType, 
  setFurnitureType,
  mainDimensions,
  setMainDimensions,
  availableMaterials
}) => {
  // Types de meubles disponibles
  const furnitureTypes = [
    { value: 'wardrobe', label: 'Dressing/Armoire' },
    { value: 'shelf', label: 'Étagère/Bibliothèque' },
    { value: 'desk', label: 'Bureau' },
    { value: 'cabinet', label: 'Meuble bas' },
    { value: 'custom', label: 'Personnalisé' }
  ];
  
  // Mise à jour des dimensions
  const handleDimensionChange = (dimension, value) => {
    setMainDimensions(prev => ({
      ...prev,
      [dimension]: parseInt(value, 10) || 0
    }));
  };
  
  // Sélection du matériau
  const handleMaterialChange = (materialId) => {
    setMainDimensions(prev => ({
      ...prev,
      material: materialId
    }));
  };
  
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Type de meuble
      </Typography>
      
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Type de meuble</InputLabel>
        <Select
          value={furnitureType}
          onChange={(e) => setFurnitureType(e.target.value)}
          label="Type de meuble"
        >
          {furnitureTypes.map(type => (
            <MenuItem key={type.value} value={type.value}>
              {type.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle1" gutterBottom>
        Dimensions
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Largeur"
            type="number"
            value={mainDimensions.width}
            onChange={(e) => handleDimensionChange('width', e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">mm</InputAdornment>,
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Hauteur"
            type="number"
            value={mainDimensions.height}
            onChange={(e) => handleDimensionChange('height', e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">mm</InputAdornment>,
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Profondeur"
            type="number"
            value={mainDimensions.depth}
            onChange={(e) => handleDimensionChange('depth', e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">mm</InputAdornment>,
            }}
          />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle1" gutterBottom>
        Matériau principal
      </Typography>
      
      <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
        {availableMaterials.length > 0 ? (
          availableMaterials.map(material => (
            <FormControlLabel
              key={material.id}
              control={
                <Checkbox 
                  checked={mainDimensions.material === material.id}
                  onChange={() => handleMaterialChange(material.id)}
                />
              }
              label={`${material.name} - ${material.thickness}mm - ${material.color}`}
            />
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            Aucun matériau disponible
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

const ConstructionStep = ({ constructionOptions, setConstructionOptions }) => {
  // Mise à jour des options de construction
  const handleOptionChange = (option, value) => {
    setConstructionOptions(prev => ({
      ...prev,
      [option]: typeof value === 'boolean' ? value : parseInt(value, 10) || 0
    }));
  };
  
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Options de construction
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={constructionOptions.hasPlinths}
                onChange={(e) => handleOptionChange('hasPlinths', e.target.checked)}
              />
            }
            label="Plinthes"
          />
        </Grid>
        
        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={constructionOptions.hasBackPanel}
                onChange={(e) => handleOptionChange('hasBackPanel', e.target.checked)}
              />
            }
            label="Panneau arrière"
          />
        </Grid>
        
        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={constructionOptions.hasDecorations}
                onChange={(e) => handleOptionChange('hasDecorations', e.target.checked)}
              />
            }
            label="Éléments décoratifs"
          />
        </Grid>
        
        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={constructionOptions.useBeams}
                onChange={(e) => handleOptionChange('useBeams', e.target.checked)}
              />
            }
            label="Utiliser des tasseaux"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Épaisseur panneau"
            type="number"
            value={constructionOptions.panelThickness}
            onChange={(e) => handleOptionChange('panelThickness', e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">mm</InputAdornment>,
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Épaisseur panneau arrière"
            type="number"
            value={constructionOptions.backPanelThickness}
            onChange={(e) => handleOptionChange('backPanelThickness', e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">mm</InputAdornment>,
            }}
            disabled={!constructionOptions.hasBackPanel}
          />
        </Grid>
      </Grid>
      
      {constructionOptions.hasDecorations && (
        <>
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Éléments décoratifs
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Configuration des fileurs et bandeaux décoratifs...
          </Typography>
          
          {/* Formulaire pour les éléments décoratifs */}
        </>
      )}
    </Paper>
  );
};

const InternalLayoutStep = ({ 
  internalLayout, 
  setInternalLayout, 
  mainDimensions,
  constructionOptions
}) => {
  const [activeTab, setActiveTab] = useState(0);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Ajout d'une séparation verticale
  const addVerticalSeparator = () => {
    const newSeparator = {
      id: Date.now(),
      position: Math.floor(mainDimensions.width / 2),
      depth: mainDimensions.depth,
      thickness: constructionOptions.panelThickness
    };
    
    setInternalLayout(prev => ({
      ...prev,
      verticalSeparators: [...prev.verticalSeparators, newSeparator]
    }));
  };
  
  // Ajout d'une étagère
  const addShelf = () => {
    const newShelf = {
      id: Date.now(),
      position: Math.floor(mainDimensions.height / 2),
      width: mainDimensions.width,
      depth: mainDimensions.depth,
      thickness: constructionOptions.panelThickness
    };
    
    setInternalLayout(prev => ({
      ...prev,
      shelves: [...prev.shelves, newShelf]
    }));
  };
  
  return (
    <Paper sx={{ p: 2 }}>
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Séparations" />
        <Tab label="Étagères" />
        <Tab label="Tiroirs" />
        <Tab label="Penderies" />
      </Tabs>
      
      <Box sx={{ p: 2 }}>
        {activeTab === 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Séparations verticales
              </Typography>
              <Button 
                startIcon={<AddIcon />}
                variant="outlined" 
                size="small"
                onClick={addVerticalSeparator}
              >
                Ajouter
              </Button>
            </Box>
            
            {internalLayout.verticalSeparators.length > 0 ? (
              internalLayout.verticalSeparators.map(separator => (
                <Accordion key={separator.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Séparation à {separator.position}mm</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {/* Contrôles pour cette séparation */}
                    <TextField
                      label="Position"
                      type="number"
                      value={separator.position}
                      onChange={(e) => {
                        // Mise à jour de la position
                      }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                      }}
                      fullWidth
                      margin="normal"
                    />
                    <Button 
                      startIcon={<DeleteIcon />}
                      color="error"
                      onClick={() => {
                        // Suppression de la séparation
                      }}
                    >
                      Supprimer
                    </Button>
                  </AccordionDetails>
                </Accordion>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                Aucune séparation verticale
              </Typography>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Séparations horizontales
              </Typography>
              <Button 
                startIcon={<AddIcon />}
                variant="outlined" 
                size="small"
              >
                Ajouter
              </Button>
            </Box>
            
            {internalLayout.horizontalSeparators.length > 0 ? (
              <Typography variant="body2">
                Séparations horizontales...
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Aucune séparation horizontale
              </Typography>
            )}
          </>
        )}
        
        {activeTab === 1 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Étagères
              </Typography>
              <Button 
                startIcon={<AddIcon />}
                variant="outlined" 
                size="small"
                onClick={addShelf}
              >
                Ajouter
              </Button>
            </Box>
            
            {internalLayout.shelves.length > 0 ? (
              internalLayout.shelves.map(shelf => (
                <Accordion key={shelf.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Étagère à {shelf.position}mm</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {/* Contrôles pour cette étagère */}
                    <TextField
                      label="Hauteur"
                      type="number"
                      value={shelf.position}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                      }}
                      fullWidth
                      margin="normal"
                    />
                    <Button 
                      startIcon={<DeleteIcon />}
                      color="error"
                    >
                      Supprimer
                    </Button>
                  </AccordionDetails>
                </Accordion>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                Aucune étagère
              </Typography>
            )}
          </>
        )}
        
        {activeTab === 2 && (
          <Typography variant="body2">
            Configuration des tiroirs...
          </Typography>
        )}
        
        {activeTab === 3 && (
          <Typography variant="body2">
            Configuration des penderies...
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

const FinishingStep = ({ 
  accessories, 
  setAccessories,
  availableHardware,
  availableEdgeBanding
}) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Finitions
      </Typography>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Placage de chant</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2">
            Configuration des chants...
          </Typography>
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Quincaillerie</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2">
            Configuration de la quincaillerie...
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default FurnitureBuilder;