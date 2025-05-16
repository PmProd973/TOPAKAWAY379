import React from 'react';
import { useOperationActions, usePanelData, usePanelActions } from '../../store/appStore';
import { OperationType } from '../../types/models';

const Sidebar: React.FC = () => {
  const { addOperation } = useOperationActions();
  const panelData = usePanelData();
  const { updatePanelData, updatePanelDimensions } = usePanelActions();
  
  const operationTypes: Array<{
    type: OperationType,
    label: string,
    icon: string
  }> = [
    { type: 'perçage', label: 'Perçage', icon: '🕳️' },
    { type: 'contournage', label: 'Contournage', icon: '📏' },
    { type: 'poche_fermee', label: 'Poche fermée', icon: '🔲' },
    { type: 'poche_ouverte', label: 'Poche ouverte', icon: '🔳' }
  ];

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updatePanelData({ materiau: e.target.value });
  };
  
  return (
    <div className="sidebar">
      <section className="sidebar-section">
        <h2>Outils d'usinage</h2>
        <div className="tools-grid">
          {operationTypes.map(op => (
            <button
              key={op.type}
              onClick={() => addOperation(op.type)}
              className="tool-button"
            >
              <span className="tool-icon">{op.icon}</span>
              <span>{op.label}</span>
            </button>
          ))}
        </div>
      </section>
      
      <section className="sidebar-section">
        <h2>Dimensions de la pièce</h2>
        <div className="dimensions-grid">
          <div className="control-group">
            <label>Longueur (mm)</label>
            <input 
              type="number" 
              value={panelData.dimensions.longueur}
              onChange={(e) => updatePanelDimensions({ longueur: parseFloat(e.target.value) })}
            />
          </div>
          <div className="control-group">
            <label>Largeur (mm)</label>
            <input 
              type="number" 
              value={panelData.dimensions.largeur}
              onChange={(e) => updatePanelDimensions({ largeur: parseFloat(e.target.value) })}
            />
          </div>
          <div className="control-group">
            <label>Épaisseur (mm)</label>
            <input 
              type="number" 
              value={panelData.dimensions.epaisseur}
              onChange={(e) => updatePanelDimensions({ epaisseur: parseFloat(e.target.value) })}
            />
          </div>
        </div>
      </section>
      
      <section className="sidebar-section">
        <h2>Matériau</h2>
        <select 
          value={panelData.materiau}
          onChange={handleMaterialChange}
        >
          <option value="Contreplaqué">Contreplaqué</option>
          <option value="MDF">MDF</option>
          <option value="Bois massif">Bois massif</option>
          <option value="Aggloméré">Aggloméré</option>
        </select>
      </section>
    </div>
  );
};

export default Sidebar;