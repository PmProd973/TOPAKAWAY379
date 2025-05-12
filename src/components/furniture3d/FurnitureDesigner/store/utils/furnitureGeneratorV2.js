// src/components/furniture3d/FurnitureDesigner/store/utils/furnitureGeneratorV2.js
import { furnitureUtils } from './furnitureUtils';

function calculateInternalDimensions(totalDimensions, cladding) {
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
}

export function generateFurnitureV2(furniture, displayOptions = {}) {
  const construction = furniture.constructionV2;
  const totalDimensions = furniture.totalDimensions;
  
  // Dimensions totales en unités Three.js
  const totalWidthUnits = furnitureUtils.mmToUnits(totalDimensions.width);
  const totalHeightUnits = furnitureUtils.mmToUnits(totalDimensions.height);
  const totalDepthUnits = furnitureUtils.mmToUnits(totalDimensions.depth);
  
  // Dimensions internes (après habillage)
  const internalDimensions = calculateInternalDimensions(totalDimensions, construction.cladding);
  
  const widthUnits = furnitureUtils.mmToUnits(internalDimensions.width);
  const heightUnits = furnitureUtils.mmToUnits(internalDimensions.height);
  const depthUnits = furnitureUtils.mmToUnits(internalDimensions.depth);
  const thicknessUnits = furnitureUtils.mmToUnits(construction.basic.panelThickness);
  
  // Calcul des offsets pour centrer correctement le meuble interne
  const offsetX = (construction.cladding.left.enabled && construction.cladding.right.enabled) ? 0 :
                  construction.cladding.left.enabled ? furnitureUtils.mmToUnits(construction.cladding.left.thickness) / 2 :
                  construction.cladding.right.enabled ? -furnitureUtils.mmToUnits(construction.cladding.right.thickness) / 2 : 0;
  
  const offsetY = construction.cladding.bottom.enabled ? 
    furnitureUtils.mmToUnits(construction.cladding.bottom.thickness) : 0;
  
  // Hauteur du socle/plinthe - CORRECTION: Vérifiez explicitement les plinthes
  const hasBaseElement = construction.base.hasBase || 
                         (construction.base.frontPlinth && construction.base.frontPlinth.enabled === true) ||
                         (construction.base.backPlinth && construction.base.backPlinth.enabled === true);
  const baseHeightValue = hasBaseElement ? construction.base.baseHeight : 0;
  const baseHeightUnits = furnitureUtils.mmToUnits(baseHeightValue);
  
  // Vérifier si les côtés vont jusqu'au sol
  const sidesExtendToFloor = construction.base.sidesExtendToFloor || false;
  
  // Logging pour debug
  console.log("Génération du meuble:", {
    hasBaseElement, 
    baseHeightValue, 
    baseHeightUnits,
    sidesExtendToFloor,
    hasFrontPlinth: construction.base.frontPlinth?.enabled === true,
    hasBackPlinth: construction.base.backPlinth?.enabled === true,
    frontPlinthProps: construction.base.frontPlinth,
    backPlinthProps: construction.base.backPlinth
  });
  
  const objects = [];
  
  // Position du meuble
  const furnitureX = furnitureUtils.mmToUnits(furniture.position.x);
  const furnitureY = furnitureUtils.mmToUnits(furniture.position.y);
  const furnitureZ = furnitureUtils.mmToUnits(furniture.position.z);
  
  // 1. GÉNÉRER LE MEUBLE PRINCIPAL (structure de base)
  
  // Calcul des dimensions selon le type d'assemblage
  let topBottomWidth, sideHeight;
  
  switch (construction.basic.assemblyType) {
    case 'overlap':
      // Les côtés dépassent sur dessus/dessous
      sideHeight = heightUnits;
      topBottomWidth = widthUnits - thicknessUnits * 2;
      break;
      
    case 'flush':
      // Dessus/dessous vont d'un bord à l'autre
      sideHeight = heightUnits - thicknessUnits * 2;
      topBottomWidth = widthUnits;
      break;
      
    case 'miter':
      // Assemblage à 45°
      sideHeight = heightUnits;
      topBottomWidth = widthUnits;
      break;
      
    default:
      sideHeight = heightUnits;
      topBottomWidth = widthUnits - thicknessUnits * 2;
  }
  
  // Générer les montants verticaux s'ils sont activés
  if (construction.base.verticalSupports.enabled && construction.base.verticalSupports.positions.length > 0) {
    // Générer des montants filants et diviser les panneaux horizontaux
    const supportPositions = construction.base.verticalSupports.positions;
    
    // Générer les montants
    supportPositions.forEach((position, index) => {
      const posUnits = furnitureUtils.mmToUnits(position);
      
      objects.push({
        id: `vertical_support_${index}_${furnitureUtils.generateId()}`,
        type: 'piece',
        piece: {
          description: `Montant vertical ${index + 1}`,
          material: furniture.material,
          edgeBanding: {
            front: true,
            back: true,
            top: true,
            bottom: !sidesExtendToFloor // Pas de chant en bas si les côtés vont jusqu'au sol
          }
        },
        position: [
          offsetX + posUnits - widthUnits/2,
          offsetY + baseHeightUnits + (sidesExtendToFloor ? (heightUnits - baseHeightUnits) / 2 : heightUnits/2),
          0
        ],
        dimensions: {
          width: thicknessUnits,
          height: sidesExtendToFloor ? heightUnits + baseHeightUnits : heightUnits,
          depth: depthUnits
        }
      });
    });
    
    // Diviser le dessus et dessous en segments
    const segments = [];
    let lastPos = 0;
    
    // Positions triées
    const sortedPositions = [...supportPositions].sort((a, b) => a - b);
    
    sortedPositions.forEach((pos, idx) => {
      // Segment avant ce montant
      if (pos - lastPos > construction.basic.panelThickness) {
        segments.push({
          start: lastPos,
          end: pos - construction.basic.panelThickness / 2,
          index: idx
        });
      }
      lastPos = pos + construction.basic.panelThickness / 2;
    });
    
    // Dernier segment
    if (internalDimensions.width - lastPos > construction.basic.panelThickness) {
      segments.push({
        start: lastPos,
        end: internalDimensions.width,
        index: sortedPositions.length
      });
    }
    
    // Générer les segments de dessus et dessous
    segments.forEach((segment, segIdx) => {
      const segWidth = segment.end - segment.start;
      const segWidthUnits = furnitureUtils.mmToUnits(segWidth);
      const segX = furnitureUtils.mmToUnits((segment.start + segment.end) / 2);
      
      // Segment de dessus
      objects.push({
        id: `top_segment_${segIdx}_${furnitureUtils.generateId()}`,
        type: 'piece',
        piece: {
          description: `Dessus segment ${segIdx + 1}`,
          material: furniture.material,
          edgeBanding: {
            front: true,
            back: false,
            left: segIdx === 0 && construction.basic.assemblyType !== 'overlap',
            right: segIdx === segments.length - 1 && construction.basic.assemblyType !== 'overlap'
          }
        },
        position: [
          offsetX + segX - widthUnits/2,
          offsetY + baseHeightUnits + heightUnits - thicknessUnits/2,
          0
        ],
        dimensions: {
          width: segWidthUnits,
          height: thicknessUnits,
          depth: depthUnits
        }
      });
      
      // Segment de dessous (sauf si les côtés vont jusqu'au sol)
      if (!sidesExtendToFloor) {
        objects.push({
          id: `bottom_segment_${segIdx}_${furnitureUtils.generateId()}`,
          type: 'piece',
          piece: {
            description: `Dessous segment ${segIdx + 1}`,
            material: furniture.material,
            edgeBanding: {
              front: true,
              back: false,
              left: segIdx === 0 && construction.basic.assemblyType !== 'overlap',
              right: segIdx === segments.length - 1 && construction.basic.assemblyType !== 'overlap'
            }
          },
          position: [
            offsetX + segX - widthUnits/2,
            offsetY + baseHeightUnits + thicknessUnits/2,
            0
          ],
          dimensions: {
            width: segWidthUnits,
            height: thicknessUnits,
            depth: depthUnits
          }
        });
      }
    });
    
  } else {
    // Pas de montants verticaux - générer dessus/dessous normaux
    
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
          left: construction.basic.assemblyType !== 'overlap',
          right: construction.basic.assemblyType !== 'overlap'
        }
      },
      position: [
        offsetX,
        offsetY + baseHeightUnits + heightUnits - thicknessUnits/2,
        0
      ],
      dimensions: {
        width: topBottomWidth,
        height: thicknessUnits,
        depth: depthUnits
      }
    });
    
    // Dessous (sauf si les côtés vont jusqu'au sol)
    if (!sidesExtendToFloor) {
      objects.push({
        id: `bottom_${furnitureUtils.generateId()}`,
        type: 'piece',
        piece: {
          description: 'Dessous',
          material: furniture.material,
          edgeBanding: {
            front: true,
            back: false,
            left: construction.basic.assemblyType !== 'overlap',
            right: construction.basic.assemblyType !== 'overlap'
          }
        },
        position: [
          offsetX,
          offsetY + baseHeightUnits + thicknessUnits/2,
          0
        ],
        dimensions: {
          width: topBottomWidth,
          height: thicknessUnits,
          depth: depthUnits
        }
      });
    }
  }
  
  // Côté gauche avec correction pour l'assemblage et extension au sol si nécessaire
  objects.push({
    id: `side_left_${furnitureUtils.generateId()}`,
    type: 'piece',
    piece: {
      description: 'Côté gauche',
      material: furniture.material,
      edgeBanding: {
        front: true,
        back: true,
        top: construction.basic.assemblyType === 'overlap',
        bottom: !sidesExtendToFloor && !hasBaseElement // Pas de chant si va jusqu'au sol ou si plinthe
      }
    },
    position: [
      offsetX - widthUnits/2 + thicknessUnits/2,
      construction.basic.assemblyType === 'flush' 
        ? offsetY + baseHeightUnits + thicknessUnits + (sidesExtendToFloor ? (sideHeight - baseHeightUnits)/2 : sideHeight/2)
        : offsetY + (sidesExtendToFloor ? (baseHeightUnits + heightUnits)/2 : baseHeightUnits + sideHeight/2),
      0
    ],
    dimensions: {
      width: thicknessUnits,
      height: sidesExtendToFloor ? heightUnits + baseHeightUnits : sideHeight,
      depth: depthUnits
    }
  });
  
  // Côté droit avec correction pour l'assemblage et extension au sol si nécessaire
  objects.push({
    id: `side_right_${furnitureUtils.generateId()}`,
    type: 'piece',
    piece: {
      description: 'Côté droit',
      material: furniture.material,
      edgeBanding: {
        front: true,
        back: true,
        top: construction.basic.assemblyType === 'overlap',
        bottom: !sidesExtendToFloor && !hasBaseElement // Pas de chant si va jusqu'au sol ou si plinthe
      }
    },
    position: [
      offsetX + widthUnits/2 - thicknessUnits/2,
      construction.basic.assemblyType === 'flush' 
        ? offsetY + baseHeightUnits + thicknessUnits + (sidesExtendToFloor ? (sideHeight - baseHeightUnits)/2 : sideHeight/2)
        : offsetY + (sidesExtendToFloor ? (baseHeightUnits + heightUnits)/2 : baseHeightUnits + sideHeight/2),
      0
    ],
    dimensions: {
      width: thicknessUnits,
      height: sidesExtendToFloor ? heightUnits + baseHeightUnits : sideHeight,
      depth: depthUnits
    }
  });
  
  // 2. GÉNÉRER LES PLINTHES AVANT ET ARRIÈRE
  
  // Plinthe avant - CORRECTION: Vérification et logging améliorés
  if (construction.base.frontPlinth && construction.base.frontPlinth.enabled === true) {
    // Log détaillé pour débogage
    console.log("Génération de la plinthe avant:", {
      enabled: construction.base.frontPlinth.enabled,
      thickness: construction.base.frontPlinth.thickness,
      leftInset: construction.base.frontPlinth.leftInset,
      rightInset: construction.base.frontPlinth.rightInset
    });
    
    const frontPlinth = construction.base.frontPlinth;
    const plinthThicknessUnits = furnitureUtils.mmToUnits(frontPlinth.thickness || 18);
    
    // Appliquer les retraits - avec vérifications explicites
    const leftInset = typeof frontPlinth.leftInset === 'number' ? furnitureUtils.mmToUnits(frontPlinth.leftInset) : 0;
    const rightInset = typeof frontPlinth.rightInset === 'number' ? furnitureUtils.mmToUnits(frontPlinth.rightInset) : 0;
    
    // Largeur ajustée avec les retraits
    const plinthWidth = totalWidthUnits - leftInset - rightInset;
    
    // Position X ajustée pour tenir compte des retraits
    const plinthX = (leftInset - rightInset) / 2;
    
    // Création explicite de l'objet plinthe
    const frontPlinthObject = {
      id: `front_plinth_${furnitureUtils.generateId()}`,
      type: 'piece',
      piece: {
        description: 'Plinthe avant',
        material: furniture.material,
        edgeBanding: {
          front: true,
          back: false,
          left: true,
          right: true,
          top: true,
          bottom: true
        }
      },
      position: [
        plinthX,
        baseHeightUnits / 2, // Moitié de la hauteur de la plinthe
        depthUnits / 2 - plinthThicknessUnits / 2
      ],
      dimensions: {
        width: plinthWidth,
        height: baseHeightUnits,
        depth: plinthThicknessUnits
      }
    };
    
    // Log de la plinthe créée
    console.log("Ajout plinthe avant:", frontPlinthObject);
    
    // Ajouter la plinthe au tableau objects
    objects.push(frontPlinthObject);
  }
  
  // Plinthe arrière - CORRECTION: Vérification et logging améliorés
  if (construction.base.backPlinth && construction.base.backPlinth.enabled === true) {
    // Log détaillé pour débogage
    console.log("Génération de la plinthe arrière:", {
      enabled: construction.base.backPlinth.enabled,
      thickness: construction.base.backPlinth.thickness,
      leftInset: construction.base.backPlinth.leftInset,
      rightInset: construction.base.backPlinth.rightInset
    });
    
    const backPlinth = construction.base.backPlinth;
    const plinthThicknessUnits = furnitureUtils.mmToUnits(backPlinth.thickness || 18);
    
    // Appliquer les retraits - avec vérifications explicites
    const leftInset = typeof backPlinth.leftInset === 'number' ? furnitureUtils.mmToUnits(backPlinth.leftInset) : 0;
    const rightInset = typeof backPlinth.rightInset === 'number' ? furnitureUtils.mmToUnits(backPlinth.rightInset) : 0;
    
    // Largeur ajustée avec les retraits
    const plinthWidth = totalWidthUnits - leftInset - rightInset;
    
    // Position X ajustée pour tenir compte des retraits
    const plinthX = (leftInset - rightInset) / 2;
    
    // Création explicite de l'objet plinthe
    const backPlinthObject = {
      id: `back_plinth_${furnitureUtils.generateId()}`,
      type: 'piece',
      piece: {
        description: 'Plinthe arrière',
        material: furniture.material,
        edgeBanding: {
          front: true,
          back: false,
          left: true,
          right: true,
          top: true,
          bottom: true
        }
      },
      position: [
        plinthX,
        baseHeightUnits / 2, // Moitié de la hauteur de la plinthe
        -depthUnits / 2 + plinthThicknessUnits / 2
      ],
      dimensions: {
        width: plinthWidth,
        height: baseHeightUnits,
        depth: plinthThicknessUnits
      }
    };
    
    // Log de la plinthe créée
    console.log("Ajout plinthe arrière:", backPlinthObject);
    
    // Ajouter la plinthe au tableau objects
    objects.push(backPlinthObject);
  }
  
  // 3. GÉNÉRER LES PANNEAUX D'HABILLAGE AVEC DÉBORDEMENTS
  
  // Panneau gauche
  if (construction.cladding.left.enabled) {
    const leftCladding = construction.cladding.left;
    const overhang = leftCladding.overhang || { front: 0, back: 0, top: 0, bottom: 0 };
    
    // Calculer les dimensions avec débordements (sans compter la plinthe/socle)
    const claddingHeight = totalHeightUnits + 
      furnitureUtils.mmToUnits(overhang.top) + 
      furnitureUtils.mmToUnits(overhang.bottom);
    
    const claddingDepth = totalDepthUnits + 
      furnitureUtils.mmToUnits(overhang.front) + 
      furnitureUtils.mmToUnits(overhang.back);
    
    // CORRECTION: Décalage vertical pour tenir compte de la plinthe/socle
    const claddingYPosition = hasBaseElement ? baseHeightUnits : 0;
    
    objects.push({
      id: `cladding_left_${furnitureUtils.generateId()}`,
      type: 'piece',
      piece: {
        description: leftCladding.type === 'filler' ? 'Fileur gauche' : 'Panneau habillage gauche',
        material: furniture.material,
        edgeBanding: {
          front: true,
          back: false,
          top: true,
          bottom: true
        }
      },
      position: [
        -totalWidthUnits/2 + furnitureUtils.mmToUnits(leftCladding.thickness)/2,
        claddingYPosition + totalHeightUnits/2 + 
          (furnitureUtils.mmToUnits(overhang.top) - furnitureUtils.mmToUnits(overhang.bottom))/2,
        (furnitureUtils.mmToUnits(overhang.front) - furnitureUtils.mmToUnits(overhang.back)) / 2
      ],
      dimensions: {
        width: furnitureUtils.mmToUnits(leftCladding.thickness),
        height: claddingHeight,
        depth: claddingDepth
      }
    });
  }
  
  // Panneau droit
  if (construction.cladding.right.enabled) {
    const rightCladding = construction.cladding.right;
    const overhang = rightCladding.overhang || { front: 0, back: 0, top: 0, bottom: 0 };
    
    // Calculer les dimensions avec débordements (sans compter la plinthe/socle)
    const claddingHeight = totalHeightUnits + 
      furnitureUtils.mmToUnits(overhang.top) + 
      furnitureUtils.mmToUnits(overhang.bottom);
    
    const claddingDepth = totalDepthUnits + 
      furnitureUtils.mmToUnits(overhang.front) + 
      furnitureUtils.mmToUnits(overhang.back);
    
    // CORRECTION: Décalage vertical pour tenir compte de la plinthe/socle
    const claddingYPosition = hasBaseElement ? baseHeightUnits : 0;
    
    objects.push({
      id: `cladding_right_${furnitureUtils.generateId()}`,
      type: 'piece',
      piece: {
        description: rightCladding.type === 'filler' ? 'Fileur droit' : 'Panneau habillage droit',
        material: furniture.material,
        edgeBanding: {
          front: true,
          back: false,
          top: true,
          bottom: true
        }
      },
      position: [
        totalWidthUnits/2 - furnitureUtils.mmToUnits(rightCladding.thickness)/2,
        claddingYPosition + totalHeightUnits/2 + 
          (furnitureUtils.mmToUnits(overhang.top) - furnitureUtils.mmToUnits(overhang.bottom))/2,
        (furnitureUtils.mmToUnits(overhang.front) - furnitureUtils.mmToUnits(overhang.back)) / 2
      ],
      dimensions: {
        width: furnitureUtils.mmToUnits(rightCladding.thickness),
        height: claddingHeight,
        depth: claddingDepth
      }
    });
  }
  
  // Panneau supérieur
  if (construction.cladding.top.enabled) {
    const topCladding = construction.cladding.top;
    const overhang = topCladding.overhang || { front: 0, back: 0, left: 0, right: 0 };
    
    // Calcul de la largeur
    let claddingWidth = totalWidthUnits + 
      furnitureUtils.mmToUnits(overhang.left) + 
      furnitureUtils.mmToUnits(overhang.right);
    
    const claddingDepth = totalDepthUnits + 
      furnitureUtils.mmToUnits(overhang.front) + 
      furnitureUtils.mmToUnits(overhang.back);
    
    // CORRECTION: Décalage vertical pour tenir compte de la plinthe/socle
    const claddingYPosition = hasBaseElement ? baseHeightUnits : 0;
    
    objects.push({
      id: `cladding_top_${furnitureUtils.generateId()}`,
      type: 'piece',
      piece: {
        description: 'Panneau habillage supérieur',
        material: furniture.material,
        edgeBanding: {
          front: true,
          back: true,
          left: true,
          right: true
        }
      },
      position: [
        (furnitureUtils.mmToUnits(overhang.right) - furnitureUtils.mmToUnits(overhang.left)) / 2,
        claddingYPosition + totalHeightUnits - furnitureUtils.mmToUnits(topCladding.thickness)/2,
        (furnitureUtils.mmToUnits(overhang.front) - furnitureUtils.mmToUnits(overhang.back)) / 2
      ],
      dimensions: {
        width: claddingWidth,
        height: furnitureUtils.mmToUnits(topCladding.thickness),
        depth: claddingDepth
      }
    });
  }
  
  // Panneau inférieur (seulement si les côtés ne vont pas jusqu'au sol)
  if (construction.cladding.bottom.enabled && !sidesExtendToFloor) {
    const bottomCladding = construction.cladding.bottom;
    const overhang = bottomCladding.overhang || { front: 0, back: 0, left: 0, right: 0 };
    
    // Calcul de la largeur
    let claddingWidth = totalWidthUnits + 
      furnitureUtils.mmToUnits(overhang.left) + 
      furnitureUtils.mmToUnits(overhang.right);
    
    const claddingDepth = totalDepthUnits + 
      furnitureUtils.mmToUnits(overhang.front) + 
      furnitureUtils.mmToUnits(overhang.back);
    
    // CORRECTION: Décalage vertical pour tenir compte de la plinthe/socle
    const claddingYPosition = hasBaseElement ? baseHeightUnits : 0;
    
    objects.push({
      id: `cladding_bottom_${furnitureUtils.generateId()}`,
      type: 'piece',
      piece: {
        description: 'Panneau habillage inférieur',
        material: furniture.material,
        edgeBanding: {
          front: true,
          back: true,
          left: true,
          right: true
        }
      },
      position: [
        (furnitureUtils.mmToUnits(overhang.right) - furnitureUtils.mmToUnits(overhang.left)) / 2,
        claddingYPosition + furnitureUtils.mmToUnits(bottomCladding.thickness)/2,
        (furnitureUtils.mmToUnits(overhang.front) - furnitureUtils.mmToUnits(overhang.back)) / 2
      ],
      dimensions: {
        width: claddingWidth,
        height: furnitureUtils.mmToUnits(bottomCladding.thickness),
        depth: claddingDepth
      }
    });
  }
  
  // 4. PANNEAU ARRIÈRE SI ACTIVÉ
  
  if (construction.backPanel.enabled) {
    const backThicknessUnits = furnitureUtils.mmToUnits(construction.backPanel.thickness);
    const backInsetUnits = furnitureUtils.mmToUnits(construction.backPanel.inset);
    
    objects.push({
      id: `back_panel_${furnitureUtils.generateId()}`,
      type: 'piece',
      piece: {
        description: 'Panneau arrière',
        material: furniture.material,
        color: '#D0D0D0'
      },
      position: [
        offsetX,
        offsetY + baseHeightUnits + heightUnits/2,
        -depthUnits/2 + backThicknessUnits/2 + backInsetUnits
      ],
      dimensions: {
        width: widthUnits - thicknessUnits * 2,
        height: heightUnits - thicknessUnits * 2,
        depth: backThicknessUnits
      }
    });
  }
  
  // Log final du nombre d'objets générés
  console.log(`Génération terminée: ${objects.length} objets créés.`);
  
  // Créer le groupe de meuble
  const furnitureGroup = {
    id: `furniture_group_${furnitureUtils.generateId()}`,
    type: 'furnitureGroup',
    position: [furnitureX, furnitureY, furnitureZ],
    rotation: [
      furniture.rotation?.x || 0,
      furniture.rotation?.y || 0,
      furniture.rotation?.z || 0
    ],
    children: objects
  };
  
  return [furnitureGroup];
}