// src/components/furniture3d/FurnitureDesigner/store/utils/furnitureUtils.js
// Utilitaires pour la conversion d'unités et autres fonctions communes
export const furnitureUtils = {
    // Conversion entre millimètres et unités Three.js
    mmToUnits: (mm) => mm / 100, // Échelle adaptée pour Three.js
    unitsToMm: (units) => units * 100,
    
    // Génération d'ID uniques
    generateId: () => `id_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    
    // Calcul de volume en mètres cubes
    calculateVolume: (width, height, depth) => {
      return (width * height * depth) / 1000000000; // mm³ to m³
    },
    
    // Calcul de poids en kg (densité par défaut: MDF = 680 kg/m³)
    calculateWeight: (width, height, depth, density = 680) => {
      const volume = (width * height * depth) / 1000000000; // mm³ to m³
      return volume * density;
    }
  };