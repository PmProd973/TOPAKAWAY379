import React, { useState } from 'react';
import { Tool } from '../../types/models';
import { useTools, useToolActions } from '../../store/appStore';

const ToolLibrary: React.FC = () => {
  const tools = useTools();
  const { addTool, updateTool, removeTool } = useToolActions();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  
  // État pour un nouvel outil
  const [newTool, setNewTool] = useState<Partial<Tool>>({
    id: `tool_${Date.now()}`,
    nom: '',
    type: 'fraise',
    diametre: 6,
    vitesseRotation: 16000,
    vitesseAvance: 800,
    vitessePlongee: 300
  });
  
  // Trouver l'outil sélectionné
  const selectedTool = selectedToolId 
    ? tools.find((tool: Tool) => tool.id === selectedToolId) 
    : null;
  
  // Gérer la sélection d'un outil
  const handleSelectTool = (id: string) => {
    setSelectedToolId(id === selectedToolId ? null : id);
    setShowAddForm(false);
  };
  
  // Gérer la mise à jour d'un outil
  const handleUpdateTool = (id: string, data: Partial<Tool>) => {
    updateTool(id, data);
  };
  
  // Gérer la suppression d'un outil
  const handleRemoveTool = (id: string) => {
    removeTool(id);
    setSelectedToolId(null);
  };
  
  // Gérer l'ajout d'un outil
  const handleAddTool = () => {
    // Valider les champs requis
    if (!newTool.nom || !newTool.diametre) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    // Ajouter l'outil avec les champs requis
    addTool({
      id: newTool.id || `tool_${Date.now()}`,
      nom: newTool.nom,
      type: newTool.type || 'fraise',
      diametre: newTool.diametre,
      vitesseRotation: newTool.vitesseRotation || 16000,
      vitesseAvance: newTool.vitesseAvance || 800,
      vitessePlongee: newTool.type === 'fraise' ? (newTool.vitessePlongee || 300) : undefined,
      profondeurMax: newTool.profondeurMax
    } as Tool);
    
    // Réinitialiser le formulaire
    setNewTool({
      id: `tool_${Date.now()}`,
      nom: '',
      type: 'fraise',
      diametre: 6,
      vitesseRotation: 16000,
      vitesseAvance: 800,
      vitessePlongee: 300
    });
    
    setShowAddForm(false);
  };
  
  // Afficher la liste des outils
  const renderToolList = () => {
    return (
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {tools.map((tool: Tool) => (
          <div 
            key={tool.id}
            className={`p-2 border rounded cursor-pointer ${
              selectedToolId === tool.id ? 'bg-blue-100 border-blue-500' : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => handleSelectTool(tool.id)}
          >
            <div className="font-medium">{tool.nom}</div>
            <div className="text-sm text-gray-600">
              {tool.type === 'fraise' ? '🔄' : '🔘'} Ø{tool.diametre}mm
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Afficher le formulaire de modification d'outil
  const renderToolEditForm = () => {
    if (!selectedTool) return null;
    
    return (
      <div className="mt-4 p-3 border rounded bg-gray-50">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Modifier l'outil</h4>
          <button 
            className="text-red-500 text-sm"
            onClick={() => handleRemoveTool(selectedTool.id)}
          >
            Supprimer
          </button>
        </div>
        
        <div className="space-y-2">
          <div>
            <label className="block text-sm mb-1">Nom</label>
            <input
              type="text"
              value={selectedTool.nom}
              onChange={(e) => handleUpdateTool(selectedTool.id, { nom: e.target.value })}
              className="w-full p-1 border rounded text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1">Type</label>
            <select
              value={selectedTool.type}
              onChange={(e) => handleUpdateTool(selectedTool.id, { type: e.target.value as 'fraise' | 'foret' })}
              className="w-full p-1 border rounded text-sm"
            >
              <option value="fraise">Fraise</option>
              <option value="foret">Foret</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm mb-1">Diamètre (mm)</label>
            <input
              type="number"
              value={selectedTool.diametre}
              onChange={(e) => handleUpdateTool(selectedTool.id, { diametre: parseFloat(e.target.value) })}
              className="w-full p-1 border rounded text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1">Vitesse rotation (tr/min)</label>
            <input
              type="number"
              value={selectedTool.vitesseRotation}
              onChange={(e) => handleUpdateTool(selectedTool.id, { vitesseRotation: parseFloat(e.target.value) })}
              className="w-full p-1 border rounded text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1">Vitesse avance (mm/min)</label>
            <input
              type="number"
              value={selectedTool.vitesseAvance}
              onChange={(e) => handleUpdateTool(selectedTool.id, { vitesseAvance: parseFloat(e.target.value) })}
              className="w-full p-1 border rounded text-sm"
            />
          </div>
          
          {selectedTool.type === 'fraise' && (
            <>
              <div>
                <label className="block text-sm mb-1">Vitesse plongée (mm/min)</label>
                <input
                  type="number"
                  value={selectedTool.vitessePlongee || 300}
                  onChange={(e) => handleUpdateTool(selectedTool.id, { vitessePlongee: parseFloat(e.target.value) })}
                  className="w-full p-1 border rounded text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">Prof. max (mm, opt.)</label>
                <input
                  type="number"
                  value={selectedTool.profondeurMax || ''}
                  onChange={(e) => {
                    const val = e.target.value !== '' ? parseFloat(e.target.value) : undefined;
                    handleUpdateTool(selectedTool.id, { profondeurMax: val });
                  }}
                  className="w-full p-1 border rounded text-sm"
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  };
  
  // Afficher le formulaire d'ajout d'outil
  const renderAddToolForm = () => {
    if (!showAddForm) return null;
    
    return (
      <div className="mt-4 p-3 border rounded bg-gray-50">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Ajouter un outil</h4>
          <button 
            className="text-gray-500 text-sm"
            onClick={() => setShowAddForm(false)}
          >
            Annuler
          </button>
        </div>
        
        <div className="space-y-2">
          <div>
            <label className="block text-sm mb-1">Nom *</label>
            <input
              type="text"
              value={newTool.nom || ''}
              onChange={(e) => setNewTool({...newTool, nom: e.target.value})}
              className="w-full p-1 border rounded text-sm"
              placeholder="Nom de l'outil"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1">Type</label>
            <select
              value={newTool.type || 'fraise'}
              onChange={(e) => setNewTool({...newTool, type: e.target.value as 'fraise' | 'foret'})}
              className="w-full p-1 border rounded text-sm"
            >
              <option value="fraise">Fraise</option>
              <option value="foret">Foret</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm mb-1">Diamètre (mm) *</label>
            <input
              type="number"
              value={newTool.diametre || ''}
              onChange={(e) => setNewTool({...newTool, diametre: parseFloat(e.target.value)})}
              className="w-full p-1 border rounded text-sm"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1">Vitesse rotation (tr/min)</label>
            <input
              type="number"
              value={newTool.vitesseRotation || ''}
              onChange={(e) => setNewTool({...newTool, vitesseRotation: parseFloat(e.target.value)})}
              className="w-full p-1 border rounded text-sm"
              placeholder="16000"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1">Vitesse avance (mm/min)</label>
            <input
              type="number"
              value={newTool.vitesseAvance || ''}
              onChange={(e) => setNewTool({...newTool, vitesseAvance: parseFloat(e.target.value)})}
              className="w-full p-1 border rounded text-sm"
              placeholder="800"
            />
          </div>
          
          {newTool.type === 'fraise' && (
            <>
              <div>
                <label className="block text-sm mb-1">Vitesse plongée (mm/min)</label>
                <input
                  type="number"
                  value={newTool.vitessePlongee || ''}
                  onChange={(e) => setNewTool({...newTool, vitessePlongee: parseFloat(e.target.value)})}
                  className="w-full p-1 border rounded text-sm"
                  placeholder="300"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">Prof. max (mm, opt.)</label>
                <input
                  type="number"
                  value={newTool.profondeurMax || ''}
                  onChange={(e) => {
                    const val = e.target.value !== '' ? parseFloat(e.target.value) : undefined;
                    setNewTool({...newTool, profondeurMax: val});
                  }}
                  className="w-full p-1 border rounded text-sm"
                />
              </div>
            </>
          )}
          
          <button
            className="w-full mt-2 p-1 bg-blue-500 text-white rounded text-sm"
            onClick={handleAddTool}
          >
            Ajouter
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Bibliothèque d'outils</h3>
        {!showAddForm && (
          <button
            className="text-blue-500 text-sm"
            onClick={() => {
              setShowAddForm(true);
              setSelectedToolId(null);
            }}
          >
            + Ajouter
          </button>
        )}
      </div>
      
      {renderToolList()}
      {renderToolEditForm()}
      {renderAddToolForm()}
    </div>
  );
};

export default ToolLibrary;