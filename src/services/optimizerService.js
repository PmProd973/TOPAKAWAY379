// optimizerService.js
// Service d'optimisation de découpe pour l'application OptiCoupe

import { db, storage } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadString } from "firebase/storage";
import { jsPDF } from "jspdf";

/**
 * Optimisation de la découpe des pièces en fonction des matériaux disponibles
 * @param {Array} pieces Liste des pièces à découper
 * @param {Array} materials Liste des matériaux disponibles
 * @param {Object} params Paramètres d'optimisation
 * @returns {Object} Résultat de l'optimisation
 */
export const optimizeCutting = async (pieces, materials, params) => {
  try {
    console.log("Démarrage de l'optimisation avec algorithme:", params.algorithm);
    
    // Validation des entrées
    if (!pieces || !Array.isArray(pieces) || pieces.length === 0) {
      console.error("Aucune pièce à optimiser");
      return { panels: [], statistics: { efficiency: 0 } };
    }
    
    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      console.error("Aucun matériau disponible pour l'optimisation");
      return { panels: [], statistics: { efficiency: 0 } };
    }
    
    // S'assurer que les paramètres ont des valeurs par défaut
    const optimizationParams = {
      algorithm: 'maxrects', // Par défaut MaxRects au lieu de guillotine
      sawWidth: 3.2,
      allowRotation: true,
      respectGrain: false,
      wasteStrategy: 'minimize',
      panelMargin: 0,
      ...params
    };
    
    console.log(`Optimisation pour ${pieces.length} pièces avec ${materials.length} matériaux`);
    
    // Regrouper les pièces par matériau
    const piecesByMaterial = {};
    
    // Développer les quantités
    let allPiecesExpanded = [];
    const MAX_PIECES = 500; // Limite pour éviter les performances médiocres
    
    for (const piece of pieces) {
      if (!piece.materialId) continue;
      
      if (!piecesByMaterial[piece.materialId]) {
        piecesByMaterial[piece.materialId] = [];
      }
      
      // Ajouter la pièce autant de fois que sa quantité
      const quantity = Math.min(Math.max(1, Number(piece.quantity) || 1), 50); // Limité à 50 par sécurité
      
      for (let i = 0; i < quantity && allPiecesExpanded.length < MAX_PIECES; i++) {
        // Créer une copie avec un ID unique pour éviter les doublons lors du placement
        const uniqueId = `${piece.id}_${i}`;
        const pieceCopy = { 
          ...piece,
          instanceId: uniqueId, // ID unique pour cette instance
          width: Number(piece.width),
          length: Number(piece.length)
        };
        piecesByMaterial[piece.materialId].push(pieceCopy);
        allPiecesExpanded.push(pieceCopy);
      }
    }
    
    console.log(`Nombre total de pièces après expansion des quantités: ${allPiecesExpanded.length}`);
    
    // Résultat de l'optimisation
    const result = {
      panels: [],
      statistics: {
        materialCost: 0,
        materialArea: 0,
        piecesArea: 0,
        wasteArea: 0,
        reusableOffcuts: [],
        panelCount: 0,
        sawLength: 0,
        efficiency: 0
      }
    };
    
    // Pour chaque matériau, générer les panneaux optimisés
    for (const materialId in piecesByMaterial) {
      const material = materials.find(m => m.id === materialId);
      if (!material) continue;
      
      const materialPieces = piecesByMaterial[materialId];
      if (!materialPieces || materialPieces.length === 0) continue;

      // Toujours utiliser l'algorithme MaxRects, indépendamment de ce qui a été sélectionné
      console.log("Utilisation de l'algorithme MaxRects pour une optimisation avancée");
      const optimizedPanels = maxRectsOptimization(materialPieces, material, optimizationParams);
      
      // Ajouter les panneaux optimisés au résultat
      if (optimizedPanels && optimizedPanels.panels) {
        result.panels = [...result.panels, ...optimizedPanels.panels];
        
        // Mettre à jour les statistiques
        result.statistics.materialCost += optimizedPanels.statistics.materialCost || 0;
        result.statistics.materialArea += optimizedPanels.statistics.materialArea || 0;
        result.statistics.piecesArea += optimizedPanels.statistics.piecesArea || 0;
        result.statistics.wasteArea += optimizedPanels.statistics.wasteArea || 0;
        result.statistics.panelCount += optimizedPanels.statistics.panelCount || 0;
        result.statistics.sawLength += optimizedPanels.statistics.sawLength || 0;
        
        if (optimizedPanels.statistics.reusableOffcuts) {
          result.statistics.reusableOffcuts = [
            ...result.statistics.reusableOffcuts, 
            ...optimizedPanels.statistics.reusableOffcuts
          ];
        }
      }
    }
    
    // Calculer l'efficacité globale
    if (result.statistics.materialArea > 0) {
      result.statistics.efficiency = Math.min(100, (result.statistics.piecesArea / result.statistics.materialArea) * 100);
    }
    
    console.log(`Optimisation terminée: ${result.panels.length} panneaux générés avec efficacité ${result.statistics.efficiency.toFixed(2)}%`);
    
    return result;
  } catch (error) {
    console.error("Erreur dans l'optimisation:", error);
    return { 
      panels: [], 
      statistics: { 
        efficiency: 0,
        materialCost: 0,
        materialArea: 0,
        piecesArea: 0,
        wasteArea: 0,
        panelCount: 0,
        sawLength: 0,
        reusableOffcuts: []
      }
    };
  }
};

/**
 * Implémentation de l'algorithme MaxRects amélioré pour l'optimisation de découpe
 * Cet algorithme offre une efficacité supérieure en utilisant plusieurs heuristiques de placement
 * et une meilleure gestion des espaces libres.
 * 
 * @param {Array} pieces Liste des pièces à optimiser
 * @param {Object} material Matériau à utiliser
 * @param {Object} params Paramètres d'optimisation
 * @returns {Object} Résultat de l'optimisation
 */
