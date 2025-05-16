import React from 'react';
import { usePanelData, usePanelActions } from '../../store/appStore';

const Header: React.FC = () => {
  const panelData = usePanelData();
  const { updatePanelData } = usePanelActions();
  
  // Changer le nom de la pièce
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePanelData({ nom: e.target.value });
  };
  
  // Exemple d'export JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(panelData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${panelData.nom || 'piece'}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-primary mr-4">CNC Wood App</h1>
          <input
            type="text"
            value={panelData.nom}
            onChange={handleNameChange}
            className="input-field max-w-xs"
            placeholder="Nom de la pièce"
          />
        </div>
        
        <div className="flex space-x-2">
          <button className="btn-secondary" onClick={handleExportJSON}>
            Exporter JSON
          </button>
          <button className="btn-primary">
            Générer G-code
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;