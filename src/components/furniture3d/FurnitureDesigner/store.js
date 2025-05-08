// src/components/furniture3d/FurnitureDesigner/store.js
import { create } from 'zustand';
import * as THREE from 'three';


// Utilitaires pour la conversion d'unités et autres fonctions communes
const furnitureUtils = {
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

// Store Zustand principal
const useFurnitureStore = create((set, get) => ({
  // Flag pour contrôler les mises à jour multiples
  isUpdating: false,

  // État de base pour l'utilisateur et son abonnement
  user: null,
  subscription: null,
  
  // État pour la sauvegarde
  isDirty: false,
  lastSaved: null,
  
  // État de la scène 3D
  sceneObjects: [], // Objets dans la scène
  selectedObjectId: null, // Objet actuellement sélectionné
  dimensionLines: [], // Lignes de cotation
  
  // Informations de base du projet
  projectInfo: {
    id: `project_${Date.now()}`,
    name: "Nouveau projet",
    createdAt: new Date(),
    lastModified: new Date(),
    description: ""
  },
  
  // Configuration de la pièce
  room: {
    width: 3000,  // mm
    height: 2500,  // mm
    depth: 2000,   // mm
    showDimensions: true,
    
    // Sol
    floor: {
      visible: true,
      color: "#F5F5F5",
      texture: null,
    },
    
    // Plafond
    ceiling: {
      visible: false,
      color: "#FFFFFF",
      texture: null,
    },
    
    // Murs
    walls: {
      left: {
        visible: true,
        thickness: 100,  // mm
        color: "#E0E0E0",
        texture: null,
      },
      right: {
        visible: true,
        thickness: 100,  // mm
        color: "#E0E0E0",
        texture: null,
      },
      back: {
        visible: true,
        thickness: 100,  // mm
        color: "#E0E0E0",
        texture: null,
      }
    }
  },
  
  // Catalogue de matériaux disponibles
  availableMaterials: [],
  availableEdgeBanding: [],
  availableHardware: [],
  
  // État du meuble principal
  furniture: {
    type: "wardrobe",
    dimensions: {
      width: 2000,   // mm
      height: 2000,  // mm
      depth: 500,    // mm
    },
    position: {
      x: 0,
      y: 0,
      z: 0
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0
    },
    placement: {
      wall: null,  // "back", "left", "right" ou null
      alignH: "center", // "left", "center", "right"
    },
    material: null,
    
    // Options de construction
    construction: {
      panelThickness: 19,
      hasPlinths: true,
      plinthHeight: 80,
      plinthInsets: {
        front: 0,
        back: 0,
        left: 0,
        right: 0
      },
      hasBackPanel: true,
      backPanelThickness: 19,
      backPanelInset: 0,
      backPanelGap: 0.5, // Jeu par défaut de 0.5mm
      backPanelThrough: {
       top: false,
       bottom: false,
       left: false,
       right: false
      },
      // Nouvelles propriétés pour la rainure
      backPanelGroove: {
        top: false,
        bottom: false,
        left: false,
        right: false
      },
      backPanelOverhang: 0, // Débordement en mm pour la rainure
      sidesExtendToFloor: false,
      sidesOverlapTopBottom: true, // Nouvelle propriété
      // Nouvelles propriétés pour le socle
      socleSupports: 0, // Nombre de séparations verticales
      socleSideSupports: false,
      socleTopType: 'panel', // 'panel' ou 'traverses'
      socleTraverseWidth: 80 // Largeur des traverses (si utilisées)
    },
    
    // Éléments intérieurs
    layout: {
      verticalSeparators: [],
      horizontalSeparators: [],
      shelves: [],
      drawers: [],
      hangingRods: [],
      doors: []
    }
  },
  
  // Options d'affichage
  displayOptions: {
    viewMode: "solid",  // "solid", "wireframe", "realistic"
    showGrid: true,
    gridSize: 100,
    showAxes: true,
    showDimensions: true,
    showShadows: false,
    showWireframe: false,
    furnitureOpacity: 1.0, // Nouvelle propriété (1.0 = opaque, 0.0 = transparent)
    backgroundColor: "#F0F0F0"
  },
  
  // Position de la caméra
  cameraPosition: [4, 4, 4],
  cameraTarget: [0, 0, 0],
  
  // Mode d'édition
  editMode: 'select', // 'select', 'add', 'move', 'resize', 'delete'
  lastUpdate: 0,
  updateScheduled: false,
  currentTool: null,  // outil spécifique en cours d'utilisation
  
  // Historique pour undo/redo
  history: [],
  historyIndex: -1,
  maxHistoryLength: 30,
  
  // Statistiques du meuble
  statistics: {
    totalPanels: 0,
    totalVolume: 0, // m³
    totalWeight: 0, // kg
    totalEdgeBanding: 0, // mm
    totalCost: 0,
    materialBreakdown: []
  },
  
  // Zones interactives pour la sélection intérieure
  interiorZones: [],
  
  // ========== ACTIONS ==========
  
  // Actions pour l'utilisateur et l'abonnement
  setUser: (user) => set({ user }),
  setSubscription: (subscription) => set({ subscription }),
  
  // Méthode pour mettre à jour plusieurs propriétés à la fois
  updateBatch: (updates) => {
    // Si déjà en cours de mise à jour, ne pas déclencher d'autres mises à jour
    if (get().isUpdating) return;
    
    // Marquer comme en cours de mise à jour
    set({ isUpdating: true });
    
    try {
      // Mettre à jour l'état en une seule opération
      set((state) => {
        const newState = { ...state };
        
        // Mettre à jour les dimensions de la pièce
        if (updates.roomWidth !== undefined) newState.room.width = updates.roomWidth;
        if (updates.roomHeight !== undefined) newState.room.height = updates.roomHeight;
        if (updates.roomDepth !== undefined) newState.room.depth = updates.roomDepth;
        
        // Mettre à jour les dimensions du meuble
        if (updates.furnitureWidth !== undefined) {
          newState.furniture.dimensions.width = updates.furnitureWidth;
        }
        if (updates.furnitureHeight !== undefined) {
          newState.furniture.dimensions.height = updates.furnitureHeight;
        }
        if (updates.furnitureDepth !== undefined) {
          newState.furniture.dimensions.depth = updates.furnitureDepth;
        }
        
        // Autres mises à jour
        if (updates.furnitureType !== undefined) newState.furniture.type = updates.furnitureType;
        if (updates.material !== undefined) newState.furniture.material = updates.material;
        
        // Marquer comme modifié
        newState.isDirty = true;
        
        return newState;
      });
      
      // Régénérer la scène une seule fois après toutes les mises à jour
      get().regenerateScene();
    } finally {
      // Réinitialiser le flag, même en cas d'erreur
      set({ isUpdating: false });
    }
  },
  
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
  
  // Gestion de l'affichage des murs - VERSION AMÉLIORÉE
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

  // Mise à jour de la couleur des murs - VERSION AMÉLIORÉE
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

  // Gestion de l'affichage du sol - VERSION AMÉLIORÉE
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

  // Mise à jour de la couleur du sol - VERSION AMÉLIORÉE
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

  // Gestion de l'affichage du plafond - VERSION AMÉLIORÉE
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

  // Gestion de l'affichage des dimensions - VERSION AMÉLIORÉE
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
  
  // Actions pour le meuble
  updateFurnitureDimensions: (dimension, value, shouldRegenerate = true) => {
    // Si déjà en cours de mise à jour, ne pas déclencher d'autres mises à jour
    if (get().isUpdating) return;
    
    console.log(`Mise à jour de la dimension du meuble "${dimension}" à ${value}`);
    
    // Vérifier si la valeur a réellement changé
    if (get().furniture.dimensions[dimension] === value) {
      console.log("Valeur inchangée, pas de mise à jour");
      return;
    }
    
    set((state) => ({
      furniture: {
        ...state.furniture,
        dimensions: {
          ...state.furniture.dimensions,
          [dimension]: value
        }
      }
    }));
    
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
    
    set((state) => ({
      furniture: {
        ...state.furniture,
        position: {
          ...state.furniture.position,
          [axis]: value
        }
      }
    }));
    
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
    
    set((state) => ({
      furniture: {
        ...state.furniture,
        rotation: { x, y, z }
      }
    }));
    
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
    
    set((state) => ({
      furniture: {
        ...state.furniture,
        placement: {
          ...state.furniture.placement,
          [property]: value
        }
      }
    }));
    
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
    
    set((state) => ({
      furniture: {
        ...state.furniture,
        type
      }
    }));
    
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
    
    set((state) => ({
      furniture: {
        ...state.furniture,
        material: materialId
      }
    }));
    
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
    
    set((state) => ({
      furniture: {
        ...state.furniture,
        construction: {
          ...state.furniture.construction,
          [option]: value
        }
      }
    }));
    
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
    const { furniture } = get();
    
    // Position par défaut si non spécifiée
    if (position === null) {
      position = furniture.dimensions.width / 2;
    }
    
    const newSeparator = {
      id: `vsep_${furnitureUtils.generateId()}`,
      position,
      material: furniture.material,
      thickness: furniture.construction.panelThickness
    };
    
    set((state) => ({
      furniture: {
        ...state.furniture,
        layout: {
          ...state.furniture.layout,
          verticalSeparators: [
            ...state.furniture.layout.verticalSeparators,
            newSeparator
          ]
        }
      }
    }));
    
    get().regenerateScene();
    get().markAsDirty();
    get().addToHistory();
    
    return newSeparator.id;
  },
  
  updateVerticalSeparator: (id, props, shouldRegenerate = true) => {
    set((state) => {
      const verticalSeparators = state.furniture.layout.verticalSeparators.map(sep => 
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
    
    if (shouldRegenerate) {
      get().regenerateScene();
    }
    
    get().markAsDirty();
  },
  
  removeVerticalSeparator: (id) => {
    set((state) => {
      const verticalSeparators = state.furniture.layout.verticalSeparators.filter(sep => 
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
    
    get().regenerateScene();
    get().markAsDirty();
    get().addToHistory();
  },
  
  // Gestion des étagères
  addShelf: (position = null, zoneId = null) => {
    const { furniture } = get();
    
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
      id: `shelf_${furnitureUtils.generateId()}`,
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
    
    set((state) => ({
      furniture: {
        ...state.furniture,
        layout: {
          ...state.furniture.layout,
          shelves: [
            ...state.furniture.layout.shelves,
            newShelf
          ]
        }
      }
    }));
    
    get().regenerateScene();
    get().markAsDirty();
    get().addToHistory();
    
    return newShelf.id;
  },
  
  updateShelf: (id, props, shouldRegenerate = true) => {
    set((state) => {
      const shelves = state.furniture.layout.shelves.map(shelf => 
        shelf.id === id ? { ...shelf, ...props } : shelf
      );
      
      return {
        furniture: {
          ...state.furniture,
          layout: {
            ...state.furniture.layout,
            shelves
          }
        }
      };
    });
    
    if (shouldRegenerate) {
      get().regenerateScene();
    }
    
    get().markAsDirty();
  },
  
  removeShelf: (id) => {
    set((state) => {
      const shelves = state.furniture.layout.shelves.filter(shelf => 
        shelf.id !== id
      );
      
      return {
        furniture: {
          ...state.furniture,
          layout: {
            ...state.furniture.layout,
            shelves
          }
        }
      };
    });
    
    get().regenerateScene();
    get().markAsDirty();
    get().addToHistory();
  },
  
  // Gestion des tiroirs
  addDrawer: (position = null, zoneId = null) => {
    const { furniture } = get();
    
    // Position par défaut si non spécifiée
    if (position === null) {
      position = furniture.dimensions.height / 3;
    }
    
    // Déterminer la largeur, la hauteur et la profondeur en fonction de la zone
    let width = furniture.dimensions.width - furniture.construction.panelThickness * 2;
    let depth = furniture.dimensions.depth - 50; // Espace pour le coulissement
    let height = 150; // Hauteur standard
    let xPosition = 0;
    
    // Si une zone est spécifiée, ajuster les dimensions
    if (zoneId) {
      const zone = get().interiorZones.find(z => z.id === zoneId);
      if (zone) {
        width = zone.width;
        xPosition = zone.position.x;
      }
    }
    
    const newDrawer = {
      id: `drawer_${furnitureUtils.generateId()}`,
      position,
      width,
      height,
      depth,
      xPosition,
      material: furniture.material,
      thickness: furniture.construction.panelThickness,
      frontMaterial: furniture.material,
      handle: null,
      slides: 'standard', // 'standard', 'fullExtension', 'softClose'
      edgeBanding: {
        front: true,
        sides: false,
        back: false
      }
    };
    
    set((state) => ({
      furniture: {
        ...state.furniture,
        layout: {
          ...state.furniture.layout,
          drawers: [
            ...state.furniture.layout.drawers,
            newDrawer
          ]
        }
      }
    }));
    
    get().regenerateScene();
    get().markAsDirty();
    get().addToHistory();
    
    return newDrawer.id;
  },
  
  updateDrawer: (id, props, shouldRegenerate = true) => {
    set((state) => {
      const drawers = state.furniture.layout.drawers.map(drawer => 
        drawer.id === id ? { ...drawer, ...props } : drawer
      );
      
      return {
        furniture: {
          ...state.furniture,
          layout: {
            ...state.furniture.layout,
            drawers
          }
        }
      };
    });
    
    if (shouldRegenerate) {
      get().regenerateScene();
    }
    
    get().markAsDirty();
  },
  
  removeDrawer: (id) => {
    set((state) => {
      const drawers = state.furniture.layout.drawers.filter(drawer => 
        drawer.id !== id
      );
      
      return {
        furniture: {
          ...state.furniture,
          layout: {
            ...state.furniture.layout,
            drawers
          }
        }
      };
    });
    
    get().regenerateScene();
    get().markAsDirty();
    get().addToHistory();
  },
  
  // Gestion des tringles
  addHangingRod: (position = null, zoneId = null) => {
    const { furniture } = get();
    
    // Position par défaut si non spécifiée
    if (position === null) {
      position = furniture.dimensions.height - 300; // Près du haut
    }
    
    // Déterminer la largeur en fonction de la zone
    let width = furniture.dimensions.width - furniture.construction.panelThickness * 2;
    let xPosition = 0;
    
    // Si une zone est spécifiée, ajuster les dimensions
    if (zoneId) {
      const zone = get().interiorZones.find(z => z.id === zoneId);
      if (zone) {
        width = zone.width;
        xPosition = zone.position.x;
      }
    }
    
    const newRod = {
      id: `rod_${furnitureUtils.generateId()}`,
      position,
      width,
      xPosition,
      diameter: 25, // mm
      material: 'chrome', // 'chrome', 'brass', 'steel'
      supports: 2 // Nombre de supports
    };
    
    set((state) => ({
      furniture: {
        ...state.furniture,
        layout: {
          ...state.furniture.layout,
          hangingRods: [
            ...state.furniture.layout.hangingRods,
            newRod
          ]
        }
      }
    }));
    
    get().regenerateScene();
    get().markAsDirty();
    get().addToHistory();
    
    return newRod.id;
  },
  
  updateHangingRod: (id, props, shouldRegenerate = true) => {
    set((state) => {
      const hangingRods = state.furniture.layout.hangingRods.map(rod => 
        rod.id === id ? { ...rod, ...props } : rod
      );
      
      return {
        furniture: {
          ...state.furniture,
          layout: {
            ...state.furniture.layout,
            hangingRods
          }
        }
      };
    });
    
    if (shouldRegenerate) {
      get().regenerateScene();
    }
    
    get().markAsDirty();
  },
  
  removeHangingRod: (id) => {
    set((state) => {
      const hangingRods = state.furniture.layout.hangingRods.filter(rod => 
        rod.id !== id
      );
      
      return {
        furniture: {
          ...state.furniture,
          layout: {
            ...state.furniture.layout,
            hangingRods
          }
        }
      };
    });
    
    get().regenerateScene();
    get().markAsDirty();
    get().addToHistory();
  },
  
  // Gestion des portes
  addDoor: (zoneId = null) => {
    const { furniture } = get();
    
    // Déterminer les dimensions et la position en fonction de la zone
    let width = furniture.dimensions.width / 2;
    let height = furniture.dimensions.height;
    let xPosition = -width / 2;
    let yPosition = height / 2;
    
    // Si une zone est spécifiée, ajuster les dimensions
    if (zoneId) {
      const zone = get().interiorZones.find(z => z.id === zoneId);
      if (zone) {
        width = zone.width;
        height = zone.height;
        xPosition = zone.position.x - width / 2;
        yPosition = zone.position.y;
      }
    }
    
    const newDoor = {
      id: `door_${furnitureUtils.generateId()}`,
      position: {
        x: xPosition,
        y: yPosition
      },
      width,
      height,
      thickness: furniture.construction.panelThickness,
      material: furniture.material,
      type: 'hinged', // 'hinged', 'sliding', 'folding'
      hinges: [
        { position: height * 0.15 },
        { position: height * 0.85 }
      ],
      handle: {
        type: 'knob',
        position: { x: width - 60, y: height / 2 }
      },
      openDirection: 'left', // 'left', 'right'
      edgeBanding: {
        all: true
      }
    };
    
    set((state) => ({
      furniture: {
        ...state.furniture,
        layout: {
          ...state.furniture.layout,
          doors: [
            ...state.furniture.layout.doors,
            newDoor
          ]
        }
      }
    }));
    
    get().regenerateScene();
    get().markAsDirty();
    get().addToHistory();
    
    return newDoor.id;
  },
  
  updateDoor: (id, props, shouldRegenerate = true) => {
    set((state) => {
      const doors = state.furniture.layout.doors.map(door => 
        door.id === id ? { ...door, ...props } : door
      );
      
      return {
        furniture: {
          ...state.furniture,
          layout: {
            ...state.furniture.layout,
            doors
          }
        }
      };
    });
    
    if (shouldRegenerate) {
      get().regenerateScene();
    }
    
    get().markAsDirty();
  },
  
  removeDoor: (id) => {
    set((state) => {
      const doors = state.furniture.layout.doors.filter(door => 
        door.id !== id
      );
      
      return {
        furniture: {
          ...state.furniture,
          layout: {
            ...state.furniture.layout,
            doors
          }
        }
      };
    });
    
    get().regenerateScene();
    get().markAsDirty();
    get().addToHistory();
  },
  
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
  
  // Gestion des options d'affichage - VERSION AMÉLIORÉE
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
    
    // Utiliser setTimeout pour garantir que la mise à jour de l'état soit complète
    // avant de régénérer la scène
    if (shouldRegenerate) {
      setTimeout(() => {
        console.log(`Régénération de la scène après mise à jour de "${option}"`);
        get().regenerateScene();
      }, 0);
    }
  },
  
  // Régénération de la scène 3D - VERSION AMÉLIORÉE
  regenerateScene: () => {
    console.log("Début de regenerateScene");
    
    // Éviter les appels récursifs
    if (get().isUpdating) {
      console.log("Régénération déjà en cours, ignoré");
      return;
    }
    
    // Marquer comme en cours de mise à jour
    set({ isUpdating: true });
    
    try {
      const { room, furniture, displayOptions } = get();
      
      console.log("État actuel:", { 
        roomDimensions: [room.width, room.height, room.depth],
        furnitureDimensions: [furniture.dimensions.width, furniture.dimensions.height, furniture.dimensions.depth],
        displayOptions: JSON.stringify(displayOptions)
      });
      
      // Vérifier si un délai suffisant s'est écoulé depuis la dernière régénération
      const now = Date.now();
      const lastUpdate = get().lastUpdate || 0;
      
      if (now - lastUpdate < 100) { // Limiter à une mise à jour toutes les 100ms
        // Planifier une mise à jour différée si nécessaire
        if (!get().updateScheduled) {
          console.log("Planification d'une mise à jour différée");
          set({ updateScheduled: true });
          setTimeout(() => {
            set({ updateScheduled: false, lastUpdate: Date.now() });
            get().regenerateScene();
          }, 150);
        }
        return;
      }
      
      console.log("Génération des objets de la scène");
      
      // Créer les objets de la scène
      const sceneObjects = [];
      
      // Générer les murs, le sol, etc.
      const environmentObjects = generateEnvironment(room);
      sceneObjects.push(...environmentObjects);
      
      // Générer le meuble principal
      const furnitureObjects = generateFurniture(furniture, displayOptions);
      sceneObjects.push(...furnitureObjects);
      
      // Générer les lignes de cotation si activées
      let dimensionLines = [];
      if (displayOptions.showDimensions) {
        dimensionLines = generateDimensionLines(room, furniture);
      }
      
      // Générer les zones intérieures pour la sélection
      const interiorZones = generateInteriorZones(furniture);
      
      // Calculer les statistiques du meuble
      const statistics = calculateFurnitureStatistics(furniture);
      
      console.log(`Objets générés: ${sceneObjects.length}`);
      
      // Mettre à jour l'état avec tous les objets générés
      set({ 
        sceneObjects,
        dimensionLines,
        interiorZones,
        statistics,
        lastUpdate: now,
        isDirty: true // Marquer comme modifié
      });
      
      console.log("Mise à jour de la scène terminée");
    } catch (error) {
      console.error("Erreur lors de la régénération de la scène:", error);
    } finally {
      // Réinitialiser le flag d'update, même en cas d'erreur
      setTimeout(() => {
        set({ isUpdating: false });
      }, 50);
    }
  },

  // Actions pour la sélection
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),
  
  // Actions pour le mode d'édition
  setEditMode: (mode) => set({ editMode: mode }),
  setCurrentTool: (tool) => set({ currentTool: tool }),
  
  // Gestion caméra
  setCameraPosition: (position) => {
    console.log(`Mise à jour de la position de la caméra à [${position[0]}, ${position[1]}, ${position[2]}]`);
    set({ cameraPosition: position });
  },
  
  setCameraTarget: (target) => set({ cameraTarget: target }),
  
  // Gestion des zones intérieures
  selectZone: (zoneId) => {
    set({ selectedZoneId: zoneId });
    // Éventuellement, afficher un menu contextuel ou des options
  },
  
  // Gestion historique
  addToHistory: () => {
    const { 
      furniture, 
      history, 
      historyIndex,
      maxHistoryLength
    } = get();
    
    // Créer une copie profonde pour l'historique
    const newEntry = JSON.parse(JSON.stringify(furniture));
    
    // Tronquer l'historique si nous sommes au milieu d'une séquence
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEntry);
    
    // Limiter la taille de l'historique
    if (newHistory.length > maxHistoryLength) {
      newHistory.shift();
    }
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  },
  
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      console.log("Annulation de la dernière action");
      
      set({
        furniture: JSON.parse(JSON.stringify(history[historyIndex - 1])),
        historyIndex: historyIndex - 1,
        isDirty: true
      });
      
      get().regenerateScene();
      return true;
    }
    return false;
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      console.log("Rétablissement de la dernière action annulée");
      
      set({
        furniture: JSON.parse(JSON.stringify(history[historyIndex + 1])),
        historyIndex: historyIndex + 1,
        isDirty: true
      });
      
      get().regenerateScene();
      return true;
    }
    return false;
  },
  
  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },
  
  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },
  
  // Fonctions pour la sauvegarde et le chargement
  prepareForSave: () => {
    const { 
      furniture, 
      room, 
      projectInfo,
      displayOptions 
    } = get();
    
    return {
      projectInfo: {
        ...projectInfo,
        lastModified: new Date(),
      },
      room,
      furniture,
      displayOptions
    };
  },
  
  loadProject: (projectData) => {
    if (!projectData) return;
    
    console.log("Chargement du projet:", projectData.projectInfo?.name || "Sans nom");
    
    set({
      projectInfo: projectData.projectInfo || get().projectInfo,
      room: projectData.room || get().room,
      furniture: projectData.furniture || get().furniture,
      displayOptions: projectData.displayOptions || get().displayOptions,
      isDirty: false,
      lastSaved: new Date()
    });
    
    setTimeout(() => {
      console.log("Régénération de la scène après chargement du projet");
      get().regenerateScene();
      get().addToHistory();
    }, 100);
  },
  
  markAsDirty: () => {
    set({ isDirty: true });
  },
  
  markAsSaved: () => {
    set({ 
      isDirty: false,
      lastSaved: new Date()
    });
  },
  
  // Initialisation
  initialize: () => {
    console.log("Initialisation du store");
    
    // S'assurer que les options d'affichage sont correctement définies
    const { displayOptions } = get();
    
    // Définir les valeurs par défaut pour toutes les propriétés importantes
    const defaultDisplayOptions = {
      viewMode: "solid",
      showGrid: true,
      gridSize: 100,
      showAxes: true,
      showDimensions: true,
      showShadows: false,
      showWireframe: false,
      furnitureOpacity: 1.0,
      backgroundColor: "#F0F0F0"
    };
    
    // Mettre à jour seulement les propriétés manquantes ou undefined
    const updatedOptions = { ...defaultDisplayOptions };
    let needUpdate = false;
    
    for (const key in defaultDisplayOptions) {
      if (displayOptions[key] === undefined) {
        updatedOptions[key] = defaultDisplayOptions[key];
        needUpdate = true;
      } else {
        updatedOptions[key] = displayOptions[key];
      }
    }
    
    if (needUpdate) {
      console.log("Mise à jour des options d'affichage par défaut");
      set({
        displayOptions: updatedOptions
      });
    }
    
    // Régénérer la scène avec les options correctes
    console.log("Régénération initiale de la scène");
    get().regenerateScene();
    get().addToHistory();
  },
  
  // Export de la liste de pièces
  exportPiecesList: () => {
    const { furniture, statistics } = get();
    
    // Construire la liste des pièces (panels)
    const panels = [];
    
    // Caisson principal
    panels.push({
      description: "Côté gauche",
      material: furniture.material,
      width: furniture.construction.panelThickness,
      length: furniture.dimensions.depth,
      thickness: furniture.dimensions.height,
      quantity: 1,
      edgeBanding: "Front, top, bottom"
    });
    
    panels.push({
      description: "Côté droit",
      material: furniture.material,
      width: furniture.construction.panelThickness,
      length: furniture.dimensions.depth,
      thickness: furniture.dimensions.height,
      quantity: 1,
      edgeBanding: "Front, top, bottom"
    });
    
    panels.push({
      description: "Dessus",
      material: furniture.material,
      width: furniture.dimensions.width,
      length: furniture.dimensions.depth,
      thickness: furniture.construction.panelThickness,
      quantity: 1,
      edgeBanding: "Front, left, right"
    });
    
    panels.push({
      description: "Fond",
      material: furniture.material,
      width: furniture.dimensions.width - furniture.construction.panelThickness * 2,
      length: furniture.dimensions.depth,
      thickness: furniture.construction.panelThickness,
      quantity: 1,
      edgeBanding: "Front"
    });
    
    // Ajouter panneau arrière si présent
    if (furniture.construction.hasBackPanel) {
      panels.push({
        description: "Panneau arrière",
        material: furniture.material,
        width: furniture.dimensions.width - furniture.construction.panelThickness * 2,
        length: furniture.dimensions.height,
        thickness: furniture.construction.backPanelThickness,
        quantity: 1,
        edgeBanding: "None"
      });
    }
    
    // Ajouter séparations verticales
    furniture.layout.verticalSeparators.forEach((sep, index) => {
      panels.push({
        description: `Séparation verticale ${index + 1}`,
        material: sep.material || furniture.material,
        width: sep.thickness || furniture.construction.panelThickness,
        length: furniture.dimensions.depth,
        thickness: furniture.dimensions.height,
        quantity: 1,
        edgeBanding: "Front"
      });
    });
    
    // Ajouter étagères
    furniture.layout.shelves.forEach((shelf, index) => {
      panels.push({
        description: `Étagère ${index + 1}`,
        material: shelf.material || furniture.material,
        width: shelf.width,
        length: shelf.depth,
        thickness: shelf.thickness || furniture.construction.panelThickness,
        quantity: 1,
        edgeBanding: shelf.edgeBanding ? 
          Object.entries(shelf.edgeBanding)
            .filter(([k, v]) => v)
            .map(([k, v]) => k.charAt(0).toUpperCase() + k.slice(1))
            .join(", ") : 
          "Front"
      });
    });
    
    // Ajouter tiroirs
    furniture.layout.drawers.forEach((drawer, index) => {
      // Face avant
      panels.push({
        description: `Face avant tiroir ${index + 1}`,
        material: drawer.frontMaterial || furniture.material,
        width: drawer.width,
        length: drawer.thickness || furniture.construction.panelThickness,
        thickness: drawer.height,
        quantity: 1,
        edgeBanding: "All"
      });
      
      // Côtés, fond et arrière du tiroir
      panels.push({
        description: `Côtés tiroir ${index + 1}`,
        material: drawer.material || furniture.material,
        width: drawer.thickness || furniture.construction.panelThickness,
        length: drawer.depth,
        thickness: drawer.height,
        quantity: 2,
        edgeBanding: "Top"
      });
      
      panels.push({
        description: `Fond tiroir ${index + 1}`,
        material: drawer.material || furniture.material,
        width: drawer.width - (drawer.thickness || furniture.construction.panelThickness) * 2,
        length: drawer.depth,
        thickness: drawer.thickness || furniture.construction.panelThickness,
        quantity: 1,
        edgeBanding: "None"
      });
      
      panels.push({
        description: `Arrière tiroir ${index + 1}`,
        material: drawer.material || furniture.material,
        width: drawer.width - (drawer.thickness || furniture.construction.panelThickness) * 2,
        length: drawer.thickness || furniture.construction.panelThickness,
        thickness: drawer.height,
        quantity: 1,
        edgeBanding: "Top"
      });
    });
    
    // Ajouter portes
    furniture.layout.doors.forEach((door, index) => {
      panels.push({
        description: `Porte ${index + 1}`,
        material: door.material || furniture.material,
        width: door.width,
        length: door.thickness || furniture.construction.panelThickness,
        thickness: door.height,
        quantity: 1,
        edgeBanding: door.edgeBanding && door.edgeBanding.all ? "All" : 
          (door.edgeBanding ? 
            Object.entries(door.edgeBanding)
              .filter(([k, v]) => v && k !== 'all')
              .map(([k, v]) => k.charAt(0).toUpperCase() + k.slice(1))
              .join(", ") : 
            "All")
      });
    });
    
    // Liste de quincaillerie
    const hardware = [];
    
    // Charnières pour les portes
    furniture.layout.doors.forEach((door, doorIndex) => {
      if (door.type === 'hinged') {
        hardware.push({
          description: `Charnières pour porte ${doorIndex + 1}`,
          type: "Charnière",
          quantity: door.hinges ? door.hinges.length : 2
        });
      }
    });
    
    // Coulisses pour tiroirs
    furniture.layout.drawers.forEach((drawer, drawerIndex) => {
      hardware.push({
        description: `Coulisses pour tiroir ${drawerIndex + 1}`,
        type: `Coulisse ${drawer.slides || 'standard'}`,
        quantity: 1 // Une paire
      });
    });
    
    // Tringles et supports
    furniture.layout.hangingRods.forEach((rod, rodIndex) => {
      hardware.push({
        description: `Tringle penderie ${rodIndex + 1}`,
        type: `Tringle ${rod.material || 'chrome'} Ø${rod.diameter || 25}mm`,
        quantity: 1,
        length: rod.width
      });
      
      hardware.push({
        description: `Supports tringle ${rodIndex + 1}`,
        type: "Support tringle",
        quantity: rod.supports || 2
      });
    });
    
    // Poignées et boutons
    furniture.layout.doors.forEach((door, doorIndex) => {
      if (door.handle) {
        hardware.push({
          description: `Poignée porte ${doorIndex + 1}`,
          type: door.handle.type || "Poignée standard",
          quantity: 1
        });
      }
    });
    
    furniture.layout.drawers.forEach((drawer, drawerIndex) => {
      if (drawer.handle) {
        hardware.push({
          description: `Poignée tiroir ${drawerIndex + 1}`,
          type: drawer.handle.type || "Poignée standard",
          quantity: 1
        });
      }
    });
    
    return {
      panels,
      hardware,
      statistics
    };
  }
}));