function maxRectsOptimization(pieces, material, params) {
  try {
    console.log(`Optimisation MaxRects pour ${pieces.length} pièces de ${material.description}`);
    
    // Validation des entrées
    if (!material.width || !material.length) {
      console.error("Matériau sans dimensions valides");
      return {
        panels: [],
        statistics: {
          materialCost: 0,
          materialArea: 0,
          piecesArea: 0,
          wasteArea: 0,
          reusableOffcuts: [],
          panelCount: 0,
          sawLength: 0,
          efficiency: 0
        }
      };
    }
    
    // Vérifier que la marge du panneau n'est pas trop grande
    const panelMargin = Number(params.panelMargin) || 0;
    const usableWidth = material.width - (panelMargin * 2);
    const usableLength = material.length - (panelMargin * 2);
    
    if (usableWidth <= 0 || usableLength <= 0) {
      console.error("Marge trop grande, le panneau n'est pas utilisable");
      return {
        panels: [],
        statistics: {
          materialCost: 0,
          materialArea: 0,
          piecesArea: 0,
          wasteArea: 0,
          reusableOffcuts: [],
          panelCount: 0,
          sawLength: 0,
          efficiency: 0
        }
      };
    }
    
    // Convertir explicitement les dimensions en nombres
    const materialWidth = Number(material.width);
    const materialLength = Number(material.length);
    const sawWidth = Number(params.sawWidth) || 3.2;
    
    // Trier les pièces selon plusieurs critères
    const sortedPieces = [...pieces].sort((a, b) => {
      // D'abord par priorité
      const priorityOrder = { 'high': 0, 'normal': 1, 'low': 2 };
      const priorityA = priorityOrder[a.priority] || 1;
      const priorityB = priorityOrder[b.priority] || 1;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Ensuite par surface (descendant)
      const areaA = Number(a.width) * Number(a.length);
      const areaB = Number(b.width) * Number(b.length);
      
      if (Math.abs(areaA - areaB) > 0.001) {
        return areaB - areaA;
      }
      
      // Si même surface, privilégier les pièces carrées
      const ratioA = Math.max(a.width / a.length, a.length / a.width);
      const ratioB = Math.max(b.width / b.length, b.length / b.width);
      return ratioA - ratioB;
    });
    
    const panels = [];
    const minReuseSize = 100; // Taille minimale pour qu'une chute soit réutilisable
    
    // Limiter le nombre de panneaux pour éviter les problèmes de performance
    const MAX_PANELS = 20;
    
    // Garder une trace des pièces déjà placées pour éviter les doublons
    const placedPieceInstanceIds = new Set();
    let remainingPieces = [...sortedPieces];
    let panelCount = 0;
    
    // Pour l'analyse préliminaire
    const totalPieceArea = pieces.reduce((total, piece) => {
      const quantity = Number(piece.quantity) || 1;
      const pieceArea = Number(piece.width) * Number(piece.length);
      return total + (pieceArea * quantity);
    }, 0);
    
    const panelArea = materialWidth * materialLength;
    const theoreticalMinPanels = Math.ceil(totalPieceArea / panelArea);
    
    console.log(`Nombre théorique minimum de panneaux: ${theoreticalMinPanels} (${(totalPieceArea / panelArea).toFixed(2)} panneaux parfaits)`);
    
    // Tant qu'il y a des pièces à placer et qu'on n'a pas dépassé le nombre max de panneaux
    while (remainingPieces.length > 0 && panelCount < MAX_PANELS) {
      // Créer un nouveau panneau
      const panel = {
        materialId: material.id,
        width: materialWidth,
        length: materialLength,
        cuts: [],
        sawLines: [],
        placedPieces: [],
        reusableOffcuts: [],
        efficiency: 0
      };
      
      // Initialiser les rectangles libres avec le panneau complet (moins les marges)
      const freeRectangles = [{
        x: panelMargin,
        y: panelMargin,
        width: materialWidth - (panelMargin * 2),
        length: materialLength - (panelMargin * 2)
      }];
      
      // Essayer de placer chaque pièce dans le panneau actuel
      let placedCount = 0;
      let pieceIndex = 0;
      let improvement = true;
      
      // Continuer tant qu'on peut améliorer le placement
      while (improvement && remainingPieces.length > pieceIndex) {
        improvement = false;
        
        // Nombre de pièces au début de l'itération
        const initialPlacedCount = placedCount;
        
        // Essayer chaque pièce restante
        while (pieceIndex < remainingPieces.length) {
          const piece = remainingPieces[pieceIndex];
          
          // Vérifier si cette instance de pièce a déjà été placée
          if (placedPieceInstanceIds.has(piece.instanceId)) {
            pieceIndex++;
            continue;
          }
          
          // Convertir les dimensions en nombres
          const pieceWidth = Number(piece.width);
          const pieceLength = Number(piece.length);
          
          // Vérifier que les dimensions sont valides
          if (!pieceWidth || !pieceLength || pieceWidth <= 0 || pieceLength <= 0) {
            console.warn(`Pièce ${piece.id} avec dimensions invalides: ${pieceWidth}×${pieceLength}`);
            pieceIndex++;
            continue;
          }
          
          // Respecter le fil du bois si nécessaire
          let canRotate = params.allowRotation;
          if (params.respectGrain && piece.hasGrain) {
            canRotate = false;
          }
          
          // Essayer de placer la pièce avec différentes heuristiques
          const placement = findBestPlacementMaxRects(piece, freeRectangles, {
            ...params,
            canRotate,
            sawWidth
          });
          
          if (placement) {
            // Déterminer les dimensions finales en fonction de la rotation
            const finalWidth = placement.rotated ? pieceLength : pieceWidth;
            const finalLength = placement.rotated ? pieceWidth : pieceLength;
            
            // Marquer cette instance de pièce comme placée
            placedPieceInstanceIds.add(piece.instanceId);
            
            // Placer la pièce
            panel.placedPieces.push({
              piece: piece,
              x: Number(placement.x),
              y: Number(placement.y),
              rotated: placement.rotated || false
            });
            
            // Ajouter aux coupes pour l'affichage
            panel.cuts.push({
              pieceId: piece.id,
              x: Number(placement.x),
              y: Number(placement.y),
              width: finalWidth,
              length: finalLength,
              rotated: placement.rotated || false
            });
            
            // Mettre à jour les rectangles libres avec l'algorithme MaxRects
            updateFreeRectanglesMaxRects(freeRectangles, placement, sawWidth);
            
            // Générer les traits de scie
            generateSawLines(panel, placement, finalWidth, finalLength, materialWidth, materialLength);
            
            placedCount++;
            
            // Retirer la pièce placée des pièces restantes
            remainingPieces.splice(pieceIndex, 1);
            
            // On a réussi à placer une pièce, donc on a amélioré le placement
            improvement = true;
          } else {
            // Si on ne peut pas placer cette pièce, on passe à la suivante
            pieceIndex++;
          }
        }
        
        // Si on a placé de nouvelles pièces, réinitialiser l'index pour réessayer avec toutes les pièces restantes
        if (placedCount > initialPlacedCount) {
          pieceIndex = 0;
        }
        
        // Optimiser les rectangles libres pour fusionner les espaces adjacents
        optimizeFreeRectanglesMaxRects(freeRectangles);
      }
      
      // Si aucune pièce n'a pu être placée sur ce panneau, on arrête
      if (placedCount === 0) {
        console.warn("Aucune pièce n'a pu être placée sur le panneau, arrêt de l'optimisation");
        break;
      }
      
      // Identifier les chutes réutilisables
      panel.reusableOffcuts = identifyReusableOffcutsMaxRects(freeRectangles, minReuseSize);
      
      // Calculer l'efficacité du panneau
      const totalArea = materialWidth * materialLength;
      let usedArea = 0;
      
      for (const placed of panel.placedPieces) {
        const pieceWidth = Number(placed.rotated ? placed.piece.length : placed.piece.width);
        const pieceLength = Number(placed.rotated ? placed.piece.width : placed.piece.length);
        usedArea += pieceWidth * pieceLength;
      }
      
      panel.efficiency = Math.min(100, (usedArea / totalArea) * 100);
      
      console.log(`Panneau optimisé: ${placedCount} pièces placées, efficacité: ${panel.efficiency.toFixed(2)}%`);
      
      // Ajouter le panneau au résultat
      panels.push(panel);
      panelCount++;
    }
    
    // Calculer les statistiques
    let totalMaterialArea = 0;
    let totalPiecesArea = 0;
    let totalReusableOffcuts = [];
    let totalSawLength = 0;
    
    for (const panel of panels) {
      totalMaterialArea += materialWidth * materialLength;
      
      // Calculer l'aire totale des pièces placées
      for (const placed of panel.placedPieces) {
        const pieceWidth = Number(placed.rotated ? placed.piece.length : placed.piece.width);
        const pieceLength = Number(placed.rotated ? placed.piece.width : placed.piece.length);
        totalPiecesArea += pieceWidth * pieceLength;
      }
      
      // Ajouter les chutes réutilisables
      if (panel.reusableOffcuts) {
        totalReusableOffcuts = [...totalReusableOffcuts, ...panel.reusableOffcuts];
      }
      
      // Ajouter la longueur de découpe
      if (panel.sawLines) {
        for (const line of panel.sawLines) {
          if (line.type === 'horizontal') {
            totalSawLength += materialWidth;
          } else if (line.type === 'vertical') {
            totalSawLength += materialLength;
          }
        }
      }
    }
    
    // Calculer l'aire de déchets
    const totalWasteArea = totalMaterialArea - totalPiecesArea;
    
    // Calculer le coût des matériaux
    const materialPrice = Number(material.pricePerSquareMeter) || 0;
    const totalMaterialCost = (totalMaterialArea / 1000000) * materialPrice;
    
    // Préparer le résultat
    return {
      panels,
      statistics: {
        materialCost: totalMaterialCost,
        materialArea: totalMaterialArea,
        piecesArea: totalPiecesArea,
        wasteArea: totalWasteArea,
        reusableOffcuts: totalReusableOffcuts,
        panelCount: panels.length,
        sawLength: totalSawLength,
        efficiency: Math.min(100, (totalPiecesArea / totalMaterialArea) * 100)
      }
    };
  } catch (error) {
    console.error("Erreur dans maxRectsOptimization:", error);
    return {
      panels: [],
      statistics: {
        materialCost: 0,
        materialArea: 0,
        piecesArea: 0,
        wasteArea: 0,
        reusableOffcuts: [],
        panelCount: 0,
        sawLength: 0,
        efficiency: 0
      }
    };
  }
}


