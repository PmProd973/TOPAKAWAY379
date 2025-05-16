import React from 'react';
import { ClosedPocketOperation, Tool, EntryType } from '../../types/models';

interface ClosedPocketPropertiesProps {
  operation: ClosedPocketOperation;
  tools: Tool[];
  onChange: (data: Partial<ClosedPocketOperation>) => void;
}

const ClosedPocketProperties: React.FC<ClosedPocketPropertiesProps> = ({
  operation,
  tools,
  onChange
}) => {
  // Filter only milling tools (fraises)
  const millingTools = tools.filter((tool: Tool) => tool.type === 'fraise');
  
  // Options pour les stratégies de poche
  const strategies = [
    { value: 'spirale', label: 'Spirale' },
    { value: 'zigzag', label: 'Zig-zag' },
    { value: 'contour', label: 'Contours parallèles' }
  ];
  
  // Options pour les types d'entrée
  const entryTypes: { value: EntryType, label: string }[] = [
    { value: 'verticale', label: 'Plongée verticale' },
    { value: 'rampe', label: 'Rampe' },
    { value: 'spirale', label: 'Spirale/Hélicoïdale' }
  ];
  
  // Gérer le changement de type d'entrée de façon sécurisée
  const handleEntryTypeChange = (entryType: EntryType) => {
    onChange({ 
      entreeFerme: { 
        type: entryType,
        angle: operation.entreeFerme?.angle,
        rayon: operation.entreeFerme?.rayon
      } 
    });
  };
  
  // Gérer le changement d'angle de rampe
  const handleRampAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const angle = parseFloat(e.target.value);
    onChange({ 
      entreeFerme: { 
        type: operation.entreeFerme?.type || 'rampe', // Type par défaut si undefined
        angle: angle,
        rayon: operation.entreeFerme?.rayon
      } 
    });
  };
  
  // Gérer le changement de rayon de spirale
  const handleSpiralRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rayon = parseFloat(e.target.value);
    onChange({ 
      entreeFerme: { 
        type: operation.entreeFerme?.type || 'spirale', // Type par défaut si undefined
        rayon: rayon,
        angle: operation.entreeFerme?.angle
      } 
    });
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Propriétés de la poche fermée</h3>
      
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
          onChange={(e) => onChange({ strategie: e.target.value as 'spirale' | 'zigzag' | 'contour' })}
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
        <label className="block text-sm mb-1">Type d'entrée</label>
        <select
          value={operation.entreeFerme?.type || 'verticale'}
          onChange={(e) => handleEntryTypeChange(e.target.value as EntryType)}
          className="input-field"
        >
          {entryTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      
      {operation.entreeFerme?.type === 'rampe' && (
        <div>
          <label className="block text-sm mb-1">Angle de rampe (°)</label>
          <input
            type="number"
            value={operation.entreeFerme?.angle || 45}
            onChange={handleRampAngleChange}
            className="input-field"
            min="1"
            max="89"
          />
        </div>
      )}
      
      {operation.entreeFerme?.type === 'spirale' && (
        <div>
          <label className="block text-sm mb-1">Rayon de spirale (mm)</label>
          <input
            type="number"
            value={operation.entreeFerme?.rayon || 5}
            onChange={handleSpiralRadiusChange}
            className="input-field"
            min="1"
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

export default ClosedPocketProperties;