import DxfParser from 'dxf-parser';
import { 
  Operation, 
  PanelData, 
  DEFAULT_PANEL_DATA, 
  Point2D 
} from '../../types/models';

/**
 * Importer un fichier DXF et le convertir en PanelData
 */
export const importDXF = async (file: File): Promise<PanelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        if (!e.target || typeof e.target.result !== 'string') {
          throw new Error('Erreur de lecture du fichier');
        }
        
        const parser = new DxfParser();
        const dxfData = parser.parseSync(e.target.result);
        
        // Convertir les entités DXF en opérations
        const operations = convertDXFEntitiesToOperations(dxfData.entities);
        
        // Détecter les dimensions de la pièce à partir des entités
        const dimensions = detectDimensionsFromEntities(dxfData.entities);
        
        // Créer les données de la pièce
        const panelData: PanelData = {
          ...DEFAULT_PANEL_DATA,
          nom: file.name.replace(/\.[^/.]+$/, ""), // Nom du fichier sans extension
          dimensions,
          operations
        };
        
        resolve(panelData);
      } catch (error) {
        console.error('Erreur lors du parsing DXF:', error);
        reject(new Error('Erreur lors du parsing DXF: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erreur de lecture du fichier'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Convertir les entités DXF en opérations
 */
const convertDXFEntitiesToOperations = (entities: any[]): Operation[] => {
  const operations: Operation[] = [];
  
  entities.forEach((entity) => {
    try {
      switch (entity.type) {
        case 'CIRCLE':
          // Considérer les cercles comme des perçages
          operations.push({
            type: 'perçage',
            x: entity.center.x,
            y: entity.center.y,
            diametre: entity.radius * 2,
            profondeur: 10, // Profondeur par défaut
            outil: `foret_${Math.round(entity.radius * 2)}mm`, // Outil basé sur diamètre
          });
          break;
          
        case 'LINE':
          // Lignes simples (à éventuellement regrouper en polylines)
          break;
          
        case 'LWPOLYLINE':
        case 'POLYLINE':
          // Convertir les polylines en contour ou poche
          const points: Point2D[] = entity.vertices.map((v: any) => [v.x, v.y]);
          const isClosed = entity.shape === true || entity.closed === true;
          
          if (points.length > 2) {
            if (isClosed) {
              // Polyline fermée -> potentiellement une poche
              operations.push({
                type: 'poche_fermee',
                chemin: points,
                strategie: 'spirale',
                multiPass: true,
                profondeurPasse: 3,
                profondeur: 6,
                outil: 'fraise_6mm', // Outil par défaut
              });
            } else {
              // Polyline ouverte -> contournage
              operations.push({
                type: 'contournage',
                chemin: points,
                ferme: false,
                multiPass: true,
                profondeurPasse: 6,
                profondeur: 18,
                entree: {
                  type: 'rampe',
                  angle: 45
                },
                sortie: {
                  type: 'verticale'
                },
                outil: 'fraise_6mm', // Outil par défaut
              });
            }
          }
          break;
          
        case 'ARC':
          // Traiter les arcs
          break;
          
        case 'SPLINE':
          // Traiter les splines
          break;
          
        // Ajouter d'autres types d'entités au besoin
      }
    } catch (error) {
      console.warn('Erreur lors de la conversion d\'une entité:', error);
    }
  });
  
  return operations;
};

/**
 * Détecter les dimensions de la pièce à partir des entités
 */
const detectDimensionsFromEntities = (entities: any[]): PanelData['dimensions'] => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  const parsePoint = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  
  entities.forEach((entity) => {
    try {
      switch (entity.type) {
        case 'CIRCLE':
          parsePoint(entity.center.x - entity.radius, entity.center.y - entity.radius);
          parsePoint(entity.center.x + entity.radius, entity.center.y + entity.radius);
          break;
          
        case 'LINE':
          parsePoint(entity.start.x, entity.start.y);
          parsePoint(entity.end.x, entity.end.y);
          break;
          
        case 'LWPOLYLINE':
        case 'POLYLINE':
          entity.vertices.forEach((v: any) => parsePoint(v.x, v.y));
          break;
          
        case 'ARC':
          // Approximation simple pour l'arc
          parsePoint(entity.center.x - entity.radius, entity.center.y - entity.radius);
          parsePoint(entity.center.x + entity.radius, entity.center.y + entity.radius);
          break;
          
        case 'SPLINE':
          entity.controlPoints.forEach((p: any) => parsePoint(p.x, p.y));
          break;
      }
    } catch (error) {
      console.warn('Erreur lors de la détection des dimensions:', error);
    }
  });
  
  // Calculer les dimensions
  const width = maxX - minX;
  const height = maxY - minY;
  
  // S'assurer que les dimensions sont positives et valides
  const validWidth = isFinite(width) && width > 0 ? Math.ceil(width) : DEFAULT_PANEL_DATA.dimensions.longueur;
  const validHeight = isFinite(height) && height > 0 ? Math.ceil(height) : DEFAULT_PANEL_DATA.dimensions.largeur;
  
  return {
    longueur: validWidth,
    largeur: validHeight,
    epaisseur: DEFAULT_PANEL_DATA.dimensions.epaisseur // Épaisseur par défaut
  };
};

export default {
  importDXF
};