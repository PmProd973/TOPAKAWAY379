import React from 'react';
import { DrillOperation, Tool } from '../../types/models';

interface DrillPropertiesProps {
  operation: DrillOperation;
  tools: Tool[];
  onChange: (data: Partial<DrillOperation>) => void;
}

const DrillProperties: React.FC<DrillPropertiesProps> = ({
  operation,
  tools,
  onChange
}) => {
  // Filter only drilling tools (forets)
  const drillTools = tools.filter(tool => tool.type === 'foret');
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Propriétés du perçage</h3>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm mb-1">Position X (mm)</label>
          <input
            type="number"
            value={operation.x}
            onChange={(e) => onChange({ x: parseFloat(e.target.value) })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Position Y (mm)</label>
          <input
            type="number"
            value={operation.y}
            onChange={(e) => onChange({ y: parseFloat(e.target.value) })}
            className="input-field"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm mb-1">Diamètre (mm)</label>
        <input
          type="number"
          value={operation.diametre}
          onChange={(e) => onChange({ diametre: parseFloat(e.target.value) })}
          className="input-field"
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
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="traversant"
          checked={operation.traversant || false}
          onChange={(e) => onChange({ traversant: e.target.checked })}
          className="mr-2"
        />
        <label htmlFor="traversant">Perçage traversant</label>
      </div>
      
      <div>
        <label className="block text-sm mb-1">Outil</label>
        <select
          value={operation.outil}
          onChange={(e) => onChange({ outil: e.target.value })}
          className="input-field"
        >
          {drillTools.map(tool => (
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

export default DrillProperties;