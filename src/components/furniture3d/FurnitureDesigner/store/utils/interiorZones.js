// src/components/furniture3d/FurnitureDesigner/store/utils/interiorZones.js
import { furnitureUtils } from './furnitureUtils';

export function generateInteriorZones(furniture) {
  const zones = [];
  
  // Convertir les dimensions en unités Three.js
  const widthUnits = furnitureUtils.mmToUnits(furniture.dimensions.width);
  const heightUnits = furnitureUtils.mmToUnits(furniture.dimensions.height);
  const depthUnits = furnitureUtils.mmToUnits(furniture.dimensions.depth);
  const thicknessUnits = furnitureUtils.mmToUnits(furniture.construction.panelThickness);
  const plinthHeightUnits = furniture.construction.hasPlinths ? 
    furnitureUtils.mmToUnits(furniture.construction.plinthHeight) : 0;
  
  // Zone complète du meuble
  zones.push({
    id: `zone_full_${furnitureUtils.generateId()}`,
    name: 'Meuble complet',
    type: 'full',
    width: widthUnits - thicknessUnits * 2,
    height: heightUnits - thicknessUnits * 2,
    depth: depthUnits - thicknessUnits,
    position: {
      x: 0,
      y: plinthHeightUnits + heightUnits / 2,
      z: 0
    }
  });
  
  // Si des séparations verticales existent, créer des zones entre elles
  if (furniture.layout.verticalSeparators && furniture.layout.verticalSeparators.length > 0) {
    // Trier les séparations par position
    const sortedSeparators = [...furniture.layout.verticalSeparators]
      .sort((a, b) => a.position - b.position);
    
    // Ajouter une "séparation" virtuelle pour le côté gauche
    const leftWall = {
      position: 0,
      thickness: furniture.construction.panelThickness
    };
    
    // Ajouter une "séparation" virtuelle pour le côté droit
    const rightWall = {
      position: furniture.dimensions.width,
      thickness: furniture.construction.panelThickness
    };
    
    // Liste complète incluant les parois latérales
    const allDividers = [leftWall, ...sortedSeparators, rightWall];
    
    // Créer des zones entre chaque paire de séparations
    for (let i = 0; i < allDividers.length - 1; i++) {
      const left = allDividers[i];
      const right = allDividers[i + 1];
      
      const leftPos = furnitureUtils.mmToUnits(left.position);
      const rightPos = furnitureUtils.mmToUnits(right.position);
      const leftThickness = furnitureUtils.mmToUnits(left.thickness || furniture.construction.panelThickness);
      const rightThickness = furnitureUtils.mmToUnits(right.thickness || furniture.construction.panelThickness);
      
      const zoneWidth = rightPos - leftPos - leftThickness / 2 - rightThickness / 2;
      const zonePosX = leftPos + leftThickness / 2 + zoneWidth / 2;
      
      zones.push({
        id: `zone_section_${i}_${furnitureUtils.generateId()}`,
        name: `Section ${i + 1}`,
        type: 'section',
        width: zoneWidth,
        height: heightUnits - thicknessUnits * 2,
        depth: depthUnits - thicknessUnits,
        position: {
          x: zonePosX - widthUnits / 2, // Centrer dans le repère du meuble
          y: plinthHeightUnits + heightUnits / 2,
          z: 0
        },
        leftBoundary: left.id,
        rightBoundary: right.id
      });
    }
  }
  
  return zones;
}