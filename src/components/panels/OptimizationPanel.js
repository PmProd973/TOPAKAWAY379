import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormControlLabel,
  InputLabel,
  Switch,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  PictureAsPdf as PictureAsPdfIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  LocalPrintshop as LocalPrintshopIcon
} from '@mui/icons-material';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { optimizeCutting, formatOptimizationResult, exportToCsv, exportToPdf, printOptimizationResult } from '../../services/optimizerService';
import PanelLabelsComponent from './PanelLabelsComponent';

// Composant pour les paramètres d'optimisation
const OptimizationParams = ({ params, onChange }) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <FormControl fullWidth margin="normal">
          <InputLabel id="algorithm-label">Algorithme</InputLabel>
          <Select
            labelId="algorithm-label"
            name="algorithm"
            value={params.algorithm}
            onChange={onChange}
            label="Algorithme"
          >
            <MenuItem value="maxrects">MaxRects (optimisation avancée)</MenuItem>
            <MenuItem value="skyline" disabled>Skyline (à venir)</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          label="Largeur de trait de scie (mm)"
          type="number"
          name="sawWidth"
          value={params.sawWidth}
          onChange={onChange}
          margin="normal"
          inputProps={{ min: 1, max: 10, step: 0.1 }}
          fullWidth
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          label="Marge autour du panneau (mm)"
          type="number"
          name="panelMargin"
          value={params.panelMargin || 0}
          onChange={onChange}
          margin="normal"
          inputProps={{ min: 0, max: 50, step: 1 }}
          fullWidth
          helperText="Espace entre le bord du panneau et les pièces"
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControlLabel
          control={
            <Switch
              name="allowRotation"
              checked={params.allowRotation}
              onChange={(e) => onChange({ target: { name: 'allowRotation', value: e.target.checked } })}
              color="primary"
            />
          }
          label="Autoriser la rotation des pièces"
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControlLabel
          control={
            <Switch
              name="respectGrain"
              checked={params.respectGrain}
              onChange={(e) => onChange({ target: { name: 'respectGrain', value: e.target.checked } })}
              color="primary"
              disabled={!params.allowRotation}
            />
          }
          label="Respecter le fil du bois"
        />
      </Grid>
      
      <Grid item xs={12}>
        <FormControl fullWidth margin="normal">
          <InputLabel id="waste-strategy-label">Stratégie de chutes</InputLabel>
          <Select
            labelId="waste-strategy-label"
            name="wasteStrategy"
            value={params.wasteStrategy}
            onChange={onChange}
            label="Stratégie de chutes"
          >
            <MenuItem value="minimize">Minimiser les chutes</MenuItem>
            <MenuItem value="reusable">Favoriser les chutes réutilisables</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      {/* Options d'optimisation par bandes */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Options avancées pour scies industrielles
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControlLabel
          control={
            <Switch
              name="groupIntoBands"
              checked={params.groupIntoBands}
              onChange={(e) => onChange({ target: { name: 'groupIntoBands', value: e.target.checked } })}
              color="primary"
            />
          }
          label="Regrouper les pièces en bandes"
        />
      </Grid>

      {params.groupIntoBands && (
        <>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="band-orientation-label">Orientation des bandes</InputLabel>
              <Select
                labelId="band-orientation-label"
                name="bandOrientation"
                value={params.bandOrientation}
                onChange={onChange}
                label="Orientation des bandes"
              >
                <MenuItem value="width">Par largeur</MenuItem>
                <MenuItem value="length">Par longueur</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Longueur max de bande (mm)"
              type="number"
              name="maxBandLength"
              value={params.maxBandLength}
              onChange={onChange}
              margin="normal"
              inputProps={{ min: 500, max: 6000, step: 100 }}
              fullWidth
              helperText="Longueur maximale d'une bande"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Tolérance de dimension (mm)"
              type="number"
              name="dimensionTolerance"
              value={params.dimensionTolerance || 0.5}
              onChange={onChange}
              margin="normal"
              inputProps={{ min: 0, max: 5, step: 0.1 }}
              fullWidth
              helperText="Tolérance pour regrouper des pièces de dimensions similaires"
            />
          </Grid>
        </>
      )}
    </Grid>
  );
};