/**
 * Génère les traits de scie pour une pièce placée
 * @param {Object} panel Panneau contenant la pièce
 * @param {Object} placement Placement de la pièce
 * @param {Number} width Largeur de la pièce
 * @param {Number} length Longueur de la pièce
 * @param {Number} materialWidth Largeur du matériau
 * @param {Number} materialLength Longueur du matériau
 */
function generateSawLines(panel, placement, width, length, materialWidth, materialLength) {
  // Trait horizontal supérieur
  panel.sawLines.push({
    type: 'horizontal',
    position: Number(placement.y),
    length: materialWidth
  });
  
  // Trait horizontal inférieur
  panel.sawLines.push({
    type: 'horizontal',
    position: Number(placement.y) + length + Number(placement.sawWidth || 0),
    length: materialWidth
  });
  
  // Trait vertical gauche
  panel.sawLines.push({
    type: 'vertical',
    position: Number(placement.x),
    length: materialLength
  });
  
  // Trait vertical droit
  panel.sawLines.push({
    type: 'vertical',
    position: Number(placement.x) + width + Number(placement.sawWidth || 0),
    length: materialLength
  });
}

/**
 * Trouve le meilleur emplacement pour une pièce avec l'algorithme MaxRects
 * @param {Object} piece Pièce à placer
 * @param {Array} freeRectangles Liste des rectangles libres
 * @param {Object} params Paramètres d'optimisation
 * @returns {Object|null} Meilleur emplacement trouvé ou null si aucun n'est possible
 */
function findBestPlacementMaxRects(piece, freeRectangles, params) {
  // Convertir en nombres pour éviter les erreurs
  const pieceWidth = Number(piece.width);
  const pieceLength = Number(piece.length);
  const sawWidth = Number(params.sawWidth) || 3.2;
  
  // On va tester différentes heuristiques et garder la meilleure
  const placements = [];
  
  // Heuristique 1: Best Short Side Fit (BSSF)
  let bssfScore = Infinity;
  let bssfPlacement = null;
  
  // Heuristique 2: Best Long Side Fit (BLSF)
  let blsfScore = Infinity;
  let blsfPlacement = null;
  
  // Heuristique 3: Best Area Fit (BAF)
  let bafScore = Infinity;
  let bafPlacement = null;
  
  // Heuristique 4: Bottom-Left (BL)
  let blScore = Infinity;
  let blPlacement = null;
  
  // Essayer chaque rectangle libre
  for (let i = 0; i < freeRectangles.length; i++) {
    const rect = freeRectangles[i];
    
    // Convertir les dimensions en nombres
    const rectX = Number(rect.x);
    const rectY = Number(rect.y);
    const rectWidth = Number(rect.width);
    const rectLength = Number(rect.length);
    
    // Vérifier si la pièce peut tenir dans ce rectangle (en tenant compte du trait de scie)
    const effectiveRectWidth = rectWidth - sawWidth;
    const effectiveRectLength = rectLength - sawWidth;
    
    // Essayer sans rotation
    if (pieceWidth <= effectiveRectWidth && pieceLength <= effectiveRectLength) {
      // Calcul des scores pour différentes heuristiques
      
      // 1. BSSF - diff entre le côté le plus court du reste et le côté correspondant de la pièce
      const shortSideFit = Math.min(
        effectiveRectWidth - pieceWidth,
        effectiveRectLength - pieceLength
      );
      
      // 2. BLSF - diff entre le côté le plus long du reste et le côté correspondant de la pièce
      const longSideFit = Math.max(
        effectiveRectWidth - pieceWidth,
        effectiveRectLength - pieceLength
      );
      
      // 3. BAF - aire du rectangle - aire de la pièce
      const areaFit = rectWidth * rectLength - pieceWidth * pieceLength;
      
      // 4. BL - distance au coin inférieur gauche
      const blFit = rectY + rectX;
      
      // Mettre à jour les meilleurs scores
      if (shortSideFit < bssfScore) {
        bssfScore = shortSideFit;
        bssfPlacement = {
          x: rectX,
          y: rectY,
          width: pieceWidth,
          length: pieceLength,
          rotated: false,
          sawWidth: sawWidth
        };
      }
      
      if (longSideFit < blsfScore) {
        blsfScore = longSideFit;
        blsfPlacement = {
          x: rectX,
          y: rectY,
          width: pieceWidth,
          length: pieceLength,
          rotated: false,
          sawWidth: sawWidth
        };
      }
      
      if (areaFit < bafScore) {
        bafScore = areaFit;
        bafPlacement = {
          x: rectX,
          y: rectY,
          width: pieceWidth,
          length: pieceLength,
          rotated: false,
          sawWidth: sawWidth
        };
      }
      
      if (blFit < blScore) {
        blScore = blFit;
        blPlacement = {
          x: rectX,
          y: rectY,
          width: pieceWidth,
          length: pieceLength,
          rotated: false,
          sawWidth: sawWidth
        };
      }
    }
    
    // Essayer avec rotation si autorisé
    if (params.canRotate && pieceLength <= effectiveRectWidth && pieceWidth <= effectiveRectLength) {
      // Calcul des scores pour différentes heuristiques avec rotation
      
      // 1. BSSF
      const shortSideFitRotated = Math.min(
        effectiveRectWidth - pieceLength,
        effectiveRectLength - pieceWidth
      );
      
      // 2. BLSF
      const longSideFitRotated = Math.max(
        effectiveRectWidth - pieceLength,
        effectiveRectLength - pieceWidth
      );
      
      // 3. BAF
      const areaFitRotated = rectWidth * rectLength - pieceLength * pieceWidth;
      
      // 4. BL
      const blFitRotated = rectY + rectX;
      
      // Mettre à jour les meilleurs scores
      if (shortSideFitRotated < bssfScore) {
        bssfScore = shortSideFitRotated;
        bssfPlacement = {
          x: rectX,
          y: rectY,
          width: pieceLength,
          length: pieceWidth,
          rotated: true,
          sawWidth: sawWidth
        };
      }
      
      if (longSideFitRotated < blsfScore) {
        blsfScore = longSideFitRotated;
        blsfPlacement = {
          x: rectX,
          y: rectY,
          width: pieceLength,
          length: pieceWidth,
          rotated: true,
          sawWidth: sawWidth
        };
      }
      
      if (areaFitRotated < bafScore) {
        bafScore = areaFitRotated;
        bafPlacement = {
          x: rectX,
          y: rectY,
          width: pieceLength,
          length: pieceWidth,
          rotated: true,
          sawWidth: sawWidth
        };
      }
      
      if (blFitRotated < blScore) {
        blScore = blFitRotated;
        blPlacement = {
          x: rectX,
          y: rectY,
          width: pieceLength,
          length: pieceWidth,
          rotated: true,
          sawWidth: sawWidth
        };
      }
    }
  }
  
  // Ajouter tous les placements valides à la liste
  if (bssfPlacement) placements.push({ ...bssfPlacement, heuristic: 'bssf', score: bssfScore });
  if (blsfPlacement) placements.push({ ...blsfPlacement, heuristic: 'blsf', score: blsfScore });
  if (bafPlacement) placements.push({ ...bafPlacement, heuristic: 'baf', score: bafScore });
  if (blPlacement) placements.push({ ...blPlacement, heuristic: 'bl', score: blScore });
  
  // Si aucun placement n'est possible
  if (placements.length === 0) {
    return null;
  }
  
  // Stratégie de sélection basée sur les paramètres
  if (params.wasteStrategy === 'reusable') {
    // Privilégier les placements qui laissent de grandes chutes
    placements.sort((a, b) => {
      // En cas d'égalité, départager par score
      if (Math.abs(a.score - b.score) < 0.001) {
        return a.score - b.score;
      }
      
      // BLSF est meilleur pour créer de grandes chutes réutilisables
      const heuristicRank = { 'blsf': 0, 'bssf': 1, 'baf': 2, 'bl': 3 };
      return heuristicRank[a.heuristic] - heuristicRank[b.heuristic];
    });
  } else {
    // Stratégie par défaut: minimiser les chutes
    placements.sort((a, b) => {
      // En cas d'égalité, départager par score
      if (Math.abs(a.score - b.score) < 0.001) {
        return a.score - b.score;
      }
      
      // BAF est meilleur pour minimiser les chutes
      const heuristicRank = { 'baf': 0, 'bssf': 1, 'blsf': 2, 'bl': 3 };
      return heuristicRank[a.heuristic] - heuristicRank[b.heuristic];
    });
  }
  
  // Retourner le meilleur placement selon la stratégie choisie
  return {
    x: placements[0].x,
    y: placements[0].y,
    width: placements[0].width,
    length: placements[0].length,
    rotated: placements[0].rotated,
    sawWidth: placements[0].sawWidth
  };
}

