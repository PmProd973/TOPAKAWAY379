// src/components/furniture3d/FurnitureDesigner/store/slices/roomSlice.js
export const roomSlice = (set, get) => ({
    // Actions pour la pièce
    updateRoomDimensions: (dimension, value, shouldRegenerate = true) => {
      // Si déjà en cours de mise à jour, ne pas déclencher d'autres mises à jour
      if (get().isUpdating) return;
      
      console.log(`Mise à jour de la dimension de la pièce "${dimension}" à ${value}`);
      
      // Vérifier si la dimension est imbriquée (comme 'walls.left.thickness')
      if (typeof dimension === 'string' && dimension.includes('.')) {
        // Vérifier si la valeur a réellement changé
        const props = dimension.split('.');
        let current = get().room;
        
        for (let i = 0; i < props.length - 1; i++) {
          current = current[props[i]];
        }
        
        if (current[props[props.length - 1]] === value) {
          console.log("Valeur inchangée, pas de mise à jour");
          return;
        }
        
        // Gestion des props imbriquées comme 'walls.left.thickness'
        set((state) => {
          const newState = { ...state };
          let current = newState.room;
          
          for (let i = 0; i < props.length - 1; i++) {
            current = current[props[i]];
          }
          
          current[props[props.length - 1]] = value;
          return newState;
        });
        
        console.log(`Dimension imbriquée "${dimension}" mise à jour avec succès`);
      } else {
        // Vérifier si la valeur a réellement changé
        if (get().room[dimension] === value) {
          console.log("Valeur inchangée, pas de mise à jour");
          return;
        }
        
        // Prop simple
        set((state) => ({
          room: {
            ...state.room,
            [dimension]: value
          }
        }));
        
        console.log(`Dimension "${dimension}" mise à jour avec succès`);
      }
      
      // Appeler regenerateScene seulement si demandé
      if (shouldRegenerate) {
        setTimeout(() => {
          console.log(`Régénération après mise à jour de dimension "${dimension}"`);
          get().regenerateScene();
        }, 0);
      }
      
      get().markAsDirty();
    },
    
    // Gestion de l'affichage des murs
    toggleWallVisibility: (wall, shouldRegenerate = true) => {
      console.log(`Changement de visibilité du mur: ${wall}`);
      
      set((state) => {
        // Vérifier l'état actuel
        const isCurrentlyVisible = state.room.walls[wall].visible;
        console.log(`État actuel du mur ${wall}: ${isCurrentlyVisible ? 'visible' : 'invisible'}`);
        
        return {
          room: {
            ...state.room,
            walls: {
              ...state.room.walls,
              [wall]: {
                ...state.room.walls[wall],
                visible: !isCurrentlyVisible
              }
            }
          }
        };
      });
      
      if (shouldRegenerate) {
        setTimeout(() => {
          console.log(`Régénération après changement de visibilité du mur ${wall}`);
          get().regenerateScene();
        }, 0);
      }
      
      get().markAsDirty();
    },
    
    // Mise à jour de la couleur des murs
    updateWallColor: (wall, color, shouldRegenerate = true) => {
      console.log(`Mise à jour de la couleur du mur ${wall} à ${color}`);
      
      set((state) => ({
        room: {
          ...state.room,
          walls: {
            ...state.room.walls,
            [wall]: {
              ...state.room.walls[wall],
              color: color
            }
          }
        }
      }));
      
      if (shouldRegenerate) {
        setTimeout(() => {
          console.log(`Régénération après changement de couleur du mur ${wall}`);
          get().regenerateScene();
        }, 0);
      }
      
      get().markAsDirty();
    },
    
    // Gestion de l'affichage du sol
    toggleFloorVisibility: (shouldRegenerate = true) => {
      console.log("Changement de visibilité du sol");
      
      set((state) => {
        // Vérifier l'état actuel
        const isCurrentlyVisible = state.room.floor.visible;
        console.log(`État actuel du sol: ${isCurrentlyVisible ? 'visible' : 'invisible'}`);
        
        return {
          room: {
            ...state.room,
            floor: {
              ...state.room.floor,
              visible: !isCurrentlyVisible
            }
          }
        };
      });
      
      if (shouldRegenerate) {
        setTimeout(() => {
          console.log("Régénération après changement de visibilité du sol");
          get().regenerateScene();
        }, 0);
      }
      
      get().markAsDirty();
    },
    
    // Mise à jour de la couleur du sol
    updateFloorColor: (color, shouldRegenerate = true) => {
      console.log(`Mise à jour de la couleur du sol à ${color}`);
      
      set((state) => ({
        room: {
          ...state.room,
          floor: {
            ...state.room.floor,
            color: color
          }
        }
      }));
      
      if (shouldRegenerate) {
        setTimeout(() => {
          console.log("Régénération après changement de couleur du sol");
          get().regenerateScene();
        }, 0);
      }
      
      get().markAsDirty();
    },
    
    // Gestion de l'affichage du plafond
    toggleCeilingVisibility: (shouldRegenerate = true) => {
      console.log("Changement de visibilité du plafond");
      
      set((state) => {
        // Vérifier l'état actuel
        const isCurrentlyVisible = state.room.ceiling.visible;
        console.log(`État actuel du plafond: ${isCurrentlyVisible ? 'visible' : 'invisible'}`);
        
        return {
          room: {
            ...state.room,
            ceiling: {
              ...state.room.ceiling,
              visible: !isCurrentlyVisible
            }
          }
        };
      });
      
      if (shouldRegenerate) {
        setTimeout(() => {
          console.log("Régénération après changement de visibilité du plafond");
          get().regenerateScene();
        }, 0);
      }
      
      get().markAsDirty();
    },
    
    // Gestion de l'affichage des dimensions
    toggleDimensionsVisibility: (shouldRegenerate = true) => {
      console.log("Changement de visibilité des dimensions");
      
      set((state) => {
        // Vérifier l'état actuel
        const showDimensions = state.room.showDimensions;
        console.log(`État actuel des dimensions: ${showDimensions ? 'visible' : 'invisible'}`);
        
        return {
          room: {
            ...state.room,
            showDimensions: !showDimensions
          },
          displayOptions: {
            ...state.displayOptions,
            showDimensions: !showDimensions
          }
        };
      });
      
      if (shouldRegenerate) {
        setTimeout(() => {
          console.log("Régénération après changement de visibilité des dimensions");
          get().regenerateScene();
        }, 0);
      }
    },
  });