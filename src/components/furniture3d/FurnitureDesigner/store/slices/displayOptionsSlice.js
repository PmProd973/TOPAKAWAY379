// src/components/furniture3d/FurnitureDesigner/store/slices/displayOptionsSlice.js
export const displayOptionsSlice = (set, get) => ({
    // Gestion des options d'affichage
    setDisplayOption: (option, value, shouldRegenerate = true) => {
      console.log(`Mise à jour de l'option d'affichage "${option}" à la valeur:`, value);
      
      // Vérifier si la valeur a réellement changé avec une petite tolérance pour les nombres à virgule
      const currentValue = get().displayOptions[option];
      
      if (typeof value === 'number' && typeof currentValue === 'number') {
        if (Math.abs(currentValue - value) < 0.01) {
          console.log("Valeur inchangée, pas de mise à jour");
          return;
        }
      } else if (currentValue === value) {
        console.log("Valeur inchangée, pas de mise à jour");
        return;
      }
      
      // Mise à jour de l'état avec la nouvelle valeur
      set((state) => ({
        displayOptions: {
          ...state.displayOptions,
          [option]: value
        }
      }));
      
      console.log(`Option "${option}" mise à jour avec succès`);
      
      // Liste des options qui nécessitent une régénération
      const optionsRequiringRegenerationOrRefresh = [
        'viewMode', 'showGrid', 'showAxes', 'showShadows', 
        'showWireframe', 'furnitureOpacity', 'showDimensions',
        'edgeColor', 'edgeThickness', 'showAllEdges' // Nouvelles options pour le mode conceptuel
      ];
      
      // Utiliser setTimeout pour garantir que la mise à jour de l'état soit complète
      // avant de régénérer la scène
      if (shouldRegenerate && optionsRequiringRegenerationOrRefresh.includes(option)) {
        setTimeout(() => {
          console.log(`Régénération de la scène après mise à jour de "${option}"`);
          get().regenerateScene();
        }, 0);
      }
    },
  });