// ========== FONCTIONS DE GÉNÉRATION ==========

// Génération de l'environnement (murs, sol, plafond)
function generateEnvironment(room) {
  const objects = [];
  
  // Convertir les dimensions en unités Three.js
  const widthUnits = furnitureUtils.mmToUnits(room.width);
  const heightUnits = furnitureUtils.mmToUnits(room.height);
  const depthUnits = furnitureUtils.mmToUnits(room.depth);
  
  // Ajouter le sol
  if (room.floor.visible) {
    objects.push({
      id: `floor_${furnitureUtils.generateId()}`,
      type: 'floor',
      position: [0, 0, 0],
      rotation: [-Math.PI / 2, 0, 0],
      dimensions: {
        width: widthUnits,
        height: depthUnits
      },
      color: room.floor.color,
      texture: room.floor.texture
    });
  }
  
  // Ajouter le plafond
  if (room.ceiling.visible) {
    objects.push({
      id: `ceiling_${furnitureUtils.generateId()}`,
      type: 'ceiling',
      position: [0, heightUnits, 0],
      rotation: [-Math.PI / 2, 0, 0],
      dimensions: {
        width: widthUnits,
        height: depthUnits
      },
      color: room.ceiling.color,
      texture: room.ceiling.texture
    });
  }
  
  // Ajouter les murs
  
  // Mur du fond
  if (room.walls.back.visible) {
    const wallThickness = furnitureUtils.mmToUnits(room.walls.back.thickness);
    
    objects.push({
      id: `wall_back_${furnitureUtils.generateId()}`,
      type: 'wall',
      position: [0, heightUnits / 2, -depthUnits / 2 - wallThickness / 2],
      rotation: [0, 0, 0],
      dimensions: {
        width: widthUnits,
        height: heightUnits,
        depth: wallThickness
      },
      color: room.walls.back.color,
      texture: room.walls.back.texture,
      wallType: 'back'
    });
  }
  
  // Mur gauche
  if (room.walls.left.visible) {
    const wallThickness = furnitureUtils.mmToUnits(room.walls.left.thickness);
    
    objects.push({
      id: `wall_left_${furnitureUtils.generateId()}`,
      type: 'wall',
      position: [-widthUnits / 2 - wallThickness / 2, heightUnits / 2, 0],
      rotation: [0, Math.PI / 2, 0],
      dimensions: {
        width: depthUnits,
        height: heightUnits,
        depth: wallThickness
      },
      color: room.walls.left.color,
      texture: room.walls.left.texture,
      wallType: 'left'
    });
  }
  
  // Mur droit
  if (room.walls.right.visible) {
    const wallThickness = furnitureUtils.mmToUnits(room.walls.right.thickness);
    
    objects.push({
      id: `wall_right_${furnitureUtils.generateId()}`,
      type: 'wall',
      position: [widthUnits / 2 + wallThickness / 2, heightUnits / 2, 0],
      rotation: [0, -Math.PI / 2, 0],
      dimensions: {
        width: depthUnits,
        height: heightUnits,
        depth: wallThickness
      },
      color: room.walls.right.color,
      texture: room.walls.right.texture,
      wallType: 'right'
    });
  }
  
  return objects;
}

