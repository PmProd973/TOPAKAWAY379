// LabelPreview.js
import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel 
} from '@mui/material';

const LabelPreview = ({ 
  pieces = [], 
  materials = [], 
  panels = [], 
  config
}) => {
  // État pour la pagination
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  
  // Calculer le nombre total de pages
  const totalPages = Math.ceil(pieces.length / itemsPerPage);
  
  // Obtenir les pièces pour la page actuelle
  const currentPieces = pieces.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  // Fonction pour obtenir les informations du matériau
  const getMaterialInfo = (materialId) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return "Matériau inconnu";
    return `${material.description || "Matériau"} ${material.thickness ? `(${material.thickness}mm)` : ""}`;
  };
  
  // Fonction pour obtenir les informations sur les chants
  const getEdgesInfo = (piece) => {
    const edges = [];
    if (piece.edgingFront || piece.edgeFront) edges.push('Avant');
    if (piece.edgingBack || piece.edgeBack) edges.push('Arrière');
    if (piece.edgingLeft || piece.edgeLeft) edges.push('Gauche');
    if (piece.edgingRight || piece.edgeRight) edges.push('Droite');
    
    if (edges.length === 0) return "Aucun";
    if (edges.length === 4) return "Tous les côtés";
    return edges.join(', ');
  };
  
  // Fonction pour obtenir le numéro de panneau pour une pièce
  const getPanelNumber = (piece) => {
    if (!panels || panels.length === 0) return "-";
    
    // Recherche dans les panneaux optimisés
    for (let i = 0; i < panels.length; i++) {
      const panel = panels[i];
      const placedPieces = panel.placedPieces || panel.cuts || [];
      
      if (placedPieces.some(p => 
        (p.id === piece.id) || 
        (p.pieceId === piece.id) || 
        (p.piece && p.piece.id === piece.id)
      )) {
        return `Panneau ${i + 1}`;
      }
    }
    
    return "-";
  };
  
  // Fonction pour formater la date actuelle
  const getCurrentDate = () => {
    return new Date().toLocaleDateString();
  };
  
  // Générer un aperçu d'étiquette
  const renderLabelPreview = (piece, index) => {
    // Déterminer les dimensions en fonction de la configuration
    const { width, height } = config.layout;
    const { 
      mainColor, secondaryColor, textColor, 
      fontFamily, fontSize, headerFontSize, 
      borderWidth, borderColor, borderRadius 
    } = config.style;
    
    return (
      <Paper
        elevation={3}
        sx={{
          width: `${width}mm`,
          height: `${height}mm`,
          border: `${borderWidth}px solid ${borderColor || mainColor}`,
          borderRadius: `${borderRadius}px`,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'white',
          mb: 2
        }}
      >
        {/* En-tête de l'étiquette */}
        <Box
          sx={{
            backgroundColor: mainColor,
            color: 'white',
            p: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontFamily, 
              fontSize: headerFontSize || (fontSize + 2),
              fontWeight: 'bold'
            }}
          >
            {config.content.showPieceId && piece.id ? 
              `#${piece.id.substring(0, 6)}` : 
              `Pièce ${index + 1}`
            }
          </Typography>
          
          {config.content.showPanelNumber && (
            <Typography 
              variant="caption" 
              sx={{ fontFamily, fontSize: (fontSize - 1) }}
            >
              {getPanelNumber(piece)}
            </Typography>
          )}
        </Box>
        
        {/* Contenu principal */}
        <Box sx={{ p: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Description */}
          {config.content.showDescription && (
            <Typography 
              variant="body1" 
              sx={{ 
                fontFamily, 
                fontSize, 
                fontWeight: 'bold',
                mb: 0.5,
                color: textColor
              }}
            >
              {piece.description || "Sans description"}
            </Typography>
          )}
          
          {/* Dimensions */}
          {config.content.showDimensions && (
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily, 
                fontSize,
                color: textColor,
                mb: 0.5
              }}
            >
              L: {piece.length} × l: {piece.width} {piece.thickness ? `× e: ${piece.thickness}` : ''} mm
            </Typography>
          )}
          
          {/* Matériau */}
          {config.content.showMaterial && piece.materialId && (
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily, 
                fontSize, 
                color: textColor,
                mb: 0.5
              }}
            >
              Mat: {getMaterialInfo(piece.materialId)}
            </Typography>
          )}
          
          {/* Chants */}
          {config.content.showEdges && (
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily, 
                fontSize, 
                color: textColor
              }}
            >
              Chants: {getEdgesInfo(piece)}
            </Typography>
          )}
        </Box>
        
        {/* Pied de page */}
        <Box
          sx={{
            borderTop: `1px solid ${borderColor || mainColor}`,
            backgroundColor: secondaryColor || '#f5f5f5',
            p: 0.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {/* Date */}
          {config.content.showDate && (
            <Typography 
              variant="caption" 
              sx={{ 
                fontFamily, 
                fontSize: fontSize - 2,
                color: textColor
              }}
            >
              {getCurrentDate()}
            </Typography>
          )}
          
          {/* Quantité */}
          {config.content.showQuantity && (
            <Typography 
              variant="caption" 
              sx={{ 
                fontFamily, 
                fontSize: fontSize - 2,
                fontWeight: 'bold',
                color: textColor
              }}
            >
              Qté: {piece.quantity || 1}
            </Typography>
          )}
        </Box>
        
        {/* Logo (placeholder) */}
        {config.logo && config.logo.enabled && (
          <Box
            sx={{
              position: 'absolute',
              top: config.logo.position.includes('top') ? 5 : 'auto',
              bottom: config.logo.position.includes('bottom') ? 5 : 'auto',
              left: config.logo.position.includes('left') ? 5 : 'auto',
              right: config.logo.position.includes('right') ? 5 : 'auto',
              width: `${config.logo.width}mm`,
              height: `${config.logo.height}mm`,
              backgroundColor: 'rgba(200, 200, 200, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              color: 'gray'
            }}
          >
            LOGO
          </Box>
        )}
      </Paper>
    );
  };
  
  // Si aucune pièce n'est disponible
  if (!pieces || pieces.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 5 }}>
        <Typography variant="body1" color="text.secondary">
          Aucune pièce disponible pour prévisualiser les étiquettes
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Contrôles de prévisualisation */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="caption" color="text.secondary">
          {pieces.length} étiquettes au total
        </Typography>
        
        <FormControl size="small" sx={{ width: 120 }}>
          <InputLabel id="preview-items-label">Afficher</InputLabel>
          <Select
            labelId="preview-items-label"
            value={itemsPerPage}
            label="Afficher"
            onChange={(e) => {
              setItemsPerPage(e.target.value);
              setPage(1); // Revenir à la première page
            }}
            size="small"
          >
            <MenuItem value={2}>2 par page</MenuItem>
            <MenuItem value={4}>4 par page</MenuItem>
            <MenuItem value={6}>6 par page</MenuItem>
            <MenuItem value={8}>8 par page</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Grille d'étiquettes */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {currentPieces.map((piece, index) => (
          <Grid item key={piece.id || index}>
            {renderLabelPreview(piece, (page - 1) * itemsPerPage + index)}
          </Grid>
        ))}
      </Grid>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, newPage) => setPage(newPage)}
            color="primary"
            size="small"
          />
        </Box>
      )}
    </Box>
  );
};

export default LabelPreview;