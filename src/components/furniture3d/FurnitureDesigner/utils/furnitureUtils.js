// src/components/furniture3d/FurnitureDesigner/utils/furnitureUtils.js

// Constante globale pour la conversion des mm en unités Three.js
const UNIT_CONVERSION = 0.01; // 1mm = 0.01 unités Three.js

export const furnitureUtils = {
  // Conversion mm vers unités Three.js
  mmToUnits: (mm) => {
    return mm * UNIT_CONVERSION;
  },
  
  // Conversion unités Three.js vers mm
  unitsToMm: (units) => {
    return units / UNIT_CONVERSION;
  },
  
  // Générer un ID unique
  generateId: () => {
    return Math.random().toString(36).substring(2, 9);
  },
  
  // Calculer les dimensions internes d'un meuble en tenant compte des panneaux d'habillage
  calculateInternalDimensions: (totalDimensions, cladding) => {
    const reduction = {
      width: 0,
      height: 0,
      depth: 0
    };
    
    if (cladding.left.enabled) reduction.width += cladding.left.thickness;
    if (cladding.right.enabled) reduction.width += cladding.right.thickness;
    if (cladding.top.enabled) reduction.height += cladding.top.thickness;
    if (cladding.bottom.enabled) reduction.height += cladding.bottom.thickness;
    
    return {
      width: totalDimensions.width - reduction.width,
      height: totalDimensions.height - reduction.height,
      depth: totalDimensions.depth - reduction.depth
    };
  },
  
  // Calculer le volume d'un panneau en m³
  calculatePanelVolume: (width, height, thickness) => {
    // Conversion de mm en m
    const widthM = width / 1000;
    const heightM = height / 1000;
    const thicknessM = thickness / 1000;
    
    return widthM * heightM * thicknessM;
  },
  
  // Calculer le poids d'un panneau en kg (estimation pour un panneau de particules)
  calculatePanelWeight: (width, height, thickness, density = 650) => {
    // Densité par défaut: 650 kg/m³ (panneau de particules)
    const volume = furnitureUtils.calculatePanelVolume(width, height, thickness);
    return volume * density;
  },
  
  // Calculer la longueur de chant nécessaire pour un panneau
  calculateEdgeBanding: (width, height, edges) => {
    let totalLength = 0;
    
    if (edges.front) totalLength += width;
    if (edges.back) totalLength += width;
    if (edges.left) totalLength += height;
    if (edges.right) totalLength += height;
    
    return totalLength;
  },
  
  // Générer les coordonnées pour un panneau à partir des dimensions et du type de meuble
  generatePanelCoordinates: (dimension, thickness, panelType, assemblyType) => {
    // Types de panneau: 'top', 'bottom', 'side_left', 'side_right', 'back'
    // Types d'assemblage: 'overlap', 'flush', 'miter'
    
    let width, height, depth, position;
    
    switch (panelType) {
      case 'top':
      case 'bottom':
        if (assemblyType === 'overlap') {
          width = dimension.width - thickness * 2;
        } else {
          width = dimension.width;
        }
        depth = dimension.depth;
        height = thickness;
        break;
        
      case 'side_left':
      case 'side_right':
        width = thickness;
        if (assemblyType === 'flush') {
          height = dimension.height - thickness * 2;
        } else {
          height = dimension.height;
        }
        depth = dimension.depth;
        break;
        
      case 'back':
        width = dimension.width - thickness * 2;
        height = dimension.height - thickness * 2;
        depth = thickness;
        break;
        
      default:
        width = thickness;
        height = thickness;
        depth = thickness;
    }
    
    return { width, height, depth };
  },
  
  // Ajuster le matériau en fonction du type de panneau
  adjustMaterialForPanel: (material, panelType) => {
    // Si c'est un panneau arrière, on utilise souvent un matériau moins cher
    if (panelType === 'back' && material && material.alternatives && material.alternatives.back) {
      return material.alternatives.back;
    }
    
    return material;
  }
};