// Génération du meuble avec prise en compte des options d'affichage
function generateFurniture(furniture, displayOptions = {}) {
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

// Génération des lignes de cotation
function generateDimensionLines(room, furniture) {
  const dimensionLines = [];
  
  // Convertir les dimensions en unités Three.js
  const roomWidthUnits = furnitureUtils.mmToUnits(room.width);
  const roomHeightUnits = furnitureUtils.mmToUnits(room.height);
  const roomDepthUnits = furnitureUtils.mmToUnits(room.depth);
  
  const furnitureWidthUnits = furnitureUtils.mmToUnits(furniture.dimensions.width);
  const furnitureHeightUnits = furnitureUtils.mmToUnits(furniture.dimensions.height);
  const furnitureDepthUnits = furnitureUtils.mmToUnits(furniture.dimensions.depth);
  
  // Lignes de cotation de la pièce
  if (room.showDimensions) {
    // Largeur de la pièce
    dimensionLines.push({
      id: `room_width_dimension_${furnitureUtils.generateId()}`,
      type: 'dimensionLine',
      points: [
        [-roomWidthUnits/2, 0, roomDepthUnits/2 + 0.5],
        [roomWidthUnits/2, 0, roomDepthUnits/2 + 0.5]
      ],
      value: room.width,
      unit: 'mm',
      color: '#333333'
    });
    
    // Hauteur de la pièce
    dimensionLines.push({
      id: `room_height_dimension_${furnitureUtils.generateId()}`,
      type: 'dimensionLine',
      points: [
        [roomWidthUnits/2 + 0.5, 0, roomDepthUnits/2],
        [roomWidthUnits/2 + 0.5, roomHeightUnits, roomDepthUnits/2]
      ],
      value: room.height,
      unit: 'mm',
      color: '#333333'
    });
    
    // Profondeur de la pièce
    dimensionLines.push({
      id: `room_depth_dimension_${furnitureUtils.generateId()}`,
      type: 'dimensionLine',
      points: [
        [roomWidthUnits/2, 0, -roomDepthUnits/2],
        [roomWidthUnits/2, 0, roomDepthUnits/2]
      ],
      value: room.depth,
      unit: 'mm',
      color: '#333333'
    });
  }
  
  // Lignes de cotation du meuble
  dimensionLines.push({
    id: `furniture_width_dimension_${furnitureUtils.generateId()}`,
    type: 'dimensionLine',
    points: [
      [-furnitureWidthUnits/2, 0, furnitureDepthUnits/2 + 0.2],
      [furnitureWidthUnits/2, 0, furnitureDepthUnits/2 + 0.2]
    ],
    value: furniture.dimensions.width,
    unit: 'mm',
    color: '#0066CC'
  });
  
  dimensionLines.push({
    id: `furniture_height_dimension_${furnitureUtils.generateId()}`,
    type: 'dimensionLine',
    points: [
      [furnitureWidthUnits/2 + 0.2, 0, furnitureDepthUnits/2],
      [furnitureWidthUnits/2 + 0.2, furnitureHeightUnits, furnitureDepthUnits/2]
    ],
    value: furniture.dimensions.height,
    unit: 'mm',
    color: '#0066CC'
  });
  
  dimensionLines.push({
    id: `furniture_depth_dimension_${furnitureUtils.generateId()}`,
    type: 'dimensionLine',
    points: [
      [furnitureWidthUnits/2, 0, -furnitureDepthUnits/2],
      [furnitureWidthUnits/2, 0, furnitureDepthUnits/2]
    ],
    value: furniture.dimensions.depth,
    unit: 'mm',
    color: '#0066CC'
  });
  
  return dimensionLines;
}

// Génération des zones interactives pour la sélection intérieure
function generateInteriorZones(furniture) {
  const zones = [];
  
  // Convertir les dimensions en unités Three.js
  const widthUnits = furnitureUtils.mmToUnits(furniture.dimensions.width);
  const heightUnits = furnitureUtils.mmToUnits(furniture.dimensions.height);
  const depthUnits = furnitureUtils.mmToUnits(furniture.dimensions.depth);
  const thicknessUnits = furnitureUtils.mmToUnits(furniture.construction.panelThickness);
  const plinthHeightUnits = furniture.construction.hasPlinths ? 
    furnitureUtils.mmToUnits(furniture.construction.plinthHeight) : 0;
  
  // Zone complète du meuble
  zones.push({
    id: `zone_full_${furnitureUtils.generateId()}`,
    name: 'Meuble complet',
    type: 'full',
    width: widthUnits - thicknessUnits * 2,
    height: heightUnits - thicknessUnits * 2,
    depth: depthUnits - thicknessUnits,
    position: {
      x: 0,
      y: plinthHeightUnits + heightUnits / 2,
      z: 0
    }
  });
  
  // Si des séparations verticales existent, créer des zones entre elles
  if (furniture.layout.verticalSeparators && furniture.layout.verticalSeparators.length > 0) {
    // Trier les séparations par position
    const sortedSeparators = [...furniture.layout.verticalSeparators]
      .sort((a, b) => a.position - b.position);
    
    // Ajouter une "séparation" virtuelle pour le côté gauche
    const leftWall = {
      position: 0,
      thickness: furniture.construction.panelThickness
    };
    
    // Ajouter une "séparation" virtuelle pour le côté droit
    const rightWall = {
      position: furniture.dimensions.width,
      thickness: furniture.construction.panelThickness
    };
    
    // Liste complète incluant les parois latérales
    const allDividers = [leftWall, ...sortedSeparators, rightWall];
    
    // Créer des zones entre chaque paire de séparations
    for (let i = 0; i < allDividers.length - 1; i++) {
      const left = allDividers[i];
      const right = allDividers[i + 1];
      
      const leftPos = furnitureUtils.mmToUnits(left.position);
      const rightPos = furnitureUtils.mmToUnits(right.position);
      const leftThickness = furnitureUtils.mmToUnits(left.thickness || furniture.construction.panelThickness);
      const rightThickness = furnitureUtils.mmToUnits(right.thickness || furniture.construction.panelThickness);
      
      const zoneWidth = rightPos - leftPos - leftThickness / 2 - rightThickness / 2;
      const zonePosX = leftPos + leftThickness / 2 + zoneWidth / 2;
      
      zones.push({
        id: `zone_section_${i}_${furnitureUtils.generateId()}`,
        name: `Section ${i + 1}`,
        type: 'section',
        width: zoneWidth,
        height: heightUnits - thicknessUnits * 2,
        depth: depthUnits - thicknessUnits,
        position: {
          x: zonePosX - widthUnits / 2, // Centrer dans le repère du meuble
          y: plinthHeightUnits + heightUnits / 2,
          z: 0
        },
        leftBoundary: left.id,
        rightBoundary: right.id
      });
    }
  }
  
  return zones;
}

// Calcul des statistiques du meuble
function calculateFurnitureStatistics(furniture) {
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

export { useFurnitureStore };