/**
 * Met à jour les rectangles libres après placement d'une pièce avec l'algorithme MaxRects
 * @param {Array} freeRectangles Liste des rectangles libres à mettre à jour
 * @param {Object} placement Emplacement de la pièce placée
 * @param {Number} sawWidth Largeur de la scie
 */
function updateFreeRectanglesMaxRects(freeRectangles, placement, sawWidth) {
  try {
    // Convertir toutes les valeurs en nombres
    const placeX = Number(placement.x);
    const placeY = Number(placement.y);
    const placeWidth = Number(placement.width);
    const placeLength = Number(placement.length);
    const sawWidthNum = Number(sawWidth);
    
    // L'algorithme MaxRects fonctionne en divisant chaque rectangle libre
    // qui chevauche la pièce placée en 4 nouveaux rectangles libres maximum
    
    // La zone occupée inclut la pièce + le trait de scie
    const occupiedX = placeX;
    const occupiedY = placeY;
    const occupiedWidth = placeWidth + sawWidthNum;
    const occupiedLength = placeLength + sawWidthNum;
    
    // Nouveaux rectangles libres à ajouter
    const newFreeRectangles = [];
    
    // Pour chaque rectangle libre existant
    for (let i = freeRectangles.length - 1; i >= 0; i--) {
      const rect = freeRectangles[i];
      
      // Convertir les dimensions du rectangle en nombres
      const rectX = Number(rect.x);
      const rectY = Number(rect.y);
      const rectWidth = Number(rect.width);
      const rectLength = Number(rect.length);
      
      // Vérifier si ce rectangle chevauche la zone occupée
      if (rectX < occupiedX + occupiedWidth && rectX + rectWidth > occupiedX &&
          rectY < occupiedY + occupiedLength && rectY + rectLength > occupiedY) {
        
        // Supprimer ce rectangle car il chevauche la pièce
        freeRectangles.splice(i, 1);
        
        // Générer jusqu'à 4 nouveaux rectangles libres autour de la pièce
        
        // 1. Rectangle à gauche de la pièce
        if (rectX < occupiedX) {
          newFreeRectangles.push({
            x: rectX,
            y: rectY,
            width: occupiedX - rectX,
            length: rectLength
          });
        }
        
        // 2. Rectangle à droite de la pièce
        if (rectX + rectWidth > occupiedX + occupiedWidth) {
          newFreeRectangles.push({
            x: occupiedX + occupiedWidth,
            y: rectY,
            width: (rectX + rectWidth) - (occupiedX + occupiedWidth),
            length: rectLength
          });
        }
        
        // 3. Rectangle au-dessus de la pièce
        if (rectY < occupiedY) {
          newFreeRectangles.push({
            x: rectX,
            y: rectY,
            width: rectWidth,
            length: occupiedY - rectY
          });
        }
        
        // 4. Rectangle en-dessous de la pièce
        if (rectY + rectLength > occupiedY + occupiedLength) {
          newFreeRectangles.push({
            x: rectX,
            y: occupiedY + occupiedLength,
            width: rectWidth,
            length: (rectY + rectLength) - (occupiedY + occupiedLength)
          });
        }
      }
    }
    
    // Ajouter les nouveaux rectangles à la liste
    freeRectangles.push(...newFreeRectangles);
    
    // Filtrer les rectangles trop petits ou invalides
    for (let i = freeRectangles.length - 1; i >= 0; i--) {
      const r = freeRectangles[i];
      if (Number(r.width) <= 0 || Number(r.length) <= 0) {
        freeRectangles.splice(i, 1);
      }
    }
    
    // Optimiser la liste des rectangles libres
    optimizeFreeRectanglesMaxRects(freeRectangles);
  } catch (error) {
    console.error("Erreur dans updateFreeRectanglesMaxRects:", error);
  }
}

/**
 * Optimise la liste des rectangles libres pour l'algorithme MaxRects
 * @param {Array} freeRectangles Liste des rectangles libres à optimiser
 */
function optimizeFreeRectanglesMaxRects(freeRectangles) {
  // MaxRects utilise une procédure spéciale pour éliminer les rectangles contenus dans d'autres
  
  // Éliminer les rectangles complètement inclus dans d'autres (redondants)
  for (let i = freeRectangles.length - 1; i >= 0; i--) {
    const r1 = freeRectangles[i];
    
    let isContained = false;
    for (let j = 0; j < freeRectangles.length; j++) {
      if (i === j) continue;
      
      const r2 = freeRectangles[j];
      
      // Vérifier si r1 est contenu dans r2
      if (
        Number(r1.x) >= Number(r2.x) &&
        Number(r1.y) >= Number(r2.y) &&
        Number(r1.x) + Number(r1.width) <= Number(r2.x) + Number(r2.width) &&
        Number(r1.y) + Number(r1.length) <= Number(r2.y) + Number(r2.length)
      ) {
        isContained = true;
        break;
      }
    }
    
    if (isContained) {
      freeRectangles.splice(i, 1);
    }
  }
  
  // Fusionner les rectangles adjacents quand possible
  for (let i = 0; i < freeRectangles.length; i++) {
    for (let j = i + 1; j < freeRectangles.length; j++) {
      const a = freeRectangles[i];
      const b = freeRectangles[j];
      
      // Convertir en nombres
      const aX = Number(a.x);
      const aY = Number(a.y);
      const aWidth = Number(a.width);
      const aLength = Number(a.length);
      const bX = Number(b.x);
      const bY = Number(b.y);
      const bWidth = Number(b.width);
      const bLength = Number(b.length);
      
      // Vérifier si les rectangles peuvent être fusionnés horizontalement
      if (aY === bY && aLength === bLength && aX + aWidth === bX) {
        a.width = aWidth + bWidth;
        freeRectangles.splice(j, 1);
        j--;
        continue;
      } else if (bY === aY && bLength === aLength && bX + bWidth === aX) {
        a.x = bX;
        a.width = aWidth + bWidth;
        freeRectangles.splice(j, 1);
        j--;
        continue;
      }
      
      // Vérifier si les rectangles peuvent être fusionnés verticalement
      if (aX === bX && aWidth === bWidth && aY + aLength === bY) {
        a.length = aLength + bLength;
        freeRectangles.splice(j, 1);
        j--;
        continue;
      } else if (bX === aX && bWidth === aWidth && bY + bLength === aY) {
        a.y = bY;
        a.length = aLength + bLength;
        freeRectangles.splice(j, 1);
        j--;
        continue;
      }
    }
  }
}

/**
 * Identifie les chutes réutilisables parmi les rectangles libres
 * @param {Array} freeRectangles Liste des rectangles libres
 * @param {Number} minSize Taille minimale pour qu'une chute soit réutilisable
 * @returns {Array} Liste des chutes réutilisables
 */
function identifyReusableOffcutsMaxRects(freeRectangles, minSize) {
  try {
    // Filtrer les rectangles pour ne garder que ceux qui sont assez grands
    const reusableOffcuts = freeRectangles.filter(rect => {
      if (!rect || typeof rect.width !== 'number' || typeof rect.length !== 'number') {
        return false;
      }
      return rect.width >= minSize && rect.length >= minSize;
    }).map(rect => ({
      x: Number(rect.x),
      y: Number(rect.y),
      width: Number(rect.width),
      length: Number(rect.length)
    }));
    
    // Trier les chutes par taille (plus grandes d'abord)
    reusableOffcuts.sort((a, b) => {
      const areaA = a.width * a.length;
      const areaB = b.width * b.length;
      return areaB - areaA;
    });
    
    return reusableOffcuts;
  } catch (error) {
    console.error("Erreur dans identifyReusableOffcutsMaxRects:", error);
    return [];
  }
}

/**
 * Enlève les pièces superposées d'un panneau
 * @param {Object} panel Le panneau à nettoyer
 */
