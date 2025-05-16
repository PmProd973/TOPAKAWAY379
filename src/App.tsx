import React, { useState } from 'react';
import { useOperations, useOperationActions } from './store/appStore';
import Editor3D from './components/editor/Editor3D';
import Sidebar from './components/layout/Sidebar';
import PropertyPanel from './components/properties/PropertyPanel';

function App() {
  const [selectedOperationIndex, setSelectedOperationIndex] = useState<number>(-1);
  const operations = useOperations();
  const { updateOperation, removeOperation } = useOperationActions();
  
  // Sélectionner une opération
  const handleSelectOperation = (index: number) => {
    setSelectedOperationIndex(index);
  };
  
  // Mise à jour d'une opération
  const handleUpdateOperation = (updatedData: any) => {
    if (selectedOperationIndex >= 0) {
      updateOperation(selectedOperationIndex, updatedData);
    }
  };
  
  // Suppression d'une opération
  const handleRemoveOperation = () => {
    if (selectedOperationIndex >= 0) {
      removeOperation(selectedOperationIndex);
      setSelectedOperationIndex(-1);
    }
  };
  
  return (
    <div className="app-container">
      {/* En-tête flottant */}
      <header className="app-header">
        <h1>CNC Wood App</h1>
        <div className="app-actions">
          <button className="btn-outline">Exporter JSON</button>
          <button className="btn-primary">Générer G-code</button>
        </div>
      </header>
      
      {/* Contenu principal - zone 3D avec panneaux flottants */}
      <div className="app-content">
        {/* Zone 3D en plein écran */}
        <div className="view-3d">
          <Editor3D 
            onSelectOperation={handleSelectOperation}
            selectedOperationIndex={selectedOperationIndex}
          />
        </div>
        
        {/* Sidebar flottante */}
        <Sidebar />
        
        {/* Panneau de propriétés flottant */}
        <div className="properties-panel">
          <div className="properties-header">
            <h2>Propriétés</h2>
            {selectedOperationIndex >= 0 && (
              <button 
                className="btn-danger" 
                onClick={handleRemoveOperation}
                title="Supprimer cette opération"
              >
                Supprimer
              </button>
            )}
          </div>
          
          <div className="properties-content">
            {selectedOperationIndex >= 0 ? (
              <PropertyPanel 
                selectedOperation={operations[selectedOperationIndex]}
                onUpdateOperation={handleUpdateOperation}
                onRemoveOperation={handleRemoveOperation}
              />
            ) : (
              <div className="property-empty">
                Sélectionnez une opération pour voir et modifier ses propriétés
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Barre d'état flottante (optionnelle) */}
      <div className="status-bar">
        <div className="status-coordinates">X: 0.0 Y: 0.0 Z: 0.0</div>
        <div className="status-info">Prêt</div>
      </div>
    </div>
  );
}

export default App;