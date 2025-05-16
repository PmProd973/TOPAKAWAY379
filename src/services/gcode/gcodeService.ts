import { 
  Operation, 
  PanelData, 
  Tool
} from '../../types/models';

// Configuration de base pour la génération de G-code
export interface GCodeConfig {
  machine: 'generic' | 'biesse' | 'homag' | 'scm' | 'grbl';
  safeHeight: number; // Hauteur de sécurité pour les déplacements rapides
  spindleSpeed: number; // Vitesse de rotation de la broche
  feedRate: number; // Vitesse d'avance par défaut
  plungeRate: number; // Vitesse de plongée par défaut
  useToolCompensation: boolean; // Utiliser la compensation d'outil (G41/G42)
}

// Configuration par défaut
const DEFAULT_CONFIG: GCodeConfig = {
  machine: 'generic',
  safeHeight: 10,
  spindleSpeed: 18000,
  feedRate: 800,
  plungeRate: 300,
  useToolCompensation: false
};

/**
 * Générer le G-code pour une pièce complète
 */
export const generateGCode = (
  panelData: PanelData, 
  tools: Tool[],
  config: Partial<GCodeConfig> = {}
): string => {
  // Fusionner la configuration par défaut avec les options fournies
  const fullConfig: GCodeConfig = { ...DEFAULT_CONFIG, ...config };
  
  let gcode = '';
  
  // Ajouter l'en-tête du programme
  gcode += generateHeader(panelData, fullConfig);
  
  // Générer le G-code pour chaque opération
  panelData.operations.forEach((operation, index) => {
    // Récupérer l'outil utilisé
    const tool = tools.find(t => t.id === operation.outil);
    
    if (!tool) {
      // Si l'outil n'est pas trouvé, ajouter un commentaire d'erreur
      gcode += `; ERREUR: Outil "${operation.outil}" non trouvé pour l'opération ${index + 1}\n`;
      return;
    }
    
    // Ajouter un commentaire pour l'opération
    gcode += `\n; Opération ${index + 1}: ${operation.type}\n`;
    
    // Générer le G-code en fonction du type d'opération
    switch (operation.type) {
      case 'perçage':
        gcode += generateDrillingGCode(operation, tool, fullConfig);
        break;
      case 'contournage':
        gcode += generateContourGCode(operation, tool, fullConfig);
        break;
      case 'poche_fermee':
        gcode += generateClosedPocketGCode(operation, tool, fullConfig);
        break;
      case 'poche_ouverte':
        gcode += generateOpenPocketGCode(operation, tool, fullConfig);
        break;
    }
  });
  
  // Ajouter le pied de page du programme
  gcode += generateFooter(fullConfig);
  
  return gcode;
};

/**
 * Générer l'en-tête du programme G-code
 */
const generateHeader = (panelData: PanelData, config: GCodeConfig): string => {
  const { machine } = config;
  
  let header = '';
  
  // Commentaires avec informations sur la pièce
  header += `; Programme G-code pour: ${panelData.nom}\n`;
  header += `; Dimensions: ${panelData.dimensions.longueur} x ${panelData.dimensions.largeur} x ${panelData.dimensions.epaisseur} mm\n`;
  header += `; Matériau: ${panelData.materiau}\n`;
  header += `; Date de génération: ${new Date().toISOString()}\n\n`;
  
  // Ajouter les commandes d'initialisation selon la machine
  switch (machine) {
    case 'generic':
    case 'grbl':
      header += 'G90 ; Mode absolu\n';
      header += 'G21 ; Unités en mm\n';
      header += `G0 Z${config.safeHeight} ; Monter à la hauteur de sécurité\n`;
      header += `M3 S${config.spindleSpeed} ; Démarrer la broche\n`;
      break;
      
    case 'biesse':
      header += '; Programme pour Biesse\n';
      header += 'G90\n';
      header += 'G21\n';
      header += `G0 Z${config.safeHeight}\n`;
      header += `M3 S${config.spindleSpeed}\n`;
      break;
      
    // Ajouter d'autres cas pour des machines spécifiques
    default:
      header += 'G90 ; Mode absolu\n';
      header += 'G21 ; Unités en mm\n';
      header += `G0 Z${config.safeHeight} ; Monter à la hauteur de sécurité\n`;
      header += `M3 S${config.spindleSpeed} ; Démarrer la broche\n`;
  }
  
  return header;
};

/**
 * Générer le pied de page du programme G-code
 */
const generateFooter = (config: GCodeConfig): string => {
  let footer = '\n';
  
  footer += `G0 Z${config.safeHeight} ; Monter à la hauteur de sécurité\n`;
  footer += 'M5 ; Arrêter la broche\n';
  footer += 'M30 ; Fin du programme\n';
  
  return footer;
};

/**
 * Générer le G-code pour une opération de perçage
 */
