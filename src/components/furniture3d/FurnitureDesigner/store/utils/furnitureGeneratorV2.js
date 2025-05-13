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
                         (construction.base.backPlinth && construction.base.backPlinth.enabled === true) ||
                         (construction.base.baseType === 'socle' && construction.base.socle && construction.base.socle.enabled === true);
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
    hasSocle: construction.base.baseType === 'socle' && construction.base.socle?.enabled === true,
    frontPlinthProps: construction.base.frontPlinth,
    backPlinthProps: construction.base.backPlinth,
    baseInsets: construction.base.baseInset
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
      
      // Segment de dessous - MODIFIÉ: comportement différent selon sidesExtendToFloor
      if (!sidesExtendToFloor) {
        // Version standard: dessous normal
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
      } else {
        // Version avec côtés jusqu'au sol: dessous positionné plus bas
        // et entre les côtés
        objects.push({
          id: `bottom_segment_${segIdx}_${furnitureUtils.generateId()}`,
          type: 'piece',
          piece: {
            description: `Dessous segment ${segIdx + 1} (entre côtés)`,
            material: furniture.material,
            edgeBanding: {
              front: true,
              back: false,
              left: false, // Pas de chant sur les côtés car positionné entre les côtés
              right: false
            }
          },
          position: [
            offsetX + segX - widthUnits/2,
            baseHeightUnits + thicknessUnits/2, // Positionné au niveau du bas des côtés
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
    
    // MODIFICATION: Dessous avec comportement différent selon sidesExtendToFloor
    if (!sidesExtendToFloor) {
      // Dessous standard quand les côtés ne vont pas jusqu'au sol
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
    } else {
      // Dessous positionné entre les côtés quand les côtés vont jusqu'au sol
      // Largeur réduite de l'épaisseur des côtés si nécessaire
      const bottomWidthWithSides = construction.basic.assemblyType === 'overlap' 
        ? topBottomWidth  // Déjà réduit dans le cas 'overlap'
        : topBottomWidth - thicknessUnits * 2; // Réduction supplémentaire pour autres types d'assemblage
      
      objects.push({
        id: `bottom_between_sides_${furnitureUtils.generateId()}`,
        type: 'piece',
        piece: {
          description: 'Dessous (entre côtés)',
          material: furniture.material,
          edgeBanding: {
            front: true,
            back: false,
            left: false,  // Pas de chant car entre les côtés
            right: false  // Pas de chant car entre les côtés
          }
        },
        position: [
          offsetX,
          baseHeightUnits + thicknessUnits/2,  // Positionné au niveau du bas des côtés
          0
        ],
        dimensions: {
          width: bottomWidthWithSides,
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
  
  // 2. GÉNÉRER LES PLINTHES AVANT ET ARRIÈRE - MODIFICATIONS POUR LES CÔTÉS JUSQU'AU SOL
  
  // Plinthe avant
  if (construction.base.frontPlinth && construction.base.frontPlinth.enabled === true) {
    // Log détaillé pour débogage
    console.log("Génération de la plinthe avant:", {
      enabled: construction.base.frontPlinth.enabled,
      thickness: construction.base.frontPlinth.thickness,
      leftInset: construction.base.frontPlinth.leftInset,
      rightInset: construction.base.frontPlinth.rightInset,
      frontInset: construction.base.baseInset?.front || 0,
      sidesExtendToFloor
    });
    
    const frontPlinth = construction.base.frontPlinth;
    const plinthThicknessUnits = furnitureUtils.mmToUnits(frontPlinth.thickness || 18);
    
    // Appliquer les retraits latéraux - avec vérifications explicites
    const leftInset = typeof frontPlinth.leftInset === 'number' ? furnitureUtils.mmToUnits(frontPlinth.leftInset) : 0;
    const rightInset = typeof frontPlinth.rightInset === 'number' ? furnitureUtils.mmToUnits(frontPlinth.rightInset) : 0;
    
    // NOUVEAU: Appliquer le retrait vers l'intérieur (depuis l'avant)
    const frontInset = typeof construction.base.baseInset?.front === 'number' ? 
                       furnitureUtils.mmToUnits(construction.base.baseInset.front) : 0;
    
    // Ajuster la largeur selon si les côtés vont jusqu'au sol
    let plinthWidth = totalWidthUnits - leftInset - rightInset;
    let plinthX = (leftInset - rightInset) / 2;
    
    // Si les côtés vont jusqu'au sol, la plinthe doit être entre les côtés
    if (sidesExtendToFloor) {
      // Réduire la largeur de l'épaisseur des côtés
      plinthWidth = plinthWidth - 2 * thicknessUnits;
    }
    
    console.log("Ajout plinthe avant:", {
      width: plinthWidth,
      sidesExtendToFloor,
      frontInset,
      position: [
        plinthX,
        baseHeightUnits / 2,
        depthUnits / 2 - plinthThicknessUnits / 2 - frontInset // Ajout du retrait vers l'intérieur
      ]
    });
    
    objects.push({
      id: `front_plinth_${furnitureUtils.generateId()}`,
      type: 'piece',
      piece: {
        description: 'Plinthe avant',
        material: furniture.material,
        edgeBanding: {
          front: true,
          back: false,
          left: !sidesExtendToFloor,  // Pas de chant si entre les côtés
          right: !sidesExtendToFloor  // Pas de chant si entre les côtés
        }
      },
      position: [
        plinthX,
        baseHeightUnits / 2, // Moitié de la hauteur de la plinthe
        depthUnits / 2 - plinthThicknessUnits / 2 - frontInset // Retrait vers l'intérieur
      ],
      dimensions: {
        width: plinthWidth,
        height: baseHeightUnits,
        depth: plinthThicknessUnits
      }
    });
  }
  
  // Plinthe arrière
  if (construction.base.backPlinth && construction.base.backPlinth.enabled === true) {
    // Log détaillé pour débogage
    console.log("Génération de la plinthe arrière:", {
      enabled: construction.base.backPlinth.enabled,
      thickness: construction.base.backPlinth.thickness,
      leftInset: construction.base.backPlinth.leftInset,
      rightInset: construction.base.backPlinth.rightInset,
      backInset: construction.base.baseInset?.back || 0,
      sidesExtendToFloor
    });
    
    const backPlinth = construction.base.backPlinth;
    const plinthThicknessUnits = furnitureUtils.mmToUnits(backPlinth.thickness || 18);
    
    // Appliquer les retraits latéraux - avec vérifications explicites
    const leftInset = typeof backPlinth.leftInset === 'number' ? furnitureUtils.mmToUnits(backPlinth.leftInset) : 0;
    const rightInset = typeof backPlinth.rightInset === 'number' ? furnitureUtils.mmToUnits(backPlinth.rightInset) : 0;
    
    // NOUVEAU: Appliquer le retrait vers l'intérieur (depuis l'arrière)
    const backInset = typeof construction.base.baseInset?.back === 'number' ? 
                      furnitureUtils.mmToUnits(construction.base.baseInset.back) : 0;
    
    // Ajuster la largeur selon si les côtés vont jusqu'au sol
    let plinthWidth = totalWidthUnits - leftInset - rightInset;
    let plinthX = (leftInset - rightInset) / 2;
    
    // Si les côtés vont jusqu'au sol, la plinthe doit être entre les côtés
    if (sidesExtendToFloor) {
      // Réduire la largeur de l'épaisseur des côtés
      plinthWidth = plinthWidth - 2 * thicknessUnits;
    }
    
    console.log("Ajout plinthe arrière:", {
      width: plinthWidth,
      sidesExtendToFloor,
      backInset,
      position: [
        plinthX,
        baseHeightUnits / 2,
        -depthUnits / 2 + plinthThicknessUnits / 2 + backInset // Ajout du retrait vers l'intérieur
      ]
    });
    
    objects.push({
      id: `back_plinth_${furnitureUtils.generateId()}`,
      type: 'piece',
      piece: {
        description: 'Plinthe arrière',
        material: furniture.material,
        edgeBanding: {
          front: true,
          back: false,
          left: !sidesExtendToFloor,  // Pas de chant si entre les côtés
          right: !sidesExtendToFloor  // Pas de chant si entre les côtés
        }
      },
      position: [
        plinthX,
        baseHeightUnits / 2, // Moitié de la hauteur de la plinthe
        -depthUnits / 2 + plinthThicknessUnits / 2 + backInset // Retrait vers l'intérieur
      ],
      dimensions: {
        width: plinthWidth,
        height: baseHeightUnits,
        depth: plinthThicknessUnits
      }
    });
  }

  // NOUVEAU: Génération du socle complet
  if (construction.base.baseType === 'socle' && construction.base.socle && construction.base.socle.enabled === true) {
    const socle = construction.base.socle;
    const baseInset = construction.base.baseInset || { front: 0, back: 0, left: 0, right: 0 };
    
    console.log("Génération du socle complet:", {
      enabled: socle.enabled,
      sides: socle.sides,
      verticalSeparations: socle.verticalSeparations,
      topCoverage: socle.topCoverage,
      baseInset
    });
    
    // Référence des plinthes/faces avant et arrière
    const hasFrontPlinth = construction.base.frontPlinth?.enabled || false;
    const hasBackPlinth = construction.base.backPlinth?.enabled || false;
    
    // Déterminer l'épaisseur des faces avant et arrière
    const frontThickness = hasFrontPlinth ? construction.base.frontPlinth.thickness : 18;
    const frontThicknessUnits = furnitureUtils.mmToUnits(frontThickness);
    
    const backThickness = hasBackPlinth ? construction.base.backPlinth.thickness : 18;
    const backThicknessUnits = furnitureUtils.mmToUnits(backThickness);
    
    // Récupérer l'épaisseur du panneau supérieur ou des traverses pour le calcul vertical
    const topThickness = furnitureUtils.mmToUnits(socle.topCoverage?.thickness || 18);
    
    // Calculer les retraits avant et arrière
    const frontInset = furnitureUtils.mmToUnits(baseInset.front || 0);
    const backInset = furnitureUtils.mmToUnits(baseInset.back || 0);
    
    // 1. Faces avant et arrière (utiliser les plinthes existantes si activées)
    if (!hasFrontPlinth) {
      // Créer la face avant du socle
      const leftInset = furnitureUtils.mmToUnits(baseInset.left || 0);
      const rightInset = furnitureUtils.mmToUnits(baseInset.right || 0);
      
      let socleWidth = totalWidthUnits - leftInset - rightInset;
      
      objects.push({
        id: `socle_front_${furnitureUtils.generateId()}`,
        type: 'piece',
        piece: {
          description: 'Face avant socle',
          material: furniture.material,
          edgeBanding: {
            front: true,
            back: false,
            left: true,
            right: true
          }
        },
        position: [
          (leftInset - rightInset) / 2,
          baseHeightUnits / 2, // Moitié de la hauteur du socle
          depthUnits / 2 - frontThicknessUnits / 2 - frontInset
        ],
        dimensions: {
          width: socleWidth,
          height: baseHeightUnits,
          depth: frontThicknessUnits
        }
      });
    }
    
    if (!hasBackPlinth) {
      // Créer la face arrière du socle
      const leftInset = furnitureUtils.mmToUnits(baseInset.left || 0);
      const rightInset = furnitureUtils.mmToUnits(baseInset.right || 0);
      
      let socleWidth = totalWidthUnits - leftInset - rightInset;
      
      objects.push({
        id: `socle_back_${furnitureUtils.generateId()}`,
        type: 'piece',
        piece: {
          description: 'Face arrière socle',
          material: furniture.material,
          edgeBanding: {
            front: false,
            back: true,
            left: true,
            right: true
          }
        },
        position: [
          (leftInset - rightInset) / 2,
          baseHeightUnits / 2, // Moitié de la hauteur du socle
          -depthUnits / 2 + backThicknessUnits / 2 + backInset
        ],
        dimensions: {
          width: socleWidth,
          height: baseHeightUnits,
          depth: backThicknessUnits
        }
      });
    }
    
    // 2. Côtés du socle (entre avant et arrière) - NOUVELLE CORRECTION POUR ALIGNEMENT VERTICAL
    if (socle.sides && socle.sides.enabled) {
      const sideThickness = furnitureUtils.mmToUnits(socle.sides.thickness || 18);
      
      // Calculer la profondeur du socle en tenant compte des retraits et faces avant/arrière
      const totalDepthWithInsets = depthUnits - frontInset - backInset;
      const frontFacePos = depthUnits / 2 - frontInset;
      const backFacePos = -depthUnits / 2 + backInset;
      
      // Calculer la profondeur des côtés
      const sideDepth = totalDepthWithInsets - frontThicknessUnits - backThicknessUnits;
      
      // CORRECTION: Position Z centrée entre faces avant et arrière
      // Prend en compte les retraits asymétriques
      const frontFaceInnerZ = frontFacePos - frontThicknessUnits;
      const backFaceInnerZ = backFacePos + backThicknessUnits;
      const sideZPos = (frontFaceInnerZ + backFaceInnerZ) / 2;
      
      // CORRECTION: Hauteur réduite pour s'arrêter sous le panneau/traverses
      const sideHeight = baseHeightUnits - topThickness;
      
      // CORRECTION: Position Y ajustée pour aligner sur la nouvelle hauteur
      const sideYPos = sideHeight / 2;
      
      // Côté gauche du socle - CORRIGÉ
      objects.push({
        id: `socle_side_left_${furnitureUtils.generateId()}`,
        type: 'piece',
        piece: {
          description: 'Côté gauche socle',
          material: furniture.material,
          edgeBanding: {
            front: false, // Contre face avant
            back: false,  // Contre face arrière
            top: false,   // Sous le panneau supérieur
            bottom: false // Contre le sol
          }
        },
        position: [
          -totalWidthUnits/2 + sideThickness/2 + furnitureUtils.mmToUnits(baseInset.left || 0),
          sideYPos, // Position Y corrigée
          sideZPos // Position Z corrigée
        ],
        dimensions: {
          width: sideThickness,
          height: sideHeight, // Hauteur réduite
          depth: sideDepth
        }
      });
      
      // Côté droit du socle - CORRIGÉ
      objects.push({
        id: `socle_side_right_${furnitureUtils.generateId()}`,
        type: 'piece',
        piece: {
          description: 'Côté droit socle',
          material: furniture.material,
          edgeBanding: {
            front: false,
            back: false,
            top: false,
            bottom: false
          }
        },
        position: [
          totalWidthUnits/2 - sideThickness/2 - furnitureUtils.mmToUnits(baseInset.right || 0),
          sideYPos, // Position Y corrigée
          sideZPos
        ],
        dimensions: {
          width: sideThickness,
          height: sideHeight, // Hauteur réduite
          depth: sideDepth
        }
      });
    }
    
    // 3. Séparations verticales - NOUVELLE CORRECTION POUR ALIGNEMENT VERTICAL
    if (socle.verticalSeparations && socle.verticalSeparations.enabled && 
        socle.verticalSeparations.count > 0) {
      const sepThickness = furnitureUtils.mmToUnits(socle.verticalSeparations.thickness || 18);
      
      // Utiliser les mêmes calculs que pour les côtés
      const totalDepthWithInsets = depthUnits - frontInset - backInset;
      const frontFacePos = depthUnits / 2 - frontInset;
      const backFacePos = -depthUnits / 2 + backInset;
      
      // Calculer la profondeur des séparations
      const sepDepth = totalDepthWithInsets - frontThicknessUnits - backThicknessUnits;
      
      // CORRECTION: Position Z centrée entre faces avant et arrière
      const frontFaceInnerZ = frontFacePos - frontThicknessUnits;
      const backFaceInnerZ = backFacePos + backThicknessUnits;
      const sepZPos = (frontFaceInnerZ + backFaceInnerZ) / 2;
      
      // CORRECTION: Hauteur réduite pour s'arrêter sous le panneau/traverses
      const sepHeight = baseHeightUnits - topThickness;
      
      // CORRECTION: Position Y ajustée pour aligner sur la nouvelle hauteur
      const sepYPos = sepHeight / 2;
      
      // Positions des séparations
      let positions = [];
      
      if (socle.verticalSeparations.autoDistribute) {
        // Calculer les positions automatiquement
        const count = socle.verticalSeparations.count;
        const availableWidth = totalWidthUnits - 
                              furnitureUtils.mmToUnits(baseInset.left || 0) - 
                              furnitureUtils.mmToUnits(baseInset.right || 0);
        
        const step = availableWidth / (count + 1);
        
        for (let i = 1; i <= count; i++) {
          positions.push(-totalWidthUnits/2 + 
                        furnitureUtils.mmToUnits(baseInset.left || 0) + 
                        i * step);
        }
      } else if (socle.verticalSeparations.positions && socle.verticalSeparations.positions.length > 0) {
        // Utiliser les positions manuelles
        positions = socle.verticalSeparations.positions.map(pos => 
          furnitureUtils.mmToUnits(pos) - totalWidthUnits/2);
      }
      
      // Générer les séparations - CORRIGÉ
      positions.forEach((pos, idx) => {
        objects.push({
          id: `socle_vertical_sep_${idx}_${furnitureUtils.generateId()}`,
          type: 'piece',
          piece: {
            description: `Séparation socle ${idx + 1}`,
            material: furniture.material,
            edgeBanding: {
              front: false,
              back: false,
              top: false,
              bottom: false
            }
          },
          position: [
            pos,
            sepYPos, // Position Y corrigée
            sepZPos
          ],
          dimensions: {
            width: sepThickness,
            height: sepHeight, // Hauteur réduite
            depth: sepDepth
          }
        });
      });
    }
    
    // 4. Couverture supérieure (panneau ou traverses) - NOUVELLE CORRECTION
    if (socle.topCoverage) {
      const thickness = furnitureUtils.mmToUnits(socle.topCoverage.thickness || 18);
      
      if (socle.topCoverage.type === 'panel') {
        // Panneau complet couvrant tout le socle ENTRE les faces avant et arrière
        
        // Calculer la largeur du panneau
        const panelWidth = totalWidthUnits - 
                          furnitureUtils.mmToUnits(baseInset.left || 0) - 
                          furnitureUtils.mmToUnits(baseInset.right || 0);
        
        // Calculer la profondeur en tenant compte des faces avant et arrière
        const totalDepthWithInsets = depthUnits - frontInset - backInset;
        const frontFacePos = depthUnits / 2 - frontInset;
        const backFacePos = -depthUnits / 2 + backInset;
        
        // CORRECTION: Calculer profondeur du panneau
        const panelDepth = totalDepthWithInsets - frontThicknessUnits - backThicknessUnits;
        
        // CORRECTION: Position Z centrée entre faces avant et arrière
        const frontFaceInnerZ = frontFacePos - frontThicknessUnits;
        const backFaceInnerZ = backFacePos + backThicknessUnits;
        const panelZ = (frontFaceInnerZ + backFaceInnerZ) / 2;
        
        // Position centrée en X
        const panelX = (furnitureUtils.mmToUnits(baseInset.left || 0) - 
                      furnitureUtils.mmToUnits(baseInset.right || 0)) / 2;
        
        objects.push({
          id: `socle_top_panel_${furnitureUtils.generateId()}`,
          type: 'piece',
          piece: {
            description: 'Dessus du socle',
            material: furniture.material,
            edgeBanding: {
              front: false, // Contre face avant
              back: false,  // Contre face arrière
              left: false,  // Contre côté gauche
              right: false  // Contre côté droit
            }
          },
          position: [
            panelX,
            baseHeightUnits - thickness/2, // En haut du socle
            panelZ
          ],
          dimensions: {
            width: panelWidth,
            height: thickness,
            depth: panelDepth
          }
        });
      } else if (socle.topCoverage.type === 'traverses') {
        // Deux traverses (avant et arrière)
        const traverseWidth = furnitureUtils.mmToUnits(socle.topCoverage.traverseWidth || 80);
        
        // Largeur commune des traverses
        const traversesWidth = totalWidthUnits - 
                            furnitureUtils.mmToUnits(baseInset.left || 0) - 
                            furnitureUtils.mmToUnits(baseInset.right || 0);
        
        // Position X commune des traverses
        const traversesX = (furnitureUtils.mmToUnits(baseInset.left || 0) - 
                          furnitureUtils.mmToUnits(baseInset.right || 0)) / 2;
        
        // CORRECTION: Calculer positions des traverses
        const frontFacePos = depthUnits / 2 - frontInset;
        const backFacePos = -depthUnits / 2 + backInset;
        
        // Position de la traverse avant (juste derrière la face avant)
        const frontTraverseZ = frontFacePos - frontThicknessUnits - traverseWidth/2;
        
        // Position de la traverse arrière (juste devant la face arrière)
        const backTraverseZ = backFacePos + backThicknessUnits + traverseWidth/2;
        
        // Traverse avant
        objects.push({
          id: `socle_top_traverse_front_${furnitureUtils.generateId()}`,
          type: 'piece',
          piece: {
            description: 'Traverse avant socle',
            material: furniture.material,
            edgeBanding: {
              front: false, // Contre face avant
              back: true,   // Visible de l'intérieur
              left: false,  // Contre côté gauche
              right: false  // Contre côté droit
            }
          },
          position: [
            traversesX,
            baseHeightUnits - thickness/2, // En haut du socle
            frontTraverseZ
          ],
          dimensions: {
            width: traversesWidth,
            height: thickness,
            depth: traverseWidth
          }
        });
        
        // Traverse arrière
        objects.push({
          id: `socle_top_traverse_back_${furnitureUtils.generateId()}`,
          type: 'piece',
          piece: {
            description: 'Traverse arrière socle',
            material: furniture.material,
            edgeBanding: {
              front: true,  // Visible de l'intérieur
              back: false,  // Contre face arrière
              left: false,  // Contre côté gauche
              right: false  // Contre côté droit
            }
          },
          position: [
            traversesX,
            baseHeightUnits - thickness/2, // En haut du socle
            backTraverseZ
          ],
          dimensions: {
            width: traversesWidth,
            height: thickness,
            depth: traverseWidth
          }
        });
      }
    }
  }
  
  // 3. GÉNÉRER LES PANNEAUX D'HABILLAGE ET LES FILEURS - CODE SÉPARÉ
  
  // Panneau/fileur gauche - SÉPARATION CLAIRE ENTRE PANNEAU ET FILEUR
  if (construction.cladding.left.enabled) {
    const leftCladding = construction.cladding.left;
    const overhang = leftCladding.overhang || { front: 0, back: 0, top: 0, bottom: 0 };
    const isFillerType = leftCladding.type === 'filler';
    
    // Log détaillé pour le type d'élément créé
    console.log(`Génération ${isFillerType ? 'fileur' : 'panneau'} gauche:`, {
      type: leftCladding.type,
      thickness: leftCladding.thickness,
      overhangs: overhang
    });
    
    // Décalage vertical pour tenir compte de la plinthe/socle
    const claddingYPosition = hasBaseElement ? baseHeightUnits : 0;
    
    if (isFillerType) {
      // FILEUR GAUCHE - CODE SPÉCIFIQUE
      // Pour un fileur gauche, les débordements haut/bas sont les principaux
      
      // Hauteur avec débordements haut/bas
      const fillerHeight = totalHeightUnits + 
        furnitureUtils.mmToUnits(overhang.top) + 
        furnitureUtils.mmToUnits(overhang.bottom);
      
      // Profondeur avec débordements avant/arrière
      const fillerDepth = totalDepthUnits + 
        furnitureUtils.mmToUnits(overhang.front) + 
        furnitureUtils.mmToUnits(overhang.back);
      
      // ID spécifique pour les fileurs pour faciliter le débogage
      objects.push({
        id: `filler_left_${furnitureUtils.generateId()}`,
        type: 'piece',
        piece: {
          description: 'Fileur gauche',
          material: furniture.material,
          edgeBanding: {
            front: true,  // Visible en façade
            back: false,  // Contre le meuble
            top: true,    // Visible en haut
            bottom: true  // Visible en bas
          },
          // Marqueur explicite pour fileurs
          type: 'filler',
          position: 'left'
        },
        position: [
          -totalWidthUnits/2 - furnitureUtils.mmToUnits(leftCladding.thickness)/2, // Vers l'extérieur
          claddingYPosition + totalHeightUnits/2 + 
            (furnitureUtils.mmToUnits(overhang.top) - furnitureUtils.mmToUnits(overhang.bottom))/2,
          (furnitureUtils.mmToUnits(overhang.front) - furnitureUtils.mmToUnits(overhang.back)) / 2
        ],
        dimensions: {
          width: furnitureUtils.mmToUnits(leftCladding.thickness), // Épaisseur du fileur
          height: fillerHeight,  // Hauteur avec débordements haut/bas
          depth: fillerDepth     // Profondeur avec débordements avant/arrière
        }
      });
    } else {
      // PANNEAU HABILLAGE GAUCHE STANDARD - CODE INCHANGÉ
      const claddingHeight = totalHeightUnits + 
        furnitureUtils.mmToUnits(overhang.top) + 
        furnitureUtils.mmToUnits(overhang.bottom);
      
      const claddingDepth = totalDepthUnits + 
        furnitureUtils.mmToUnits(overhang.front) + 
        furnitureUtils.mmToUnits(overhang.back);
      
      objects.push({
        id: `cladding_left_${furnitureUtils.generateId()}`,
        type: 'piece',
        piece: {
          description: 'Panneau habillage gauche',
          material: furniture.material,
          edgeBanding: {
            front: true,
            back: false,
            top: true,
            bottom: true
          },
          type: 'panel'
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
  }
  
  // Panneau/fileur droit - SÉPARATION CLAIRE ENTRE PANNEAU ET FILEUR
  if (construction.cladding.right.enabled) {
    const rightCladding = construction.cladding.right;
    const overhang = rightCladding.overhang || { front: 0, back: 0, top: 0, bottom: 0 };
    const isFillerType = rightCladding.type === 'filler';
    
    // Log détaillé pour le type d'élément créé
    console.log(`Génération ${isFillerType ? 'fileur' : 'panneau'} droit:`, {
      type: rightCladding.type,
      thickness: rightCladding.thickness,
      overhangs: overhang
    });
    
    // Décalage vertical pour tenir compte de la plinthe/socle
    const claddingYPosition = hasBaseElement ? baseHeightUnits : 0;
    
    if (isFillerType) {
      // FILEUR DROIT - CODE SPÉCIFIQUE
      // Pour un fileur droit, les débordements haut/bas sont les principaux
      
      // Hauteur avec débordements haut/bas
      const fillerHeight = totalHeightUnits + 
        furnitureUtils.mmToUnits(overhang.top) + 
        furnitureUtils.mmToUnits(overhang.bottom);
      
      // Profondeur avec débordements avant/arrière
      const fillerDepth = totalDepthUnits + 
        furnitureUtils.mmToUnits(overhang.front) + 
        furnitureUtils.mmToUnits(overhang.back);
      
      // ID spécifique pour les fileurs pour faciliter le débogage
      objects.push({
        id: `filler_right_${furnitureUtils.generateId()}`,
        type: 'piece',
        piece: {
          description: 'Fileur droit',
          material: furniture.material,
          edgeBanding: {
            front: true,  // Visible en façade
            back: false,  // Contre le meuble
            top: true,    // Visible en haut
            bottom: true  // Visible en bas
          },
          // Marqueur explicite pour fileurs
          type: 'filler',
          position: 'right'
        },
        position: [
          totalWidthUnits/2 + furnitureUtils.mmToUnits(rightCladding.thickness)/2, // Vers l'extérieur
          claddingYPosition + totalHeightUnits/2 + 
            (furnitureUtils.mmToUnits(overhang.top) - furnitureUtils.mmToUnits(overhang.bottom))/2,
          (furnitureUtils.mmToUnits(overhang.front) - furnitureUtils.mmToUnits(overhang.back)) / 2
        ],
        dimensions: {
          width: furnitureUtils.mmToUnits(rightCladding.thickness), // Épaisseur du fileur
          height: fillerHeight,  // Hauteur avec débordements haut/bas
          depth: fillerDepth     // Profondeur avec débordements avant/arrière
        }
      });
    } else {
      // PANNEAU HABILLAGE DROIT STANDARD - CODE INCHANGÉ
      const claddingHeight = totalHeightUnits + 
        furnitureUtils.mmToUnits(overhang.top) + 
        furnitureUtils.mmToUnits(overhang.bottom);
      
      const claddingDepth = totalDepthUnits + 
        furnitureUtils.mmToUnits(overhang.front) + 
        furnitureUtils.mmToUnits(overhang.back);
      
      objects.push({
        id: `cladding_right_${furnitureUtils.generateId()}`,
        type: 'piece',
        piece: {
          description: 'Panneau habillage droit',
          material: furniture.material,
          edgeBanding: {
            front: true,
            back: false,
            top: true,
            bottom: true
          },
          type: 'panel'
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
  }
  
  // Panneau/fileur supérieur - SÉPARATION CLAIRE ENTRE PANNEAU ET FILEUR
  if (construction.cladding.top.enabled) {
    const topCladding = construction.cladding.top;
    const overhang = topCladding.overhang || { front: 0, back: 0, left: 0, right: 0 };
    const isFillerType = topCladding.type === 'filler';
    
    // Log détaillé pour le type d'élément créé
    console.log(`Génération ${isFillerType ? 'fileur' : 'panneau'} supérieur:`, {
      type: topCladding.type,
      thickness: topCladding.thickness,
      overhangs: overhang
    });
    
    // Décalage vertical pour tenir compte de la plinthe/socle
    const claddingYPosition = hasBaseElement ? baseHeightUnits : 0;
    
    if (isFillerType) {
      // FILEUR SUPÉRIEUR - CODE SPÉCIFIQUE
      // Pour un fileur supérieur, les débordements gauche/droite sont les principaux
      
      // Largeur avec débordements gauche/droite
      const fillerWidth = totalWidthUnits + 
        furnitureUtils.mmToUnits(overhang.left) + 
        furnitureUtils.mmToUnits(overhang.right);
      
      // Profondeur avec débordements avant/arrière
      const fillerDepth = totalDepthUnits + 
        furnitureUtils.mmToUnits(overhang.front) + 
        furnitureUtils.mmToUnits(overhang.back);
      
      // ID spécifique pour les fileurs pour faciliter le débogage
      objects.push({
        id: `filler_top_${furnitureUtils.generateId()}`,
        type: 'piece',
        piece: {
          description: 'Fileur supérieur',
          material: furniture.material,
          edgeBanding: {
            front: true,  // Visible en façade
            back: true,   // Visible à l'arrière
            left: true,   // Visible à gauche
            right: true   // Visible à droite
          },
          // Marqueur explicite pour fileurs
          type: 'filler',
          position: 'top'
        },
        position: [
          (furnitureUtils.mmToUnits(overhang.right) - furnitureUtils.mmToUnits(overhang.left)) / 2,
          claddingYPosition + totalHeightUnits + furnitureUtils.mmToUnits(topCladding.thickness)/2, // Au-dessus
          (furnitureUtils.mmToUnits(overhang.front) - furnitureUtils.mmToUnits(overhang.back)) / 2
        ],
        dimensions: {
          width: fillerWidth,     // Largeur avec débordements gauche/droite
          height: furnitureUtils.mmToUnits(topCladding.thickness), // Épaisseur du fileur
          depth: fillerDepth      // Profondeur avec débordements avant/arrière
        }
      });
    } else {
      // PANNEAU HABILLAGE SUPÉRIEUR STANDARD - CODE INCHANGÉ
      const claddingWidth = totalWidthUnits + 
        furnitureUtils.mmToUnits(overhang.left) + 
        furnitureUtils.mmToUnits(overhang.right);
      
      const claddingDepth = totalDepthUnits + 
        furnitureUtils.mmToUnits(overhang.front) + 
        furnitureUtils.mmToUnits(overhang.back);
      
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
          },
          type: 'panel'
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
        },
        type: 'panel'
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
        color: '#D0D0D0',
        type: 'panel'
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