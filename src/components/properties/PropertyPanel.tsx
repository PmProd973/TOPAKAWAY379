import React from 'react';
import { Operation } from '../../types/models';
// Importation directe depuis appStore.ts au lieu de store/index.ts
import { useTools } from '../../store/appStore';
import DrillProperties from './DrillProperties';
import ContourProperties from './ContourProperties';
import ClosedPocketProperties from './ClosedPocketProperties';
import OpenPocketProperties from './OpenPocketProperties';

interface PropertyPanelProps {
  selectedOperation: Operation | null;
  onUpdateOperation: (data: Partial<Operation>) => void;
  onRemoveOperation: () => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedOperation,
  onUpdateOperation,
  onRemoveOperation
}) => {
  const tools = useTools();
  
  // Rendu du panneau de propriétés en fonction du type d'opération sélectionné
  const renderPropertiesPanel = () => {
    if (!selectedOperation) {
      return (
        <div className="text-gray-500 italic">
          Sélectionnez une opération pour voir et modifier ses propriétés
        </div>
      );
    }
    
    switch (selectedOperation.type) {
      case 'perçage':
        return (
          <DrillProperties
            operation={selectedOperation}
            tools={tools}
            onChange={onUpdateOperation}
          />
        );
      case 'contournage':
        return (
          <ContourProperties
            operation={selectedOperation}
            tools={tools}
            onChange={onUpdateOperation}
          />
        );
      case 'poche_fermee':
        return (
          <ClosedPocketProperties
            operation={selectedOperation}
            tools={tools}
            onChange={onUpdateOperation}
          />
        );
      case 'poche_ouverte':
        return (
          <OpenPocketProperties
            operation={selectedOperation}
            tools={tools}
            onChange={onUpdateOperation}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="w-72 bg-white border-l border-gray-200 p-4 flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Propriétés</h2>
        {selectedOperation && (
          <button 
            onClick={onRemoveOperation}
            className="text-red-500 hover:text-red-700"
          >
            Supprimer
          </button>
        )}
      </div>
      
      {renderPropertiesPanel()}
    </div>
  );
};

export default PropertyPanel;