const generateDrillingGCode = (
  operation: Operation & { type: 'perçage' },
  tool: Tool,
  config: GCodeConfig
): string => {
  const { x, y, profondeur, traversant } = operation;
  const { safeHeight, plungeRate } = config;
  
  let gcode = '';
  
  // Commentaires
  gcode += `; Perçage à X=${x} Y=${y}, Ø=${operation.diametre}mm, Profondeur=${profondeur}mm\n`;
  gcode += `; Outil: ${tool.nom} (Ø${tool.diametre}mm)\n`;
  
  // Déplacement rapide au-dessus du point de perçage
  gcode += `G0 X${x} Y${y} ; Positionnement au-dessus du trou\n`;
  gcode += `G0 Z${safeHeight} ; Hauteur de sécurité\n`;
  
  // Calcul de la profondeur réelle
  const finalDepth = traversant 
    ? -(profondeur + 2) // Ajouter 2mm pour traverser complètement
    : -profondeur;
  
  // Perçage
  gcode += `G1 Z${finalDepth} F${plungeRate} ; Perçage\n`;
  
  // Remontée rapide
  gcode += `G0 Z${safeHeight} ; Remontée\n`;
  
  return gcode;
};

/**
 * Générer le G-code pour une opération de contournage
 */
const generateContourGCode = (
  operation: Operation & { type: 'contournage' },
  tool: Tool,
  config: GCodeConfig
): string => {
  const { 
    chemin, 
    profondeur, 
    multiPass, 
    profondeurPasse = profondeur,
    entree,
    sortie,
    compensation
  } = operation;
  
  const { 
    safeHeight, 
    feedRate, 
    plungeRate,
    useToolCompensation
  } = config;
  
  let gcode = '';
  
  // Commentaires
  gcode += `; Contournage, ${chemin.length} points, Profondeur=${profondeur}mm\n`;
  gcode += `; Outil: ${tool.nom} (Ø${tool.diametre}mm)\n`;
  
  // Calculer le nombre de passes
  const nbPasses = multiPass ? Math.ceil(profondeur / profondeurPasse) : 1;
  
  // Pour chaque passe
  for (let passe = 0; passe < nbPasses; passe++) {
    // Calculer la profondeur de cette passe
    const passDepth = multiPass 
      ? -Math.min((passe + 1) * profondeurPasse, profondeur)
      : -profondeur;
    
    gcode += `\n; Passe ${passe + 1}/${nbPasses} - Profondeur: ${passDepth}mm\n`;
    
    // Aller au premier point en déplacement rapide
    gcode += `G0 X${chemin[0][0]} Y${chemin[0][1]} ; Aller au point de départ\n`;
    gcode += `G0 Z${safeHeight} ; Hauteur de sécurité\n`;
    
    // Activer la compensation d'outil si nécessaire
    if (useToolCompensation && compensation && compensation !== 'aucune') {
      const compCode = compensation === 'gauche' ? 'G41' : 'G42';
      gcode += `${compCode} D${tool.diametre} ; Compensation d'outil\n`;
    }
    
    // Gérer l'entrée d'outil
    if (entree && entree.type === 'rampe' && passe === 0) {
      // Entrée en rampe
      gcode += `G1 Z0 F${plungeRate} ; Contact avec la surface\n`;
      
      // Calculer les coordonnées du point de rampe
      const rampDist = 10; // Distance de rampe (à ajuster selon l'angle)
      const rampX = chemin[0][0] + rampDist;
      const rampY = chemin[0][1] + rampDist;
      
      gcode += `G1 X${rampX} Y${rampY} Z${passDepth} F${plungeRate} ; Rampe d'entrée\n`;
      
      // Revenir au point de départ du contour à la bonne profondeur
      gcode += `G1 X${chemin[0][0]} Y${chemin[0][1]} F${feedRate} ; Retour au début du contour\n`;
    } else {
      // Plongée verticale
      gcode += `G1 Z${passDepth} F${plungeRate} ; Plongée verticale\n`;
    }
    
    // Parcourir tous les points du contour
    for (let i = 1; i < chemin.length; i++) {
      gcode += `G1 X${chemin[i][0]} Y${chemin[i][1]} F${feedRate} ; Point ${i+1}\n`;
    }
    
    // Fermer le contour si nécessaire
    if (operation.ferme) {
      gcode += `G1 X${chemin[0][0]} Y${chemin[0][1]} F${feedRate} ; Fermeture du contour\n`;
    }
    
    // Gérer la sortie d'outil
    if (sortie && sortie.type === 'rampe' && passe === nbPasses - 1) {
      // Sortie en rampe
      const rampDist = 10;
      const rampX = chemin[0][0] + rampDist;
      const rampY = chemin[0][1] + rampDist;
      
      gcode += `G1 X${rampX} Y${rampY} Z0 F${plungeRate} ; Rampe de sortie\n`;
    }
    
    // Désactiver la compensation d'outil si elle était active
    if (useToolCompensation && compensation && compensation !== 'aucune') {
      gcode += 'G40 ; Désactiver la compensation d\'outil\n';
    }
    
    // Remonter à la hauteur de sécurité
    gcode += `G0 Z${safeHeight} ; Remontée à la hauteur de sécurité\n`;
  }
  
  return gcode;
};

