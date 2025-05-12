// src/components/furniture3d/FurnitureDesigner/store/index.js
import { create } from 'zustand';
import { initialState } from './initialState';
import { roomSlice } from './slices/roomSlice';
import { furnitureSlice } from './slices/furnitureSlice';
import { displayOptionsSlice } from './slices/displayOptionsSlice';
import { historySlice } from './slices/historySlice';
import { materialsSlice } from './slices/materialsSlice';

// Import des générateurs
import { generateEnvironment } from './utils/environmentGenerator';
import { generateFurniture } from './utils/furnitureGenerator';
import { generateFurnitureV2 } from './utils/furnitureGeneratorV2';
import { generateDimensionLines } from './utils/dimensionGenerator';
import { generateInteriorZones } from './utils/interiorZones';
import { calculateFurnitureStatistics } from './utils/statisticsCalculator';

export const useFurnitureStore = create((set, get) => ({
  ...initialState,
  
  // Flag pour suivre si le store est initialisé
  isInitialized: false,
  setInitialized: (value) => set({ isInitialized: value }),
  
  // Méthode pour mettre à jour une propriété dans constructionV2
  updateConstructionV2: (section, property, value) => {
    // Log pour déboguer
    console.log(`updateConstructionV2: ${section}.${property} =`, value);
    
    set(state => {
      // Créer une copie profonde de constructionV2
      const newConstructionV2 = JSON.parse(JSON.stringify(state.constructionV2));
      
      // S'assurer que les propriétés des plinthes existent
      if (section === 'base') {
        if (!newConstructionV2.base.frontPlinth) {
          newConstructionV2.base.frontPlinth = {
            enabled: false,
            thickness: 18,
            leftInset: 0,
            rightInset: 0
          };
        }
        
        if (!newConstructionV2.base.backPlinth) {
          newConstructionV2.base.backPlinth = {
            enabled: false,
            thickness: 18,
            leftInset: 0,
            rightInset: 0
          };
        }
      }
      
      // Mise à jour de la propriété
      if (typeof property === 'string') {
        if (newConstructionV2[section]) {
          newConstructionV2[section][property] = value;
        }
      } else {
        // Si property est un objet, fusionner les propriétés
        newConstructionV2[section] = { ...newConstructionV2[section], ...property };
      }
      
      return { constructionV2: newConstructionV2 };
    });
    
    // Régénérer la scène après un délai pour assurer que les états sont mis à jour
    setTimeout(() => {
      console.log(`Régénération de la scène après mise à jour de "${section}.${property}"`);
      get().regenerateScene();
    }, 200);
  },
  
  // Méthode générale pour mettre à jour plusieurs propriétés à la fois
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
  
  // Régénération de la scène 3D
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
      const { room, furniture, displayOptions, useNewConstructionSystem, totalDimensions, constructionV2 } = get();
      
      console.log("État actuel:", { 
        roomDimensions: [room.width, room.height, room.depth],
        furnitureDimensions: [furniture.dimensions.width, furniture.dimensions.height, furniture.dimensions.depth],
        displayOptions: JSON.stringify(displayOptions),
        useNewConstructionSystem,
        totalDimensions,
        constructionV2
      });
      
      // Sauvegarder les dimensions actuelles pour éviter les écrasements
      const currentDimensions = {
        roomWidth: room.width,
        roomHeight: room.height,
        roomDepth: room.depth,
        wallLeftThickness: room.walls.left.thickness,
        wallRightThickness: room.walls.right.thickness,
        wallBackThickness: room.walls.back.thickness
      };
      
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
      
      // Générer le meuble principal en utilisant le bon générateur
      let furnitureObjects;
      
      // CORRECTION: Utiliser le générateur V2 avec la structure correcte
      if (useNewConstructionSystem) {
        console.log("Utilisation du générateur V2");
        // Créer un objet compatible avec le générateur V2
        const furnitureV2Data = {
          ...furniture,
          totalDimensions: totalDimensions,
          constructionV2: constructionV2
        };
        
        // Log pour vérifier les propriétés des plinthes
        console.log("Check plinthes avant génération:", {
          frontPlinth: furnitureV2Data.constructionV2.base.frontPlinth,
          backPlinth: furnitureV2Data.constructionV2.base.backPlinth,
          hasBase: furnitureV2Data.constructionV2.base.hasBase
        });
        
        furnitureObjects = generateFurnitureV2(furnitureV2Data, displayOptions);
        
        // Log pour vérifier le nombre d'objets générés
        console.log(`Objets generés par furnitureGeneratorV2: ${furnitureObjects.length}`);
        
        // Si furnitureObjects est un tableau avec un seul élément qui contient des enfants,
        // comme c'est souvent le cas pour les groupes, extraire ces enfants
        if (furnitureObjects.length === 1 && furnitureObjects[0].children && Array.isArray(furnitureObjects[0].children)) {
          // Ajouter le groupe principal
          sceneObjects.push(furnitureObjects[0]);
          
          // Puis vérifier si des objets ont été ajoutés au groupe
          console.log(`Le groupe contient ${furnitureObjects[0].children.length} objets enfants`);
        } else {
          // Ajouter tous les objets directement
          sceneObjects.push(...furnitureObjects);
        }
      } else {
        console.log("Utilisation du générateur V1");
        furnitureObjects = generateFurniture(furniture, displayOptions);
        sceneObjects.push(...furnitureObjects);
      }
      
      // Générer les lignes de cotation si activées
      let dimensionLines = [];
      
      // Passer les deux options séparément à la fonction generateDimensionLines
      dimensionLines = generateDimensionLines(room, furniture, {
        showDimensions: displayOptions.showDimensions !== false,
        showFurnitureDimensions: displayOptions.showFurnitureDimensions === true
      });
      
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
      
      // Vérifier que les dimensions n'ont pas été modifiées après la régénération
      const { room: newRoom } = get();
      if (newRoom.width !== currentDimensions.roomWidth || 
          newRoom.height !== currentDimensions.roomHeight || 
          newRoom.depth !== currentDimensions.roomDepth ||
          newRoom.walls.left.thickness !== currentDimensions.wallLeftThickness ||
          newRoom.walls.right.thickness !== currentDimensions.wallRightThickness ||
          newRoom.walls.back.thickness !== currentDimensions.wallBackThickness) {
        console.log("Dimensions modifiées durant la régénération, restauration...");
        set((state) => ({
          room: {
            ...state.room,
            width: currentDimensions.roomWidth,
            height: currentDimensions.roomHeight,
            depth: currentDimensions.roomDepth,
            walls: {
              ...state.room.walls,
              left: {
                ...state.room.walls.left,
                thickness: currentDimensions.wallLeftThickness
              },
              right: {
                ...state.room.walls.right,
                thickness: currentDimensions.wallRightThickness
              },
              back: {
                ...state.room.walls.back,
                thickness: currentDimensions.wallBackThickness
              }
            }
          }
        }));
      }
      
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
  
  // Le reste du code reste inchangé...
  
  // Fonctions utilisateur et abonnement
  setUser: (user) => set({ user }),
  setSubscription: (subscription) => set({ subscription }),
  
  // Fonctions pour la sauvegarde et le chargement
  markAsDirty: () => set({ isDirty: true }),
  markAsSaved: () => set({ isDirty: false, lastSaved: new Date() }),
  
  prepareForSave: () => {
    const { furniture, room, projectInfo, displayOptions, constructionV2, totalDimensions, useNewConstructionSystem } = get();
    return {
      projectInfo: { ...projectInfo, lastModified: new Date() },
      room,
      furniture,
      displayOptions,
      // Ajouter les nouvelles propriétés V2 pour la sauvegarde
      constructionV2,
      totalDimensions,
      useNewConstructionSystem
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
      // Charger les propriétés V2 si elles existent
      constructionV2: projectData.constructionV2 || get().constructionV2,
      totalDimensions: projectData.totalDimensions || get().totalDimensions,
      useNewConstructionSystem: projectData.useNewConstructionSystem || false,
      isDirty: false,
      lastSaved: new Date()
    });
    
    setTimeout(() => {
      console.log("Régénération de la scène après chargement du projet");
      get().regenerateScene();
      get().addToHistory();
    }, 100);
  },
  
  // Import des autres slices
  ...roomSlice(set, get),
  ...furnitureSlice(set, get),
  ...displayOptionsSlice(set, get),
  ...historySlice(set, get),
  ...materialsSlice(set, get),
}));