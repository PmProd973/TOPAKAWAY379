// src/components/furniture3d/FurnitureDesigner/store/slices/furnitureSlice.js
export const furnitureSlice = (set, get) => ({
    // Liste des meubles et ID du meuble actif
    furnitureList: [],
    activeFurnitureId: null,
    
    // Initialiser la liste des meubles
    initializeFurnitureList: () => {
      const { furniture } = get();
      
      // Vérifier si la liste est déjà initialisée
      if (get().furnitureList && get().furnitureList.length > 0) {
        console.log("Liste des meubles déjà initialisée");
        return;
      }
      
      console.log("Initialisation de la liste des meubles");
      
      // Créer un premier meuble par défaut
      const firstFurniture = {
        id: `furniture_${Date.now()}`,
        name: "Meuble par défaut",
        type: furniture.type || "wardrobe",
        dimensions: { ...furniture.dimensions },
        position: { ...furniture.position },
        rotation: { ...furniture.rotation },
        placement: { ...furniture.placement },
        material: furniture.material,
        construction: { ...furniture.construction },
        layout: { ...furniture.layout }
      };
      
      set({ 
        furnitureList: [firstFurniture],
        activeFurnitureId: firstFurniture.id,
        furniture: firstFurniture // Synchroniser avec le meuble courant
      });
      
      console.log("Premier meuble créé avec ID:", firstFurniture.id);
    },
    
    // Ajouter un nouveau meuble
    addFurniture: (customProps = {}) => {
      console.log("Ajout d'un nouveau meuble");
      
      // Récupérer le meuble actif comme modèle de base
      const { furniture, activeFurnitureId } = get();
      const activeFurniture = get().furnitureList.find(f => f.id === activeFurnitureId) || furniture;
      
      // Créer un nouveau meuble basé sur le meuble actif
      const newFurniture = {
        id: `furniture_${Date.now()}`,
        name: "Nouveau meuble",
        type: activeFurniture.type || "wardrobe",
        dimensions: { ...activeFurniture.dimensions },
        position: { 
          x: activeFurniture.position.x + 200, // Décaler de 200mm pour éviter la superposition
          y: activeFurniture.position.y,
          z: activeFurniture.position.z + 200
        },
        rotation: { ...activeFurniture.rotation },
        placement: { ...activeFurniture.placement },
        material: activeFurniture.material,
        construction: { ...activeFurniture.construction },
        layout: {
          verticalSeparators: [],
          horizontalSeparators: [],
          shelves: [],
          drawers: [],
          hangingRods: [],
          doors: []
        },
        ...customProps // Écraser par les propriétés personnalisées si fournies
      };
      
      set(state => ({
        furnitureList: [...state.furnitureList, newFurniture],
        activeFurnitureId: newFurniture.id,
        furniture: newFurniture // Définir comme meuble actif
      }));
      
      console.log("Nouveau meuble créé avec ID:", newFurniture.id);
      
      // Régénérer la scène pour afficher le nouveau meuble
      setTimeout(() => {
        get().regenerateScene();
      }, 0);
      
      return newFurniture.id;
    },
    
    // Supprimer un meuble
    removeFurniture: (furnitureId) => {
      console.log("Suppression du meuble avec ID:", furnitureId);
      
      // Vérifier qu'il reste au moins un meuble
      if (get().furnitureList.length <= 1) {
        console.warn("Impossible de supprimer le dernier meuble");
        return;
      }
      
      set(state => {
        // Filtrer la liste pour supprimer le meuble
        const updatedList = state.furnitureList.filter(f => f.id !== furnitureId);
        
        // Déterminer le nouvel ID actif
        let newActiveId = state.activeFurnitureId;
        
        // Si on supprime le meuble actif, sélectionner le premier meuble de la liste
        if (furnitureId === state.activeFurnitureId) {
          newActiveId = updatedList[0]?.id;
          console.log("Nouveau meuble actif:", newActiveId);
        }
        
        // Trouver le nouveau meuble actif
        const newActiveFurniture = updatedList.find(f => f.id === newActiveId) || updatedList[0];
        
        return {
          furnitureList: updatedList,
          activeFurnitureId: newActiveId,
          furniture: newActiveFurniture // Mettre à jour le meuble actif
        };
      });
      
      // Régénérer la scène pour refléter les changements
      setTimeout(() => {
        get().regenerateScene();
      }, 0);
    },
    
    // Sélectionner un meuble comme actif
    selectFurniture: (furnitureId) => {
      console.log("Sélection du meuble avec ID:", furnitureId);
      
      // Trouver le meuble dans la liste
      const selectedFurniture = get().furnitureList.find(f => f.id === furnitureId);
      
      if (!selectedFurniture) {
        console.warn("Meuble non trouvé:", furnitureId);
        return;
      }
      
      // Mettre à jour le meuble actif
      set({
        activeFurnitureId: furnitureId,
        furniture: { ...selectedFurniture } // Cloner pour éviter des problèmes de référence
      });
      
      // Régénérer la scène pour mettre en évidence le meuble sélectionné
      setTimeout(() => {
        get().regenerateScene();
      }, 0);
    },
    
    // Mettre à jour un meuble
    updateFurniture: (furnitureId, updates, shouldRegenerate = true) => {
      console.log("Mise à jour du meuble:", furnitureId, updates);
      
      set(state => {
        // Mettre à jour le meuble dans la liste
        const updatedList = state.furnitureList.map(f => 
          f.id === furnitureId ? { ...f, ...updates } : f
        );
        
        // Si le meuble mis à jour est le meuble actif, mettre également à jour furniture
        const updatedFurniture = furnitureId === state.activeFurnitureId 
          ? { ...state.furniture, ...updates }
          : state.furniture;
        
        return {
          furnitureList: updatedList,
          furniture: updatedFurniture
        };
      });
      
      if (shouldRegenerate) {
        setTimeout(() => {
          get().regenerateScene();
        }, 0);
      }
      
      get().markAsDirty();
    },
    
    // NOUVELLES MÉTHODES POUR LE SYSTÈME V2
    
    // Basculer entre ancien et nouveau système
    toggleConstructionSystem: () => {
      set((state) => ({
        useNewConstructionSystem: !state.useNewConstructionSystem
      }));
      
      setTimeout(() => {
        get().regenerateScene();
      }, 0);
    },
    
    // Définir le type d'assemblage
    setAssemblyType: (type) => {
      set((state) => ({
        constructionV2: {
          ...state.constructionV2,
          basic: {
            ...state.constructionV2.basic,
            assemblyType: type
          }
        }
      }));
      
      get().regenerateScene();
      get().markAsDirty();
    },
    
    // Mettre à jour les options de construction V2
    updateConstructionV2: (section, property, value) => {
      set((state) => ({
        constructionV2: {
          ...state.constructionV2,
          [section]: {
            ...state.constructionV2[section],
            [property]: typeof value === 'object' ? 
              { ...state.constructionV2[section][property], ...value } : 
              value
          }
        }
      }));
      
      get().regenerateScene();
      get().markAsDirty();
    },
    
    // Définir les dimensions totales
    setTotalDimensions: (dimensions) => {
      set({ totalDimensions: dimensions });
      get().regenerateScene();
      get().markAsDirty();
    },
    
    // Activer/désactiver un panneau d'habillage
    toggleCladding: (side, enabled) => {
      set((state) => ({
        constructionV2: {
          ...state.constructionV2,
          cladding: {
            ...state.constructionV2.cladding,
            [side]: {
              ...state.constructionV2.cladding[side],
              enabled
            }
          }
        }
      }));
      
      get().regenerateScene();
      get().markAsDirty();
    },
    
    // Activer/désactiver les montants verticaux
    toggleVerticalSupports: (enabled) => {
      set((state) => ({
        constructionV2: {
          ...state.constructionV2,
          base: {
            ...state.constructionV2.base,
            verticalSupports: {
              ...state.constructionV2.base.verticalSupports,
              enabled,
              positions: enabled && state.constructionV2.base.verticalSupports.positions.length === 0 ? 
                [state.totalDimensions.width / 2] : 
                state.constructionV2.base.verticalSupports.positions
            }
          }
        }
      }));
      
      get().regenerateScene();
      get().markAsDirty();
    },
    
    // Ajouter un montant vertical
    addVerticalSupport: (position = null) => {
      const state = get();
      const currentPositions = state.constructionV2.base.verticalSupports.positions;
      
      if (position === null) {
        position = state.totalDimensions.width / 2;
      }
      
      set((state) => ({
        constructionV2: {
          ...state.constructionV2,
          base: {
            ...state.constructionV2.base,
            verticalSupports: {
              ...state.constructionV2.base.verticalSupports,
              positions: [...currentPositions, position].sort((a, b) => a - b)
            }
          }
        }
      }));
      
      get().regenerateScene();
      get().markAsDirty();
    },
    
    // Supprimer un montant vertical
    removeVerticalSupport: (index) => {
      set((state) => {
        const newPositions = [...state.constructionV2.base.verticalSupports.positions];
        newPositions.splice(index, 1);
        
        return {
          constructionV2: {
            ...state.constructionV2,
            base: {
              ...state.constructionV2.base,
              verticalSupports: {
                ...state.constructionV2.base.verticalSupports,
                positions: newPositions
              }
            }
          }
        };
      });
      
      get().regenerateScene();
      get().markAsDirty();
    },
    
    // Distribuer automatiquement les montants verticaux
    distributeVerticalSupports: (count) => {
      const width = get().totalDimensions.width;
      const positions = [];
      
      if (count > 0) {
        const spacing = width / (count + 1);
        for (let i = 1; i <= count; i++) {
          positions.push(spacing * i);
        }
      }
      
      set((state) => ({
        constructionV2: {
          ...state.constructionV2,
          base: {
            ...state.constructionV2.base,
            verticalSupports: {
              ...state.constructionV2.base.verticalSupports,
              positions,
              count
            }
          }
        }
      }));
      
      get().regenerateScene();
      get().markAsDirty();
    },
    
    // FIN DES NOUVELLES MÉTHODES V2
    
    // Actions pour le meuble actif
    updateFurnitureDimensions: (dimension, value, shouldRegenerate = true) => {
      // Si déjà en cours de mise à jour, ne pas déclencher d'autres mises à jour
      if (get().isUpdating) return;
      
      console.log(`Mise à jour de la dimension du meuble "${dimension}" à ${value}`);
      
      // Vérifier si la valeur a réellement changé
      if (get().furniture.dimensions[dimension] === value) {
        console.log("Valeur inchangée, pas de mise à jour");
        return;
      }
      
      const { activeFurnitureId } = get();
      
      // Mettre à jour le meuble actif
      set((state) => ({
        furniture: {
          ...state.furniture,
          dimensions: {
            ...state.furniture.dimensions,
            [dimension]: value
          }
        }
      }));
      
      // Mettre également à jour dans la liste des meubles
      if (activeFurnitureId) {
        set((state) => ({
          furnitureList: state.furnitureList.map(f => 
            f.id === activeFurnitureId 
              ? {
                  ...f,
                  dimensions: {
                    ...f.dimensions,
                    [dimension]: value
                  }
                }
              : f
          )
        }));
      }
      
      console.log(`Dimension du meuble "${dimension}" mise à jour avec succès`);
      
      if (shouldRegenerate) {
        setTimeout(() => {
          console.log(`Régénération après mise à jour de dimension du meuble "${dimension}"`);
          get().regenerateScene();
        }, 0);
      }
      
      get().markAsDirty();
    },
    
    updateFurniturePosition: (axis, value, shouldRegenerate = true) => {
      console.log(`Mise à jour de la position du meuble sur l'axe "${axis}" à ${value}`);
      
      // Vérifier si la valeur a réellement changé
      if (get().furniture.position[axis] === value) {
        console.log("Valeur inchangée, pas de mise à jour");
        return;
      }
      
      const { activeFurnitureId } = get();
      
      // Mettre à jour le meuble actif
      set((state) => ({
        furniture: {
          ...state.furniture,
          position: {
            ...state.furniture.position,
            [axis]: value
          }
        }
      }));
      
      // Mettre également à jour dans la liste des meubles
      if (activeFurnitureId) {
        set((state) => ({
          furnitureList: state.furnitureList.map(f => 
            f.id === activeFurnitureId 
              ? {
                  ...f,
                  position: {
                    ...f.position,
                    [axis]: value
                  }
                }
              : f
          )
        }));
      }
      
      console.log(`Position du meuble sur l'axe "${axis}" mise à jour avec succès`);
      
      if (shouldRegenerate) {
        setTimeout(() => {
          console.log(`Régénération après mise à jour de position du meuble "${axis}"`);
          get().regenerateScene();
        }, 0);
      }
      
      get().markAsDirty();
    },
    
    updateFurnitureRotation: (x, y, z, shouldRegenerate = true) => {
      console.log(`Mise à jour de la rotation du meuble à [${x}, ${y}, ${z}]`);
      
      // Vérifier si les valeurs ont réellement changé
      const currentRotation = get().furniture.rotation;
      if (currentRotation.x === x && currentRotation.y === y && currentRotation.z === z) {
        console.log("Valeurs inchangées, pas de mise à jour");
        return;
      }
      
      const { activeFurnitureId } = get();
      
      // Mettre à jour le meuble actif
      set((state) => ({
        furniture: {
          ...state.furniture,
          rotation: { x, y, z }
        }
      }));
      
      // Mettre également à jour dans la liste des meubles
      if (activeFurnitureId) {
        set((state) => ({
          furnitureList: state.furnitureList.map(f => 
            f.id === activeFurnitureId 
              ? {
                  ...f,
                  rotation: { x, y, z }
                }
              : f
          )
        }));
      }
      
      console.log("Rotation du meuble mise à jour avec succès");
      
      if (shouldRegenerate) {
        setTimeout(() => {
          console.log("Régénération après mise à jour de rotation du meuble");
          get().regenerateScene();
        }, 0);
      }
      
      get().markAsDirty();
    },
    
    updateFurniturePlacement: (property, value) => {
      console.log(`Mise à jour du placement du meuble, propriété "${property}" à ${value}`);
      
      // Vérifier si la valeur a réellement changé
      if (get().furniture.placement[property] === value) {
        console.log("Valeur inchangée, pas de mise à jour");
        return;
      }
      
      const { activeFurnitureId } = get();
      
      // Mettre à jour le meuble actif
      set((state) => ({
        furniture: {
          ...state.furniture,
          placement: {
            ...state.furniture.placement,
            [property]: value
          }
        }
      }));
      
      // Mettre également à jour dans la liste des meubles
      if (activeFurnitureId) {
        set((state) => ({
          furnitureList: state.furnitureList.map(f => 
            f.id === activeFurnitureId 
              ? {
                  ...f,
                  placement: {
                    ...f.placement,
                    [property]: value
                  }
                }
              : f
          )
        }));
      }
      
      console.log(`Placement du meuble "${property}" mis à jour avec succès`);
      
      get().markAsDirty();
    },
    
    updateFurnitureType: (type, shouldRegenerate = true) => {
      console.log(`Mise à jour du type de meuble à "${type}"`);
      
      // Vérifier si la valeur a réellement changé
      if (get().furniture.type === type) {
        console.log("Valeur inchangée, pas de mise à jour");
        return;
      }
      
      const { activeFurnitureId } = get();
      
      // Mettre à jour le meuble actif
      set((state) => ({
        furniture: {
          ...state.furniture,
          type
        }
      }));
      
      // Mettre également à jour dans la liste des meubles
      if (activeFurnitureId) {
        set((state) => ({
          furnitureList: state.furnitureList.map(f => 
            f.id === activeFurnitureId 
              ? {
                  ...f,
                  type
                }
              : f
          )
        }));
      }
      
      console.log("Type de meuble mis à jour avec succès");
      
      if (shouldRegenerate) {
        setTimeout(() => {
          console.log("Régénération après mise à jour du type de meuble");
          get().regenerateScene();
        }, 0);
      }
      
      get().markAsDirty();
    },
    
    setFurnitureMaterial: (materialId, shouldRegenerate = true) => {
      console.log(`Mise à jour du matériau du meuble à "${materialId}"`);
      
      // Vérifier si la valeur a réellement changé
      if (get().furniture.material === materialId) {
        console.log("Valeur inchangée, pas de mise à jour");
        return;
      }
      
      const { activeFurnitureId } = get();
      
      // Mettre à jour le meuble actif
      set((state) => ({
        furniture: {
          ...state.furniture,
          material: materialId
        }
      }));
      
      // Mettre également à jour dans la liste des meubles
      if (activeFurnitureId) {
        set((state) => ({
          furnitureList: state.furnitureList.map(f => 
            f.id === activeFurnitureId 
              ? {
                  ...f,
                  material: materialId
                }
              : f
          )
        }));
      }
      
      console.log("Matériau du meuble mis à jour avec succès");
      
      if (shouldRegenerate) {
        setTimeout(() => {
          console.log("Régénération après mise à jour du matériau du meuble");
          get().regenerateScene();
        }, 0);
      }
      
      get().markAsDirty();
    },
    
    updateConstructionOption: (option, value, shouldRegenerate = true) => {
      console.log(`Mise à jour de l'option de construction "${option}" à`, value);
      
      // Vérifier si la valeur a réellement changé
      const currentValue = get().furniture.construction[option];
      if (JSON.stringify(currentValue) === JSON.stringify(value)) {
        console.log("Valeur inchangée, pas de mise à jour");
        return;
      }
      
      const { activeFurnitureId } = get();
      
      // Mettre à jour le meuble actif
      set((state) => ({
        furniture: {
          ...state.furniture,
          construction: {
            ...state.furniture.construction,
            [option]: value
          }
        }
      }));
      
      // Mettre également à jour dans la liste des meubles
      if (activeFurnitureId) {
        set((state) => ({
          furnitureList: state.furnitureList.map(f => 
            f.id === activeFurnitureId 
              ? {
                  ...f,
                  construction: {
                    ...f.construction,
                    [option]: value
                  }
                }
              : f
          )
        }));
      }
      
      console.log(`Option de construction "${option}" mise à jour avec succès`);
      
      if (shouldRegenerate) {
        setTimeout(() => {
          console.log(`Régénération après mise à jour de l'option de construction "${option}"`);
          get().regenerateScene();
        }, 0);
      }
      
      get().markAsDirty();
    },
    
    // Gestion des séparations
    addVerticalSeparator: (position = null) => {
      const { furniture, activeFurnitureId } = get();
      
      // Position par défaut si non spécifiée
      if (position === null) {
        position = furniture.dimensions.width / 2;
      }
      
      const newSeparator = {
        id: `vsep_${Math.random().toString(36).substring(2, 9)}`,
        position,
        material: furniture.material,
        thickness: furniture.construction.panelThickness
      };
      
      // Mettre à jour le meuble actif
      set((state) => ({
        furniture: {
          ...state.furniture,
          layout: {
            ...state.furniture.layout,
            verticalSeparators: [
              ...(state.furniture.layout.verticalSeparators || []),
              newSeparator
            ]
          }
        }
      }));
      
      // Mettre à jour également dans la liste des meubles
      if (activeFurnitureId) {
        set((state) => ({
          furnitureList: state.furnitureList.map(f => 
            f.id === activeFurnitureId 
              ? {
                  ...f,
                  layout: {
                    ...f.layout,
                    verticalSeparators: [
                      ...(f.layout.verticalSeparators || []),
                      newSeparator
                    ]
                  }
                }
              : f
          )
        }));
      }
      
      get().regenerateScene();
      get().markAsDirty();
      get().addToHistory();
      
      return newSeparator.id;
    },
    
    updateVerticalSeparator: (id, props, shouldRegenerate = true) => {
      const { activeFurnitureId } = get();
      
      // Mettre à jour le meuble actif
      set((state) => {
        const verticalSeparators = (state.furniture.layout.verticalSeparators || []).map(sep => 
          sep.id === id ? { ...sep, ...props } : sep
        );
        
        return {
          furniture: {
            ...state.furniture,
            layout: {
              ...state.furniture.layout,
              verticalSeparators
            }
          }
        };
      });
      
      // Mettre également à jour dans la liste des meubles
      if (activeFurnitureId) {
        set((state) => ({
          furnitureList: state.furnitureList.map(f => 
            f.id === activeFurnitureId 
              ? {
                  ...f,
                  layout: {
                    ...f.layout,
                    verticalSeparators: (f.layout.verticalSeparators || []).map(sep => 
                      sep.id === id ? { ...sep, ...props } : sep
                    )
                  }
                }
              : f
          )
        }));
      }
      
      if (shouldRegenerate) {
        get().regenerateScene();
      }
      
      get().markAsDirty();
    },
    
    removeVerticalSeparator: (id) => {
      const { activeFurnitureId } = get();
      
      // Mettre à jour le meuble actif
      set((state) => {
        const verticalSeparators = (state.furniture.layout.verticalSeparators || []).filter(sep => 
          sep.id !== id
        );
        
        return {
          furniture: {
            ...state.furniture,
            layout: {
              ...state.furniture.layout,
              verticalSeparators
            }
          }
        };
      });
      
      // Mettre également à jour dans la liste des meubles
      if (activeFurnitureId) {
        set((state) => ({
          furnitureList: state.furnitureList.map(f => 
            f.id === activeFurnitureId 
              ? {
                  ...f,
                  layout: {
                    ...f.layout,
                    verticalSeparators: (f.layout.verticalSeparators || []).filter(sep => 
                      sep.id !== id
                    )
                  }
                }
              : f
          )
        }));
      }
      
      get().regenerateScene();
      get().markAsDirty();
      get().addToHistory();
    },
    
    // Gestion des étagères
    addShelf: (position = null, zoneId = null) => {
      const { furniture, activeFurnitureId } = get();
      
      // Position par défaut si non spécifiée
      if (position === null) {
        position = furniture.dimensions.height / 2;
      }
      
      // Déterminer la largeur et la profondeur en fonction de la zone
      let width = furniture.dimensions.width - furniture.construction.panelThickness * 2;
      let depth = furniture.dimensions.depth;
      let xPosition = 0;
      
      // Si une zone est spécifiée, ajuster les dimensions
      if (zoneId) {
        const zone = get().interiorZones.find(z => z.id === zoneId);
        if (zone) {
          width = zone.width;
          xPosition = zone.position.x;
        }
      }
      
      const newShelf = {
        id: `shelf_${Math.random().toString(36).substring(2, 9)}`,
        position,
        width,
        depth,
        xPosition,
        material: furniture.material,
        thickness: furniture.construction.panelThickness,
        edgeBanding: {
          front: true,
          back: false,
          left: false,
          right: false
        }
      };
      
      // Mettre à jour le meuble actif
      set((state) => ({
        furniture: {
          ...state.furniture,
          layout: {
            ...state.furniture.layout,
            shelves: [
              ...(state.furniture.layout.shelves || []),
              newShelf
            ]
          }
        }
      }));
      
      // Mettre également à jour dans la liste des meubles
      if (activeFurnitureId) {
        set((state) => ({
          furnitureList: state.furnitureList.map(f => 
            f.id === activeFurnitureId 
              ? {
                  ...f,
                  layout: {
                    ...f.layout,
                    shelves: [
                      ...(f.layout.shelves || []),
                      newShelf
                    ]
                  }
                }
              : f
          )
        }));
      }
      
      get().regenerateScene();
      get().markAsDirty();
      get().addToHistory();
      
      return newShelf.id;
    },
    
    // Autres méthodes pour la gestion des éléments du meuble...
});