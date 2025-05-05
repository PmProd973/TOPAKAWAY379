import React from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Grid,
  Paper,
  Box,
  Typography
} from '@mui/material';

/**
 * Composant dédié pour les sélecteurs de chants dans le formulaire de pièce
 */
const EdgingSelectors = ({ 
  formData, 
  edgings, 
  onChange,
  showVisualization = true
}) => {
  // Fonction pour récupérer les infos d'un chant par son ID
  const getEdgingById = (edgingId) => {
    if (!edgingId) return null;
    return edgings.find(e => e.id === edgingId) || null;
  };

  // Fonction pour formater l'affichage d'un chant
  const formatEdgingDisplay = (edging) => {
    if (!edging) return 'Aucun';
    
    // Vérification de la présence des propriétés et conversion en nombre si nécessaire
    const height = typeof edging.height === 'number' ? edging.height : 
                  (typeof edging.hauteur === 'number' ? edging.hauteur : 
                  parseFloat(edging.height || edging.hauteur || 0));
    
    const thickness = typeof edging.thickness === 'number' ? edging.thickness : 
                     (typeof edging.epaisseur === 'number' ? edging.epaisseur : 
                     parseFloat(edging.thickness || edging.epaisseur || 0));
    
    // Log pour débogage
    console.log(`Formatage du chant ${edging.id}:`, { 
      description: edging.description, 
      height, 
      thickness,
      original: { height: edging.height, thickness: edging.thickness }
    });
    
    return `${edging.description} (${height}×${thickness}mm)`;
  };

  // Rendu des options de chant pour les Select
  const renderEdgingOptions = () => {
    return [
      <MenuItem key="none" value="">Aucun</MenuItem>,
      ...edgings.map((edging) => (
        <MenuItem key={edging.id} value={edging.id}>
          {formatEdgingDisplay(edging)}
        </MenuItem>
      ))
    ];
  };

  // Rendu de la visualisation de la pièce avec ses chants
  const renderPieceVisualization = () => {
    // Récupérer les chants sélectionnés
    const frontEdging = getEdgingById(formData.edgingFront);
    const backEdging = getEdgingById(formData.edgingBack);
    const leftEdging = getEdgingById(formData.edgingLeft);
    const rightEdging = getEdgingById(formData.edgingRight);

    // Style pour la pièce
    const pieceStyle = {
      width: '100%',
      height: '120px',
      background: '#f0f0f0',
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    };

    // Styles pour les chants
    const edgingStyles = {
      front: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '8px',
        background: frontEdging ? '#4caf50' : 'transparent',
        borderBottom: frontEdging ? '1px solid #2e7d32' : 'none'
      },
      back: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '8px',
        background: backEdging ? '#4caf50' : 'transparent',
        borderTop: backEdging ? '1px solid #2e7d32' : 'none'
      },
      left: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: '8px',
        background: leftEdging ? '#4caf50' : 'transparent',
        borderLeft: leftEdging ? '1px solid #2e7d32' : 'none'
      },
      right: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        width: '8px',
        background: rightEdging ? '#4caf50' : 'transparent',
        borderRight: rightEdging ? '1px solid #2e7d32' : 'none'
      }
    };

    return (
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Visualisation des chants
        </Typography>
        <Box sx={pieceStyle}>
          <Typography variant="body2">
            {formData.description || 'Pièce'}
          </Typography>
          <Box sx={edgingStyles.front}></Box>
          <Box sx={edgingStyles.back}></Box>
          <Box sx={edgingStyles.left}></Box>
          <Box sx={edgingStyles.right}></Box>
        </Box>
        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Typography variant="caption">
              Avant: {frontEdging ? formatEdgingDisplay(frontEdging) : 'Aucun'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">
              Arrière: {backEdging ? formatEdgingDisplay(backEdging) : 'Aucun'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">
              Gauche: {leftEdging ? formatEdgingDisplay(leftEdging) : 'Aucun'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">
              Droite: {rightEdging ? formatEdgingDisplay(rightEdging) : 'Aucun'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  return (
    <>
      {showVisualization && renderPieceVisualization()}
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="dense">
            <InputLabel id="edging-front-label">Chant Avant</InputLabel>
            <Select
              labelId="edging-front-label"
              name="edgingFront"
              value={formData.edgingFront || ''}
              onChange={onChange}
              label="Chant Avant"
            >
              {renderEdgingOptions()}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="dense">
            <InputLabel id="edging-back-label">Chant Arrière</InputLabel>
            <Select
              labelId="edging-back-label"
              name="edgingBack"
              value={formData.edgingBack || ''}
              onChange={onChange}
              label="Chant Arrière"
            >
              {renderEdgingOptions()}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="dense">
            <InputLabel id="edging-left-label">Chant Gauche</InputLabel>
            <Select
              labelId="edging-left-label"
              name="edgingLeft"
              value={formData.edgingLeft || ''}
              onChange={onChange}
              label="Chant Gauche"
            >
              {renderEdgingOptions()}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="dense">
            <InputLabel id="edging-right-label">Chant Droite</InputLabel>
            <Select
              labelId="edging-right-label"
              name="edgingRight"
              value={formData.edgingRight || ''}
              onChange={onChange}
              label="Chant Droite"
            >
              {renderEdgingOptions()}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </>
  );
};

export default EdgingSelectors;