// src/components/furniture3d/FurnitureDesigner/store/utils/dimensionGenerator.js
import { furnitureUtils } from './furnitureUtils';

export function generateDimensionLines(room, furniture, displayOptions = {}) {
  const dimensionLines = [];
  
  // Convertir les dimensions en unités Three.js
  const roomWidthUnits = furnitureUtils.mmToUnits(room.width);
  const roomHeightUnits = furnitureUtils.mmToUnits(room.height);
  const roomDepthUnits = furnitureUtils.mmToUnits(room.depth);

  // Utiliser les dimensions totales ou les dimensions normales selon le système
  const furnitureWidth = furniture.useNewConstructionSystem ?
    (furniture.totalDimensions?.width || furniture.dimensions.width) :
    furniture.dimensions.width;

  const furnitureHeight = furniture.useNewConstructionSystem ?
    (furniture.totalDimensions?.height || furniture.dimensions.height) :
    furniture.dimensions.height;

  const furnitureDepth = furniture.useNewConstructionSystem ?
    (furniture.totalDimensions?.depth || furniture.dimensions.depth) :
    furniture.dimensions.depth;

  const furnitureWidthUnits = furnitureUtils.mmToUnits(furnitureWidth);
  const furnitureHeightUnits = furnitureUtils.mmToUnits(furnitureHeight);
  const furnitureDepthUnits = furnitureUtils.mmToUnits(furnitureDepth);
  
  // Décalage pour les lignes de cotation (pour éviter qu'elles se superposent)
  const offsetUnit = 0.2;
  
  // Lignes de cotation de la pièce - Utiliser showRoomDimensions au lieu de showDimensions
  if (displayOptions.showDimensions !== false || room.showDimensions) {
    // Marquer ces lignes comme des dimensions de mur pour le filtrage ultérieur
    const wallDimensionType = 'room';
    
    // Largeur de la pièce (mur du fond)
    if (room.walls.back.visible) {
      dimensionLines.push({
        id: `room_width_back_${furnitureUtils.generateId()}`,
        type: 'dimensionLine',
        dimensionType: wallDimensionType, // Type de dimension (mur)
        points: [
          [-roomWidthUnits/2, roomHeightUnits/2, -roomDepthUnits/2 - offsetUnit],
          [roomWidthUnits/2, roomHeightUnits/2, -roomDepthUnits/2 - offsetUnit]
        ],
        value: room.width,
        unit: 'mm',
        color: '#2196F3',
        showLabel: true,
        labelPosition: 'top'
      });
    }
    
    // Hauteur du mur du fond
    if (room.walls.back.visible) {
      dimensionLines.push({
        id: `room_height_back_${furnitureUtils.generateId()}`,
        type: 'dimensionLine',
        dimensionType: wallDimensionType, // Type de dimension (mur)
        points: [
          [roomWidthUnits/2 + offsetUnit, 0, -roomDepthUnits/2],
          [roomWidthUnits/2 + offsetUnit, roomHeightUnits, -roomDepthUnits/2]
        ],
        value: room.height,
        unit: 'mm',
        color: '#2196F3',
        showLabel: true,
        labelPosition: 'right'
      });
    }
    
    // Largeur de la pièce (mur gauche)
    if (room.walls.left.visible) {
      dimensionLines.push({
        id: `room_depth_left_${furnitureUtils.generateId()}`,
        type: 'dimensionLine',
        dimensionType: wallDimensionType, // Type de dimension (mur)
        points: [
          [-roomWidthUnits/2 - offsetUnit, roomHeightUnits/2, -roomDepthUnits/2],
          [-roomWidthUnits/2 - offsetUnit, roomHeightUnits/2, roomDepthUnits/2]
        ],
        value: room.depth,
        unit: 'mm',
        color: '#2196F3',
        showLabel: true,
        labelPosition: 'left'
      });
    }
    
    // Hauteur du mur gauche
    if (room.walls.left.visible) {
      dimensionLines.push({
        id: `room_height_left_${furnitureUtils.generateId()}`,
        type: 'dimensionLine',
        dimensionType: wallDimensionType, // Type de dimension (mur)
        points: [
          [-roomWidthUnits/2, 0, roomDepthUnits/2 + offsetUnit],
          [-roomWidthUnits/2, roomHeightUnits, roomDepthUnits/2 + offsetUnit]
        ],
        value: room.height,
        unit: 'mm',
        color: '#2196F3',
        showLabel: true,
        labelPosition: 'right'
      });
    }
    
    // Largeur de la pièce (mur droit)
    if (room.walls.right.visible) {
      dimensionLines.push({
        id: `room_depth_right_${furnitureUtils.generateId()}`,
        type: 'dimensionLine',
        dimensionType: wallDimensionType, // Type de dimension (mur)
        points: [
          [roomWidthUnits/2 + offsetUnit, roomHeightUnits/2, -roomDepthUnits/2],
          [roomWidthUnits/2 + offsetUnit, roomHeightUnits/2, roomDepthUnits/2]
        ],
        value: room.depth,
        unit: 'mm',
        color: '#2196F3',
        showLabel: true,
        labelPosition: 'right'
      });
    }
    
    // Hauteur du mur droit
    if (room.walls.right.visible) {
      dimensionLines.push({
        id: `room_height_right_${furnitureUtils.generateId()}`,
        type: 'dimensionLine',
        dimensionType: wallDimensionType, // Type de dimension (mur)
        points: [
          [roomWidthUnits/2, 0, -roomDepthUnits/2 - offsetUnit],
          [roomWidthUnits/2, roomHeightUnits, -roomDepthUnits/2 - offsetUnit]
        ],
        value: room.height,
        unit: 'mm',
        color: '#2196F3',
        showLabel: true,
        labelPosition: 'left'
      });
    }
    
    // Épaisseur des murs (si visible)
    if (room.walls.back.visible) {
      const wallThicknessUnits = furnitureUtils.mmToUnits(room.walls.back.thickness);
      dimensionLines.push({
        id: `wall_thickness_back_${furnitureUtils.generateId()}`,
        type: 'dimensionLine',
        dimensionType: wallDimensionType, // Type de dimension (mur)
        points: [
          [0, roomHeightUnits/4, -roomDepthUnits/2],
          [0, roomHeightUnits/4, -roomDepthUnits/2 - wallThicknessUnits]
        ],
        value: room.walls.back.thickness,
        unit: 'mm',
        color: '#FF9800',
        showLabel: true,
        labelPosition: 'top'
      });
    }
    
    if (room.walls.left.visible) {
      const wallThicknessUnits = furnitureUtils.mmToUnits(room.walls.left.thickness);
      dimensionLines.push({
        id: `wall_thickness_left_${furnitureUtils.generateId()}`,
        type: 'dimensionLine',
        dimensionType: wallDimensionType, // Type de dimension (mur)
        points: [
          [-roomWidthUnits/2, roomHeightUnits/4, 0],
          [-roomWidthUnits/2 - wallThicknessUnits, roomHeightUnits/4, 0]
        ],
        value: room.walls.left.thickness,
        unit: 'mm',
        color: '#FF9800',
        showLabel: true,
        labelPosition: 'top'
      });
    }
    
    if (room.walls.right.visible) {
      const wallThicknessUnits = furnitureUtils.mmToUnits(room.walls.right.thickness);
      dimensionLines.push({
        id: `wall_thickness_right_${furnitureUtils.generateId()}`,
        type: 'dimensionLine',
        dimensionType: wallDimensionType, // Type de dimension (mur)
        points: [
          [roomWidthUnits/2, roomHeightUnits/4, 0],
          [roomWidthUnits/2 + wallThicknessUnits, roomHeightUnits/4, 0]
        ],
        value: room.walls.right.thickness,
        unit: 'mm',
        color: '#FF9800',
        showLabel: true,
        labelPosition: 'top'
      });
    }
  }
  
  // Dimensions du meuble - Nouvelle section avec showFurnitureDimensions
  if (displayOptions.showFurnitureDimensions === true) {
    // Marquer ces lignes comme des dimensions de meuble pour le filtrage ultérieur
    const furnitureDimensionType = 'furniture';
    
    // Largeur du meuble
    dimensionLines.push({
      id: `furniture_width_${furnitureUtils.generateId()}`,
      type: 'dimensionLine',
      dimensionType: furnitureDimensionType, // Type de dimension (meuble)
      points: [
        [-furnitureWidthUnits/2, 0, furnitureDepthUnits/2 + offsetUnit],
        [furnitureWidthUnits/2, 0, furnitureDepthUnits/2 + offsetUnit]
      ],
      value: furnitureWidth,
      unit: 'mm',
      color: '#4CAF50', // Vert pour le meuble
      showLabel: true,
      labelPosition: 'bottom'
    });
    
    // Hauteur du meuble
    dimensionLines.push({
      id: `furniture_height_${furnitureUtils.generateId()}`,
      type: 'dimensionLine',
      dimensionType: furnitureDimensionType, // Type de dimension (meuble)
      points: [
        [-furnitureWidthUnits/2 - offsetUnit, 0, 0],
        [-furnitureWidthUnits/2 - offsetUnit, furnitureHeightUnits, 0]
      ],
      value: furnitureHeight,
      unit: 'mm',
      color: '#4CAF50', // Vert pour le meuble
      showLabel: true,
      labelPosition: 'left'
    });
    
    // Profondeur du meuble
    dimensionLines.push({
      id: `furniture_depth_${furnitureUtils.generateId()}`,
      type: 'dimensionLine',
      dimensionType: furnitureDimensionType, // Type de dimension (meuble)
      points: [
        [furnitureWidthUnits/2 + offsetUnit, 0, -furnitureDepthUnits/2],
        [furnitureWidthUnits/2 + offsetUnit, 0, furnitureDepthUnits/2]
      ],
      value: furnitureDepth,
      unit: 'mm',
      color: '#4CAF50', // Vert pour le meuble
      showLabel: true,
      labelPosition: 'right'
    });
  }
  
  return dimensionLines;
}