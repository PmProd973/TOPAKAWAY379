import React from 'react';
import { OpenPocketOperation, Tool } from '../../types/models';

interface OpenPocketPropertiesProps {
  operation: OpenPocketOperation;
  tools: Tool[];
  onChange: (data: Partial<OpenPocketOperation>) => void;
}

const OpenPocketProperties: React.FC<OpenPocketPropertiesProps> = ({
  operation,
  tools,
  onChange
}) => {
  // Filter only milling tools (fraises)
  const millingTools = tools.filter(tool => tool.type === 'fraise');
  
  // Options pour les stratégies de poche ouverte
  const strategies = [
    { value: 'zigzag', label: 'Zig-zag' },
    { value: 'parallele', label: 'Lignes parallèles' }
  ];
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Propriétés de la poche ouverte</h3>
      
      <div>
        <label className="block text-sm mb-1">Largeur (mm)</label>
        <input
          type="number"
          value={operation.largeur}
          onChange={(e) => onChange({ largeur: parseFloat(e.target.value) })}
          className="input-field"
          min="1"
        />
      </div>
      
      <div>
        <label className="block text-sm mb-1">Profondeur (mm)</label>
        <input
          type="number"
          value={operation.profondeur}
          onChange={(e) => onChange({ profondeur: parseFloat(e.target.value) })}
          className="input-field"
        />
      </div>
      
      <div>
        <label className="block text-sm mb-1">Stratégie d'usinage</label>
        <select
          value={operation.strategie}
          onChange={(e) => onChange({ strategie: e.target.value as 'zigzag' | 'parallele' })}
          className="input-field"
        >
          {strategies.map(strategy => (
            <option key={strategy.value} value={strategy.value}>
              {strategy.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          id="multiPass"
          checked={operation.multiPass}
          onChange={(e) => onChange({ multiPass: e.target.checked })}
          className="mr-2"
        />
        <label htmlFor="multiPass">Usinage multi-passes</label>
      </div>
      
      {operation.multiPass && (
        <div>
          <label className="block text-sm mb-1">Profondeur par passe (mm)</label>
          <input
            type="number"
            value={operation.profondeurPasse || operation.profondeur}
            onChange={(e) => onChange({ profondeurPasse: parseFloat(e.target.value) })}
            className="input-field"
          />
        </div>
      )}
      
      <div>
        <label className="block text-sm mb-1">Outil</label>
        <select
          value={operation.outil}
          onChange={(e) => onChange({ outil: e.target.value })}
          className="input-field"
        >
          {millingTools.map(tool => (
            <option key={tool.id} value={tool.id}>
              {tool.nom} (Ø{tool.diametre}mm)
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm mb-1">Commentaire</label>
        <textarea
          value={operation.commentaire || ''}
          onChange={(e) => onChange({ commentaire: e.target.value })}
          className="input-field resize-none h-20"
          placeholder="Ajouter un commentaire..."
        />
      </div>
    </div>
  );
};

export default OpenPocketProperties;