function removeOverlappingPieces(panel) {
  if (!panel.cuts || !Array.isArray(panel.cuts) || panel.cuts.length < 2) {
    return; // Rien à nettoyer
  }
  
  // Tableau pour suivre les pièces à conserver
  const validCuts = [];
  const validPlacedPieces = [];
  
  // Tableau pour suivre les positions occupées
  const occupiedRegions = [];
  
  // Vérifier chaque coupe
  for (let i = 0; i < panel.cuts.length; i++) {
    const cut = panel.cuts[i];
    const x = Number(cut.x);
    const y = Number(cut.y);
    const width = Number(cut.width);
    const length = Number(cut.length);
    
    // Vérifier si cette coupe chevauche une coupe déjà validée
    let hasOverlap = false;
    
    for (const region of occupiedRegions) {
      if (
        x < region.x + region.width && 
        x + width > region.x && 
        y < region.y + region.length && 
        y + length > region.y
      ) {
        hasOverlap = true;
        break;
      }
    }
    
    // Si pas de chevauchement, on garde cette coupe
    if (!hasOverlap) {
      validCuts.push(cut);
      
      // Si on a également les placedPieces, on synchronise
      if (panel.placedPieces && i < panel.placedPieces.length) {
        validPlacedPieces.push(panel.placedPieces[i]);
      }
      
      // Ajouter cette région aux régions occupées
      occupiedRegions.push({ x, y, width, length });
    }
  }
  
  // Mettre à jour le panneau avec les coupes valides
  panel.cuts = validCuts;
  
  // Mettre à jour les placedPieces si elles existent
  if (panel.placedPieces && Array.isArray(panel.placedPieces)) {
    panel.placedPieces = validPlacedPieces;
  }
}

/**
 * Formate le résultat de l'optimisation pour l'affichage et l'export
 * @param {Object} optimizationResult Résultat brut de l'optimisation
 * @param {Array} pieces Liste des pièces originales
 * @param {Array} materials Liste des matériaux
 * @returns {Object} Résultat formaté
 */
