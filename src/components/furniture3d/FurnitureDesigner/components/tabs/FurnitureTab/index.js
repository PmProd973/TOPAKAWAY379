// src/components/furniture3d/FurnitureDesigner/components/tabs/FurnitureTab/index.js
import React from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Slider,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useFurnitureStore } from '../../../store';

const FurnitureTab = () => {
  const {
    furniture,
    updateFurnitureDimensions,
    updateFurnitureType,
    updateFurniturePosition,
    updateConstructionOption,
    availableMaterials,
    setFurnitureMaterial,
    updateFurnitureRotation,
    updateFurniturePlacement,
    regenerateScene
  } = useFurnitureStore();

  // Types de meubles disponibles
  const furnitureTypes = [
    { value: 'wardrobe', label: 'Armoire/Dressing' },
    { value: 'bookcase', label: 'Bibliothèque' },
    { value: 'cabinet', label: 'Meuble bas' },
    { value: 'desk', label: 'Bureau' },
    { value: 'custom', label: 'Personnalisé' }
  ];

  const handleDimensionChange = (dimension, value) => {
    updateFurnitureDimensions(dimension, parseInt(value, 10) || 0);
  };

  // Gestion des retraits de plinthes
  const handlePlinthInsetChange = (side, value) => {
    // Mettre à jour l'option de retrait spécifique
    const plinthInsets = {
      ...(furniture.construction.plinthInsets || {
        front: 0,
        back: 0,
        left: 0,
        right: 0
      }),
      [side]: parseInt(value, 10) || 0
    };
    updateConstructionOption('plinthInsets', plinthInsets);
  };

  // Gestion des options de rainure pour le panneau arrière
  const handleBackPanelGrooveChange = (side, value) => {
    // Mettre à jour l'option de rainure spécifique
    const backPanelGroove = {
      ...(furniture.construction.backPanelGroove || {
        top: false,
        bottom: false,
        left: false,
        right: false
      }),
      [side]: value
    };
    updateConstructionOption('backPanelGroove', backPanelGroove);
  };

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Configuration du meuble</Typography>

      {/* Type de meuble */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Type de meuble</Typography>
        <FormControl fullWidth>
          <InputLabel>Type</InputLabel>
          <Select
            value={furniture.type}
            onChange={(e) => updateFurnitureType(e.target.value)}
            label="Type"
          >
            {furnitureTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Dimensions principales */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Dimensions principales</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Largeur"
              type="number"
              value={furniture.dimensions.width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">mm</InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Hauteur"
              type="number"
              value={furniture.dimensions.height}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">mm</InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Profondeur"
              type="number"
              value={furniture.dimensions.depth}
              onChange={(e) => handleDimensionChange('depth', e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">mm</InputAdornment>
              }}
            />
          </Grid>
        </Grid>
      </Box>

     
      <Divider sx={{ my: 2 }} />

      {/* Positionnement sur un mur */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Placement contre un mur</Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Mur de référence</InputLabel>
          <Select
            value={furniture.placement?.wall || "none"}
            onChange={(e) => {
              const wallValue = e.target.value;
              // Calculer automatiquement la position basée sur le mur sélectionné
              if (wallValue !== "none") {
                const { room, furniture } = useFurnitureStore.getState();
                let newPosition = { ...furniture.position };
                
                switch (wallValue) {
                  case "back":
                    // Placer le meuble contre le mur du fond
                    newPosition.z = -room.depth/2 + furniture.dimensions.depth/2;
                    newPosition.x = 0; // Centré par défaut
                    break;
                  case "left":
                    // Placer le meuble contre le mur de gauche
                    newPosition.x = -room.width/2 + furniture.dimensions.width/2;
                    newPosition.z = 0; // Centré par défaut
                    // Rotation à 90 degrés
                    updateFurnitureRotation(0, Math.PI/2, 0);
                    break;
                  case "right":
                    // Placer le meuble contre le mur de droite
                    newPosition.x = room.width/2 - furniture.dimensions.width/2;
                    newPosition.z = 0; // Centré par défaut
                    // Rotation à -90 degrés
                    updateFurnitureRotation(0, -Math.PI/2, 0);
                    break;
                  default:
                    break;
                }
                
                // Mettre à jour la position
                updateFurniturePosition('x', newPosition.x);
                updateFurniturePosition('z', newPosition.z);
                
                // Sauvegarder le mur de référence
                updateFurniturePlacement('wall', wallValue);
              } else {
                // Réinitialiser la rotation si aucun mur n'est sélectionné
                updateFurnitureRotation(0, 0, 0);
                updateFurniturePlacement('wall', null);
              }
            }}
            label="Mur de référence"
          >
            <MenuItem value="none">Aucun (libre)</MenuItem>
            <MenuItem value="back">Mur du fond</MenuItem>
            <MenuItem value="left">Mur de gauche</MenuItem>
            <MenuItem value="right">Mur de droite</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth>
          <InputLabel>Alignement horizontal</InputLabel>
          <Select
            value={furniture.placement?.alignH || "center"}
            onChange={(e) => {
              const alignValue = e.target.value;
              const { room, furniture } = useFurnitureStore.getState();
              let newPosition = { ...furniture.position };
              
              // Ajuster la position horizontale selon l'alignement choisi
              if (furniture.placement?.wall === "back") {
                // Alignement le long du mur du fond
                switch (alignValue) {
                  case "left":
                    newPosition.x = -room.width/2 + furniture.dimensions.width/2;
                    break;
                  case "center":
                    newPosition.x = 0;
                    break;
                  case "right":
                    newPosition.x = room.width/2 - furniture.dimensions.width/2;
                    break;
                  default:
                    break;
                }
                updateFurniturePosition('x', newPosition.x);
              } else if (furniture.placement?.wall === "left" || furniture.placement?.wall === "right") {
                // Alignement le long du mur gauche ou droit
                switch (alignValue) {
                  case "left":
                    newPosition.z = -room.depth/2 + furniture.dimensions.width/2;
                    break;
                  case "center":
                    newPosition.z = 0;
                    break;
                  case "right":
                    newPosition.z = room.depth/2 - furniture.dimensions.width/2;
                    break;
                  default:
                    break;
                }
                updateFurniturePosition('z', newPosition.z);
              }
              
              updateFurniturePlacement('alignH', alignValue);
            }}
            label="Alignement horizontal"
            disabled={!furniture.placement?.wall}
          >
            <MenuItem value="left">Gauche</MenuItem>
            <MenuItem value="center">Centré</MenuItem>
            <MenuItem value="right">Droite</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Position du meuble */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Position dans la pièce</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Position X"
              type="number"
              value={furniture.position.x}
              onChange={(e) => updateFurniturePosition('x', parseInt(e.target.value, 10) || 0)}
              InputProps={{
                endAdornment: <InputAdornment position="end">mm</InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Position Y"
              type="number"
              value={furniture.position.y}
              onChange={(e) => updateFurniturePosition('y', parseInt(e.target.value, 10) || 0)}
              InputProps={{
                endAdornment: <InputAdornment position="end">mm</InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Position Z"
              type="number"
              value={furniture.position.z}
              onChange={(e) => updateFurniturePosition('z', parseInt(e.target.value, 10) || 0)}
              InputProps={{
                endAdornment: <InputAdornment position="end">mm</InputAdornment>
              }}
            />
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Options de construction */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Options de construction</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Épaisseur panneau"
              type="number"
              value={furniture.construction.panelThickness}
              onChange={(e) => updateConstructionOption('panelThickness', parseInt(e.target.value, 10) || 0)}
              InputProps={{
                endAdornment: <InputAdornment position="end">mm</InputAdornment>
              }}
            />
          </Grid>

          {/* Nouvelle option pour le débordement des côtés */}
          <Grid item xs={12} sm={6}>
  <FormControlLabel
    control={
      <Checkbox
        checked={furniture.construction.sidesOverlapTopBottom !== false}
        onChange={(e) => updateConstructionOption('sidesOverlapTopBottom', e.target.checked)}
      />
    }
    label="Côtés débordent sur dessus/dessous"
  />
</Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={furniture.construction.hasPlinths}
                  onChange={(e) => updateConstructionOption('hasPlinths', e.target.checked)}
                />
              }
              label="Ajouter plinthes"
            />
          </Grid>

          {furniture.construction.hasPlinths && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hauteur plinthe"
                  type="number"
                  value={furniture.construction.plinthHeight}
                  onChange={(e) => updateConstructionOption('plinthHeight', parseInt(e.target.value, 10) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">mm</InputAdornment>
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={furniture.construction.sidesExtendToFloor || false}
                      onChange={(e) => updateConstructionOption('sidesExtendToFloor', e.target.checked)}
                    />
                  }
                  label="Côtés jusqu'au sol"
                />
              </Grid>
              
              {/* Retraits des plinthes - Section accordion pour ne pas encombrer l'interface */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Retrait des plinthes</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Retrait avant"
                          type="number"
                          value={(furniture.construction.plinthInsets || {}).front || 0}
                          onChange={(e) => handlePlinthInsetChange('front', e.target.value)}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Retrait arrière"
                          type="number"
                          value={(furniture.construction.plinthInsets || {}).back || 0}
                          onChange={(e) => handlePlinthInsetChange('back', e.target.value)}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Retrait gauche"
                          type="number"
                          value={(furniture.construction.plinthInsets || {}).left || 0}
                          onChange={(e) => handlePlinthInsetChange('left', e.target.value)}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Retrait droit"
                          type="number"
                          value={(furniture.construction.plinthInsets || {}).right || 0}
                          onChange={(e) => handlePlinthInsetChange('right', e.target.value)}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
              
              {/* Configuration du socle */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Configuration du socle</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Séparations verticales"
                          type="number"
                          value={furniture.construction.socleSupports || 0}
                          onChange={(e) => updateConstructionOption('socleSupports', parseInt(e.target.value, 10) || 0)}
                          InputProps={{
                            inputProps: { min: 0, max: 10 }
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={furniture.construction.socleSideSupports || false}
                              onChange={(e) => updateConstructionOption('socleSideSupports', e.target.checked)}
                            />
                          }
                          label="Ajouter côtés au socle"
                        />
                      </Grid>
                      
                      {(furniture.construction.socleSupports > 0 || furniture.construction.socleSideSupports) && (
                        <>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                              <InputLabel>Type de dessus de socle</InputLabel>
                              <Select
                                value={furniture.construction.socleTopType || 'panel'}
                                onChange={(e) => updateConstructionOption('socleTopType', e.target.value)}
                                label="Type de dessus de socle"
                              >
                                <MenuItem value="panel">Panneau complet</MenuItem>
                                <MenuItem value="traverses">Traverses</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          {furniture.construction.socleTopType === 'traverses' && (
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Largeur des traverses"
                                type="number"
                                value={furniture.construction.socleTraverseWidth || 60}
                                onChange={(e) => updateConstructionOption('socleTraverseWidth', parseInt(e.target.value, 10) || 60)}
                                InputProps={{
                                  endAdornment: <InputAdornment position="end">mm</InputAdornment>
                                }}
                              />
                            </Grid>
                          )}
                        </>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </>
          )}

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={furniture.construction.hasBackPanel}
                  onChange={(e) => updateConstructionOption('hasBackPanel', e.target.checked)}
                />
              }
              label="Ajouter panneau arrière"
            />
          </Grid>

          
          {furniture.construction.hasBackPanel && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Épaisseur panneau arrière"
                  type="number"
                  value={furniture.construction.backPanelThickness}
                  onChange={(e) => updateConstructionOption('backPanelThickness', parseInt(e.target.value, 10) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">mm</InputAdornment>
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Retrait panneau arrière"
                  type="number"
                  value={furniture.construction.backPanelInset || 0}
                  onChange={(e) => updateConstructionOption('backPanelInset', parseInt(e.target.value, 10) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">mm</InputAdornment>
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Jeu pour rainure"
                  type="number"
                  value={furniture.construction.backPanelGap || 0}
                  onChange={(e) => updateConstructionOption('backPanelGap', parseInt(e.target.value, 10) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">mm</InputAdornment>
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Débordement pour rainure"
                  type="number"
                  value={furniture.construction.backPanelOverhang || 0}
                  onChange={(e) => updateConstructionOption('backPanelOverhang', parseInt(e.target.value, 10) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">mm</InputAdornment>
                  }}
                />
              </Grid>
              
              {/* Options avancées du panneau arrière */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Options avancées pour panneau arrière</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>Panneau traversant sur</Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={6} sm={3}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={furniture.construction.backPanelThrough?.top || false}
                                  onChange={(e) => {
                                    const newBackPanelThrough = {
                                      ...(furniture.construction.backPanelThrough || {}),
                                      top: e.target.checked
                                    };
                                    updateConstructionOption('backPanelThrough', newBackPanelThrough);
                                  }}
                                />
                              }
                              label="Dessus"
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={furniture.construction.backPanelThrough?.bottom || false}
                                  onChange={(e) => {
                                    const newBackPanelThrough = {
                                      ...(furniture.construction.backPanelThrough || {}),
                                      bottom: e.target.checked
                                    };
                                    updateConstructionOption('backPanelThrough', newBackPanelThrough);
                                  }}
                                />
                              }
                              label="Dessous"
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={furniture.construction.backPanelThrough?.left || false}
                                  onChange={(e) => {
                                    const newBackPanelThrough = {
                                      ...(furniture.construction.backPanelThrough || {}),
                                      left: e.target.checked
                                    };
                                    updateConstructionOption('backPanelThrough', newBackPanelThrough);
                                  }}
                                />
                              }
                              label="Côté gauche"
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={furniture.construction.backPanelThrough?.right || false}
                                  onChange={(e) => {
                                    const newBackPanelThrough = {
                                      ...(furniture.construction.backPanelThrough || {}),
                                      right: e.target.checked
                                    };
                                    updateConstructionOption('backPanelThrough', newBackPanelThrough);
                                  }}
                                />
                              }
                              label="Côté droit"
                            />
                          </Grid>
                        </Grid>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>Créer une rainure sur</Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={6} sm={3}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={furniture.construction.backPanelGroove?.top || false}
                                  onChange={(e) => handleBackPanelGrooveChange('top', e.target.checked)}
                                  disabled={!furniture.construction.backPanelThrough?.top}
                                />
                              }
                              label="Dessus"
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={furniture.construction.backPanelGroove?.bottom || false}
                                  onChange={(e) => handleBackPanelGrooveChange('bottom', e.target.checked)}
                                  disabled={!furniture.construction.backPanelThrough?.bottom}
                                />
                              }
                              label="Dessous"
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={furniture.construction.backPanelGroove?.left || false}
                                  onChange={(e) => handleBackPanelGrooveChange('left', e.target.checked)}
                                  disabled={!furniture.construction.backPanelThrough?.left}
                                />
                              }
                              label="Côté gauche"
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={furniture.construction.backPanelGroove?.right || false}
                                  onChange={(e) => handleBackPanelGrooveChange('right', e.target.checked)}
                                  disabled={!furniture.construction.backPanelThrough?.right}
                                />
                              }
                              label="Côté droit"
                            />
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </>
          )}
        </Grid>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Matériau */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Matériau</Typography>
        {availableMaterials && availableMaterials.length > 0 ? (
          <FormControl fullWidth>
            <InputLabel>Matériau principal</InputLabel>
            <Select
              value={furniture.material || ''}
              onChange={(e) => setFurnitureMaterial(e.target.value)}
              label="Matériau principal"
            >
              <MenuItem value="">
                <em>Aucun</em>
              </MenuItem>
              {availableMaterials.map((material) => (
                <MenuItem key={material.id} value={material.id}>
                  {material.name} - {material.thickness}mm - {material.color}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Typography color="text.secondary">
            Aucun matériau disponible. Ajoutez des matériaux dans la section Matériaux.
          </Typography>
        )}
      </Box>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => regenerateScene()}
        >
          Générer le meuble
        </Button>
      </Box>
    </Paper>
  );
};

export default FurnitureTab;