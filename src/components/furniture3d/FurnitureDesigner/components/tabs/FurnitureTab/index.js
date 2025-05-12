// src/components/furniture3d/FurnitureDesigner/components/tabs/FurnitureTab/index.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
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
  AccordionDetails,
  IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import { useFurnitureStore } from '../../../store/index';

const FurnitureTab = () => {
  // État local indépendant avec structure complète
  const [localState, setLocalState] = useState({
    dimensions: {
      width: 0,
      height: 0,
      depth: 0
    },
    position: {
      x: 0,
      y: 0,
      z: 0
    },
    type: '',
    material: '',
    construction: {
      panelThickness: 0,
      plinthHeight: 0,
      backPanelThickness: 0,
      backPanelInset: 0,
      backPanelGap: 0,
      backPanelOverhang: 0,
      plinthInsets: {
        front: 0,
        back: 0,
        left: 0,
        right: 0
      },
      sidesOverlapTopBottom: true,
      hasPlinths: false,
      hasBackPanel: false,
      sidesExtendToFloor: false,
      backPanelGroove: {
        top: false,
        bottom: false,
        left: false,
        right: false
      },
      backPanelThrough: {
        top: false,
        bottom: false,
        left: false,
        right: false
      },
      socleSupports: 0,
      socleSideSupports: false,
      socleTopType: 'panel',
      socleTraverseWidth: 60
    },
    placement: {
      wall: "none",
      alignH: "center"
    }
  });
  
  // État initial pour permettre de réinitialiser et éviter les rendus multiples
  const initialStateRef = useRef(null);
  const isInitialRenderRef = useRef(true);
  
  // Debounce timer pour éviter trop de régénérations
  const regenerationTimer = useRef(null);

  // Récupérer le store
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

  // Synchroniser l'état local avec le store seulement au montage initial
  // ou lorsque l'ID du meuble change (nouveau meuble)
  useEffect(() => {
    if (furniture && isInitialRenderRef.current) {
      const state = {
        dimensions: {
          width: furniture.dimensions.width,
          height: furniture.dimensions.height,
          depth: furniture.dimensions.depth
        },
        position: {
          x: furniture.position.x,
          y: furniture.position.y,
          z: furniture.position.z
        },
        type: furniture.type,
        material: furniture.material,
        construction: {
          panelThickness: furniture.construction.panelThickness,
          plinthHeight: furniture.construction.plinthHeight || 0,
          backPanelThickness: furniture.construction.backPanelThickness || 0,
          backPanelInset: furniture.construction.backPanelInset || 0,
          backPanelGap: furniture.construction.backPanelGap || 0,
          backPanelOverhang: furniture.construction.backPanelOverhang || 0,
          plinthInsets: {
            front: (furniture.construction.plinthInsets || {}).front || 0,
            back: (furniture.construction.plinthInsets || {}).back || 0,
            left: (furniture.construction.plinthInsets || {}).left || 0,
            right: (furniture.construction.plinthInsets || {}).right || 0
          },
          sidesOverlapTopBottom: furniture.construction.sidesOverlapTopBottom !== false,
          hasPlinths: furniture.construction.hasPlinths || false,
          hasBackPanel: furniture.construction.hasBackPanel || false,
          sidesExtendToFloor: furniture.construction.sidesExtendToFloor || false,
          backPanelGroove: furniture.construction.backPanelGroove || {
            top: false,
            bottom: false,
            left: false,
            right: false
          },
          backPanelThrough: furniture.construction.backPanelThrough || {
            top: false,
            bottom: false,
            left: false,
            right: false
          },
          socleSupports: furniture.construction.socleSupports || 0,
          socleSideSupports: furniture.construction.socleSideSupports || false,
          socleTopType: furniture.construction.socleTopType || 'panel',
          socleTraverseWidth: furniture.construction.socleTraverseWidth || 60
        },
        placement: {
          wall: furniture.placement?.wall || "none",
          alignH: furniture.placement?.alignH || "center"
        }
      };

      setLocalState(state);
      
      // Créer une copie profonde pour éviter toute modification accidentelle
      initialStateRef.current = JSON.parse(JSON.stringify(state));
      console.log("État initial du meuble chargé:", state);
      
      // Marquer comme déjà initialisé
      isInitialRenderRef.current = false;
    }
  }, [furniture?.id]); // Dépendance sur l'ID du meuble, pas sur tout l'objet furniture

  // Types de meubles disponibles
  const furnitureTypes = [
    { value: 'wardrobe', label: 'Armoire/Dressing' },
    { value: 'bookcase', label: 'Bibliothèque' },
    { value: 'cabinet', label: 'Meuble bas' },
    { value: 'desk', label: 'Bureau' },
    { value: 'custom', label: 'Personnalisé' }
  ];

  // Fonction pour déclencher la régénération avec debounce
  const debouncedRegenerate = () => {
    if (regenerationTimer.current) {
      clearTimeout(regenerationTimer.current);
    }
    regenerationTimer.current = setTimeout(() => {
      regenerateScene();
    }, 300); // 300ms de debounce
  };

  // Mettre à jour uniquement l'état local pour les dimensions
  const handleDimensionChange = (dimension, e) => {
    const value = parseInt(e.target.value, 10) || 0;
    console.log(`Modification locale de la dimension ${dimension} à ${value}`);
    
    setLocalState(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [dimension]: value
      }
    }));
  };
  
  // Mettre à jour le store après la sortie du champ avec régénération dynamique
  const handleDimensionBlur = (dimension) => {
    const value = parseInt(localState.dimensions[dimension], 10) || 0;
    console.log(`Mise à jour du store pour la dimension ${dimension} à ${value} (avec régénération)`);
    
    // Mise à jour du store AVEC régénération (true)
    updateFurnitureDimensions(dimension, value, true);
  };

  // Mettre à jour uniquement l'état local pour la position
  const handlePositionChange = (axis, e) => {
    const value = parseInt(e.target.value, 10) || 0;
    console.log(`Modification locale de la position ${axis} à ${value}`);
    
    setLocalState(prev => ({
      ...prev,
      position: {
        ...prev.position,
        [axis]: value
      }
    }));
  };
  
  // Mettre à jour le store après la sortie du champ avec régénération dynamique
  const handlePositionBlur = (axis) => {
    const value = parseInt(localState.position[axis], 10) || 0;
    console.log(`Mise à jour du store pour la position ${axis} à ${value} (avec régénération)`);
    
    // Mise à jour du store AVEC régénération (true)
    updateFurniturePosition(axis, value, true);
  };

  // Gérer les changements de type directement avec régénération
  const handleTypeChange = (e) => {
    const value = e.target.value;
    console.log(`Modification du type à ${value}`);
    
    setLocalState(prev => ({
      ...prev,
      type: value
    }));
    
    // Pour les listes déroulantes, mettre à jour immédiatement le store AVEC régénération
    updateFurnitureType(value, true);
  };

  // Gérer les options de construction avec régénération dynamique
  const handleConstructionOptionChange = (option, e) => {
    const value = typeof e.target.checked !== 'undefined' 
      ? e.target.checked 
      : (parseInt(e.target.value, 10) || 0);
    
    console.log(`Modification de l'option ${option} à ${value}`);
    
    setLocalState(prev => ({
      ...prev,
      construction: {
        ...prev.construction,
        [option]: value
      }
    }));
    
    // Pour les cases à cocher et inputs numériques, mettre à jour immédiatement AVEC régénération
    updateConstructionOption(option, value, true);
  };

  // Gestion des retraits de plinthes avec régénération immédiate
  const handlePlinthInsetChange = (side, e) => {
    const value = parseInt(e.target.value, 10) || 0;
    console.log(`Modification du retrait de plinthe ${side} à ${value}`);
    
    setLocalState(prev => ({
      ...prev,
      construction: {
        ...prev.construction,
        plinthInsets: {
          ...prev.construction.plinthInsets,
          [side]: value
        }
      }
    }));
    
    // Mise à jour immédiate dans le store pour visualisation dynamique
    const plinthInsets = {
      ...localState.construction.plinthInsets,
      [side]: value
    };
    
    updateConstructionOption('plinthInsets', plinthInsets, true);
  };

  // Gestion des options de rainure pour le panneau arrière avec régénération
  const handleBackPanelGrooveChange = (side, e) => {
    const value = e.target.checked;
    console.log(`Modification de la rainure du panneau arrière ${side} à ${value}`);
    
    const backPanelGroove = {
      ...localState.construction.backPanelGroove,
      [side]: value
    };
    
    setLocalState(prev => ({
      ...prev,
      construction: {
        ...prev.construction,
        backPanelGroove
      }
    }));
    
    // Mettre à jour directement dans le store AVEC régénération
    updateConstructionOption('backPanelGroove', backPanelGroove, true);
  };
  
  // Gérer le panneau arrière qui traverse avec régénération
  const handleBackPanelThroughChange = (side, e) => {
    const value = e.target.checked;
    console.log(`Modification du traversement du panneau arrière ${side} à ${value}`);
    
    const backPanelThrough = {
      ...localState.construction.backPanelThrough,
      [side]: value
    };
    
    setLocalState(prev => ({
      ...prev,
      construction: {
        ...prev.construction,
        backPanelThrough
      }
    }));
    
    // Mettre à jour directement dans le store AVEC régénération
    updateConstructionOption('backPanelThrough', backPanelThrough, true);
  };
  
  // Gérer les changements de placement contre un mur avec régénération
  const handleWallPlacementChange = (e) => {
    const wallValue = e.target.value;
    console.log(`Modification du placement mural à ${wallValue}`);
    
    setLocalState(prev => ({
      ...prev,
      placement: {
        ...prev.placement,
        wall: wallValue
      }
    }));
    
    // Calculer automatiquement la position basée sur le mur sélectionné
    if (wallValue !== "none") {
      const { room } = useFurnitureStore.getState();
      let newPosition = { ...localState.position };
      let newRotation = { x: 0, y: 0, z: 0 };
      
      switch (wallValue) {
        case "back":
          // Placer le meuble contre le mur du fond
          newPosition.z = -room.depth/2 + furniture.dimensions.depth/2;
          newPosition.x = 0; // Centré par défaut
          newRotation.y = 0;
          break;
        case "left":
          // Placer le meuble contre le mur de gauche
          newPosition.x = -room.width/2 + furniture.dimensions.depth/2;
          newPosition.z = 0; // Centré par défaut
          // Rotation à 90 degrés
          newRotation.y = Math.PI/2;
          break;
        case "right":
          // Placer le meuble contre le mur de droite
          newPosition.x = room.width/2 - furniture.dimensions.depth/2;
          newPosition.z = 0; // Centré par défaut
          // Rotation à -90 degrés
          newRotation.y = -Math.PI/2;
          break;
        default:
          break;
      }
      
      // Mettre à jour l'état local
      setLocalState(prev => ({
        ...prev,
        position: newPosition
      }));
      
      // Mettre à jour la position et rotation dans le store AVEC régénération
      updateFurniturePosition('x', newPosition.x, false);
      updateFurniturePosition('z', newPosition.z, false);
      updateFurnitureRotation(newRotation.x, newRotation.y, newRotation.z, false);
      
      // Sauvegarder le mur de référence et régénérer une fois
      updateFurniturePlacement('wall', wallValue);
      debouncedRegenerate();
    } else {
      // Réinitialiser la rotation si aucun mur n'est sélectionné
      updateFurnitureRotation(0, 0, 0, false);
      updateFurniturePlacement('wall', null);
      debouncedRegenerate();
    }
  };
  
  // Gérer les changements d'alignement horizontal avec régénération
  const handleAlignmentChange = (e) => {
    const alignValue = e.target.value;
    console.log(`Modification de l'alignement horizontal à ${alignValue}`);
    
    setLocalState(prev => ({
      ...prev,
      placement: {
        ...prev.placement,
        alignH: alignValue
      }
    }));
    
    const { room } = useFurnitureStore.getState();
    let newPosition = { ...localState.position };
    
    // Ajuster la position horizontale selon l'alignement choisi
    if (localState.placement.wall === "back") {
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
      
      // Mettre à jour l'état local
      setLocalState(prev => ({
        ...prev,
        position: {
          ...prev.position,
          x: newPosition.x
        }
      }));
      
      // Mettre à jour la position dans le store AVEC régénération
      updateFurniturePosition('x', newPosition.x, true);
      
    } else if (localState.placement.wall === "left" || localState.placement.wall === "right") {
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
      
      // Mettre à jour l'état local
      setLocalState(prev => ({
        ...prev,
        position: {
          ...prev.position,
          z: newPosition.z
        }
      }));
      
      // Mettre à jour la position dans le store AVEC régénération
      updateFurniturePosition('z', newPosition.z, true);
    }
    
    // Mettre à jour l'alignement dans le store
    updateFurniturePlacement('alignH', alignValue);
  };
  
  // Gérer le changement de matériau avec régénération
  const handleMaterialChange = (e) => {
    const materialId = e.target.value;
    console.log(`Modification du matériau à ${materialId}`);
    
    setLocalState(prev => ({
      ...prev,
      material: materialId
    }));
    
    // Mise à jour du store AVEC régénération
    setFurnitureMaterial(materialId, true);
  };
  
  // Configuration du socle avec régénération dynamique
  const handleSocleOptionChange = (option, value) => {
    console.log(`Modification de l'option de socle ${option} à ${value}`);
    
    // Mise à jour locale
    setLocalState(prev => ({
      ...prev,
      construction: {
        ...prev.construction,
        [option]: value
      }
    }));
    
    // Mise à jour immédiate dans le store avec régénération
    updateConstructionOption(option, value, true);
  };
  
  // Réinitialiser les valeurs
  const handleResetValues = () => {
    if (initialStateRef.current) {
      console.log("Réinitialisation des valeurs");
      
      // Réinitialiser l'état local avec une copie profonde pour éviter les références
      const resetState = JSON.parse(JSON.stringify(initialStateRef.current));
      setLocalState(resetState);
      
      // Appliquer toutes les valeurs réinitialisées au store
      Object.entries(resetState.dimensions).forEach(([dimension, value]) => {
        updateFurnitureDimensions(dimension, value, false);
      });
      
      Object.entries(resetState.position).forEach(([axis, value]) => {
        updateFurniturePosition(axis, value, false);
      });
      
      updateFurnitureType(resetState.type, false);
      setFurnitureMaterial(resetState.material, false);
      
      Object.entries(resetState.construction).forEach(([option, value]) => {
        updateConstructionOption(option, value, false);
      });
      
      updateFurniturePlacement('wall', resetState.placement.wall);
      updateFurniturePlacement('alignH', resetState.placement.alignH);
      
      // Régénérer une fois à la fin
      debouncedRegenerate();
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Configuration du meuble</Typography>
        <Box>
          <IconButton 
            color="secondary" 
            onClick={handleResetValues}
            title="Réinitialiser"
          >
            <RestoreIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Type de meuble */}
      <Box className="form-section">
        <Typography className="section-title">Type de meuble</Typography>
        <FormControl fullWidth>
          <InputLabel>Type</InputLabel>
          <Select
            value={localState.type}
            onChange={handleTypeChange}
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

      {/* Dimensions principales - Layout vertical */}
      <Box className="form-section">
        <Typography className="section-title">Dimensions principales</Typography>
        
        <Box className="dimension-field-container">
          <TextField
            fullWidth
            label="Largeur"
            type="number"
            value={localState.dimensions.width}
            onChange={(e) => handleDimensionChange('width', e)}
            onBlur={() => handleDimensionBlur('width')}
            InputProps={{
              endAdornment: <InputAdornment position="end">mm</InputAdornment>
            }}
          />
        </Box>
        
        <Box className="dimension-field-container">
          <TextField
            fullWidth
            label="Hauteur"
            type="number"
            value={localState.dimensions.height}
            onChange={(e) => handleDimensionChange('height', e)}
            onBlur={() => handleDimensionBlur('height')}
            InputProps={{
              endAdornment: <InputAdornment position="end">mm</InputAdornment>
            }}
          />
        </Box>
        
        <Box className="dimension-field-container">
          <TextField
            fullWidth
            label="Profondeur"
            type="number"
            value={localState.dimensions.depth}
            onChange={(e) => handleDimensionChange('depth', e)}
            onBlur={() => handleDimensionBlur('depth')}
            InputProps={{
              endAdornment: <InputAdornment position="end">mm</InputAdornment>
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Positionnement sur un mur - Layout vertical */}
      <Box className="form-section">
        <Typography className="section-title">Placement contre un mur</Typography>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Mur de référence</InputLabel>
          <Select
            value={localState.placement.wall}
            onChange={handleWallPlacementChange}
            label="Mur de référence"
          >
            <MenuItem value="none">Aucun (libre)</MenuItem>
            <MenuItem value="back">Mur du fond</MenuItem>
            <MenuItem value="left">Mur de gauche</MenuItem>
            <MenuItem value="right">Mur de droite</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Alignement horizontal</InputLabel>
          <Select
            value={localState.placement.alignH}
            onChange={handleAlignmentChange}
            label="Alignement horizontal"
            disabled={localState.placement.wall === "none"}
          >
            <MenuItem value="left">Gauche</MenuItem>
            <MenuItem value="center">Centré</MenuItem>
            <MenuItem value="right">Droite</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Position du meuble - Layout vertical */}
      <Box className="form-section">
        <Typography className="section-title">Position dans la pièce</Typography>
        
        <Box className="dimension-field-container">
          <TextField
            fullWidth
            label="Position X"
            type="number"
            value={localState.position.x}
            onChange={(e) => handlePositionChange('x', e)}
            onBlur={() => handlePositionBlur('x')}
            InputProps={{
              endAdornment: <InputAdornment position="end">mm</InputAdornment>
            }}
          />
        </Box>
        
        <Box className="dimension-field-container">
          <TextField
            fullWidth
            label="Position Y"
            type="number"
            value={localState.position.y}
            onChange={(e) => handlePositionChange('y', e)}
            onBlur={() => handlePositionBlur('y')}
            InputProps={{
              endAdornment: <InputAdornment position="end">mm</InputAdornment>
            }}
          />
        </Box>
        
        <Box className="dimension-field-container">
          <TextField
            fullWidth
            label="Position Z"
            type="number"
            value={localState.position.z}
            onChange={(e) => handlePositionChange('z', e)}
            onBlur={() => handlePositionBlur('z')}
            InputProps={{
              endAdornment: <InputAdornment position="end">mm</InputAdornment>
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Options de construction - Layout vertical */}
      <Box className="form-section">
        <Typography className="section-title">Options de construction</Typography>
        
        <Box className="dimension-field-container">
          <TextField
            fullWidth
            label="Épaisseur panneau"
            type="number"
            value={localState.construction.panelThickness}
            onChange={(e) => handleConstructionOptionChange('panelThickness', e)}
            InputProps={{
              endAdornment: <InputAdornment position="end">mm</InputAdornment>
            }}
          />
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={localState.construction.sidesOverlapTopBottom}
              onChange={(e) => handleConstructionOptionChange('sidesOverlapTopBottom', e)}
            />
          }
          label="Côtés débordent sur dessus/dessous"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={localState.construction.hasPlinths}
              onChange={(e) => handleConstructionOptionChange('hasPlinths', e)}
            />
          }
          label="Ajouter plinthes"
        />

        {localState.construction.hasPlinths && (
          <>
            <Box className="dimension-field-container" sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Hauteur plinthe"
                type="number"
                value={localState.construction.plinthHeight}
                onChange={(e) => handleConstructionOptionChange('plinthHeight', e)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mm</InputAdornment>
                }}
              />
            </Box>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={localState.construction.sidesExtendToFloor}
                  onChange={(e) => handleConstructionOptionChange('sidesExtendToFloor', e)}
                />
              }
              label="Côtés jusqu'au sol"
            />
            
            {/* Retraits des plinthes */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Retrait des plinthes</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box className="dimension-field-container">
                  <TextField
                    fullWidth
                    label="Retrait avant"
                    type="number"
                    value={localState.construction.plinthInsets.front}
                    onChange={(e) => handlePlinthInsetChange('front', e)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>
                    }}
                  />
                </Box>
                
                <Box className="dimension-field-container">
                  <TextField
                    fullWidth
                    label="Retrait arrière"
                    type="number"
                    value={localState.construction.plinthInsets.back}
                    onChange={(e) => handlePlinthInsetChange('back', e)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>
                    }}
                  />
                </Box>
                
                <Box className="dimension-field-container">
                  <TextField
                    fullWidth
                    label="Retrait gauche"
                    type="number"
                    value={localState.construction.plinthInsets.left}
                    onChange={(e) => handlePlinthInsetChange('left', e)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>
                    }}
                  />
                </Box>
                
                <Box className="dimension-field-container">
                  <TextField
                    fullWidth
                    label="Retrait droit"
                    type="number"
                    value={localState.construction.plinthInsets.right}
                    onChange={(e) => handlePlinthInsetChange('right', e)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mm</InputAdornment>
                    }}
                  />
                </Box>
              </AccordionDetails>
            </Accordion>
            
            {/* Configuration du socle */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Configuration du socle</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box className="dimension-field-container">
                  <TextField
                    fullWidth
                    label="Séparations verticales"
                    type="number"
                    value={localState.construction.socleSupports}
                    onChange={(e) => handleSocleOptionChange('socleSupports', parseInt(e.target.value, 10) || 0)}
                    InputProps={{
                      inputProps: { min: 0, max: 10 }
                    }}
                  />
                </Box>
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={localState.construction.socleSideSupports}
                      onChange={(e) => handleSocleOptionChange('socleSideSupports', e.target.checked)}
                    />
                  }
                  label="Ajouter côtés au socle"
                />
                
                {(localState.construction.socleSupports > 0 || localState.construction.socleSideSupports) && (
                  <>
                    <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                      <InputLabel>Type de dessus de socle</InputLabel>
                      <Select
                        value={localState.construction.socleTopType}
                        onChange={(e) => handleSocleOptionChange('socleTopType', e.target.value)}
                        label="Type de dessus de socle"
                      >
                        <MenuItem value="panel">Panneau complet</MenuItem>
                        <MenuItem value="traverses">Traverses</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {localState.construction.socleTopType === 'traverses' && (
                      <Box className="dimension-field-container">
                        <TextField
                          fullWidth
                          label="Largeur des traverses"
                          type="number"
                          value={localState.construction.socleTraverseWidth}
                          onChange={(e) => handleSocleOptionChange('socleTraverseWidth', parseInt(e.target.value, 10) || 60)}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">mm</InputAdornment>
                          }}
                        />
                      </Box>
                    )}
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          </>
        )}

        <FormControlLabel
          sx={{ mt: 2 }}
          control={
            <Checkbox
              checked={localState.construction.hasBackPanel}
              onChange={(e) => handleConstructionOptionChange('hasBackPanel', e)}
            />
          }
          label="Ajouter panneau arrière"
        />

        {localState.construction.hasBackPanel && (
          <>
            <Box className="dimension-field-container" sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Épaisseur panneau arrière"
                type="number"
                value={localState.construction.backPanelThickness}
                onChange={(e) => handleConstructionOptionChange('backPanelThickness', e)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mm</InputAdornment>
                }}
              />
            </Box>
            
            <Box className="dimension-field-container">
              <TextField
                fullWidth
                label="Retrait panneau arrière"
                type="number"
                value={localState.construction.backPanelInset}
                onChange={(e) => handleConstructionOptionChange('backPanelInset', e)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mm</InputAdornment>
                }}
              />
            </Box>
            
            <Box className="dimension-field-container">
              <TextField
                fullWidth
                label="Jeu pour rainure"
                type="number"
                value={localState.construction.backPanelGap}
                onChange={(e) => handleConstructionOptionChange('backPanelGap', e)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mm</InputAdornment>
                }}
              />
            </Box>
            
            <Box className="dimension-field-container">
              <TextField
                fullWidth
                label="Débordement pour rainure"
                type="number"
                value={localState.construction.backPanelOverhang}
                onChange={(e) => handleConstructionOptionChange('backPanelOverhang', e)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mm</InputAdornment>
                }}
              />
            </Box>
            
            {/* Options avancées du panneau arrière */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Options avancées pour panneau arrière</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="subtitle2" gutterBottom>Panneau traversant sur</Typography>
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={localState.construction.backPanelThrough.top}
                      onChange={(e) => handleBackPanelThroughChange('top', e)}
                    />
                  }
                  label="Dessus"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={localState.construction.backPanelThrough.bottom}
                      onChange={(e) => handleBackPanelThroughChange('bottom', e)}
                    />
                  }
                  label="Dessous"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={localState.construction.backPanelThrough.left}
                      onChange={(e) => handleBackPanelThroughChange('left', e)}
                    />
                  }
                  label="Côté gauche"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={localState.construction.backPanelThrough.right}
                      onChange={(e) => handleBackPanelThroughChange('right', e)}
                    />
                  }
                  label="Côté droit"
                />
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Créer une rainure sur</Typography>
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={localState.construction.backPanelGroove.top}
                      onChange={(e) => handleBackPanelGrooveChange('top', e)}
                      disabled={!localState.construction.backPanelThrough.top}
                    />
                  }
                  label="Dessus"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={localState.construction.backPanelGroove.bottom}
                      onChange={(e) => handleBackPanelGrooveChange('bottom', e)}
                      disabled={!localState.construction.backPanelThrough.bottom}
                    />
                  }
                  label="Dessous"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={localState.construction.backPanelGroove.left}
                      onChange={(e) => handleBackPanelGrooveChange('left', e)}
                      disabled={!localState.construction.backPanelThrough.left}
                    />
                  }
                  label="Côté gauche"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={localState.construction.backPanelGroove.right}
                      onChange={(e) => handleBackPanelGrooveChange('right', e)}
                      disabled={!localState.construction.backPanelThrough.right}
                    />
                  }
                  label="Côté droit"
                />
              </AccordionDetails>
            </Accordion>
          </>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Matériau */}
      <Box className="form-section">
        <Typography className="section-title">Matériau</Typography>
        {availableMaterials && availableMaterials.length > 0 ? (
          <FormControl fullWidth>
            <InputLabel>Matériau principal</InputLabel>
            <Select
              value={localState.material || ''}
              onChange={handleMaterialChange}
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
    </Paper>
  );
};

export default FurnitureTab;