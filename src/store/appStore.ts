import { create } from 'zustand';
import { 
  AppData, 
  DEFAULT_APP_DATA, 
  Operation, 
  PanelData, 
  Tool,
  OperationType
} from '../types/models';
import { typeSafeUpdateOperation } from './typeSafeOperations';

interface AppState {
  // État de l'application
  appData: AppData;
  
  // Actions pour la pièce
  updatePanelData: (panelData: Partial<PanelData>) => void;
  updatePanelDimensions: (dimensions: Partial<PanelData['dimensions']>) => void;
  updatePanelOrigin: (origine: Partial<PanelData['origine']>) => void;
  
  // Actions pour les opérations
  addOperation: (type: OperationType) => void;
  updateOperation: (index: number, operation: Partial<Omit<Operation, 'type'>>) => void;
  removeOperation: (index: number) => void;
  
  // Actions pour les outils
  addTool: (tool: Tool) => void;
  updateTool: (id: string, tool: Partial<Tool>) => void;
  removeTool: (id: string) => void;
  
  // Import/Export
  importAppData: (appData: AppData) => void;
  resetAppData: () => void;
}

// Fonctions de création pour les différentes opérations
const createOperationByType = (type: OperationType): Operation => {
  switch (type) {
    case 'perçage':
      return {
        type: 'perçage',
        x: 100,
        y: 100,
        diametre: 5,
        profondeur: 10,
        outil: 'foret_5mm'
      };
    case 'contournage':
      return {
        type: 'contournage',
        chemin: [[50, 50], [150, 50], [150, 150], [50, 150]],
        ferme: true,
        multiPass: true,
        profondeurPasse: 6,
        profondeur: 18,
        entree: {
          type: 'rampe',
          angle: 45
        },
        sortie: {
          type: 'verticale'
        },
        outil: 'fraise_6mm'
      };
    case 'poche_fermee':
      return {
        type: 'poche_fermee',
        chemin: [[200, 200], [300, 200], [300, 300], [200, 300]],
        strategie: 'spirale',
        multiPass: true,
        profondeurPasse: 3,
        profondeur: 9,
        outil: 'fraise_6mm'
      };
    case 'poche_ouverte':
      return {
        type: 'poche_ouverte',
        chemin: [[350, 100], [450, 100], [500, 150]],
        largeur: 20,
        strategie: 'zigzag',
        multiPass: true,
        profondeurPasse: 3,
        profondeur: 6,
        outil: 'fraise_6mm'
      };
  }
};

// Création du store
export const useAppStore = create<AppState>((set) => ({
  appData: DEFAULT_APP_DATA,
  
  // Actions pour la pièce
  updatePanelData: (panelData) => set((state) => ({
    appData: {
      ...state.appData,
      piece: {
        ...state.appData.piece,
        ...panelData
      }
    }
  })),
  
  updatePanelDimensions: (dimensions) => set((state) => ({
    appData: {
      ...state.appData,
      piece: {
        ...state.appData.piece,
        dimensions: {
          ...state.appData.piece.dimensions,
          ...dimensions
        }
      }
    }
  })),
  
  updatePanelOrigin: (origine) => set((state) => ({
    appData: {
      ...state.appData,
      piece: {
        ...state.appData.piece,
        origine: {
          ...state.appData.piece.origine,
          ...origine
        }
      }
    }
  })),
  
  // Actions pour les opérations
  addOperation: (type) => set((state) => {
    const newOperation = createOperationByType(type);
    return {
      appData: {
        ...state.appData,
        piece: {
          ...state.appData.piece,
          operations: [...state.appData.piece.operations, newOperation]
        }
      }
    };
  }),
  
  // Mise à jour typesafe des opérations
  updateOperation: (index, updates) => set((state) => {
    const operations = [...state.appData.piece.operations];
    const currentOperation = operations[index];
    
    if (!currentOperation) return state;
    
    // Utiliser la fonction typesafe qui préserve le discriminant
    operations[index] = typeSafeUpdateOperation(currentOperation, updates);
    
    return {
      appData: {
        ...state.appData,
        piece: {
          ...state.appData.piece,
          operations
        }
      }
    };
  }),
  
  removeOperation: (index) => set((state) => {
    const operations = [...state.appData.piece.operations];
    operations.splice(index, 1);
    
    return {
      appData: {
        ...state.appData,
        piece: {
          ...state.appData.piece,
          operations
        }
      }
    };
  }),
  
  // Actions pour les outils
  addTool: (tool) => set((state) => ({
    appData: {
      ...state.appData,
      bibliotheque_outils: [...state.appData.bibliotheque_outils, tool]
    }
  })),
  
  updateTool: (id, tool) => set((state) => {
    const toolIndex = state.appData.bibliotheque_outils.findIndex(t => t.id === id);
    if (toolIndex === -1) return state;
    
    const bibliotheque_outils = [...state.appData.bibliotheque_outils];
    bibliotheque_outils[toolIndex] = {
      ...bibliotheque_outils[toolIndex],
      ...tool
    };
    
    return {
      appData: {
        ...state.appData,
        bibliotheque_outils
      }
    };
  }),
  
  removeTool: (id) => set((state) => ({
    appData: {
      ...state.appData,
      bibliotheque_outils: state.appData.bibliotheque_outils.filter(tool => tool.id !== id)
    }
  })),
  
  // Import/Export
  importAppData: (appData) => set({ appData }),
  
  resetAppData: () => set({ appData: DEFAULT_APP_DATA })
}));

// Hooks personnalisés
export const usePanelData = () => useAppStore(state => state.appData.piece);
export const useTools = () => useAppStore(state => state.appData.bibliotheque_outils);
export const useOperations = () => useAppStore(state => state.appData.piece.operations);

export const usePanelActions = () => {
  const updatePanelData = useAppStore(state => state.updatePanelData);
  const updatePanelDimensions = useAppStore(state => state.updatePanelDimensions);
  const updatePanelOrigin = useAppStore(state => state.updatePanelOrigin);
  
  return {
    updatePanelData,
    updatePanelDimensions,
    updatePanelOrigin
  };
};

export const useOperationActions = () => {
  const addOperation = useAppStore(state => state.addOperation);
  const updateOperation = useAppStore(state => state.updateOperation);
  const removeOperation = useAppStore(state => state.removeOperation);
  
  return {
    addOperation,
    updateOperation,
    removeOperation
  };
};

export const useToolActions = () => {
  const addTool = useAppStore(state => state.addTool);
  const updateTool = useAppStore(state => state.updateTool);
  const removeTool = useAppStore(state => state.removeTool);
  
  return {
    addTool,
    updateTool,
    removeTool
  };
};

export const useAppActions = () => {
  const importAppData = useAppStore(state => state.importAppData);
  const resetAppData = useAppStore(state => state.resetAppData);
  
  return {
    importAppData,
    resetAppData
  };
};