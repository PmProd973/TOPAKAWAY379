// src/components/furniture3d/FurnitureDesigner/store/utils/statisticsCalculator.js
import { furnitureUtils } from './furnitureUtils';

export function calculateFurnitureStatistics(furniture) {
  const statistics = {
    totalPanels: 0,
    totalVolume: 0, // m³
    totalWeight: 0, // kg
    totalEdgeBanding: 0, // mm
    totalCost: 0,
    materialBreakdown: []
  };
  
  // Matériau par défaut
  const defaultMaterial = furniture.material || {
    name: 'Mélaminé standard',
    color: '#D0D0D0',
    density: 680, // kg/m³
    pricePerM3: 500, // € par m³
    pricePerM2: 15 // € par m²
  };
  
  // Dimensions de base
  const width = furniture.dimensions.width;
  const height = furniture.dimensions.height;
  const depth = furniture.dimensions.depth;
  const panelThickness = furniture.construction.panelThickness;
  
  // Calculer les volumes et poids des panneaux principaux
  
  // Côtés (2)
  const sidesPanelVolume = (height * depth * panelThickness) / 1000000000 * 2; // m³
  const sidesPanelWeight = sidesPanelVolume * (defaultMaterial.density || 680); // kg
  const sidesPanelEB = ((height + depth) * 2) * 2; // mm (contour avant)
  
  // Dessus
  const topPanelVolume = (width * depth * panelThickness) / 1000000000; // m³
  const topPanelWeight = topPanelVolume * (defaultMaterial.density || 680); // kg
  const topPanelEB = width + depth * 2; // mm (bords visibles)
  
  // Fond
  const bottomPanelVolume = (width * depth * panelThickness) / 1000000000; // m³
  const bottomPanelWeight = bottomPanelVolume * (defaultMaterial.density || 680); // kg
  const bottomPanelEB = width; // mm (bord avant seulement)
  
  // Panneau arrière (si présent)
  let backPanelVolume = 0;
  let backPanelWeight = 0;
  
  if (furniture.construction.hasBackPanel) {
    const backPanelThickness = furniture.construction.backPanelThickness;
    backPanelVolume = ((width - panelThickness * 2) * (height - panelThickness * 2) * backPanelThickness) / 1000000000; // m³
    backPanelWeight = backPanelVolume * (defaultMaterial.density || 680); // kg
  }
  
  // Socle (si présent)
  let plinthVolume = 0;
  let plinthWeight = 0;
  let plinthEB = 0;
  
  if (furniture.construction.hasPlinths) {
    const plinthHeight = furniture.construction.plinthHeight;
    
    // Plinthe avant et arrière
    plinthVolume += (width * plinthHeight * panelThickness) / 1000000000 * 2; // m³
    plinthEB += width * 2; // mm (bords supérieurs)
    
    // Sides of plinth (if not extending)
    if (!furniture.construction.sidesExtendToFloor) {
      plinthVolume += ((depth - panelThickness * 2) * plinthHeight * panelThickness) / 1000000000 * 2; // m³
      plinthEB += (depth - panelThickness * 2) * 2; // mm (bords supérieurs)
    }
    
    plinthWeight = plinthVolume * (defaultMaterial.density || 680); // kg
  }
  
  // Ajouter les totaux des panneaux de base
  statistics.totalPanels += 5; // 2 côtés, dessus, fond, arrière
  statistics.totalVolume += sidesPanelVolume + topPanelVolume + bottomPanelVolume + backPanelVolume + plinthVolume;
  statistics.totalWeight += sidesPanelWeight + topPanelWeight + bottomPanelWeight + backPanelWeight + plinthWeight;
  statistics.totalEdgeBanding += sidesPanelEB + topPanelEB + bottomPanelEB + plinthEB;
  
  // Ajouter les éléments intérieurs
  
  // Séparations verticales
  if (furniture.layout.verticalSeparators && furniture.layout.verticalSeparators.length > 0) {
    const vsepCount = furniture.layout.verticalSeparators.length;
    const vsepVolume = (height * depth * panelThickness) / 1000000000 * vsepCount; // m³
    const vsepWeight = vsepVolume * (defaultMaterial.density || 680); // kg
    const vsepEB = depth * vsepCount; // mm (bord avant seulement)
    
    statistics.totalPanels += vsepCount;
    statistics.totalVolume += vsepVolume;
    statistics.totalWeight += vsepWeight;
    statistics.totalEdgeBanding += vsepEB;
  }
  
  // Étagères
  if (furniture.layout.shelves && furniture.layout.shelves.length > 0) {
    let shelfVolume = 0;
    let shelfEB = 0;
    
    furniture.layout.shelves.forEach(shelf => {
      const shelfWidth = shelf.width || (width - panelThickness * 2);
      const shelfDepth = shelf.depth || depth;
      const shelfThickness = shelf.thickness || panelThickness;
      
      shelfVolume += (shelfWidth * shelfDepth * shelfThickness) / 1000000000; // m³
      
      // Chants selon configuration
      if (shelf.edgeBanding) {
        if (shelf.edgeBanding.front) shelfEB += shelfWidth;
        if (shelf.edgeBanding.back) shelfEB += shelfWidth;
        if (shelf.edgeBanding.left) shelfEB += shelfDepth;
        if (shelf.edgeBanding.right) shelfEB += shelfDepth;
      } else {
        shelfEB += shelfWidth; // Front edge by default
      }
    });
    
    const shelfWeight = shelfVolume * (defaultMaterial.density || 680); // kg
    
    statistics.totalPanels += furniture.layout.shelves.length;
    statistics.totalVolume += shelfVolume;
    statistics.totalWeight += shelfWeight;
    statistics.totalEdgeBanding += shelfEB;
  }
  
  // Tiroirs
  if (furniture.layout.drawers && furniture.layout.drawers.length > 0) {
    let drawerVolume = 0;
    let drawerEB = 0;
    
    furniture.layout.drawers.forEach(drawer => {
      const drawerWidth = drawer.width || (width - panelThickness * 2);
      const drawerHeight = drawer.height || 150;
      const drawerDepth = drawer.depth || (depth - 50);
      const drawerThickness = drawer.thickness || panelThickness;
      
      // Face avant
      drawerVolume += (drawerWidth * drawerHeight * drawerThickness) / 1000000000; // m³
      drawerEB += (drawerWidth + drawerHeight) * 2; // mm (tous les bords)
      
      // Côtés (2)
      drawerVolume += (drawerDepth * drawerHeight * drawerThickness) / 1000000000 * 2; // m³
      drawerEB += drawerHeight * 2; // mm (bords supérieurs)
      
      // Fond
      drawerVolume += ((drawerWidth - drawerThickness * 2) * drawerDepth * drawerThickness) / 1000000000; // m³
      
      // Arrière
      drawerVolume += ((drawerWidth - drawerThickness * 2) * drawerHeight * drawerThickness) / 1000000000; // m³
      drawerEB += drawerHeight; // mm (bord supérieur)
    });
    
    const drawerWeight = drawerVolume * (defaultMaterial.density || 680); // kg
    
    statistics.totalPanels += furniture.layout.drawers.length * 5; // 5 panneaux par tiroir
    statistics.totalVolume += drawerVolume;
    statistics.totalWeight += drawerWeight;
    statistics.totalEdgeBanding += drawerEB;
  }
  
  // Portes
  if (furniture.layout.doors && furniture.layout.doors.length > 0) {
    let doorVolume = 0;
    let doorEB = 0;
    
    furniture.layout.doors.forEach(door => {
      const doorWidth = door.width || (width / 2);
      const doorHeight = door.height || height;
      const doorThickness = door.thickness || panelThickness;
      
      doorVolume += (doorWidth * doorHeight * doorThickness) / 1000000000; // m³
      
      // Chants selon configuration
      if (door.edgeBanding) {
        if (door.edgeBanding.all) {
          doorEB += (doorWidth + doorHeight) * 2;
        } else {
          if (door.edgeBanding.top) doorEB += doorWidth;
          if (door.edgeBanding.bottom) doorEB += doorWidth;
          if (door.edgeBanding.left) doorEB += doorHeight;
          if (door.edgeBanding.right) doorEB += doorHeight;
        }
      } else {
        doorEB += (doorWidth + doorHeight) * 2; // Tous les bords par défaut
      }
    });
    
    const doorWeight = doorVolume * (defaultMaterial.density || 680); // kg
    
    statistics.totalPanels += furniture.layout.doors.length;
    statistics.totalVolume += doorVolume;
    statistics.totalWeight += doorWeight;
    statistics.totalEdgeBanding += doorEB;
  }
  
  // Calculer le coût total en fonction du volume et des chants
  statistics.totalCost = 
    statistics.totalVolume * (defaultMaterial.pricePerM3 || 500) + 
    (statistics.totalEdgeBanding / 1000) * (defaultMaterial.pricePerM2 || 15);
  
  // Répartition par matériau (simplifié pour un seul matériau)
  statistics.materialBreakdown.push({
    material: defaultMaterial.name || 'Mélaminé standard',
    color: defaultMaterial.color || '#D0D0D0',
    volume: statistics.totalVolume,
    weight: statistics.totalWeight,
    cost: statistics.totalCost
  });
  
  // Arrondir les valeurs pour plus de lisibilité
  statistics.totalVolume = Math.round(statistics.totalVolume * 1000) / 1000; // 3 décimales
  statistics.totalWeight = Math.round(statistics.totalWeight * 10) / 10; // 1 décimale
  statistics.totalCost = Math.round(statistics.totalCost * 100) / 100; // 2 décimales
  
  return statistics;
}