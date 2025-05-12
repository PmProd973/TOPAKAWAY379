// src/components/furniture3d/FurnitureDesigner/store/slices/historySlice.js
export const historySlice = (set, get) => ({
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
  });