export function formatOptimizationResult(optimizationResult, pieces, materials) {
  try {
    // Vérifier que le résultat est valide
    if (!optimizationResult || !optimizationResult.panels) {
      console.warn("Résultat d'optimisation invalide");
      return {
        panels: [],
        globalEfficiency: 0,
        totalPieces: 0,
        unplacedPieces: []
      };
    }
    
    // Formater les panneaux
    const formattedPanels = optimizationResult.panels.map(panel => {
      // Récupérer le matériau
      const material = materials.find(m => m.id === panel.materialId);
      
      // Formater les pièces placées
      const cuts = [];
      if (panel.placedPieces && Array.isArray(panel.placedPieces)) {
        for (const placed of panel.placedPieces) {
          if (!placed.piece) continue;
          
          const pieceWidth = Number(placed.rotated ? placed.piece.length : placed.piece.width);
          const pieceLength = Number(placed.rotated ? placed.piece.width : placed.piece.length);
          
          cuts.push({
            pieceId: placed.piece.id,
            x: Number(placed.x),
            y: Number(placed.y),
            width: pieceWidth,
            length: pieceLength,
            rotated: !!placed.rotated
          });
        }
      } else if (panel.cuts && Array.isArray(panel.cuts)) {
        // Si panel.cuts existe déjà, l'utiliser directement
        cuts.push(...panel.cuts);
      }
      
      // Formater les traits de scie
      const sawLines = [];
      if (panel.sawLines && Array.isArray(panel.sawLines)) {
        for (const line of panel.sawLines) {
          sawLines.push({
            type: line.type,
            position: Number(line.position),
            length: Number(line.length)
          });
        }
      }
      
      // Formater les chutes réutilisables
      const reusableWaste = [];
      if (panel.reusableOffcuts && Array.isArray(panel.reusableOffcuts)) {
        for (const offcut of panel.reusableOffcuts) {
          reusableWaste.push({
            x: Number(offcut.x),
            y: Number(offcut.y),
            width: Number(offcut.width),
            length: Number(offcut.length)
          });
        }
      } else if (panel.reusableWaste && Array.isArray(panel.reusableWaste)) {
        reusableWaste.push(...panel.reusableWaste);
      }
      
      return {
        id: panel.id || `panel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        materialId: panel.materialId,
        width: Number(panel.width),
        length: Number(panel.length),
        description: material ? material.description : '',
        cuts,
        sawLines,
        reusableWaste,
        efficiency: Math.min(100, Number(panel.efficiency) || 0) / 100,
        waste: Math.max(0, 100 - (Number(panel.efficiency) || 0)) / 100
      };
    });
    
    // Identifier les pièces non placées
    const placedPieceIds = new Set();
    for (const panel of formattedPanels) {
      for (const cut of panel.cuts) {
        placedPieceIds.add(cut.pieceId);
      }
    }
    
    const unplacedPieces = [];
    for (const piece of pieces) {
      const quantity = Number(piece.quantity) || 1;
      
      // Compter combien de fois cette pièce a été placée
      let placedCount = 0;
      for (const panel of formattedPanels) {
        for (const cut of panel.cuts) {
          if (cut.pieceId === piece.id) {
            placedCount++;
          }
        }
      }
      
      // Ajouter les pièces non placées
      for (let i = 0; i < (quantity - placedCount); i++) {
        unplacedPieces.push(piece.id);
      }
    }
    
    // Calculer l'efficacité globale
    const globalEfficiency = Number(optimizationResult.statistics?.efficiency) || 0;
    
    // Compter le nombre total de pièces
    const totalPieces = formattedPanels.reduce((total, panel) => total + panel.cuts.length, 0);
    
    return {
      panels: formattedPanels,
      globalEfficiency: globalEfficiency / 100,
      totalPieces,
      unplacedPieces
    };
  } catch (error) {
    console.error("Erreur dans formatOptimizationResult:", error);
    return {
      panels: [],
      globalEfficiency: 0,
      totalPieces: 0,
      unplacedPieces: []
    };
  }
}

/**
 * Sauvegarde le résultat dans Firestore et le fichier PDF dans Storage
 * @param {Object} result Résultat de l'optimisation
 * @param {Object} projectData Données du projet
 * @returns {String} ID du document créé
 */
export async function saveOptimizationResult(result, projectData) {
  try {
    // Préparer les données à sauvegarder
    const optimizationData = {
      projectId: projectData.id,
      projectName: projectData.name,
      createdAt: serverTimestamp(),
      globalEfficiency: result.globalEfficiency,
      totalPanels: result.panels.length,
      totalPieces: result.totalPieces,
      unplacedPieces: result.unplacedPieces.length,
      result: result
    };
    
    // Créer le document dans Firestore
    const docRef = await addDoc(collection(db, "cutting_plans"), optimizationData);
    console.log("Optimisation sauvegardée avec ID:", docRef.id);
    
    // Générer le PDF
    const pdfBlob = await exportToPdf(result, projectData);
    
    // Sauvegarder le PDF dans Storage
    const pdfRef = ref(storage, `cutting_plans/${docRef.id}.pdf`);
    await uploadString(pdfRef, pdfBlob, 'data_url');
    console.log("PDF sauvegardé dans Storage");
    
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du résultat:", error);
    throw error;
  }
}
// Dans la fonction exportToPdf, avant la conversion en PDF

// Fonction pour préparer le SVG pour l'export PDF
function prepareSvgForPdf(svgElement) {
  // 1. Trouver tous les rectangles représentant des traits de scie
  const sawRects = svgElement.querySelectorAll('rect[fill="red"]');
  
  // 2. Pour chaque trait de scie, s'assurer qu'il a une opacité de 1
  sawRects.forEach(rect => {
    rect.setAttribute('opacity', '1');
    // Optionnel: réduire légèrement la taille pour éviter les chevauchements visuels
    const width = parseFloat(rect.getAttribute('width'));
    const height = parseFloat(rect.getAttribute('height'));
    
    if (width > height && height <= 3) { // Ligne horizontale
      rect.setAttribute('height', Math.min(height, 2.5));
      rect.setAttribute('y', parseFloat(rect.getAttribute('y')) + 0.25);
    } else if (height > width && width <= 3) { // Ligne verticale
      rect.setAttribute('width', Math.min(width, 2.5));
      rect.setAttribute('x', parseFloat(rect.getAttribute('x')) + 0.25);
    }
  });
  
  return svgElement;
}

// Utiliser cette fonction avant de générer le PDF
const svgElements = document.querySelectorAll('svg');
svgElements.forEach(svg => {
  prepareSvgForPdf(svg);
});

/**
 * Exporte le résultat au format CSV
 * @param {Object} result Résultat de l'optimisation
 * @param {Array} pieces Liste des pièces originales
 * @returns {String} Contenu CSV
 */
export function exportToCsv(result, pieces) {
  try {
    // En-têtes CSV
    let csv = "Panneau;Matériau;Pièce;Description;Position X;Position Y;Largeur;Longueur;Rotation\n";
    
    // Données de chaque pièce placée
    for (let panelIndex = 0; panelIndex < result.panels.length; panelIndex++) {
      const panel = result.panels[panelIndex];
      
      for (let cutIndex = 0; cutIndex < panel.cuts.length; cutIndex++) {
        const cut = panel.cuts[cutIndex];
        const piece = pieces.find(p => p.id === cut.pieceId);
        
        if (!piece) continue;
        
        // Ajouter une ligne au CSV
        csv += `${panelIndex + 1};`;
        csv += `${panel.description || 'Panneau ' + (panelIndex + 1)};`;
        csv += `${cutIndex + 1};`;
        csv += `${piece.description || 'Pièce ' + (cutIndex + 1)};`;
        csv += `${Number(cut.x).toFixed(1)};`;
        csv += `${Number(cut.y).toFixed(1)};`;
        csv += `${Number(cut.width).toFixed(1)};`;
        csv += `${Number(cut.length).toFixed(1)};`;
        csv += `${cut.rotated ? 'Oui' : 'Non'}\n`;
      }
    }
    
    // Ajouter les pièces non placées
    if (result.unplacedPieces && result.unplacedPieces.length > 0) {
      csv += "\nPièces non placées:\n";
      csv += "Pièce;Description;Largeur;Longueur\n";
      
      const unplacedPiecesMap = new Map();
      for (const pieceId of result.unplacedPieces) {
        unplacedPiecesMap.set(pieceId, (unplacedPiecesMap.get(pieceId) || 0) + 1);
      }
      
      for (const [pieceId, count] of unplacedPiecesMap.entries()) {
        const piece = pieces.find(p => p.id === pieceId);
        if (!piece) continue;
        
        csv += `${pieceId};`;
        csv += `${piece.description || 'Sans description'} (${count}x);`;
        csv += `${Number(piece.width).toFixed(1)};`;
        csv += `${Number(piece.length).toFixed(1)}\n`;
      }
    }
    
    // Créer un objet Blob et un lien de téléchargement
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `plan_decoupe_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return csv;
  } catch (error) {
    console.error("Erreur lors de l'export CSV:", error);
    return "Erreur lors de la génération du CSV";
  }
}

/**
 * Exporte le résultat au format PDF
 * @param {Object} result Résultat de l'optimisation
 * @param {Object} projectData Données du projet
 * @returns {String} Contenu PDF en base64
 */
export function exportToPdf(result, projectData = {}) {
  try {
    // Limiter le nombre de panneaux pour éviter les problèmes de performance
    const MAX_PANELS_IN_PDF = 50;
    const limitedPanels = result.panels.slice(0, MAX_PANELS_IN_PDF);
    
    // Créer un nouveau document PDF au format A4 paysage
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Définir les dimensions de la page
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    
    // Ajouter les informations du projet
    doc.setFontSize(18);
    doc.text("Plan de découpe", margin, margin + 10);
    
    doc.setFontSize(12);
    doc.text(`Projet: ${projectData.name || 'Sans nom'}`, margin, margin + 20);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, margin + 27);
    doc.text(`Efficacité globale: ${(result.globalEfficiency * 100).toFixed(2)}%`, margin, margin + 34);
    doc.text(`Nombre de panneaux: ${result.panels.length}`, margin, margin + 41);
    
    // Pour chaque panneau
    for (let panelIndex = 0; panelIndex < limitedPanels.length; panelIndex++) {
      // Ajouter une nouvelle page pour chaque panneau sauf le premier
      if (panelIndex > 0) {
        doc.addPage();
      }
      
      const panel = limitedPanels[panelIndex];
      
      // Titre du panneau
      doc.setFontSize(14);
      doc.text(`Panneau ${panelIndex + 1} - ${panel.description || ''}`, margin, margin + 55);
      
      // Informations du panneau
      doc.setFontSize(10);
      doc.text(`Dimensions: ${panel.width}×${panel.length}mm`, margin, margin + 62);
      doc.text(`Efficacité: ${(panel.efficiency * 100).toFixed(2)}%`, margin, margin + 67);
      doc.text(`Nombre de pièces: ${panel.cuts.length}`, margin, margin + 72);
      
      // Calculer l'échelle pour que le panneau tienne dans la page
      const maxWidth = pageWidth - (margin * 2);
      const maxHeight = pageHeight - (margin * 2) - 80;
      const scaleX = maxWidth / panel.width;
      const scaleY = maxHeight / panel.length;
      const scale = Math.min(scaleX, scaleY, 1); // Ne pas agrandir si le panneau est petit
      
      // Position du panneau sur la page
      const drawX = margin;
      const drawY = margin + 80;
      
      // Dessiner le contour du panneau
      doc.setDrawColor(0);
      doc.setFillColor(255, 255, 255);
      doc.rect(drawX, drawY, panel.width * scale, panel.length * scale, 'FD');
      
      try {
        // Dessiner les pièces
        for (let cutIndex = 0; cutIndex < panel.cuts.length; cutIndex++) {
          try {
            const cut = panel.cuts[cutIndex];
            
            // Vérifier que les coordonnées sont valides
            if (isNaN(cut.x) || isNaN(cut.y) || isNaN(cut.width) || isNaN(cut.length) ||
                cut.width <= 0 || cut.length <= 0) {
              console.warn(`Dimensions de pièce invalides pour PDF: x=${cut.x}, y=${cut.y}, width=${cut.width}, height=${cut.length}`);
              continue; // Passer à la pièce suivante
            }
            
            // Calculer la couleur en fonction de l'index
            const hue = (cutIndex * 137.5) % 360;
            const r = 150 + Math.sin(hue / 180 * Math.PI) * 50;
            const g = 150 + Math.sin((hue + 120) / 180 * Math.PI) * 50;
            const b = 150 + Math.sin((hue + 240) / 180 * Math.PI) * 50;
            
            // Dessiner le rectangle de la pièce
            doc.setFillColor(r, g, b);
            doc.setDrawColor(0);
            
            const x = drawX + (cut.x * scale);
            const y = drawY + (cut.y * scale);
            const width = cut.width * scale;
            const height = cut.length * scale;
            
            doc.rect(x, y, width, height, 'FD');
            
            // Ajouter le texte avec la description de la pièce
            doc.setTextColor(0);
            
            // Adapter la taille du texte à la taille de la pièce
            const minDimension = Math.min(width, height);
            let fontSize = Math.min(10, Math.max(6, minDimension / 5));
            doc.setFontSize(fontSize);
            
            // Position du texte centré dans la pièce
            const textX = x + (width / 2);
            const textY = y + (height / 2);
            
            // Ajouter le numéro de la pièce
            doc.text(`#${cutIndex + 1}`, textX, textY, { align: 'center' });
            
            // Ajouter les dimensions en dessous
            doc.setFontSize(fontSize * 0.8);
            doc.text(`${cut.width}×${cut.length}`, textX, textY + fontSize, { align: 'center' });
          } catch (cutError) {
            console.warn(`Erreur lors du rendu de la pièce ${cutIndex} dans le PDF:`, cutError);
          }
        }
        
       // Dessiner les traits de scie - APPROCHE COMPLÈTEMENT NOUVELLE
// Au lieu de dessiner chaque trait individuellement, nous allons créer une grille pour le panneau entier
const gridSize = 0.05; // Définir une taille de cellule en mm
const panelGridWidth = Math.ceil(panel.width * scale / gridSize);
const panelGridLength = Math.ceil(panel.length * scale / gridSize);
const sawGrid = Array(panelGridLength).fill().map(() => Array(panelGridWidth).fill(false));

// Marquer les cellules où il y a des traits de scie
if (panel.sawLines && Array.isArray(panel.sawLines)) {
  for (const line of panel.sawLines) {
    try {
      if (line.type === 'horizontal') {
        const yPos = Math.round(line.position * scale / gridSize);
        if (yPos >= 0 && yPos < panelGridLength) {
          // Marquer toute la ligne horizontale
          for (let x = 0; x < panelGridWidth; x++) {
            sawGrid[yPos][x] = true;
          }
        }
      } else if (line.type === 'vertical') {
        const xPos = Math.round(line.position * scale / gridSize);
        if (xPos >= 0 && xPos < panelGridWidth) {
          // Marquer toute la ligne verticale
          for (let y = 0; y < panelGridLength; y++) {
            sawGrid[y][xPos] = true;
          }
        }
      }
    } catch (lineError) {
      console.warn('Erreur lors du traitement d\'un trait de scie:', lineError);
    }
  }
}

// Dessiner les traits de scie avec des rectangles
doc.setFillColor(255, 100, 100); // Rouge pour les traits de scie
doc.setDrawColor(255, 0, 0);

// Fusionner les cellules horizontalement pour optimiser le rendu
for (let y = 0; y < panelGridLength; y++) {
  let startX = -1;
  let runLength = 0;
  
  for (let x = 0; x < panelGridWidth; x++) {
    if (sawGrid[y][x]) {
      if (startX === -1) {
        startX = x;
        runLength = 1;
      } else {
        runLength++;
      }
    } else if (startX !== -1) {
      // Dessiner un rectangle pour ce segment horizontal
      doc.rect(
        drawX + (startX * gridSize),
        drawY + (y * gridSize),
        runLength * gridSize,
        gridSize,
        'F' // 'F' pour remplir sans contour
      );
      startX = -1;
    }
  }
  
  // Ne pas oublier le dernier segment s'il atteint le bord droit
  if (startX !== -1) {
    doc.rect(
      drawX + (startX * gridSize),
      drawY + (y * gridSize),
      runLength * gridSize,
      gridSize,
      'F'
    );
  }
}

// Fusionner les cellules verticalement pour optimiser le rendu
// (Cette étape est optionnelle car nous avons déjà marqué toutes les cellules,
//  mais elle peut améliorer les performances en réduisant le nombre de rectangles)
for (let x = 0; x < panelGridWidth; x++) {
  let startY = -1;
  let runLength = 0;
  
  for (let y = 0; y < panelGridLength; y++) {
    if (sawGrid[y][x]) {
      if (startY === -1) {
        startY = y;
        runLength = 1;
      } else {
        runLength++;
      }
    } else if (startY !== -1) {
      // Dessiner un rectangle pour ce segment vertical
      doc.rect(
        drawX + (x * gridSize),
        drawY + (startY * gridSize),
        gridSize,
        runLength * gridSize,
        'F'
      );
      startY = -1;
    }
  }
  
  // Ne pas oublier le dernier segment s'il atteint le bord inférieur
  if (startY !== -1) {
    doc.rect(
      drawX + (x * gridSize),
      drawY + (startY * gridSize),
      gridSize,
      runLength * gridSize,
      'F'
    );
  }
}
        
        // Dessiner les chutes réutilisables
        doc.setFillColor(200, 255, 200);
        doc.setDrawColor(0, 150, 0);
        doc.setLineWidth(0.5);
        
        if (panel.reusableWaste && Array.isArray(panel.reusableWaste)) {
          for (const waste of panel.reusableWaste) {
            try {
              const x = drawX + (waste.x * scale);
              const y = drawY + (waste.y * scale);
              const width = waste.width * scale;
              const height = waste.length * scale;
              
              // Dessiner un motif hachuré pour les chutes
              doc.rect(x, y, width, height, 'FD');
              
              // Ajouter le mot "RESTE" et les dimensions
              doc.setTextColor(0, 100, 0);
              
              // Adapter la taille du texte à la taille de la chute
              const minDimension = Math.min(width, height);
              let fontSize = Math.min(10, Math.max(6, minDimension / 5));
              doc.setFontSize(fontSize);
              
              // Position du texte centré dans la chute
              const textX = x + (width / 2);
              const textY = y + (height / 2);
              
              doc.text("RESTE", textX, textY, { align: 'center' });
              doc.setFontSize(fontSize * 0.8);
              doc.text(`${waste.width}×${waste.length}`, textX, textY + fontSize, { align: 'center' });
            } catch (wasteError) {
              console.warn('Erreur lors du dessin d\'une chute:', wasteError);
            }
          }
        }
      } catch (panelError) {
        console.error(`Erreur lors du rendu du panneau ${panelIndex} dans le PDF:`, panelError);
      }
    }
    
    // Ajouter un avertissement si tous les panneaux n'ont pas été inclus
    if (result.panels.length > MAX_PANELS_IN_PDF) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(255, 0, 0);
      doc.text(
        `Attention: Seuls les ${MAX_PANELS_IN_PDF} premiers panneaux ont été inclus dans ce PDF.`,
        margin,
        margin + 20
      );
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(
        `L'optimisation complète contient ${result.panels.length} panneaux.`,
        margin,
        margin + 30
      );
    }
    
    // Télécharger le PDF
    doc.save(`plan_decoupe_${new Date().toISOString().split('T')[0]}.pdf`);
    
    // Retourner le PDF comme une chaîne base64
    return doc.output('datauristring');
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    
    // Créer un PDF d'erreur
    try {
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.setTextColor(255, 0, 0);
      doc.text("Erreur lors de la génération du PDF", 10, 20);
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Message d'erreur: ${error.message}`, 10, 30);
      return doc.output('datauristring');
    } catch (fallbackError) {
      console.error("Erreur lors de la création du PDF d'erreur:", fallbackError);
      return null;
    }
  }
}
  
  /**
   * Imprime le résultat de l'optimisation
   * @param {Object} result Résultat de l'optimisation
   * @param {Array} pieces Liste des pièces originales
   */
  export function printOptimizationResult(result, pieces = [], materials = []) {
    try {
      // Créer une fenêtre d'impression
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Le popup d'impression a été bloqué. Veuillez autoriser les popups pour ce site.");
        return;
      }
      
      // Limiter le nombre de panneaux pour éviter les problèmes de performance
      const MAX_PANELS_TO_PRINT = 30;
      const limitedPanels = result.panels.slice(0, MAX_PANELS_TO_PRINT);
      
      // Écrire le contenu HTML
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Plan de découpe</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              font-size: 16pt; /* Base font size increased */
            }
            h1 {
              font-size: 28pt; /* Larger heading */
              margin-top: 0;
            }
            h2 {
              font-size: 24pt; /* Larger subheading */
              margin-top: 0;
            }
            h3 {
              font-size: 20pt;
              margin-top: 0;
            }
            .panel {
              page-break-after: always;
              margin-bottom: 20px;
            }
            .panel-header {
              margin-bottom: 15px;
            }
            .panel-info {
              margin-bottom: 20px;
              font-size: 18pt; /* Larger info text */
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 16pt; /* Larger table text */
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px; /* More padding */
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .cut-visualization {
              width: 100%;
              height: auto;
              border: 1px solid #000;
              margin-bottom: 20px;
              background-color: #fff;
            }
            .footer {
              font-size: 14pt; /* Larger footer */
              color: #999;
              margin-top: 20px;
              text-align: center;
            }
            .warning {
              color: red;
              font-weight: bold;
              margin: 20px 0;
              font-size: 18pt; /* Larger warning */
            }
            /* Styles pour la visualisation des pièces */
            .piece {
              fill-opacity: 0.8;
              stroke: #000;
              stroke-width: 0.5;
            }
            .saw-line-horizontal {
              stroke: rgba(255, 0, 0, 0.6);
              stroke-width: 0.01;
            }
            .saw-line-vertical {
              stroke: rgba(255, 0, 0, 0.6);
              stroke-width: 0.01;
            }
            .reusable-waste {
              fill: #d4ffcc;
              stroke: #5cb85c;
              stroke-width: 0.5;
              stroke-dasharray: 2,2;
            }
            .piece-label {
              font-size: 28px; /* Much larger piece labels (doubled) */
              font-weight: bold;
              text-anchor: middle;
              dominant-baseline: middle;
            }
            .piece-dimensions {
              font-size: 24px; /* Much larger dimensions (doubled) */
              text-anchor: middle;
              dominant-baseline: middle;
            }
          </style>
        </head>
        <body>
          <h1>Plan de découpe</h1>
          <div class="panel-info">
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Efficacité globale:</strong> ${(result.globalEfficiency * 100).toFixed(2)}%</p>
            <p><strong>Nombre de panneaux:</strong> ${result.panels.length}</p>
            <p><strong>Nombre de pièces:</strong> ${result.totalPieces}</p>
          </div>
      `);
      
      // Pour chaque panneau
      for (let panelIndex = 0; panelIndex < limitedPanels.length; panelIndex++) {
        const panel = limitedPanels[panelIndex];
        
        // Trouver le matériau correspondant
        const material = materials.find(m => m.id === panel.materialId) || {};
        
        printWindow.document.write(`
          <div class="panel">
            <div class="panel-header">
              <h2>Panneau ${panelIndex + 1} - ${panel.description || material.description || ''}</h2>
              <p><strong>Dimensions:</strong> ${panel.width}×${panel.length}mm</p>
              <p><strong>Efficacité:</strong> ${(panel.efficiency * 100).toFixed(2)}%</p>
              <p><strong>Nombre de pièces:</strong> ${panel.cuts.length}</p>
            </div>
            
            <!-- Visualisation du panneau -->
            <svg class="cut-visualization" viewBox="0 0 ${panel.width} ${panel.length}" 
                 preserveAspectRatio="xMidYMid meet">
              <!-- Arrière-plan du panneau -->
              <rect x="0" y="0" width="${panel.width}" height="${panel.length}" 
                    fill="#f0f0f0" stroke="#000" stroke-width="1"/>
        `);
        
        // Dessiner les chutes réutilisables
        if (panel.reusableWaste && Array.isArray(panel.reusableWaste) && panel.reusableWaste.length > 0) {
          for (const waste of panel.reusableWaste) {
            printWindow.document.write(`
              <g class="reusable-waste">
                <rect x="${waste.x}" y="${waste.y}" width="${waste.width}" height="${waste.length}" />
                <text x="${waste.x + waste.width/2}" y="${waste.y + waste.length/2}" class="piece-label">
                  RESTE
                  <tspan x="${waste.x + waste.width/2}" y="${waste.y + waste.length/2 + 32}" class="piece-dimensions">${waste.width}×${waste.length}</tspan>
                </text>
              </g>
            `);
          }
        }
        
        // Dessiner les pièces
        const colors = ['#b3e0ff', '#ffcccc', '#ccffcc', '#ffffcc', '#e6ccff', '#ffccee', '#ccffe6'];
        
        for (let cutIndex = 0; cutIndex < panel.cuts.length; cutIndex++) {
          const cut = panel.cuts[cutIndex];
          
          // Obtenir la couleur en fonction de l'index
          const colorIndex = cutIndex % colors.length;
          const color = colors[colorIndex];
          
          // Trouver la pièce correspondante pour sa description
          const piece = pieces.find(p => p.id === cut.pieceId);
          const pieceDescription = piece ? piece.description : `Pièce #${cutIndex + 1}`;
          
          // Calculer dynamiquement la taille du texte en fonction des dimensions de la pièce
          const minDimension = Math.min(cut.width, cut.length);
          // Double the size with constraints
          const labelSize = Math.min(40, Math.max(28, minDimension / 5)); // Between 28 and 40px
          const dimensionSize = labelSize * 0.8; // Slightly smaller dimensions
          
          // Modifiez cette partie dans le code qui dessine les pièces :

printWindow.document.write(`
  <g class="piece">
    <rect x="${cut.x}" y="${cut.y}" width="${cut.width}" height="${cut.length}" 
          fill="${color}" />
    <text x="${cut.x + cut.width/2}" y="${cut.y + cut.length/2}" class="piece-label" font-size="${labelSize}px">
      ${pieceDescription}
      <tspan x="${cut.x + cut.width/2}" y="${cut.y + cut.length/2 + labelSize + 4}" class="piece-dimensions" font-size="${dimensionSize}px">${cut.width}×${cut.length}</tspan>
    </text>
  </g>
`);
        }
        /*
        // Dessiner les traits de scie (sans chevauchements)
        if (panel.sawLines && Array.isArray(panel.sawLines)) {
          // Stocker les positions uniques des traits
          const uniqueHorizontalPositions = new Set();
          const uniqueVerticalPositions = new Set();
          
          // Collecter les positions uniques avec plus de précision
          for (const line of panel.sawLines) {
            try {
              if (line.type === 'horizontal') {
                // Arrondir à 1 décimale pour éviter les doublons dus aux imprécisions numériques
                const y = Math.round(line.position * 10) / 10;
                uniqueHorizontalPositions.add(y);
              } else if (line.type === 'vertical') {
                const x = Math.round(line.position * 10) / 10;
                uniqueVerticalPositions.add(x);
              }
            } catch (lineError) {
              console.warn('Erreur lors du traitement d\'un trait de scie:', lineError);
            }
          }
          
          // Dessiner les traits horizontaux
          Array.from(uniqueHorizontalPositions).forEach(y => {
            printWindow.document.write(`
              <line 
                class="saw-line-horizontal" 
                x1="0" 
                y1="${y}" 
                x2="${panel.width}" 
                y2="${y}" 
              />
            `);
          });
          
          // Dessiner les traits verticaux
          Array.from(uniqueVerticalPositions).forEach(x => {
            printWindow.document.write(`
              <line 
                class="saw-line-vertical" 
                x1="${x}" 
                y1="0" 
                x2="${x}" 
                y2="${panel.length}" 
              />
            `);
          });
        }
        */
        // Fermer le SVG
        printWindow.document.write('</svg>');
        
        // Tableau des pièces
        printWindow.document.write(`
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Description</th>
                <th>Position X</th>
                <th>Position Y</th>
                <th>Largeur</th>
                <th>Longueur</th>
                <th>Rotation</th>
              </tr>
            </thead>
            <tbody>
        `);
        
        // Liste des pièces dans le panneau
        for (let cutIndex = 0; cutIndex < panel.cuts.length; cutIndex++) {
          try {
            const cut = panel.cuts[cutIndex];
            
            // Trouver la pièce correspondante
            const piece = pieces.find(p => p.id === cut.pieceId);
            
            printWindow.document.write(`
              <tr>
                <td>${cutIndex + 1}</td>
                <td>${piece ? piece.description : `Pièce #${cutIndex + 1}`}</td>
                <td>${Number(cut.x).toFixed(1)}</td>
                <td>${Number(cut.y).toFixed(1)}</td>
                <td>${Number(cut.width).toFixed(1)}</td>
                <td>${Number(cut.length).toFixed(1)}</td>
                <td>${cut.rotated ? 'Oui' : 'Non'}</td>
              </tr>
            `);
          } catch (cutError) {
            console.warn(`Erreur lors de l'impression de la pièce ${cutIndex}:`, cutError);
          }
        }
        
        printWindow.document.write(`
              </tbody>
            </table>
          </div>
        `);
      }
      
      // Ajouter un avertissement si tous les panneaux n'ont pas été inclus
      if (result.panels.length > MAX_PANELS_TO_PRINT) {
        printWindow.document.write(`
          <div class="warning">
            <p>Attention: Seuls les ${MAX_PANELS_TO_PRINT} premiers panneaux ont été inclus dans cette impression.</p>
            <p>L'optimisation complète contient ${result.panels.length} panneaux.</p>
          </div>
        `);
      }
      
      // Fermer le document
      printWindow.document.write(`
          <div class="footer">
            <p>Généré par OptiCoupe - Application d'optimisation de découpe de panneaux</p>
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Attendre que le contenu soit chargé puis imprimer
      printWindow.onload = function() {
        try {
          printWindow.print();
          // Fermer la fenêtre après l'impression (selon les navigateurs)
          // printWindow.close();
        } catch (printError) {
          console.error("Erreur lors de l'impression:", printError);
          alert("Une erreur est survenue lors de l'impression. Veuillez réessayer.");
        }
      };
    } catch (error) {
      console.error("Erreur lors de la préparation de l'impression:", error);
      alert("Une erreur est survenue lors de la préparation de l'impression. Veuillez réessayer.");
    }
  }