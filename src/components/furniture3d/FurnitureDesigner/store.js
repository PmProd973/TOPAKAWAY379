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
    width: 4000,  // mm
    height: 2500,  // mm
    depth: 3000,   // mm
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
      width: 1200,   // mm
      height: 2000,  // mm
      depth: 600,    // mm
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
      sidesOverlapTopBottom: false, // Nouvelle propriété
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
    showShadows: true,
    showWireframe: false,
    furnitureOpacity: 1.0, // Nouvelle propriété (1.0 = opaque, 0.0 = transparent)
    backgroundColor: "#F0F0F0"
  },
  
  // Position de la caméra
  cameraPosition: [400, 400, 400],
  cameraTarget: [0, 0, 0],
  
  // Mode d'édition
  editMode: 'select', // 'select', 'add', 'move', 'resize', 'delete'
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
  
  // Actions pour la pièce
  updateRoomDimensions: (dimension, value) => {
    if (typeof dimension === 'string' && dimension.includes('.')) {
      // Gestion des props imbriquées comme 'walls.left.thickness'
      const props = dimension.split('.');
      set((state) => {
        const newState = { ...state };
        let current = newState.room;
        
        for (let i = 0; i < props.length - 1; i++) {
          current = current[props[i]];
        }
        
        current[props[props.length - 1]] = value;
        return newState;
      });
    } else {
      // Prop simple
      set((state) => ({
        room: {
          ...state.room,
          [dimension]: value
        }
      }));
    }
    
    get().regenerateScene();
    get().markAsDirty();
  },
  
  toggleWallVisibility: (wall) => {
    set((state) => ({
      room: {
        ...state.room,
        walls: {
          ...state.room.walls,
          [wall]: {
            ...state.room.walls[wall],
            visible: !state.room.walls[wall].visible
          }
        }
      }
    }));
    get().regenerateScene();
    get().markAsDirty();
  },
  
  updateWallColor: (wall, color) => {
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
    get().regenerateScene();
    get().markAsDirty();
  },
  
  toggleFloorVisibility: () => {
    set((state) => ({
      room: {
        ...state.room,
        floor: {
          ...state.room.floor,
          visible: !state.room.floor.visible
        }
      }
    }));
    get().regenerateScene();
    get().markAsDirty();
  },
  
  updateFloorColor: (color) => {
    set((state) => ({
      room: {
        ...state.room,
        floor: {
          ...state.room.floor,
          color: color
        }
      }
    }));
    get().regenerateScene();
    get().markAsDirty();
  },
  
  toggleCeilingVisibility: () => {
    set((state) => ({
      room: {
        ...state.room,
        ceiling: {
          ...state.room.ceiling,
          visible: !state.room.ceiling.visible
        }
      }
    }));
    get().regenerateScene();
    get().markAsDirty();
  },
  
  toggleDimensionsVisibility: () => {
    set((state) => ({
      displayOptions: {
        ...state.displayOptions,
        showDimensions: !state.displayOptions.showDimensions
      }
    }));
    get().regenerateScene();
  },
  
  // Actions pour le meuble
  updateFurnitureDimensions: (dimension, value) => {
    set((state) => ({
      furniture: {
        ...state.furniture,
        dimensions: {
          ...state.furniture.dimensions,
          [dimension]: value
        }
      }
    }));
    get().regenerateScene();
    get().markAsDirty();
  },
  
  updateFurniturePosition: (axis, value) => {
    set((state) => ({
      furniture: {
        ...state.furniture,
        position: {
          ...state.furniture.position,
          [axis]: value
        }
      }
    }));
    get().regenerateScene();
    get().markAsDirty();
  },
  
  updateFurnitureRotation: (x, y, z) => {
    set((state) => ({
      furniture: {
        ...state.furniture,
        rotation: { x, y, z }
      }
    }));
    get().regenerateScene();
    get().markAsDirty();
  },
  
  updateFurniturePlacement: (property, value) => {
    set((state) => ({
      furniture: {
        ...state.furniture,
        placement: {
          ...state.furniture.placement,
          [property]: value
        }
      }
    }));
    get().markAsDirty();
  },
  
  updateFurnitureType: (type) => {
    set((state) => ({
      furniture: {
        ...state.furniture,
        type
      }
    }));
    get().regenerateScene();
    get().markAsDirty();
  },
  
  setFurnitureMaterial: (materialId) => {
    set((state) => ({
      furniture: {
        ...state.furniture,
        material: materialId
      }
    }));
    get().regenerateScene();
    get().markAsDirty();
  },
  
  updateConstructionOption: (option, value) => {
    set((state) => ({
      furniture: {
        ...state.furniture,
        construction: {
          ...state.furniture.construction,
          [option]: value
        }
      }
    }));
    get().regenerateScene();
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
  
  updateVerticalSeparator: (id, props) => {
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
    
    get().regenerateScene();
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
  
  updateShelf: (id, props) => {
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
    
    get().regenerateScene();
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
  
  updateDrawer: (id, props) => {
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
    
    get().regenerateScene();
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
  
  updateHangingRod: (id, props) => {
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
    
    get().regenerateScene();
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
  
  updateDoor: (id, props) => {
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
    
    get().regenerateScene();
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
  
  // Gestion des options d'affichage
  setDisplayOption: (option, value) => {
    set((state) => ({
      displayOptions: {
        ...state.displayOptions,
        [option]: value
      }
    }));
    get().regenerateScene();
  },
  
  // Régénération de la scène 3D
  regenerateScene: () => {
    const { room, furniture, displayOptions } = get();
    const sceneObjects = [];
    
    // Générer les murs, le sol, etc.
    const environmentObjects = generateEnvironment(room);
    sceneObjects.push(...environmentObjects);
    
    // Générer le meuble principal
    const furnitureObjects = generateFurniture(furniture);
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
    
    set({ 
      sceneObjects,
      dimensionLines,
      interiorZones,
      statistics
    });
  },
  
  // Actions pour la sélection
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),
  
  // Actions pour le mode d'édition
  setEditMode: (mode) => set({ editMode: mode }),
  setCurrentTool: (tool) => set({ currentTool: tool }),
  
  // Gestion caméra
  setCameraPosition: (position) => set({ cameraPosition: position }),
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
    
    set({
      projectInfo: projectData.projectInfo || get().projectInfo,
      room: projectData.room || get().room,
      furniture: projectData.furniture || get().furniture,
      displayOptions: projectData.displayOptions || get().displayOptions,
      isDirty: false,
      lastSaved: new Date()
    });
    
    get().regenerateScene();
    get().addToHistory();
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

// Génération du meuble
function generateFurniture(furniture) {
  // Convertir les dimensions en unités Three.js
  const widthUnits = furnitureUtils.mmToUnits(furniture.dimensions.width);
  const heightUnits = furnitureUtils.mmToUnits(furniture.dimensions.height);
  const depthUnits = furnitureUtils.mmToUnits(furniture.dimensions.depth);
  const thicknessUnits = furnitureUtils.mmToUnits(furniture.construction.panelThickness);
  const plinthHeightUnits = furniture.construction.hasPlinths ? 
    furnitureUtils.mmToUnits(furniture.construction.plinthHeight) : 0;
  
    // Dans la fonction generateFurniture, avant de créer le groupe
const opacity = furniture.displayOptions?.furnitureOpacity !== undefined 
? furniture.displayOptions.furnitureOpacity 
: 1.0;
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
  ////*******MODIFICATION_POUR_DESSUS_EN_RECOUVREMENT*****/

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
    opacity: opacity // Ajout de l'opacité
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
    opacity: opacity // Ajout de l'opacité
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
    opacity: opacity // Ajout de l'opacité
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
    opacity: opacity // Ajout de l'opacité
  },
  position: [0, plinthHeightUnits + thicknessUnits/2, 0],
  dimensions: {
    width: topBottomWidth,
    height: thicknessUnits,
    depth: depthUnits
  }
});
  
  // Plinthes
 // Plinthes avec retraits indépendants et côtés
if (furniture.construction.hasPlinths) {
  const plinthInsets = furniture.construction.plinthInsets || { front: 0, back: 0, left: 0, right: 0 };
  const plinthHeightUnits = furnitureUtils.mmToUnits(furniture.construction.plinthHeight);
  
  // Calcul de la largeur des plinthes en fonction des côtés
  const plinthWidthAdjustment = sidesExtendToFloor ? thicknessUnits * 2 : 0;
  const plinthLeftInset = sidesExtendToFloor ? 0 : furnitureUtils.mmToUnits(plinthInsets.left);
  const plinthRightInset = sidesExtendToFloor ? 0 : furnitureUtils.mmToUnits(plinthInsets.right);
  
  // Plinthe avant
  objects.push({
    id: `plinth_front_${furnitureUtils.generateId()}`,
    type: 'piece',
    piece: {
      description: 'Plinthe avant',
      material: furniture.material,
      edgeBanding: {
        front: false,
        back: true,
        left: !sidesExtendToFloor,
        right: !sidesExtendToFloor,
        top: true
      },
      opacity: opacity // Ajout de l'opacité
    },
    position: [0, plinthHeightUnits/2, depthUnits/2 - thicknessUnits/2 - furnitureUtils.mmToUnits(plinthInsets.front)],
    dimensions: {
      width: widthUnits - plinthWidthAdjustment - plinthLeftInset - plinthRightInset,
      height: plinthHeightUnits,
      depth: thicknessUnits
    }
  });
  
  // Plinthe arrière
  objects.push({
    id: `plinth_back_${furnitureUtils.generateId()}`,
    type: 'piece',
    piece: {
      description: 'Plinthe arrière',
      material: furniture.material,
      edgeBanding: {
        front: true,
        back: false,
        left: !sidesExtendToFloor,
        right: !sidesExtendToFloor,
        top: true
      },
      opacity: opacity // Ajout de l'opacité
    },
    position: [0, plinthHeightUnits/2, -depthUnits/2 + thicknessUnits/2 + furnitureUtils.mmToUnits(plinthInsets.back)],
    dimensions: {
      width: widthUnits - plinthWidthAdjustment - plinthLeftInset - plinthRightInset,
      height: plinthHeightUnits,
      depth: thicknessUnits
    }
  });
  
  // Ajouter les côtés du socle uniquement si les côtés du meuble ne vont pas jusqu'au sol
 // Ajouter les côtés du socle uniquement si l'option est activée
if (furniture.construction.socleSideSupports) {
  const plinthInsets = furniture.construction.plinthInsets || { front: 0, back: 0, left: 0, right: 0 };
  const frontInsetUnits = furnitureUtils.mmToUnits(plinthInsets.front);
  const backInsetUnits = furnitureUtils.mmToUnits(plinthInsets.back);
  const leftInsetUnits = furnitureUtils.mmToUnits(plinthInsets.left);
  const rightInsetUnits = furnitureUtils.mmToUnits(plinthInsets.right);
  
  // Côté gauche du socle - Attention aux positions et dimensions
  const leftSideDepth = depthUnits - frontInsetUnits - backInsetUnits - thicknessUnits * 2;
  const leftSidePosZ = (frontInsetUnits - backInsetUnits) / 2;
  
  objects.push({
    id: `socle_side_left_${furnitureUtils.generateId()}`,
    type: 'piece',
    piece: {
      description: 'Côté gauche socle',
      material: furniture.material,
      edgeBanding: {
        top: true,
        bottom: false,
        front: true,
        back: true
      },
      opacity: opacity // Ajout de l'opacité
    },
    position: [
      -widthUnits/2 + thicknessUnits/2 + leftInsetUnits,
      plinthHeightUnits/2,
      leftSidePosZ
    ],
    dimensions: {
      width: thicknessUnits,
      height: plinthHeightUnits,
      depth: leftSideDepth > 0 ? leftSideDepth : thicknessUnits // Assurer une profondeur minimale
    }
  });
  
  // Côté droit du socle - Même logique
  const rightSideDepth = depthUnits - frontInsetUnits - backInsetUnits - thicknessUnits * 2;
  const rightSidePosZ = (frontInsetUnits - backInsetUnits) / 2;
  
  objects.push({
    id: `socle_side_right_${furnitureUtils.generateId()}`,
    type: 'piece',
    piece: {
      description: 'Côté droit socle',
      material: furniture.material,
      edgeBanding: {
        top: true,
        bottom: false,
        front: true,
        back: true
      },
      opacity: opacity // Ajout de l'opacité
    },
    position: [
      widthUnits/2 - thicknessUnits/2 - rightInsetUnits,
      plinthHeightUnits/2,
      rightSidePosZ
    ],
    dimensions: {
      width: thicknessUnits,
      height: plinthHeightUnits,
      depth: rightSideDepth > 0 ? rightSideDepth : thicknessUnits // Assurer une profondeur minimale
    }
  });
}
  
    
 // Socle avec séparations verticales
const socleSupports = furniture.construction.socleSupports || 0;
if (socleSupports > 0) {
  const plinthInsets = furniture.construction.plinthInsets || { front: 0, back: 0, left: 0, right: 0 };
  const frontInsetUnits = furnitureUtils.mmToUnits(plinthInsets.front);
  const backInsetUnits = furnitureUtils.mmToUnits(plinthInsets.back);
  const leftInsetUnits = furnitureUtils.mmToUnits(plinthInsets.left);
  const rightInsetUnits = furnitureUtils.mmToUnits(plinthInsets.right);
  
  // Calculer l'espacement entre les séparations
  const availableWidth = widthUnits - thicknessUnits * 2 - leftInsetUnits - rightInsetUnits;
  const spacing = availableWidth / (socleSupports + 1);
  
  // Calculer le décalage Z pour centrer
  const zOffset = (frontInsetUnits - backInsetUnits) / 2;
  const supportDepth = depthUnits - frontInsetUnits - backInsetUnits - thicknessUnits * 2;
  
  // Ajouter les séparations verticales
  for (let i = 1; i <= socleSupports; i++) {
    const xPos = -availableWidth/2 + spacing * i + (leftInsetUnits - rightInsetUnits) / 2;
    
    objects.push({
      id: `socle_support_${i}_${furnitureUtils.generateId()}`,
      type: 'piece',
      piece: {
        description: `Support socle ${i}`,
        material: furniture.material,
        edgeBanding: {
          top: true,
          bottom: false
        },
        opacity: opacity // Ajout de l'opacité
      },
      position: [xPos, plinthHeightUnits/2, zOffset],
      dimensions: {
        width: thicknessUnits,
        height: plinthHeightUnits,
        depth: supportDepth > 0 ? supportDepth : thicknessUnits
      }
    });
  }
  
  // Dessus de socle (panneau ou traverses)
  if (furniture.construction.socleTopType === 'panel') {
    // Panneau complet
    objects.push({
      id: `socle_top_${furnitureUtils.generateId()}`,
      type: 'piece',
      piece: {
        description: 'Dessus de socle',
        material: furniture.material,
        edgeBanding: {
          front: true,
          back: true
        },
        opacity: opacity // Ajout de l'opacité
      },
      position: [
        (leftInsetUnits - rightInsetUnits) / 2, 
        plinthHeightUnits, 
        zOffset
      ],
      dimensions: {
        width: widthUnits - thicknessUnits * 2 - leftInsetUnits - rightInsetUnits,
        height: thicknessUnits,
        depth: supportDepth
      }
    });
  } else if (furniture.construction.socleTopType === 'traverses') {
    // Traverses avant et arrière
    const traverseWidthUnits = furnitureUtils.mmToUnits(furniture.construction.socleTraverseWidth || 60);
    
    // Traverse avant
    objects.push({
      id: `socle_traverse_front_${furnitureUtils.generateId()}`,
      type: 'piece',
      piece: {
        description: 'Traverse avant socle',
        material: furniture.material,
        edgeBanding: {
          front: true,
          back: false,
          left: true,
          right: true
        },
        opacity: opacity // Ajout de l'opacité
      },
      position: [
        (leftInsetUnits - rightInsetUnits) / 2, 
        plinthHeightUnits, 
        depthUnits/2 - frontInsetUnits - thicknessUnits - traverseWidthUnits/2
      ],
      dimensions: {
        width: widthUnits - thicknessUnits * 2 - leftInsetUnits - rightInsetUnits,
        height: thicknessUnits,
        depth: traverseWidthUnits
      }
    });
    
    // Traverse arrière
    objects.push({
      id: `socle_traverse_back_${furnitureUtils.generateId()}`,
      type: 'piece',
      piece: {
        description: 'Traverse arrière socle',
        material: furniture.material,
        edgeBanding: {
          front: false,
          back: true,
          left: true,
          right: true
        },
        opacity: opacity // Ajout de l'opacité
      },
      position: [
        (leftInsetUnits - rightInsetUnits) / 2, 
        plinthHeightUnits, 
        -depthUnits/2 + backInsetUnits + thicknessUnits + traverseWidthUnits/2
      ],
      dimensions: {
        width: widthUnits - thicknessUnits * 2 - leftInsetUnits - rightInsetUnits,
        height: thicknessUnits,
        depth: traverseWidthUnits
      }
    });
  }
}
}
  ///******FOND_EN_BAS*******/
 
  
  // Panneau arrière
if (furniture.construction.hasBackPanel) {
  const backThicknessUnits = furnitureUtils.mmToUnits(furniture.construction.backPanelThickness);
  const backInsetUnits = furnitureUtils.mmToUnits(furniture.construction.backPanelInset || 0);
  const backGapUnits = furnitureUtils.mmToUnits(furniture.construction.backPanelGap || 0);
  const backOverhangUnits = furnitureUtils.mmToUnits(furniture.construction.backPanelOverhang || 0);
  const backPanelThrough = furniture.construction.backPanelThrough || { top: false, bottom: false, left: false, right: false };
  const backPanelGroove = furniture.construction.backPanelGroove || { top: false, bottom: false, left: false, right: false };
  
  // Calculer les dimensions et position du panneau arrière
  let backWidth = widthUnits - thicknessUnits * 2;
  let backHeight = heightUnits - thicknessUnits * 2;
  let backPosX = 0;
  let backPosY = plinthHeightUnits + heightUnits/2;
  let backPosZ = -depthUnits/2 + backThicknessUnits/2 + backInsetUnits;
  
  // Ajuster selon les options de traverse
  if (backPanelThrough.left) {
    backWidth += thicknessUnits;
    backPosX -= thicknessUnits/2;
  }
  
  if (backPanelThrough.right) {
    backWidth += thicknessUnits;
    backPosX += thicknessUnits/2;
  }
  
  if (backPanelThrough.top) {
    backHeight += thicknessUnits;
    backPosY += thicknessUnits/2;
  }
  
  if (backPanelThrough.bottom) {
    backHeight += thicknessUnits;
    backPosY -= thicknessUnits/2;
  }
  
  // Ajouter le panneau arrière
  objects.push({
    id: `back_panel_${furnitureUtils.generateId()}`,
    type: 'piece',
    piece: {
      description: 'Panneau arrière',
      material: furniture.material,
      edgeBanding: {
        front: false,
        back: false,
        left: backPanelThrough.left,
        right: backPanelThrough.right,
        top: backPanelThrough.top,
        bottom: backPanelThrough.bottom
      },
      backPanel: true,
      inset: backInsetUnits,
      gap: backGapUnits,
      overhang: backOverhangUnits
    },
    position: [backPosX, backPosY, backPosZ],
    dimensions: {
      width: backWidth,
      height: backHeight,
      depth: backThicknessUnits
    }
  });
  
  // Ajuster les dimensions et ajouter des rainures au besoin
  
  // Dessus
  if (backPanelThrough.top) {
    // Trouver le dessus
    const topPiece = objects.find(obj => obj.piece && obj.piece.description === 'Dessus');
    if (topPiece) {
      if (backPanelGroove.top) {
        // Créer une rainure si option activée
        topPiece.piece.backGroove = {
          depth: backThicknessUnits + backGapUnits,
          offset: backInsetUnits,
          overhang: backOverhangUnits
        };
      } else {
        // Si pas de rainure, réduire la profondeur et décaler la position Z
        topPiece.dimensions.depth -= (backThicknessUnits + backInsetUnits);
        topPiece.position[2] += (backThicknessUnits + backInsetUnits) / 2;
      }
    }
  }
  
  // Dessous
  if (backPanelThrough.bottom) {
    // Trouver le fond
    const bottomPiece = objects.find(obj => obj.piece && obj.piece.description === 'Fond');
    if (bottomPiece) {
      if (backPanelGroove.bottom) {
        // Créer une rainure si option activée
        bottomPiece.piece.backGroove = {
          depth: backThicknessUnits + backGapUnits,
          offset: backInsetUnits,
          overhang: backOverhangUnits
        };
      } else {
        // Si pas de rainure, réduire la profondeur et décaler la position Z
        bottomPiece.dimensions.depth -= (backThicknessUnits + backInsetUnits);
        bottomPiece.position[2] += (backThicknessUnits + backInsetUnits) / 2;
      }
    }
  }
  
  // Côté gauche
  if (backPanelThrough.left) {
    // Trouver le côté gauche
    const leftPiece = objects.find(obj => obj.piece && obj.piece.description === 'Côté gauche');
    if (leftPiece) {
      if (backPanelGroove.left) {
        // Créer une rainure si option activée
        leftPiece.piece.backGroove = {
          depth: backThicknessUnits + backGapUnits,
          offset: backInsetUnits,
          overhang: backOverhangUnits
        };
      } else {
        // Si pas de rainure, réduire la profondeur et décaler la position Z
        leftPiece.dimensions.depth -= (backThicknessUnits + backInsetUnits);
        leftPiece.position[2] += (backThicknessUnits + backInsetUnits) / 2;
      }
    }
  }
  
  // Côté droit
  if (backPanelThrough.right) {
    // Trouver le côté droit
    const rightPiece = objects.find(obj => obj.piece && obj.piece.description === 'Côté droit');
    if (rightPiece) {
      if (backPanelGroove.right) {
        // Créer une rainure si option activée
        rightPiece.piece.backGroove = {
          depth: backThicknessUnits + backGapUnits,
          offset: backInsetUnits,
          overhang: backOverhangUnits
        };
      } else {
        // Si pas de rainure, réduire la profondeur et décaler la position Z
        rightPiece.dimensions.depth -= (backThicknessUnits + backInsetUnits);
        rightPiece.position[2] += (backThicknessUnits + backInsetUnits) / 2;
      }
    }
  }
}
    
  
  // Ajouter les séparations verticales
  if (furniture.layout.verticalSeparators && furniture.layout.verticalSeparators.length > 0) {
    furniture.layout.verticalSeparators.forEach(separator => {
      const separatorPosition = furnitureUtils.mmToUnits(separator.position);
      const separatorThickness = furnitureUtils.mmToUnits(separator.thickness || furniture.construction.panelThickness);
      
      objects.push({
        id: separator.id || `separator_${furnitureUtils.generateId()}`,
        type: 'piece',
        piece: {
          description: 'Séparation verticale',
          material: separator.material || furniture.material,
          edgeBanding: {
            front: true,
            back: false,
            top: true,
            bottom: true
          }
        },
        position: [separatorPosition, plinthHeightUnits + heightUnits/2, 0],
        dimensions: {
          width: separatorThickness,
          height: heightUnits - thicknessUnits,
          depth: depthUnits - thicknessUnits
        }
      });
    });
  }
  
  // Ajouter les étagères
  if (furniture.layout.shelves && furniture.layout.shelves.length > 0) {
    furniture.layout.shelves.forEach(shelf => {
      const shelfPosition = furnitureUtils.mmToUnits(shelf.position);
      const shelfWidth = furnitureUtils.mmToUnits(shelf.width);
      const shelfDepth = furnitureUtils.mmToUnits(shelf.depth || furniture.dimensions.depth);
      const shelfThickness = furnitureUtils.mmToUnits(shelf.thickness || furniture.construction.panelThickness);
      const shelfXPosition = furnitureUtils.mmToUnits(shelf.xPosition || 0);
      
      objects.push({
        id: shelf.id || `shelf_${furnitureUtils.generateId()}`,
        type: 'piece',
        piece: {
          description: 'Étagère',
          material: shelf.material || furniture.material,
          edgeBanding: shelf.edgeBanding || {
            front: true,
            back: false,
            left: false,
            right: false
          }
        },
        position: [shelfXPosition, plinthHeightUnits + shelfPosition, 0],
        dimensions: {
          width: shelfWidth,
          height: shelfThickness,
          depth: shelfDepth
        }
      });
    });
  }
  
  // Ajouter les tiroirs
  if (furniture.layout.drawers && furniture.layout.drawers.length > 0) {
    furniture.layout.drawers.forEach(drawer => {
      const drawerPosition = furnitureUtils.mmToUnits(drawer.position);
      const drawerWidth = furnitureUtils.mmToUnits(drawer.width);
      const drawerHeight = furnitureUtils.mmToUnits(drawer.height);
      const drawerDepth = furnitureUtils.mmToUnits(drawer.depth);
      const drawerThickness = furnitureUtils.mmToUnits(drawer.thickness || furniture.construction.panelThickness);
      const drawerXPosition = furnitureUtils.mmToUnits(drawer.xPosition || 0);
      
      // Face avant du tiroir
      objects.push({
        id: `drawer_front_${drawer.id || furnitureUtils.generateId()}`,
        type: 'piece',
        piece: {
          description: 'Face de tiroir',
          material: drawer.frontMaterial || furniture.material,
          edgeBanding: {
            all: true
          }
        },
        position: [drawerXPosition, plinthHeightUnits + drawerPosition, depthUnits/2 - drawerThickness/2],
        dimensions: {
          width: drawerWidth,
          height: drawerHeight,
          depth: drawerThickness
        }
      });
      
      // Corps du tiroir (côtés, fond, arrière - en version simplifiée)
      objects.push({
        id: `drawer_body_${drawer.id || furnitureUtils.generateId()}`,
        type: 'piece',
        piece: {
          description: 'Corps de tiroir',
          material: drawer.material || furniture.material,
          isDrawerBody: true
        },
        position: [drawerXPosition, plinthHeightUnits + drawerPosition, depthUnits/2 - drawerDepth/2 - drawerThickness],
        dimensions: {
          width: drawerWidth - drawerThickness * 2,
          height: drawerHeight - drawerThickness,
          depth: drawerDepth - drawerThickness
        }
      });
    });
  }
  
  // Ajouter les tringles de penderie
  if (furniture.layout.hangingRods && furniture.layout.hangingRods.length > 0) {
    furniture.layout.hangingRods.forEach(rod => {
      const rodPosition = furnitureUtils.mmToUnits(rod.position);
      const rodWidth = furnitureUtils.mmToUnits(rod.width);
      const rodDiameter = furnitureUtils.mmToUnits(rod.diameter || 25);
      const rodXPosition = furnitureUtils.mmToUnits(rod.xPosition || 0);
      
      objects.push({
        id: rod.id || `rod_${furnitureUtils.generateId()}`,
        type: 'rod',
        piece: {
          description: 'Tringle de penderie',
          material: rod.material || 'chrome'
        },
        position: [rodXPosition, plinthHeightUnits + rodPosition, 0],
        dimensions: {
          width: rodWidth,
          height: rodDiameter,
          depth: rodDiameter
        }
      });
    });
  }
  
  // Ajouter les portes
  if (furniture.layout.doors && furniture.layout.doors.length > 0) {
    furniture.layout.doors.forEach(door => {
      const doorWidth = furnitureUtils.mmToUnits(door.width);
      const doorHeight = furnitureUtils.mmToUnits(door.height);
      const doorThickness = furnitureUtils.mmToUnits(door.thickness || furniture.construction.panelThickness);
      const doorPosX = furnitureUtils.mmToUnits(door.position.x || 0);
      const doorPosY = furnitureUtils.mmToUnits(door.position.y || 0);
      
      objects.push({
        id: door.id || `door_${furnitureUtils.generateId()}`,
        type: 'door',
        piece: {
          description: 'Porte',
          material: door.material || furniture.material,
          edgeBanding: door.edgeBanding || { all: true },
          doorType: door.type || 'hinged',
          openDirection: door.openDirection || 'left'
        },
        position: [doorPosX, plinthHeightUnits + doorPosY, depthUnits/2 + doorThickness/2],
        dimensions: {
          width: doorWidth,
          height: doorHeight,
          depth: doorThickness
        }
      });
    });
  }
  
  // Ajouter tous les objets au groupe
  furnitureGroup.children = objects;
  
  // Retourner le groupe
  return [furnitureGroup];
}

// Génération des lignes de cotation
function generateDimensionLines(room, furniture) {
  const dimensionLines = [];
  
  // Dimensions du meuble
  const widthUnits = furnitureUtils.mmToUnits(furniture.dimensions.width);
  const heightUnits = furnitureUtils.mmToUnits(furniture.dimensions.height);
  const depthUnits = furnitureUtils.mmToUnits(furniture.dimensions.depth);
  const posX = furnitureUtils.mmToUnits(furniture.position.x);
  const posY = furnitureUtils.mmToUnits(furniture.position.y);
  const posZ = furnitureUtils.mmToUnits(furniture.position.z);
  
  // Rotation du meuble
  const rotation = [
    furniture.rotation?.x || 0,
    furniture.rotation?.y || 0,
    furniture.rotation?.z || 0
  ];
  
  // Largeur (horizontale en façade)
  dimensionLines.push({
    id: `dim_width_${furnitureUtils.generateId()}`,
    type: 'dimension',
    start: [posX - widthUnits/2, posY + heightUnits + 0.2, posZ + depthUnits/2],
    end: [posX + widthUnits/2, posY + heightUnits + 0.2, posZ + depthUnits/2],
    value: furniture.dimensions.width,
    orientation: 'horizontal',
    rotation: rotation
  });
  
  // Hauteur (verticale en façade)
  dimensionLines.push({
    id: `dim_height_${furnitureUtils.generateId()}`,
    type: 'dimension',
    start: [posX - widthUnits/2 - 0.2, posY, posZ + depthUnits/2],
    end: [posX - widthUnits/2 - 0.2, posY + heightUnits, posZ + depthUnits/2],
    value: furniture.dimensions.height,
    orientation: 'vertical',
    rotation: rotation
  });
  
  // Profondeur (horizontale sur le côté)
  dimensionLines.push({
    id: `dim_depth_${furnitureUtils.generateId()}`,
    type: 'dimension',
    start: [posX - widthUnits/2, posY + heightUnits + 0.2, posZ - depthUnits/2],
    end: [posX - widthUnits/2, posY + heightUnits + 0.2, posZ + depthUnits/2],
    value: furniture.dimensions.depth,
    orientation: 'depth',
    rotation: rotation
  });
  
  // Ajouter des dimensions pour les éléments intérieurs (séparations)
  if (furniture.layout.verticalSeparators && furniture.layout.verticalSeparators.length > 0) {
    // Trier par position pour les dimensions cumulatives
    const sortedSeps = [...furniture.layout.verticalSeparators].sort((a, b) => 
      a.position - b.position
    );
    
    // Dimension entre le bord gauche et la première séparation
    dimensionLines.push({
      id: `dim_sep_left_${furnitureUtils.generateId()}`,
      type: 'dimension',
      start: [posX - widthUnits/2, posY + heightUnits + 0.4, posZ],
      end: [posX + furnitureUtils.mmToUnits(sortedSeps[0].position), posY + heightUnits + 0.4, posZ],
      value: sortedSeps[0].position + furniture.dimensions.width/2,
      orientation: 'horizontal',
      rotation: rotation
    });
    
    // Dimensions entre séparations
    for (let i = 0; i < sortedSeps.length - 1; i++) {
      dimensionLines.push({
        id: `dim_sep_${i}_${furnitureUtils.generateId()}`,
        type: 'dimension',
        start: [posX + furnitureUtils.mmToUnits(sortedSeps[i].position), posY + heightUnits + 0.4, posZ],
        end: [posX + furnitureUtils.mmToUnits(sortedSeps[i+1].position), posY + heightUnits + 0.4, posZ],
        value: sortedSeps[i+1].position - sortedSeps[i].position,
        orientation: 'horizontal',
        rotation: rotation
      });
    }
    
    // Dimension entre la dernière séparation et le bord droit
    dimensionLines.push({
      id: `dim_sep_right_${furnitureUtils.generateId()}`,
      type: 'dimension',
      start: [posX + furnitureUtils.mmToUnits(sortedSeps[sortedSeps.length-1].position), posY + heightUnits + 0.4, posZ],
      end: [posX + widthUnits/2, posY + heightUnits + 0.4, posZ],
      value: furniture.dimensions.width/2 - sortedSeps[sortedSeps.length-1].position,
      orientation: 'horizontal',
      rotation: rotation
    });
  }
  
  // Dimensions pour les étagères
  if (furniture.layout.shelves && furniture.layout.shelves.length > 0) {
    // Trier par position verticale
    const sortedShelves = [...furniture.layout.shelves].sort((a, b) => 
      a.position - b.position
    );
    
    // Dimension pour chaque étagère (hauteur par rapport au sol)
    sortedShelves.forEach((shelf, index) => {
      dimensionLines.push({
        id: `dim_shelf_${index}_${furnitureUtils.generateId()}`,
        type: 'dimension',
        start: [posX - widthUnits/2 - 0.4, posY, posZ],
        end: [posX - widthUnits/2 - 0.4, posY + furnitureUtils.mmToUnits(shelf.position), posZ],
        value: shelf.position,
        orientation: 'vertical',
        rotation: rotation
      });
    });
  }
  
  return dimensionLines;
}

// Génération des zones intérieures pour la sélection
function generateInteriorZones(furniture) {
  const zones = [];
  
  // Convertir dimensions en unités Three.js
  const widthUnits = furnitureUtils.mmToUnits(furniture.dimensions.width);
  const heightUnits = furnitureUtils.mmToUnits(furniture.dimensions.height);
  const depthUnits = furnitureUtils.mmToUnits(furniture.dimensions.depth);
  const thicknessUnits = furnitureUtils.mmToUnits(furniture.construction.panelThickness);
  
  // Position du meuble
  const posX = furnitureUtils.mmToUnits(furniture.position.x);
  const posY = furnitureUtils.mmToUnits(furniture.position.y);
  const posZ = furnitureUtils.mmToUnits(furniture.position.z);
  
  // Créer un tableau de positions X basé sur les séparations verticales
  const xPositions = [-widthUnits/2 + thicknessUnits]; // Position gauche intérieure
  
  if (furniture.layout.verticalSeparators && furniture.layout.verticalSeparators.length > 0) {
    // Trier les séparations par position
    const sortedSeps = [...furniture.layout.verticalSeparators].sort((a, b) => a.position - b.position);
    
    sortedSeps.forEach(sep => {
      const sepPos = furnitureUtils.mmToUnits(sep.position);
      xPositions.push(sepPos);
    });
  }
  
  xPositions.push(widthUnits/2 - thicknessUnits); // Position droite intérieure
  
  // Créer un tableau de positions Y basé sur les étagères horizontales
  const yPositions = [thicknessUnits]; // Position basse intérieure
  
  if (furniture.layout.shelves && furniture.layout.shelves.length > 0) {
    // Trier les étagères par position
    const sortedShelves = [...furniture.layout.shelves].sort((a, b) => a.position - b.position);
    
    sortedShelves.forEach(shelf => {
      const shelfPos = furnitureUtils.mmToUnits(shelf.position);
      yPositions.push(shelfPos);
    });
  }
  
  yPositions.push(heightUnits - thicknessUnits); // Position haute intérieure
  
  // Générer une zone pour chaque compartiment
  for (let i = 0; i < xPositions.length - 1; i++) {
    for (let j = 0; j < yPositions.length - 1; j++) {
      const zoneWidth = xPositions[i + 1] - xPositions[i];
      const zoneHeight = yPositions[j + 1] - yPositions[j];
      
      zones.push({
        id: `zone_${i}_${j}_${furnitureUtils.generateId()}`,
        type: 'interiorZone',
        position: {
          x: xPositions[i] + zoneWidth/2,
          y: yPositions[j] + zoneHeight/2,
          z: 0
        },
        width: zoneWidth,
        height: zoneHeight,
        depth: depthUnits - thicknessUnits * 2,
        visualProperties: {
          opacity: 0.1, // Presque transparent par défaut
          color: '#88CCFF'
        }
      });
    }
  }
  
  return zones;
}

// Calcul des statistiques du meuble
function calculateFurnitureStatistics(furniture) {
  const stats = {
    totalPanels: 0,
    totalVolume: 0, // m³
    totalWeight: 0, // kg
    totalEdgeBanding: 0, // mm
    totalCost: 0,
    materialBreakdown: []
  };
  
  // Calcul du nombre total de panneaux et volumes
  
  // Caisson de base (2 côtés, dessus, fond)
  stats.totalPanels += 4;
  
  // Volume du côté gauche
  let volume = furnitureUtils.calculateVolume(
    furniture.construction.panelThickness,
    furniture.dimensions.height,
    furniture.dimensions.depth
  );
  stats.totalVolume += volume * 2; // Pour les deux côtés
  
  // Volume du dessus
  volume = furnitureUtils.calculateVolume(
    furniture.dimensions.width,
    furniture.construction.panelThickness,
    furniture.dimensions.depth
  );
  stats.totalVolume += volume;
  
  // Volume du fond
  volume = furnitureUtils.calculateVolume(
    furniture.dimensions.width - furniture.construction.panelThickness * 2,
    furniture.construction.panelThickness,
    furniture.dimensions.depth
  );
  stats.totalVolume += volume;
  
  // Panneau arrière si présent
  if (furniture.construction.hasBackPanel) {
    stats.totalPanels += 1;
    volume = furnitureUtils.calculateVolume(
      furniture.dimensions.width - furniture.construction.panelThickness * 2,
      furniture.dimensions.height - furniture.construction.panelThickness * 2,
      furniture.construction.backPanelThickness
    );
    stats.totalVolume += volume;
  }
  
  // Plinthes si présentes
  if (furniture.construction.hasPlinths) {
    stats.totalPanels += 2; // Avant et arrière
    // Volume des plinthes
    volume = furnitureUtils.calculateVolume(
      furniture.dimensions.width - furniture.construction.panelThickness * 2,
      furniture.construction.plinthHeight,
      furniture.construction.panelThickness
    );
    stats.totalVolume += volume * 2; // Pour les deux plinthes
  }
  
  // Séparations verticales
  if (furniture.layout.verticalSeparators && furniture.layout.verticalSeparators.length > 0) {
    stats.totalPanels += furniture.layout.verticalSeparators.length;
    
    furniture.layout.verticalSeparators.forEach(sep => {
      volume = furnitureUtils.calculateVolume(
        sep.thickness || furniture.construction.panelThickness,
        furniture.dimensions.height - furniture.construction.panelThickness,
        furniture.dimensions.depth - furniture.construction.panelThickness
      );
      stats.totalVolume += volume;
    });
  }
  
  // Étagères
  if (furniture.layout.shelves && furniture.layout.shelves.length > 0) {
    stats.totalPanels += furniture.layout.shelves.length;
    
    furniture.layout.shelves.forEach(shelf => {
      volume = furnitureUtils.calculateVolume(
        shelf.width,
        shelf.thickness || furniture.construction.panelThickness,
        shelf.depth || furniture.dimensions.depth
      );
      stats.totalVolume += volume;
    });
  }
  
  // Tiroirs
  if (furniture.layout.drawers && furniture.layout.drawers.length > 0) {
    // Chaque tiroir a 5 panneaux (face avant, 2 côtés, fond, arrière)
    stats.totalPanels += furniture.layout.drawers.length * 5;
    
    furniture.layout.drawers.forEach(drawer => {
      // Volume de la face avant
      volume = furnitureUtils.calculateVolume(
        drawer.width,
        drawer.height,
        drawer.thickness || furniture.construction.panelThickness
      );
      stats.totalVolume += volume;
      
      // Volume des côtés (x2)
      volume = furnitureUtils.calculateVolume(
        drawer.thickness || furniture.construction.panelThickness,
        drawer.height,
        drawer.depth
      );
      stats.totalVolume += volume * 2;
      
      // Volume du fond
      volume = furnitureUtils.calculateVolume(
        drawer.width - (drawer.thickness || furniture.construction.panelThickness) * 2,
        drawer.thickness || furniture.construction.panelThickness,
        drawer.depth
      );
      stats.totalVolume += volume;
      
      // Volume de l'arrière
      volume = furnitureUtils.calculateVolume(
        drawer.width - (drawer.thickness || furniture.construction.panelThickness) * 2,
        drawer.height,
        drawer.thickness || furniture.construction.panelThickness
      );
      stats.totalVolume += volume;
    });
  }
  
  // Portes
  if (furniture.layout.doors && furniture.layout.doors.length > 0) {
    stats.totalPanels += furniture.layout.doors.length;
    
    furniture.layout.doors.forEach(door => {
      volume = furnitureUtils.calculateVolume(
        door.width,
        door.height,
        door.thickness || furniture.construction.panelThickness
      );
      stats.totalVolume += volume;
    });
  }
  
  // Calcul du poids total (en utilisant une densité moyenne de MDF)
  stats.totalWeight = stats.totalVolume * 680; // 680 kg/m³
  
  // Calcul du chant total
  // Côtés du caisson (2 côtés x hauteur x 3 chants)
  stats.totalEdgeBanding += furniture.dimensions.height * 3 * 2;
  
  // Dessus (largeur x 3 chants + profondeur x 2 chants)
  stats.totalEdgeBanding += furniture.dimensions.width * 3 + furniture.dimensions.depth * 2;
  
  // Fond (largeur x 1 chant)
  stats.totalEdgeBanding += furniture.dimensions.width;
  
  // Étagères (chaque étagère: largeur x 1 chant avant)
  if (furniture.layout.shelves && furniture.layout.shelves.length > 0) {
    furniture.layout.shelves.forEach(shelf => {
      stats.totalEdgeBanding += shelf.width;
    });
  }
  
  // Tiroirs (faces avant: périmètre complet)
  if (furniture.layout.drawers && furniture.layout.drawers.length > 0) {
    furniture.layout.drawers.forEach(drawer => {
      stats.totalEdgeBanding += drawer.width * 2 + drawer.height * 2;
    });
  }
  
  // Portes (périmètre complet)
  if (furniture.layout.doors && furniture.layout.doors.length > 0) {
    furniture.layout.doors.forEach(door => {
      stats.totalEdgeBanding += door.width * 2 + door.height * 2;
    });
  }
  
  // Répartition des matériaux (simplifié)
  stats.materialBreakdown.push({
    material: "Panneaux principaux",
    volume: stats.totalVolume,
    weight: stats.totalWeight,
    cost: 0 // À calculer selon le prix unitaire
  });
  
  return stats;
}

export { useFurnitureStore };