// Composant de visualisation du plan de découpe
const CuttingPlanVisualization = ({ result, currentPanel, materials, pieces, onPanelChange, onRefresh }) => {
  const [zoom, setZoom] = useState(1);
  const panel = result?.panels?.[currentPanel];
  
  console.log("CuttingPlanVisualization received:", {
    result, currentPanel, materials, pieces, panel 
  });
  
  if (!panel) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Typography variant="subtitle1" color="text.secondary">
          Aucun panneau à afficher
        </Typography>
      </Box>
    );
  }
  
  // Fonction pour récupérer une pièce par ID
  const getPieceById = (pieceId) => {
    if (!pieceId || !Array.isArray(pieces)) return null;
    return pieces.find(p => p.id === pieceId);
  };
  
  // Trouver le matériau pour ce panneau
  const material = Array.isArray(materials) 
    ? materials.find(m => m && m.id === panel?.materialId) 
    : null;
  
  // Déterminer la largeur disponible et calculer l'échelle appropriée
  const containerWidth = 800;
  const containerHeight = 600;
  const scaleX = containerWidth / panel.width;
  const scaleY = containerHeight / panel.length;
  const baseScale = Math.min(scaleX, scaleY) * 0.9; // 90% pour laisser une marge
  const scale = baseScale * zoom;
  
  // Récupérer la valeur de marge du panneau
  const panelMargin = Number(result.params?.panelMargin) || 0;
  
  // Calculer la largeur du trait de scie
  const sawWidth = Number(result.params?.sawWidth) || 3.2;
  
  // Fonction pour vérifier si un tableau de pièces existe et n'est pas vide
  const hasPieces = (piecesArray) => {
    return piecesArray && Array.isArray(piecesArray) && piecesArray.length > 0;
  };
  
  // Générer une couleur basée sur un index
  const getColor = (index) => {
    const hue = (index * 137.5) % 360;
    return `hsl(${hue}, 70%, 65%)`;
  };
  
  // Fonction pour calculer la taille du texte en fonction des dimensions de la pièce
  const calculateFontSize = (width, length, baseFactor = 15, minSize = 10, maxSize = 16) => {
    // La taille du texte est proportionnelle à la plus petite dimension
    const size = Math.min(width, length) / baseFactor;
    return Math.min(maxSize, Math.max(minSize, size));
  };
  // Générer un motif d'achures pour les chutes
  const patternId = `pattern-${currentPanel}`;
  
  // Créer un Set des positions occupées (pour identifier les duplications)
  const occupiedPositions = new Set();
  
  // Créer un tableau des zones occupées par les pièces pour identifier les chutes
  const occupiedAreas = [];
  
  // Identifier les zones occupées par les pièces placées
  if (panel.cuts && panel.cuts.length > 0) {
    // Utiliser panel.cuts pour les zones occupées
    panel.cuts.forEach(cut => {
      occupiedAreas.push({
        x: Number(cut.x) - sawWidth,
        y: Number(cut.y) - sawWidth,
        width: Number(cut.width) + (sawWidth * 2),
        length: Number(cut.length) + (sawWidth * 2)
      });
    });
  } else if (panel.placedPieces && panel.placedPieces.length > 0) {
    // Utiliser panel.placedPieces pour les zones occupées
    panel.placedPieces.forEach(placedPiece => {
      const pieceWidth = placedPiece.rotated ? placedPiece.piece.length : placedPiece.piece.width;
      const pieceLength = placedPiece.rotated ? placedPiece.piece.width : placedPiece.piece.length;
      
      // Ajouter l'espace de la pièce plus le trait de scie
      occupiedAreas.push({
        x: Number(placedPiece.x) - sawWidth,
        y: Number(placedPiece.y) - sawWidth,
        width: pieceWidth + (sawWidth * 2),
        length: pieceLength + (sawWidth * 2)
      });
    });
  }
  
  // Créer un quadrillage virtuel pour visualiser les zones de chute
  const gridSize = 20; // Taille des cellules de la grille en mm
  const gridCellsX = Math.ceil(panel.width / gridSize);
  const gridCellsY = Math.ceil(panel.length / gridSize);
  
  // Déterminer quelles cellules de la grille sont libres (chutes)
  const wasteGrid = [];
  for (let y = 0; y < gridCellsY; y++) {
    for (let x = 0; x < gridCellsX; x++) {
      const cellX = x * gridSize;
      const cellY = y * gridSize;
      
      // Vérifier si cette cellule se trouve dans une zone occupée par une pièce
      const isOccupied = occupiedAreas.some(area => 
        cellX + gridSize > area.x && cellX < area.x + area.width &&
        cellY + gridSize > area.y && cellY < area.y + area.length
      );
      
      // Vérifier si cette cellule se trouve dans un reste réutilisable officiel
      const isInReusableWaste = panel.reusableWaste && panel.reusableWaste.some(waste => 
        cellX + gridSize > waste.x && cellX < waste.x + waste.width &&
        cellY + gridSize > waste.y && cellY < waste.y + waste.length
      );
      
      // Si ni occupée par une pièce ni dans un reste réutilisable, c'est une chute
      if (!isOccupied && !isInReusableWaste) {
        wasteGrid.push({
          x: cellX,
          y: cellY,
          width: Math.min(gridSize, panel.width - cellX),
          height: Math.min(gridSize, panel.length - cellY)
        });
      }
    }
  }
  
  // Gérer la navigation entre les panneaux
  const handlePrevPanel = () => {
    if (currentPanel > 0) {
      onPanelChange(currentPanel - 1);
    }
  };
  
  const handleNextPanel = () => {
    if (currentPanel < (result.panels.length - 1)) {
      onPanelChange(currentPanel + 1);
    }
  };
  
  // Gérer le zoom
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.2));
  };
  
  // Rafraîchir l'affichage du panneau
  const handleRefresh = () => {
    if (onRefresh && typeof onRefresh === 'function') {
      onRefresh();
    } else {
      // Fallback si onRefresh n'est pas fourni
      setZoom(zoom => zoom + 0.001);
      setTimeout(() => setZoom(zoom => zoom - 0.001), 10);
    }
  };
  
  // Version améliorée de la fonction pour fusionner les traits de scie
  const mergeOverlappingLines = (lines, tolerance = 1.0) => {
    if (!lines || lines.length === 0) return [];
    
    // Séparer les lignes horizontales et verticales avec plus de précision
    const horizontalLines = lines.filter(line => Math.abs(line.y1 - line.y2) < tolerance);
    const verticalLines = lines.filter(line => Math.abs(line.x1 - line.x2) < tolerance);
    
    // Normaliser les lignes pour s'assurer que x1 <= x2 et y1 <= y2
    const normalizeLines = (lineList) => {
      return lineList.map(line => {
        // Copie pour ne pas modifier l'original
        const newLine = { ...line };
        
        // Pour les lignes horizontales, s'assurer que x1 <= x2
        if (Math.abs(newLine.y1 - newLine.y2) < tolerance) {
          if (newLine.x1 > newLine.x2) {
            [newLine.x1, newLine.x2] = [newLine.x2, newLine.x1];
          }
          // Normaliser y pour être exactement le même
          const avgY = (newLine.y1 + newLine.y2) / 2;
          newLine.y1 = avgY;
          newLine.y2 = avgY;
        }
        
        // Pour les lignes verticales, s'assurer que y1 <= y2
        if (Math.abs(newLine.x1 - newLine.x2) < tolerance) {
          if (newLine.y1 > newLine.y2) {
            [newLine.y1, newLine.y2] = [newLine.y2, newLine.y1];
          }
          // Normaliser x pour être exactement le même
          const avgX = (newLine.x1 + newLine.x2) / 2;
          newLine.x1 = avgX;
          newLine.x2 = avgX;
        }
        
        return newLine;
      });
    };
    
    const normalizedHorizontal = normalizeLines(horizontalLines);
    const normalizedVertical = normalizeLines(verticalLines);
    
    // Regrouper les lignes par position (coordonnée y pour horizontales, x pour verticales)
    const groupLinesByPosition = (lines, isHorizontal) => {
      const groups = {};
      
      lines.forEach(line => {
        const pos = isHorizontal ? Math.round(line.y1 * 100) / 100 : Math.round(line.x1 * 100) / 100;
        if (!groups[pos]) groups[pos] = [];
        groups[pos].push(line);
      });
      
      return groups;
    };
    
    // Grouper les lignes horizontales et verticales
    const horizontalGroups = groupLinesByPosition(normalizedHorizontal, true);
    const verticalGroups = groupLinesByPosition(normalizedVertical, false);
    
    // Fonction pour fusionner les lignes d'un même groupe
    const mergeLineGroup = (lines, isHorizontal) => {
      if (lines.length === 0) return [];
      
      // Trier par position de début
      const sorted = [...lines].sort((a, b) => {
        return isHorizontal ? (a.x1 - b.x1) : (a.y1 - b.y1);
      });
      
      const merged = [];
      let current = { ...sorted[0] };
      
      for (let i = 1; i < sorted.length; i++) {
        const next = sorted[i];
        
        if (isHorizontal) {
          // Pour les lignes horizontales, vérifier si elles se touchent sur l'axe x
          if (next.x1 <= current.x2 + tolerance) {
            // Étendre la ligne actuelle
            current.x2 = Math.max(current.x2, next.x2);
          } else {
            // Pas de chevauchement, ajouter la ligne actuelle et passer à la suivante
            merged.push({ ...current });
            current = { ...next };
          }
        } else {
          // Pour les lignes verticales, vérifier si elles se touchent sur l'axe y
          if (next.y1 <= current.y2 + tolerance) {
            // Étendre la ligne actuelle
            current.y2 = Math.max(current.y2, next.y2);
          } else {
            // Pas de chevauchement, ajouter la ligne actuelle et passer à la suivante
            merged.push({ ...current });
            current = { ...next };
          }
        }
      }
      
      // Ajouter la dernière ligne
      merged.push({ ...current });
      
      return merged;
    };
    
    // Fusionner chaque groupe
    let mergedHorizontal = [];
    let mergedVertical = [];
    
    for (const pos in horizontalGroups) {
      mergedHorizontal = [...mergedHorizontal, ...mergeLineGroup(horizontalGroups[pos], true)];
    }
    
    for (const pos in verticalGroups) {
      mergedVertical = [...mergedVertical, ...mergeLineGroup(verticalGroups[pos], false)];
    }
    
    return [...mergedHorizontal, ...mergedVertical];
  };
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Tooltip title="Panneau précédent">
            <span>
              <IconButton 
                onClick={handlePrevPanel} 
                disabled={currentPanel === 0}
                color="primary"
              >
                <ArrowBackIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Typography variant="subtitle1" component="span" sx={{ mx: 2 }}>
            Panneau {currentPanel + 1} / {result.panels.length}
          </Typography>
          <Tooltip title="Panneau suivant">
            <span>
              <IconButton 
                onClick={handleNextPanel} 
                disabled={currentPanel === result.panels.length - 1}
                color="primary"
              >
                <ArrowForwardIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        
        <Box>
          <Tooltip title="Zoom arrière">
            <IconButton onClick={handleZoomOut} color="primary" disabled={zoom <= 0.2}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="body2" component="span" sx={{ mx: 1 }}>
            {Math.round(zoom * 100)}%
          </Typography>
          <Tooltip title="Zoom avant">
            <IconButton onClick={handleZoomIn} color="primary" disabled={zoom >= 5}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rafraîchir l'affichage">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Box 
        sx={{ 
          overflow: 'auto', 
          border: '1px solid #ddd', 
          borderRadius: 1,
          p: 1,
          bgcolor: '#f5f5f5',
          height: 600
        }}
      >
        <svg
          width={panel.width * scale}
          height={panel.length * scale}
          viewBox={`0 0 ${panel.width} ${panel.length}`}
          style={{ background: '#fff' }}
        >
          {/* Définition du motif d'achures pour les chutes */}
          <defs>
            <pattern 
              id={patternId} 
              patternUnits="userSpaceOnUse" 
              width="10" 
              height="10"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="10" stroke="#ccc" strokeWidth="1" />
            </pattern>
            
            {/* Motif pour les restes réutilisables */}
            <pattern 
              id={`${patternId}-reusable`} 
              patternUnits="userSpaceOnUse" 
              width="20" 
              height="20"
            >
              <rect width="20" height="20" fill="none" stroke="#5cb85c" strokeWidth="1" strokeDasharray="2,2" />
            </pattern>
          </defs>
          
          {/* Panneau complet */}
          <rect
            x={0}
            y={0}
            width={panel.width}
            height={panel.length}
            fill="#f0f0f0"
            stroke="#000"
            strokeWidth="2"
          />
          
          {/* Chutes (avec le motif d'achures) */}
          {wasteGrid.map((cell, index) => (
            <rect
              key={`waste-cell-${index}`}
              x={cell.x}
              y={cell.y}
              width={cell.width}
              height={cell.height}
              fill={`url(#${patternId})`}
              stroke="none"
            />
          ))}
          
          {/* Restes réutilisables */}
          {panel.reusableWaste && Array.isArray(panel.reusableWaste) && panel.reusableWaste.map((waste, index) => {
            const x = Number(waste.x);
            const y = Number(waste.y);
            const width = Number(waste.width);
            const length = Number(waste.length);
            
            // Calculer les tailles de police adaptatives
            const titleFontSize = calculateFontSize(width, length, 15, 12, 18);
            const dimFontSize = calculateFontSize(width, length, 20, 10, 16);
            
            return (
              <g key={`reusable-${index}`}>
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={length}
                  fill={`url(#${patternId}-reusable)`}
                  stroke="#5cb85c"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                />
                <text
                  x={x + width/2}
                  y={y + length/2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#5cb85c"
                  fontSize={titleFontSize}
                  fontWeight="bold"
                >
                  RESTE
                  <tspan 
                    x={x + width/2} 
                    y={y + length/2 + titleFontSize}
                    fontSize={dimFontSize}
                  >
                    {width}×{length}mm
                  </tspan>
                </text>
              </g>
            );
          })}
          
          {/* Marge du panneau (si définie) */}
          {panelMargin > 0 && (
            <rect
              x={panelMargin}
              y={panelMargin}
              width={panel.width - (panelMargin * 2)}
              height={panel.length - (panelMargin * 2)}
              fill="none"
              stroke="#999"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          )}
          
          {/* Pièces placées - d'abord essayer panel.cuts */}
          {panel.cuts && Array.isArray(panel.cuts) && panel.cuts.map((cut, index) => {
            // Récupérer les informations de la pièce
            const piece = getPieceById(cut.pieceId);
            
            // Générer une couleur en fonction de l'index
            const color = getColor(index);
            
            // Convertir coordonnées en nombres
            const x = Number(cut.x) || 0;
            const y = Number(cut.y) || 0;
            const width = Number(cut.width) || 0;
            const length = Number(cut.length) || 0;
            
            // Vérifier si une pièce avec ces coordonnées existe déjà (éviter les doublons)
            const positionKey = `${x}-${y}-${width}-${length}`;
            if (occupiedPositions.has(positionKey)) {
              return null; // Ne pas afficher les pièces en double
            }
            occupiedPositions.add(positionKey);
            
            // Calculer les tailles de police adaptatives
            const titleFontSize = calculateFontSize(width, length, 15, 10, 16);
            const dimFontSize = calculateFontSize(width, length, 20, 8, 14);
            
            // Si la pièce a des dimensions valides, l'afficher
            if (width > 0 && length > 0) {
              return (
                <g key={`piece-${index}`}>
                  {/* Zone du trait de scie */}
                  <rect
                    x={x - sawWidth/2}
                    y={y - sawWidth/2}
                    width={width + sawWidth}
                    height={length + sawWidth}
                    fill="#ffeeee"
                    stroke="none"
                  />
                  
                  {/* Pièce elle-même */}
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={length}
                    fill={color}
                    stroke="#333"
                    strokeWidth="1"
                  />
                  
                  {/* Texte descriptif */}
                  <text
                    x={x + width / 2}
                    y={y + length / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#000"
                    fontSize={titleFontSize}
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {piece ? piece.description : `#${index + 1}`}
                    <tspan 
                      x={x + width / 2} 
                      y={y + length / 2 + titleFontSize}
                      fontSize={dimFontSize}
                    >
                      {width}×{length}
                    </tspan>
                  </text>
                </g>
              );
            }
            
            return null;
          })}
          
          {/* Si panel.cuts n'existe pas, essayer d'utiliser panel.placedPieces */}
          {(!panel.cuts || panel.cuts.length === 0) && panel.placedPieces && Array.isArray(panel.placedPieces) && 
            panel.placedPieces.map((placed, index) => {
              // Si la pièce n'a pas d'infos valides, ignorer
              if (!placed.piece) return null;
              
              // Générer une couleur en fonction de l'index
              const color = getColor(index);
              
              // Convertir coordonnées en nombres
              const x = Number(placed.x) || 0;
              const y = Number(placed.y) || 0;
              
              // Déterminer les dimensions selon la rotation
              const pieceWidth = Number(placed.rotated ? placed.piece.length : placed.piece.width) || 0;
              const pieceLength = Number(placed.rotated ? placed.piece.width : placed.piece.length) || 0;
              
              // Vérifier si une pièce avec ces coordonnées existe déjà (éviter les doublons)
              const positionKey = `${x}-${y}-${pieceWidth}-${pieceLength}`;
              if (occupiedPositions.has(positionKey)) {
                return null; // Ne pas afficher les pièces en double
              }
              occupiedPositions.add(positionKey);
              
              // Calculer les tailles de police adaptatives
              const titleFontSize = calculateFontSize(pieceWidth, pieceLength, 15, 10, 16);
              const dimFontSize = calculateFontSize(pieceWidth, pieceLength, 20, 8, 14);
              
              // Si la pièce a des dimensions valides, l'afficher
              if (pieceWidth > 0 && pieceLength > 0) {
                return (
                  <g key={`placed-${index}`}>
                    {/* Zone du trait de scie */}
                    <rect
                      x={x - sawWidth/2}
                      y={y - sawWidth/2}
                      width={pieceWidth + sawWidth}
                      height={pieceLength + sawWidth}
                      fill="#ffeeee"
                      stroke="none"
                    />
                    
                    {/* Pièce elle-même */}
                    <rect
                      x={x}
                      y={y}
                      width={pieceWidth}
                      height={pieceLength}
                      fill={color}
                      stroke="#333"
                      strokeWidth="1"
                    />
                    
                    {/* Texte descriptif */}
                    <text
                      x={x + pieceWidth / 2}
                      y={y + pieceLength / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#000"
                      fontSize={titleFontSize}
                      fontWeight="bold"
                      style={{ pointerEvents: 'none' }}
                    >
                      {placed.piece.description || `#${index + 1}`}
                      <tspan 
                        x={x + pieceWidth / 2} 
                        y={y + pieceLength / 2 + titleFontSize}
                        fontSize={dimFontSize}
                      >
                        {pieceWidth}×{pieceLength}
                      </tspan>
                    </text>
                  </g>
                );
              }
              
              return null;
            })
          }
          
    

{/* Traits de scie avec une approche complètement repensée */}
{(() => {
  try {
    console.log("Début du rendu des traits de scie avec la nouvelle méthode");
    
    // Définir la taille des cellules pour la grille (en mm)
    const cellSize = Math.max(1, sawWidth);
    
    // Créer un tableau 2D pour représenter la grille
    const gridWidth = Math.ceil(panel.width / cellSize) + 1;
    const gridHeight = Math.ceil(panel.length / cellSize) + 1;
    const sawGrid = Array(gridHeight).fill().map(() => Array(gridWidth).fill(false));
    
    console.log(`Grille créée: ${gridWidth}x${gridHeight} cellules`);
    
    // Marquer les cellules qui contiennent des traits de scie
    
    // 1. Fonction plus précise pour marquer une ligne de cellules
    const markLine = (x1, y1, x2, y2) => {
      // Normaliser les coordonnées (s'assurer que x1,y1 est en haut à gauche)
      let startX, startY, endX, endY;
      
      // Pour les lignes horizontales
      if (Math.abs(y1 - y2) < cellSize) {
        startX = Math.min(x1, x2);
        endX = Math.max(x1, x2);
        // Utiliser la moyenne des y pour éviter les problèmes d'arrondi
        startY = endY = (y1 + y2) / 2;
      } 
      // Pour les lignes verticales
      else if (Math.abs(x1 - x2) < cellSize) {
        startY = Math.min(y1, y2);
        endY = Math.max(y1, y2);
        // Utiliser la moyenne des x pour éviter les problèmes d'arrondi
        startX = endX = (x1 + x2) / 2;
      }
      // Pour les lignes diagonales (rare)
      else {
        startX = x1;
        startY = y1;
        endX = x2;
        endY = y2;
      }
      
      // Convertir en indices de cellules avec une marge de sécurité
      const gridStartX = Math.max(0, Math.floor(startX / cellSize));
      const gridStartY = Math.max(0, Math.floor(startY / cellSize));
      const gridEndX = Math.min(gridWidth - 1, Math.ceil(endX / cellSize));
      const gridEndY = Math.min(gridHeight - 1, Math.ceil(endY / cellSize));
      
      // Si c'est une ligne horizontale
      if (Math.abs(startY - endY) < cellSize) {
        const gridY = Math.floor(startY / cellSize);
        if (gridY >= 0 && gridY < gridHeight) {
          for (let x = gridStartX; x <= gridEndX; x++) {
            if (x >= 0 && x < gridWidth) {
              sawGrid[gridY][x] = true;
            }
          }
        }
      }
      // Si c'est une ligne verticale
      else if (Math.abs(startX - endX) < cellSize) {
        const gridX = Math.floor(startX / cellSize);
        if (gridX >= 0 && gridX < gridWidth) {
          for (let y = gridStartY; y <= gridEndY; y++) {
            if (y >= 0 && y < gridHeight) {
              sawGrid[y][gridX] = true;
            }
          }
        }
      }
      // Si c'est une ligne diagonale
      else {
        // Algorithme de Bresenham amélioré
        const dx = Math.abs(gridEndX - gridStartX);
        const dy = Math.abs(gridEndY - gridStartY);
        const sx = gridStartX < gridEndX ? 1 : -1;
        const sy = gridStartY < gridEndY ? 1 : -1;
        let err = dx - dy;
        
        let x = gridStartX;
        let y = gridStartY;
        
        while (true) {
          if (y >= 0 && y < gridHeight && x >= 0 && x < gridWidth) {
            sawGrid[y][x] = true;
          }
          
          if (x === gridEndX && y === gridEndY) break;
          
          const e2 = 2 * err;
          if (e2 > -dy) {
            err -= dy;
            x += sx;
          }
          if (e2 < dx) {
            err += dx;
            y += sy;
          }
        }
      }
    };
    
    // 2. Fonction pour marquer les quatre côtés d'une pièce
    const markPieceBoundary = (x, y, width, length) => {
      // Ajouter une petite marge pour s'assurer que les traits sont visibles
      const safeX = Math.max(0, x - sawWidth/2);
      const safeY = Math.max(0, y - sawWidth/2);
      const safeWidth = width + sawWidth;
      const safeLength = length + sawWidth;
      
      // Marquer les quatre côtés du rectangle
      markLine(safeX, safeY, safeX + safeWidth, safeY); // Haut
      markLine(safeX, safeY + safeLength, safeX + safeWidth, safeY + safeLength); // Bas
      markLine(safeX, safeY, safeX, safeY + safeLength); // Gauche
      markLine(safeX + safeWidth, safeY, safeX + safeWidth, safeY + safeLength); // Droite
    };
    
    // 3. Marquer les traits pour chaque pièce placée
    let piecesMarked = 0;
    
    // D'abord essayer avec panel.cuts
    if (panel.cuts && Array.isArray(panel.cuts)) {
      panel.cuts.forEach((cut) => {
        const x = Number(cut.x) || 0;
        const y = Number(cut.y) || 0;
        const width = Number(cut.width) || 0;
        const length = Number(cut.length) || 0;
        
        // Si la pièce a des dimensions valides
        if (width > 0 && length > 0) {
          markPieceBoundary(x, y, width, length);
          piecesMarked++;
        }
      });
    }
    // Si panel.cuts n'existe pas, essayer avec panel.placedPieces
    else if (panel.placedPieces && Array.isArray(panel.placedPieces)) {
      panel.placedPieces.forEach((placed) => {
        if (!placed.piece) return;
        
        const x = Number(placed.x) || 0;
        const y = Number(placed.y) || 0;
        const width = Number(placed.rotated ? placed.piece.length : placed.piece.width) || 0;
        const length = Number(placed.rotated ? placed.piece.width : placed.piece.length) || 0;
        
        // Si la pièce a des dimensions valides
        if (width > 0 && length > 0) {
          markPieceBoundary(x, y, width, length);
          piecesMarked++;
        }
      });
    }
    
    console.log(`Marquage des traits de scie terminé: ${piecesMarked} pièces traitées`);
    
    // Amélioration majeure: fusion des cellules adjacentes en blocs rectangulaires
    // Cette étape réduit considérablement le nombre d'éléments SVG à rendre
    
    // 1. Fonction pour fusionner les cellules en rectangles optimisés
    const mergeAdjacentCells = () => {
      // Créer une copie de la grille pour garder trace des cellules déjà fusionnées
      const processedGrid = Array(gridHeight).fill().map(() => Array(gridWidth).fill(false));
      const mergedRects = [];
      
      // Parcourir chaque cellule
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          // Ignorer les cellules déjà traitées ou vides
          if (processedGrid[y][x] || !sawGrid[y][x]) continue;
          
          // Trouver la largeur maximale pour ce rectangle
          let width = 1;
          while (x + width < gridWidth && sawGrid[y][x + width] && !processedGrid[y][x + width]) {
            width++;
          }
          
          // Trouver la hauteur maximale pour ce rectangle
          let height = 1;
          let canExtend = true;
          
          while (canExtend && y + height < gridHeight) {
            // Vérifier si toutes les cellules de cette ligne peuvent être incluses
            for (let i = 0; i < width; i++) {
              if (!sawGrid[y + height][x + i] || processedGrid[y + height][x + i]) {
                canExtend = false;
                break;
              }
            }
            
            if (canExtend) {
              height++;
            }
          }
          
          // Marquer toutes ces cellules comme traitées
          for (let j = 0; j < height; j++) {
            for (let i = 0; i < width; i++) {
              processedGrid[y + j][x + i] = true;
            }
          }
          
          // Ajouter ce rectangle à la liste
          mergedRects.push({
            x: x * cellSize,
            y: y * cellSize,
            width: width * cellSize,
            height: height * cellSize
          });
        }
      }
      
      return mergedRects;
    };
    
    // Obtenir les rectangles optimisés
    const optimizedRects = mergeAdjacentCells();
    
    console.log(`Optimisation des traits: ${optimizedRects.length} rectangles générés`);
    
    // Rendu des rectangles avec une couleur rouge solide
    return optimizedRects.map((rect, index) => (
      <rect
        key={`saw-rect-${index}`}
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        fill="red"
        opacity={0.9} // Opacité plus élevée pour une meilleure visibilité
      />
    ));
  } catch (error) {
    console.error("Erreur lors du rendu des traits de scie:", error);
    return <text x="10" y="10" fill="red">Erreur: {error.message}</text>;
  }
})()}
        </svg>
      </Box>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="subtitle2">Légende</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#f0f0f0', border: '1px solid #000', mr: 1 }} />
              <Typography variant="caption">Panneau {material?.description || ''} ({panel.width}×{panel.length}mm)</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 16, height: 16, bgcolor: 'hsl(200, 70%, 65%)', border: '1px solid #333', mr: 1 }} />
              <Typography variant="caption">Pièces placées</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                width: 16, 
                height: 16, 
                bgcolor: '#ffeeee',
                border: '1px dotted red',
                mr: 1 
              }} />
              <Typography variant="caption">Traits de scie ({sawWidth}mm)</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                width: 16, 
                height: 16, 
                fill: `url(#${patternId})`,
                border: '1px solid #ccc',
                mr: 1 
              }} />
              <Typography variant="caption">Chutes</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                width: 16, 
                height: 16, 
                border: '1px dashed #5cb85c',
                mr: 1 
              }} />
              <Typography variant="caption">Restes réutilisables</Typography>
            </Box>
            
            {panelMargin > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <Box sx={{ 
                  width: 16, 
                  height: 16, 
                  border: '1px dashed #999',
                  mr: 1 
                }} />
                <Typography variant="caption">Marge ({panelMargin}mm)</Typography>
              </Box>
            )}
          </Box>
        </Box>
        
        <Box>
          <Typography variant="subtitle2">Efficacité</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Box 
              sx={{ 
                width: 100, 
                height: 16, 
                border: '1px solid #ccc',
                borderRadius: 1,
                overflow: 'hidden',
                mr: 1
              }}
            >
              <Box 
                sx={{ 
                  width: `${(panel.efficiency || 0) * 100}%`, 
                  height: '100%', 
                  bgcolor: (panel.efficiency || 0) > 0.7 ? 'success.main' : (panel.efficiency || 0) > 0.5 ? 'warning.main' : 'error.main'
                }} 
              />
            </Box>
            <Typography variant="caption">
              {((panel.efficiency || 0) * 100).toFixed(1)}% ({(panel.waste || 0) * 100 < 0.1 ? '< 0.1' : ((panel.waste || 0) * 100).toFixed(1)}% chutes)
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// Composant principal pour l'optimisation
const OptimizationPanel = ({ projectId, pieces, materials, onOptimizationComplete }) => {
  // États
  const [loading, setLoading] = useState(false);
  const [optimizationParams, setOptimizationParams] = useState({
    algorithm: 'maxrects',
    sawWidth: 3.2,
    allowRotation: true,
    respectGrain: true,
    wasteStrategy: 'minimize',
    panelMargin: 0,
    groupIntoBands: false,
    bandOrientation: 'width',
    maxBandLength: 2800,
    dimensionTolerance: 0.5
  });
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [currentPanel, setCurrentPanel] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [optimizationHistory, setOptimizationHistory] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [refreshKey, setRefreshKey] = useState(0); // Pour forcer le re-rendu du panneau

  // Gérer les changements dans les paramètres d'optimisation
  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setOptimizationParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Forcer le rafraîchissement de l'affichage
  const handleRefreshDisplay = () => {
    setRefreshKey(prevKey => prevKey + 1);
    
    setNotification({
      show: true,
      message: "Affichage rafraîchi",
      type: 'info'
    });
    
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Récupérer l'historique des optimisations
  const fetchOptimizationHistory = async () => {
    try {
      const historyColl = collection(db, 'cutting_plans');
      const q = query(
        historyColl,
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      setOptimizationHistory(historyData);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique:", error);
      
      setNotification({
        show: true,
        message: `Erreur lors de la récupération de l'historique: ${error.message}`,
        type: 'error'
      });
      
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
    }
  };

  // Charger l'historique des optimisations au chargement du composant
  useEffect(() => {
    if (projectId) {
      fetchOptimizationHistory();
    }
  }, [projectId]);

  // Fonction pour charger un résultat d'optimisation depuis l'historique
  const handleLoadFromHistory = (historyItem) => {
    setOptimizationResult(historyItem.result);
    setOptimizationParams(historyItem.params || optimizationParams);
    setCurrentPanel(0);
    setActiveTab(1); // Basculer sur l'onglet des résultats
    setHistoryDialogOpen(false);
    setRefreshKey(prevKey => prevKey + 1); // Forcer le re-rendu du panneau
  };

  // Fonction pour sauvegarder le résultat dans Firestore
  const saveOptimizationResult = async (result) => {
    try {
      // S'assurer que tous les champs ont des valeurs valides (non undefined)
      const dataToSave = {
        projectId,
        result,
        params: optimizationParams,
        createdAt: serverTimestamp(),
        // Utiliser des valeurs par défaut en cas de undefined
        efficiency: result.globalEfficiency ?? 0,
        panelCount: result.panels?.length ?? 0,
        pieceCount: result.totalPieces ?? 0
      };
      
      // Vérifier et nettoyer l'objet pour éviter les valeurs undefined
      const cleanData = Object.entries(dataToSave).reduce((acc, [key, value]) => {
        // Si la valeur est undefined, ne pas l'inclure dans l'objet final
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      // Créer un document dans la collection cutting_plans
      const planRef = await addDoc(collection(db, 'cutting_plans'), cleanData);
      
      console.log("Plan de découpe sauvegardé avec l'ID:", planRef.id);
      
      return planRef.id;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du plan:", error);
      throw error;
    }
  };

  // Fonction pour lancer l'optimisation
  const handleStartOptimization = async () => {
    // Vérification préalable
    if (!pieces || pieces.length === 0) {
      setNotification({
        show: true,
        message: "Aucune pièce à optimiser. Veuillez d'abord ajouter des pièces.",
        type: 'warning'
      });
      
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      
      return;
    }
    
    if (!materials || materials.length === 0) {
      setNotification({
        show: true,
        message: "Aucun matériau disponible. Veuillez d'abord ajouter des matériaux.",
        type: 'warning'
      });
      
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      
      return;
    }
    
    try {
      setLoading(true);
      
      // Convertir les pièces au format attendu par l'algorithme - avec vérification des valeurs
      const formattedPieces = (pieces || []).map(piece => ({
        id: piece.id || '',
        description: piece.description || '',
        length: Number(piece.length) || 0,
        width: Number(piece.width) || 0,
        quantity: Number(piece.quantity) || 1,
        materialId: piece.materialId || '',
        hasGrain: Boolean(piece.hasGrain),
        grainDirection: piece.grainDirection || 'length',
        priority: piece.priority || 'normal'
      }));
      
      // Convertir les matériaux au format attendu par l'algorithme - avec vérification des valeurs
      const formattedMaterials = (materials || []).map(material => ({
        id: material.id || '',
        description: material.description || '',
        length: Number(material.length) || 0,
        width: Number(material.width) || 0,
        thickness: Number(material.thickness) || 0,
        pricePerSquareMeter: Number(material.pricePerSquareMeter) || 0,
        hasGrain: Boolean(material.hasGrain)
      }));
      
      console.log("Starting optimization with:", {
        pieces: formattedPieces,
        materials: formattedMaterials,
        params: optimizationParams
      });
      
      // Vérifier que les données initiales sont correctes
      if (formattedPieces.length === 0 || formattedMaterials.length === 0) {
        throw new Error("Données insuffisantes pour l'optimisation");
      }
      
      // Lancer l'optimisation avec gestion d'erreur améliorée
      let rawResult;
      try {
        rawResult = await optimizeCutting(formattedPieces, formattedMaterials, optimizationParams);
      } catch (optimizationError) {
        console.error("Erreur dans l'algorithme d'optimisation:", optimizationError);
        throw new Error("L'algorithme d'optimisation a échoué: " + optimizationError.message);
      }
      
      console.log("Raw optimization result (detailed):", JSON.stringify(rawResult, null, 2));
      
      // Créer une structure formatée pour l'affichage
      let adaptedResult;
      
      try {
        adaptedResult = formatOptimizationResult(rawResult, formattedPieces, formattedMaterials);
      } catch (formatError) {
        console.error("Erreur lors du formatage du résultat:", formatError);
        
        // Créer un résultat minimal mais valide
        adaptedResult = {
          panels: [],
          globalEfficiency: 0,
          totalPieces: 0,
          unplacedPieces: formattedPieces.map(p => p.id),
          params: optimizationParams
        };
      }
      
      // Si le résultat est vide, créer un panneau minimal
      if (!adaptedResult.panels || !Array.isArray(adaptedResult.panels) || adaptedResult.panels.length === 0) {
        console.warn("Aucun panneau dans le résultat adapté, création d'un résultat minimal:", adaptedResult);
        
        // Créer un résultat minimal avec un panneau vide
        if (formattedMaterials.length > 0) {
          const defaultMaterial = formattedMaterials[0];
          adaptedResult = {
            panels: [{
              id: `empty-panel-${Date.now()}`,
              materialId: defaultMaterial.id,
              width: defaultMaterial.width,
              length: defaultMaterial.length,
              placedPieces: [],
              cuts: [],
              reusableWaste: [],
              sawLines: [],
              efficiency: 0,
              waste: 1
            }],
            globalEfficiency: 0,
            totalPieces: 0,
            unplacedPieces: formattedPieces.map(p => p.id),
            params: optimizationParams
          };
          
          // Notification à l'utilisateur
          setNotification({
            show: true,
            message: "L'algorithme n'a pas pu optimiser le placement. Un panneau vide a été créé.",
            type: 'warning'
          });
        }
      }
      
      console.log("Adapted result:", adaptedResult);
      
      // Définir le résultat de l'optimisation
      setOptimizationResult(adaptedResult);
      setCurrentPanel(0);
      setActiveTab(1); // Basculer sur l'onglet des résultats
      setRefreshKey(prevKey => prevKey + 1); // Forcer le re-rendu du panneau
      
      // Sauvegarder le résultat dans Firestore
      await saveOptimizationResult(adaptedResult);
      
      // Rafraîchir l'historique
      await fetchOptimizationHistory();
      
      // Notification à l'utilisateur
      setNotification({
        show: true,
        message: "Optimisation réussie !",
        type: 'success'
      });
      
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      
      // Informer le composant parent
      if (onOptimizationComplete && typeof onOptimizationComplete === 'function') {
        onOptimizationComplete(adaptedResult);
      }
    } catch (error) {
      console.error("Erreur lors de l'optimisation:", error);
      
      setNotification({
        show: true,
        message: `Erreur: ${error.message}`,
        type: 'error'
      });
      
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour exporter le plan de découpe au format CSV
  const handleExportCsv = () => {
    if (!optimizationResult) return;
    
    try {
      exportToCsv(optimizationResult, pieces);
      
      setNotification({
        show: true,
        message: "Plan de découpe exporté au format CSV",
        type: 'success'
      });
      
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    } catch (error) {
      console.error("Erreur lors de l'export CSV:", error);
      
      setNotification({
        show: true,
        message: `Erreur lors de l'export CSV: ${error.message}`,
        type: 'error'
      });
      
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
    }
  };

  // Fonction pour exporter le plan de découpe au format PDF
  const handleExportPdf = () => {
    if (!optimizationResult) return;
    
    try {
      exportToPdf(optimizationResult, { name: projectId });
      
      setNotification({
        show: true,
        message: "Plan de découpe exporté au format PDF",
        type: 'success'
      });
      
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      
      setNotification({
        show: true,
        message: `Erreur lors de l'export PDF: ${error.message}`,
        type: 'error'
      });
      
      setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
    }
  };

  // Fonction pour imprimer le plan de découpe
  const handlePrintOptimization = () => {
    if (!optimizationResult) return;
    
    try {
      printOptimizationResult(optimizationResult, pieces, materials);
      
      setNotification({
        show: true,
        message: "Impression en cours...",
        type: 'info'
      });
      
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    } catch (error) {
      console.error("Erreur lors de l'impression:", error);
      
      setNotification({
        show: true,
        message: `Erreur lors de l'impression: ${error.message}`,
        type: 'error'
      });
      
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
    }
  };

  // Fonction pour imprimer les étiquettes de panneaux
  const handlePrintPanelLabels = () => {
    // Rien à imprimer si pas de résultat d'optimisation
    if (!optimizationResult) return;
    
    // Basculer sur l'onglet des étiquettes
    setActiveTab(2);
  };

  // Rendu des onglets pour les différentes sections
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Paramètres
        return (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Paramètres d'optimisation
            </Typography>
            <OptimizationParams
              params={optimizationParams}
              onChange={handleParamChange}
            />
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleStartOptimization}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? "Optimisation en cours..." : "Lancer l'optimisation"}
              </Button>
            </Box>
          </Paper>
        );
        
      case 1: // Résultats visuels
        return optimizationResult ? (
          <Box>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Résultats de l'optimisation
                </Typography>
                <Box>
                  <Tooltip title="Historique des optimisations">
                    <IconButton 
                      color="primary" 
                      onClick={() => setHistoryDialogOpen(true)}
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      <HistoryIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Paramètres d'optimisation">
                    <IconButton 
                      color="primary" 
                      onClick={() => setDialogOpen(true)}
                      size="small"
                    >
                      <SettingsIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Informations générales
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Nombre de panneaux
                      </Typography>
                      <Typography variant="h5">
                        {optimizationResult.panels ? optimizationResult.panels.length : 0}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Efficacité globale
                      </Typography>
                      <Typography variant="h5">
                        {((optimizationResult.globalEfficiency || 0) * 100).toFixed(1)}%
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Pièces placées
                      </Typography>
                      <Typography variant="h5">
                        {optimizationResult.totalPieces || 0}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Actions
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportCsv}
                  >
                    Exporter CSV
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={handleExportPdf}
                  >
                    Exporter PDF
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={handlePrintOptimization}
                  >
                    Imprimer
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<LocalPrintshopIcon />}
                    onClick={handlePrintPanelLabels}
                  >
                    Étiquettes
                  </Button>
                </Box>
              </Box>
              
              {optimizationResult.unplacedPieces && optimizationResult.unplacedPieces.length > 0 && (
                <Alert 
                  severity="warning" 
                  sx={{ mt: 2, mb: 2 }}
                >
                  <Typography variant="subtitle2">
                    {optimizationResult.unplacedPieces.length} pièces n'ont pas pu être placées
                  </Typography>
                  <Box sx={{ mt: 1, maxHeight: 100, overflow: 'auto' }}>
                    {optimizationResult.unplacedPieces.map((pieceId, index) => {
                      const piece = pieces.find(p => p.id === pieceId);
                      return (
                        <Chip 
                          key={`unplaced-${index}`}
                          size="small"
                          label={piece ? `${piece.description || 'Pièce'} (${piece.width}×${piece.length})` : `Pièce inconnue #${index + 1}`}
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      );
                    })}
                  </Box>
                </Alert>
              )}
            </Paper>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <CuttingPlanVisualization
                key={`panel-${currentPanel}-refresh-${refreshKey}`}
                result={optimizationResult}
                currentPanel={currentPanel}
                materials={materials}
                pieces={pieces}
                onPanelChange={setCurrentPanel}
                onRefresh={handleRefreshDisplay}
              />
            </Paper>
          </Box>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
              Aucun résultat d'optimisation disponible
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setActiveTab(0)}
              startIcon={<ArrowBackIcon />}
            >
              Configurer l'optimisation
            </Button>
          </Paper>
        );
      
      case 2: // Étiquettes de panneaux
        return optimizationResult ? (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Étiquettes de panneaux
            </Typography>
            <PanelLabelsComponent 
              panels={optimizationResult.panels || []} 
              pieces={pieces} 
              materials={materials}
            />
          </Paper>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
              Aucun résultat d'optimisation disponible pour générer des étiquettes
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setActiveTab(0)}
              startIcon={<ArrowBackIcon />}
            >
              Configurer l'optimisation
            </Button>
          </Paper>
        );
      
      default:
        return <Typography>Contenu non disponible</Typography>;
    }
  };

  // Dialogue pour afficher les paramètres d'optimisation
  const renderParamsDialog = () => {
    return (
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Paramètres de l'optimisation actuelle
          <IconButton
            onClick={() => setDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Paramètre</TableCell>
                  <TableCell>Valeur</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(optimizationParams).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell component="th" scope="row">
                      {key}
                    </TableCell>
                    <TableCell>
                      {typeof value === 'boolean' 
                        ? (value ? 'Oui' : 'Non') 
                        : (value !== null && value !== undefined ? value.toString() : 'Non défini')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Dialogue pour afficher l'historique des optimisations
  const renderHistoryDialog = () => {
    const formatDate = (date) => {
      if (!date) return 'Date inconnue';
      
      try {
        return new Date(date).toLocaleString('fr-FR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return 'Date invalide';
      }
    };
    
    return (
      <Dialog 
        open={historyDialogOpen} 
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Historique des optimisations
          <IconButton
            onClick={() => setHistoryDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {optimizationHistory.length === 0 ? (
            <Typography variant="body1" align="center" sx={{ my: 2 }}>
              Aucun historique d'optimisation disponible
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Panneaux</TableCell>
                    <TableCell>Efficacité</TableCell>
                    <TableCell>Pièces</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {optimizationHistory.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                      <TableCell>{item.panelCount || item.result?.panels?.length || 0}</TableCell>
                      <TableCell>
                        {((item.efficiency || item.result?.globalEfficiency || 0) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell>{item.pieceCount || item.result?.totalPieces || 0}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<ArrowForwardIcon />}
                          onClick={() => handleLoadFromHistory(item)}
                        >
                          Charger
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            startIcon={<RefreshIcon />}
            onClick={fetchOptimizationHistory}
          >
            Actualiser
          </Button>
          <Button onClick={() => setHistoryDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Optimisation de découpe
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          aria-label="optimization tabs"
        >
          <Tab label="Paramètres" value={0} />
          <Tab label="Visualisation" value={1} disabled={!optimizationResult} />
          <Tab label="Étiquettes" value={2} disabled={!optimizationResult} />
        </Tabs>
      </Paper>
      
      {renderTabContent()}
      
      {renderParamsDialog()}
      {renderHistoryDialog()}
      
      <Snackbar
        open={notification.show}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          severity={notification.type || 'info'}
          onClose={() => setNotification(prev => ({ ...prev, show: false }))}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OptimizationPanel;