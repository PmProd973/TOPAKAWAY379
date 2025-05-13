// src/components/furniture3d/FurnitureDesigner/store/slices/materialsSlice.js
export const materialsSlice = (set, get) => ({
    // Gestion des matériaux
    setAvailableMaterials: (materials) => {
      set({ availableMaterials: materials });
    },
    
    setAvailableEdgeBanding: (edgeBanding) => {
      set({ availableEdgeBanding: edgeBanding });
    },
    
    setAvailableHardware: (hardware) => {
      set({ availableHardware: hardware });
    },
    
    // Méthodes plus avancées pour la gestion des matériaux pourraient être ajoutées ici
    addMaterial: (material) => {
      set((state) => ({
        availableMaterials: [...state.availableMaterials, material]
      }));
    },
    
    updateMaterial: (id, updates) => {
      set((state) => ({
        availableMaterials: state.availableMaterials.map(mat => 
          mat.id === id ? { ...mat, ...updates } : mat
        )
      }));
    },
    
    removeMaterial: (id) => {
      set((state) => ({
        availableMaterials: state.availableMaterials.filter(mat => mat.id !== id)
      }));
    },
    
    // Méthodes pour l'exportation et l'importation de matériaux (pour la sauvegarde)
    exportMaterialsData: () => {
      return {
        materials: get().availableMaterials,
        edgeBanding: get().availableEdgeBanding,
        hardware: get().availableHardware
      };
    },
    
    importMaterialsData: (data) => {
      if (!data) return;
      
      set({
        availableMaterials: data.materials || [],
        availableEdgeBanding: data.edgeBanding || [],
        availableHardware: data.hardware || []
      });
    }
  });