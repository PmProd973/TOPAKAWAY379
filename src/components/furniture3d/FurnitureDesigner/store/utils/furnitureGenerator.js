// src/components/furniture3d/FurnitureDesigner/store/utils/furnitureGenerator.js
import { furnitureUtils } from './furnitureUtils';

export function generateFurniture(furniture, displayOptions = {}) {
  // Convertir les dimensions en unités Three.js
  const widthUnits = furnitureUtils.mmToUnits(furniture.dimensions.width);
  const heightUnits = furnitureUtils.mmToUnits(furniture.dimensions.height);
  const depthUnits = furnitureUtils.mmToUnits(furniture.dimensions.depth);
  const thicknessUnits = furnitureUtils.mmToUnits(furniture.construction.panelThickness);
  const plinthHeightUnits = furniture.construction.hasPlinths ? 
    furnitureUtils.mmToUnits(furniture.construction.plinthHeight) : 0;
  
  // Dans la fonction generateFurniture, avant de créer le groupe
  const opacity = displayOptions.furnitureOpacity !== undefined 
    ? displayOptions.furnitureOpacity 
    : 1.0;
  
  // Mode d'affichage (solid, wireframe, realistic)
  const viewMode = displayOptions.viewMode || 'solid';
  
  // Vérifier si les côtés s'étendent jusqu'au sol
  const sidesExtendToFloor = furniture.construction.sidesExtendToFloor || false;
  
  // Position du meuble
  const posX = furnitureUtils.mmToUnits(furniture.position.x);
  const posY = furnitureUtils.mmToUnits(furniture.position.y);
  const posZ = furnitureUtils.mmToUnits(furniture.position.z);
  
  // Rotation du meuble
  const rotation = [
    furniture.rotation?.x || 0,
    furniture.rotation?.y || 0,
    furniture.rotation?.z || 0
  ];
  
  // Créer un groupe pour le meuble
  const furnitureGroup = {
    id: `furniture_group_${furnitureUtils.generateId()}`,
    type: 'furnitureGroup',
    position: [posX, posY, posZ],
    rotation: rotation,
    children: [] // Les pièces du meuble seront ajoutées ici
  };
  
  // Array pour stocker les objets avant de les ajouter au groupe
  const objects = [];
  
  // Récupérer l'option de débordement
  const sidesOverlapTopBottom = furniture.construction.sidesOverlapTopBottom !== false; // Par défaut vrai si non défini

  // Calculer les dimensions en fonction de l'option de débordement
  let topBottomWidth, sideHeight;

  if (sidesOverlapTopBottom) {
    // Mode 1: Les côtés débordent sur le dessus et le dessous
    topBottomWidth = widthUnits - thicknessUnits * 2;
    sideHeight = heightUnits;
  } else {
    // Mode 2: Le dessus et le dessous débordent sur les côtés
    topBottomWidth = widthUnits;
    sideHeight = heightUnits - thicknessUnits * 2;
  }

  // Côté gauche
  objects.push({
    id: `side_left_${furnitureUtils.generateId()}`,
    type: 'piece',
    piece: {
      description: 'Côté gauche',
      material: furniture.material,
      edgeBanding: {
        front: true,
        back: true,
        top: sidesOverlapTopBottom,
        bottom: !sidesExtendToFloor
      },
      opacity: opacity
    },
    position: [
      -widthUnits/2 + thicknessUnits/2, 
      sidesExtendToFloor ? 
        (plinthHeightUnits/2 + heightUnits/2) : 
        (plinthHeightUnits + (sidesOverlapTopBottom ? heightUnits/2 : heightUnits/2 - thicknessUnits)),
      0
    ],
    dimensions: {
      width: thicknessUnits,
      height: sidesExtendToFloor ? (heightUnits + plinthHeightUnits) : sideHeight,
      depth: depthUnits
    }
  });

  // Côté droit
  objects.push({
    id: `side_right_${furnitureUtils.generateId()}`,
    type: 'piece',
    piece: {
      description: 'Côté droit',
      material: furniture.material,
      edgeBanding: {
        front: true,
        back: true,
        top: sidesOverlapTopBottom,
        bottom: !sidesExtendToFloor
      },
      opacity: opacity
    },
    position: [
      widthUnits/2 - thicknessUnits/2, 
      sidesExtendToFloor ? 
        (plinthHeightUnits/2 + heightUnits/2) : 
        (plinthHeightUnits + (sidesOverlapTopBottom ? heightUnits/2 : heightUnits/2 - thicknessUnits)),
      0
    ],
    dimensions: {
      width: thicknessUnits,
      height: sidesExtendToFloor ? (heightUnits + plinthHeightUnits) : sideHeight,
      depth: depthUnits
    }
  });

  // Dessus
  objects.push({
    id: `top_${furnitureUtils.generateId()}`,
    type: 'piece',
    piece: {
      description: 'Dessus',
      material: furniture.material,
      edgeBanding: {
        front: true,
        back: false,
        left: !sidesOverlapTopBottom,
        right: !sidesOverlapTopBottom
      },
      opacity: opacity
    },
    position: [0, plinthHeightUnits + heightUnits - thicknessUnits/2, 0],
    dimensions: {
      width: topBottomWidth,
      height: thicknessUnits,
      depth: depthUnits
    }
  });

  // Fond (en bas)
  objects.push({
    id: `bottom_${furnitureUtils.generateId()}`,
    type: 'piece',
    piece: {
      description: 'Fond',
      material: furniture.material,
      edgeBanding: {
        front: true,
        back: false,
        left: !sidesOverlapTopBottom,
        right: !sidesOverlapTopBottom
      },
      opacity: opacity
    },
    position: [0, plinthHeightUnits + thicknessUnits/2, 0],
    dimensions: {
      width: topBottomWidth,
      height: thicknessUnits,
      depth: depthUnits
    }
  });
  
  // Ajouter panneau arrière si présent
  if (furniture.construction.hasBackPanel) {
    const backPanelThicknessUnits = furnitureUtils.mmToUnits(furniture.construction.backPanelThickness);
    const backPanelInsetUnits = furnitureUtils.mmToUnits(furniture.construction.backPanelInset);
    
    // Déterminer si le panneau arrière traverse les panneaux latéraux
    const backPanelWidth = furniture.construction.backPanelThrough?.left && furniture.construction.backPanelThrough?.right ?
      widthUnits : widthUnits - thicknessUnits * 2;
    
    const backPanelHeight = furniture.construction.backPanelThrough?.top && furniture.construction.backPanelThrough?.bottom ?
      heightUnits : heightUnits - thicknessUnits * 2;
    
    // Position du panneau arrière
    const backPanelPosX = 0;
    const backPanelPosY = plinthHeightUnits + (furniture.construction.backPanelThrough?.bottom ? 0 : thicknessUnits) + backPanelHeight / 2;
    const backPanelPosZ = -depthUnits / 2 + backPanelThicknessUnits / 2 + backPanelInsetUnits;
    
    objects.push({
      id: `back_panel_${furnitureUtils.generateId()}`,
      type: 'piece',
      piece: {
        description: 'Panneau arrière',
        material: furniture.material,
        color: furniture.material?.color || '#D0D0D0', // Plus clair que les panneaux principaux
        opacity: opacity
      },
      position: [backPanelPosX, backPanelPosY, backPanelPosZ],
      dimensions: {
        width: backPanelWidth,
        height: backPanelHeight,
        depth: backPanelThicknessUnits
      }
    });
  }
  
  // Appliquer les options de rendu selon le mode d'affichage
  if (viewMode === 'wireframe') {
    objects.forEach(obj => {
      if (obj.piece) {
        obj.piece.wireframe = true;
      }
    });
  } else if (viewMode === 'realistic') {
    objects.forEach(obj => {
      if (obj.piece) {
        obj.piece.realistic = true;
        // Ajouter des propriétés pour un rendu réaliste
        if (obj.piece.material && typeof obj.piece.material === 'string') {
          if (obj.piece.material.includes('wood')) {
            obj.piece.roughness = 0.7;
            obj.piece.metalness = 0.1;
          } else if (obj.piece.material.includes('metal')) {
            obj.piece.roughness = 0.2;
            obj.piece.metalness = 0.8;
          } else {
            obj.piece.roughness = 0.5;
            obj.piece.metalness = 0.1;
          }
        }
      }
    });
  }
  
  // Ajouter tous les objets au groupe du meuble
  furnitureGroup.children = objects;
  
  return [furnitureGroup];
}