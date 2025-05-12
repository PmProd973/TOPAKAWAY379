// src/components/furniture3d/FurnitureDesigner/store/utils/environmentGenerator.js
import { furnitureUtils } from './furnitureUtils';

export function generateEnvironment(room) {
  const objects = [];
  
  // Convertir les dimensions de la pièce en unités Three.js
  const widthUnits = furnitureUtils.mmToUnits(room.width);
  const heightUnits = furnitureUtils.mmToUnits(room.height);
  const depthUnits = furnitureUtils.mmToUnits(room.depth);
  
  // Sol
  if (room.floor.visible) {
    objects.push({
      id: `floor_${furnitureUtils.generateId()}`,
      type: 'floor',
      dimensions: {
        width: widthUnits,
        height: depthUnits
      },
      position: [0, 0, 0],
      rotation: [-Math.PI / 2, 0, 0],
      color: room.floor.color || '#F5F5F5'
    });
  }
  
  // Plafond
  if (room.ceiling.visible) {
    objects.push({
      id: `ceiling_${furnitureUtils.generateId()}`,
      type: 'ceiling',
      dimensions: {
        width: widthUnits,
        height: depthUnits
      },
      position: [0, heightUnits, 0],
      rotation: [Math.PI / 2, 0, 0],
      color: room.ceiling.color || '#FFFFFF'
    });
  }
  
  // Mur de gauche
  if (room.walls.left.visible) {
    const leftWallThickness = furnitureUtils.mmToUnits(room.walls.left.thickness);
    objects.push({
      id: `wall_left_${furnitureUtils.generateId()}`,
      type: 'wall',
      dimensions: {
        width: leftWallThickness,  // Épaisseur
        height: heightUnits,       // Hauteur
        depth: depthUnits          // Profondeur
      },
      position: [
        -widthUnits / 2 - leftWallThickness / 2,
        heightUnits / 2,
        0
      ],
      rotation: [0, 0, 0],  // Pas de rotation nécessaire avec le bon ordre des dimensions
      color: room.walls.left.color || '#E0E0E0'
    });
  }
  
  // Mur de droite
  if (room.walls.right.visible) {
    const rightWallThickness = furnitureUtils.mmToUnits(room.walls.right.thickness);
    objects.push({
      id: `wall_right_${furnitureUtils.generateId()}`,
      type: 'wall',
      dimensions: {
        width: rightWallThickness,  // Épaisseur
        height: heightUnits,        // Hauteur
        depth: depthUnits           // Profondeur
      },
      position: [
        widthUnits / 2 + rightWallThickness / 2,
        heightUnits / 2,
        0
      ],
      rotation: [0, 0, 0],  // Pas de rotation nécessaire avec le bon ordre des dimensions
      color: room.walls.right.color || '#E0E0E0'
    });
  }
  
  // Mur du fond
  if (room.walls.back.visible) {
    const backWallThickness = furnitureUtils.mmToUnits(room.walls.back.thickness);
    objects.push({
      id: `wall_back_${furnitureUtils.generateId()}`,
      type: 'wall',
      dimensions: {
        width: widthUnits,
        height: heightUnits,
        depth: backWallThickness  // Utiliser l'épaisseur correcte
      },
      position: [
        0,
        heightUnits / 2,
        -depthUnits / 2 - backWallThickness / 2
      ],
      rotation: [0, 0, 0],
      color: room.walls.back.color || '#E0E0E0'
    });
  }
  
  return objects;
}