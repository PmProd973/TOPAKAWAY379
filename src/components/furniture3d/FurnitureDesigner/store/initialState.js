// src/components/furniture3d/FurnitureDesigner/store/initialState.js
export const initialState = {
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
    
    // État pour le nouveau système de construction V2
    useNewConstructionSystem: false, // Flag pour activer/désactiver le nouveau système
    
    // Dimensions totales pour le système V2
    totalDimensions: {
      width: 2000,   // mm
      height: 2000,  // mm
      depth: 500     // mm
    },
    
    // Structure de construction V2 simplifiée
    constructionV2: {
      basic: {
        assemblyType: 'overlap', // 'overlap', 'flush', 'miter'
        panelThickness: 18,
        structure: 'frame' // 'frame', 'panel', 'hybrid'
      },
      
      base: {
        hasBase: false,
        baseType: 'plinth', // 'plinth', 'feet', 'socle'
        baseHeight: 80,
        baseInset: {
          front: 0,
          back: 0,
          left: 0,
          right: 0
        },
        // Propriétés explicites pour les plinthes avant et arrière
        frontPlinth: {
          enabled: false,
          thickness: 19,
          leftInset: 0,
          rightInset: 0
        },
        backPlinth: {
          enabled: false,
          thickness: 19,
          leftInset: 0,
          rightInset: 0
        },
        // Option pour les côtés jusqu'au sol explicitement définie
        sidesExtendToFloor: false,
        verticalSupports: {
          enabled: false,
          positions: [], // Positions en mm depuis la gauche
          thickness: 19,
          autoDistribute: true,
          count: 2
        },
        
        // Nouvelles propriétés pour le socle complet
        socle: {
          enabled: false,
          // Côtés du socle
          sides: {
            enabled: true,
            thickness: 19
          },
          // Séparations verticales
          verticalSeparations: {
            enabled: false,
            count: 0,
            thickness: 19,
            autoDistribute: true,
            positions: [] // Positions manuelles si autoDistribute=false
          },
          // Type de couverture supérieure
          topCoverage: {
            type: 'panel', // 'panel' ou 'traverses'
            thickness: 19,
            traverseWidth: 80 // Largeur des traverses si type='traverses'
          }
        }
      },
      
      backPanel: {
        enabled: true,
        thickness: 19,
        inset: 0,
        groove: false,
        grooveDepth: 10
      },
      
      cladding: {
        left: { 
          enabled: false, 
          thickness: 19, 
          type: 'panel',  // 'panel' ou 'filler'
          overhang: {
            front: 0,
            back: 0,
            top: 0,
            bottom: 0
          }
        },
        right: { 
          enabled: false, 
          thickness: 19, 
          type: 'panel',
          overhang: {
            front: 0,
            back: 0,
            top: 0,
            bottom: 0
          }
        },
        top: { 
          enabled: false, 
          thickness: 19,
          overhang: {
            front: 0,
            back: 0,
            left: 0,
            right: 0
          }
        },
        bottom: { 
          enabled: false, 
          thickness: 19,
          overhang: {
            front: 0,
            back: 0,
            left: 0,
            right: 0
          }
        }
      }
    },
    
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
        backPanelGroove: {
          top: false,
          bottom: false,
          left: false,
          right: false
        },
        backPanelOverhang: 0, // Débordement en mm pour la rainure
        sidesExtendToFloor: false,
        sidesOverlapTopBottom: true,
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
      viewMode: "solid",  // "solid", "wireframe", "realistic", "conceptual"
      showGrid: true,
      gridSize: 100,
      showAxes: true,
      showDimensions: true,
      showShadows: false,
      showWireframe: false,
      furnitureOpacity: 1.0,
      backgroundColor: "#F0F0F0",
      // Nouveaux paramètres pour le mode conceptuel
      edgeColor: "#000000",     // Couleur des arêtes en mode conceptuel
      edgeThickness: 1,         // Épaisseur des arêtes (1-3)
      showAllEdges: false       // Afficher toutes les arêtes ou seulement les arêtes visibles
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
    
    // Gestion multi-meubles
    furnitureList: [],
    activeFurnitureId: null,
};