// src/components/furniture3d/FurnitureDesigner/components/PiecesList.jsx
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { Add as AddIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { useFurnitureStore } from '../store';

const PiecesList = ({ materials = [] }) => {
  const { rawPieces, rawMaterials, importPiece } = useFurnitureStore();
  
  // Fonction pour obtenir le nom du matériau
  const getMaterialName = (materialId) => {
    const material = materials.find(m => m.id === materialId);
    return material ? material.name : 'Inconnu';
  };
  
  // Fonction pour ajouter une pièce à la scène
  const handleAddPiece = (pieceId) => {
    // Déterminer une position aléatoire pour la pièce (pour l'exemple)
    const randomX = (Math.random() - 0.5) * 100;
    const randomZ = (Math.random() - 0.5) * 100;
    
    importPiece(pieceId, [randomX, 0, randomZ], [0, 0, 0]);
  };
  
  // Trier les pièces par matériau pour une meilleure organisation
  const piecesByMaterial = {};
  rawPieces.forEach(piece => {
    const materialId = piece.materialId || 'unknown';
    if (!piecesByMaterial[materialId]) {
      piecesByMaterial[materialId] = [];
    }
    piecesByMaterial[materialId].push(piece);
  });
  
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Pièces disponibles
      </Typography>
      
      {Object.entries(piecesByMaterial).map(([materialId, pieces]) => (
        <Box key={materialId} sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
            {getMaterialName(materialId)}
          </Typography>
          
          <List dense disablePadding>
            {pieces.map((piece) => (
              <Paper key={piece.id} sx={{ mb: 1 }}>
                <ListItem dense>
                  <ListItemText
                    primary={piece.description || `Pièce ${piece.id}`}
                    secondary={`${piece.length} × ${piece.width} × ${piece.thickness} mm`}
                    primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Ajouter à la scène">
                      <IconButton edge="end" size="small" onClick={() => handleAddPiece(piece.id)}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              </Paper>
            ))}
          </List>
        </Box>
      ))}
      
      {rawPieces.length === 0 && (
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Aucune pièce disponible dans ce projet.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default PiecesList;