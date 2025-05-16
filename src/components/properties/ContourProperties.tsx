import React from 'react';
import { ContourOperation, Tool, EntryType, ExitType } from '../../types/models';

interface ContourPropertiesProps {
  operation: ContourOperation;
  tools: Tool[];
  onChange: (data: Partial<ContourOperation>) => void;
}

const ContourProperties: React.FC<ContourPropertiesProps> = ({
  operation,
  tools,
  onChange
}) => {
  // Filter only milling tools (fraises)
  const millingTools = tools.filter(tool => tool.type === 'fraise');
  
  // Options pour les types d'entrée
  const entryTypes: { value: EntryType, label: string }[] = [
    { value: 'verticale', label: 'Plongée verticale' },
    { value: 'rampe', label: 'Rampe' },
    { value: 'spirale', label: 'Spirale/Hélicoïdale' }
  ];
  
  // Options pour les types de sortie
  const exitTypes: { value: ExitType, label: string }[] = [
    { value: 'verticale', label: 'Remontée verticale' },
    { value: 'rampe', label: 'Rampe' },
    { value: 'droite', label: 'Ligne droite' }
  ];
  
  // Options pour la compensation d'outil
  const compensationTypes = [
    { value: 'aucune', label: 'Aucune (sur ligne)' },
    { value: 'gauche', label: 'Gauche (G41)' },
    { value: 'droite', label: 'Droite (G42)' }
  ];
  
  // Gérer le changement de type d'entrée de façon sécurisée
  const handleEntryTypeChange = (entryType: EntryType) => {
    onChange({ 
      entree: { 
        type: entryType,
        angle: operation.entree?.angle,
        rayon: operation.entree?.rayon
      } 
    });
  };
  
  // Gérer le changement de type de sortie de façon sécurisée
  const handleExitTypeChange = (exitType: ExitType) => {
    onChange({ 
      sortie: { 
        type: exitType 
      } 
    });
  };
  
  // Gérer le changement d'angle de rampe
  const handleRampAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const angle = parseFloat(e.target.value);
    onChange({ 
      entree: { 
        type: operation.entree?.type || 'rampe', // Type par défaut si undefined
        angle: angle,
        rayon: operation.entree?.rayon
      } 
    });
  };
  
  // Gérer le changement de rayon de spirale
  const handleSpiralRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rayon = parseFloat(e.target.value);
    onChange({ 
      entree: { 
        type: operation.entree?.type || 'spirale', // Type par défaut si undefined
        rayon: rayon,
        angle: operation.entree?.angle
      } 
    });
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Propriétés du contour</h3>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="ferme"
          checked={operation.ferme}
          onChange={(e) => onChange({ ferme: e.target.checked })}
          className="mr-2"
        />
        <label htmlFor="ferme">Contour fermé</label>
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
          value={operation.entree?.type || 'verticale'}
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
      
      {operation.entree?.type === 'rampe' && (
        <div>
          <label className="block text-sm mb-1">Angle de rampe (°)</label>
          <input
            type="number"
            value={operation.entree?.angle || 45}
            onChange={handleRampAngleChange}
            className="input-field"
            min="1"
            max="89"
          />
        </div>
      )}
      
      {operation.entree?.type === 'spirale' && (
        <div>
          <label className="block text-sm mb-1">Rayon de spirale (mm)</label>
          <input
            type="number"
            value={operation.entree?.rayon || 5}
            onChange={handleSpiralRadiusChange}
            className="input-field"
            min="1"
          />
        </div>
      )}
      
      <div>
        <label className="block text-sm mb-1">Type de sortie</label>
        <select
          value={operation.sortie?.type || 'verticale'}
          onChange={(e) => handleExitTypeChange(e.target.value as ExitType)}
          className="input-field"
        >
          {exitTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm mb-1">Compensation d'outil</label>
        <select
          value={operation.compensation || 'aucune'}
          onChange={(e) => onChange({ compensation: e.target.value as 'gauche' | 'droite' | 'aucune' })}
          className="input-field"
        >
          {compensationTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      
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

export default ContourProperties;