/**
 * Générer le G-code pour une opération de poche fermée
 * Note: Ceci est une implémentation simplifiée, une véritable usinage de poche
 * nécessiterait un algorithme plus complexe pour les stratégies de vidage
 */
const generateClosedPocketGCode = (
  operation: Operation & { type: 'poche_fermee' },
  tool: Tool,
  config: GCodeConfig
): string => {
  const { 
    chemin, 
    profondeur, 
    multiPass, 
    profondeurPasse = profondeur,
    strategie
  } = operation;
  
  const { 
    safeHeight, 
    feedRate, 
    plungeRate
  } = config;
  
  let gcode = '';
  
  // Commentaires
  gcode += `; Poche fermée, ${chemin.length} points, Profondeur=${profondeur}mm\n`;
  gcode += `; Outil: ${tool.nom} (Ø${tool.diametre}mm)\n`;
  gcode += `; Stratégie: ${strategie}\n`;
  
  // Calculer le nombre de passes
  const nbPasses = multiPass ? Math.ceil(profondeur / profondeurPasse) : 1;
  
  // Pour chaque passe
  for (let passe = 0; passe < nbPasses; passe++) {
    // Calculer la profondeur de cette passe
    const passDepth = multiPass 
      ? -Math.min((passe + 1) * profondeurPasse, profondeur)
      : -profondeur;
    
    gcode += `\n; Passe ${passe + 1}/${nbPasses} - Profondeur: ${passDepth}mm\n`;
    
    // Pour une implémentation simplifiée, on se contente de suivre le contour
    // Une vraie implémentation nécessiterait un algorithme de "pocketing"
    
    // Aller au premier point en déplacement rapide
    gcode += `G0 X${chemin[0][0]} Y${chemin[0][1]} ; Aller au point de départ\n`;
    gcode += `G0 Z${safeHeight} ; Hauteur de sécurité\n`;
    
    // Plongée
    gcode += `G1 Z${passDepth} F${plungeRate} ; Plongée verticale\n`;
    
    // Parcourir tous les points du contour
    for (let i = 1; i < chemin.length; i++) {
      gcode += `G1 X${chemin[i][0]} Y${chemin[i][1]} F${feedRate} ; Point ${i+1}\n`;
    }
    
    // Fermer le contour
    gcode += `G1 X${chemin[0][0]} Y${chemin[0][1]} F${feedRate} ; Fermeture du contour\n`;
    
    // Remonter à la hauteur de sécurité
    gcode += `G0 Z${safeHeight} ; Remontée à la hauteur de sécurité\n`;
  }
  
  return gcode;
};

/**
 * Générer le G-code pour une opération de poche ouverte
 * Note: Implémentation simplifiée
 */
const generateOpenPocketGCode = (
  operation: Operation & { type: 'poche_ouverte' },
  tool: Tool,
  config: GCodeConfig
): string => {
  const { 
    chemin, 
    profondeur, 
    multiPass, 
    profondeurPasse = profondeur,
    largeur,
    strategie
  } = operation;
  
  const { 
    safeHeight, 
    feedRate, 
    plungeRate
  } = config;
  
  let gcode = '';
  
  // Commentaires
  gcode += `; Poche ouverte, ${chemin.length} points, Profondeur=${profondeur}mm, Largeur=${largeur}mm\n`;
  gcode += `; Outil: ${tool.nom} (Ø${tool.diametre}mm)\n`;
  gcode += `; Stratégie: ${strategie}\n`;
  
  // Calculer le nombre de passes
  const nbPasses = multiPass ? Math.ceil(profondeur / profondeurPasse) : 1;
  
  // Pour chaque passe
  for (let passe = 0; passe < nbPasses; passe++) {
    // Calculer la profondeur de cette passe
    const passDepth = multiPass 
      ? -Math.min((passe + 1) * profondeurPasse, profondeur)
      : -profondeur;
    
    gcode += `\n; Passe ${passe + 1}/${nbPasses} - Profondeur: ${passDepth}mm\n`;
    
    // Aller au premier point en déplacement rapide
    gcode += `G0 X${chemin[0][0]} Y${chemin[0][1]} ; Aller au point de départ\n`;
    gcode += `G0 Z${safeHeight} ; Hauteur de sécurité\n`;
    
    // Plongée
    gcode += `G1 Z${passDepth} F${plungeRate} ; Plongée verticale\n`;
    
    // Parcourir tous les points du chemin
    for (let i = 1; i < chemin.length; i++) {
      gcode += `G1 X${chemin[i][0]} Y${chemin[i][1]} F${feedRate} ; Point ${i+1}\n`;
    }
    
    // Remonter à la hauteur de sécurité
    gcode += `G0 Z${safeHeight} ; Remontée à la hauteur de sécurité\n`;
  }
  
  return gcode;
};

// Exporter les fonctions utilitaires
export default {
  generateGCode,
};