// src/models/components/Panel.js
import { Component } from './Component.js';

/**
 * Classe représentant un panneau standard
 */
export class Panel extends Component {
  /**
   * Crée un nouveau panneau
   * @param {string} id - Identifiant unique du panneau
   * @param {string} name - Nom descriptif du panneau
   * @param {Material} material - Matériau du panneau
   * @param {number} width - Largeur en mm
   * @param {number} length - Longueur en mm
   * @param {number} thickness - Épaisseur en mm
   * @param {number} quantity - Quantité de ce panneau
   * @param {Object} metadata - Métadonnées supplémentaires
   */
  constructor(id, name, material, width, length, thickness, quantity = 1, metadata = {}) {
    super(id, name, material, width, length, thickness, quantity, metadata);
    this.type = 'panel';
    this.edgeBanding = metadata.edgeBanding || [false, false, false, false]; // [haut, droite, bas, gauche]
    this.cutAngle = metadata.cutAngle || 0; // Angle de coupe en degrés (0 = coupe droite)
    this.cornerRadius = metadata.cornerRadius || 0; // Rayon des coins arrondis en mm (0 = coins droits)
    this.position = metadata.position || null; // Position dans le meuble {x, y, z}
    this.orientation = metadata.orientation || 'horizontal'; // horizontal, vertical, frontal
    this.visibilityFactor = metadata.visibilityFactor || 1.0; // Facteur de visibilité (1.0 = complètement visible)
    this.grain = metadata.grain || 'lengthwise'; // Direction du grain: 'lengthwise', 'widthwise', 'none'
    this.fixation = metadata.fixation || []; // Points de fixation avec d'autres composants
    this.drillHoles = metadata.drillHoles || []; // Trous pré-percés
    this.cutouts = metadata.cutouts || []; // Découpes spéciales
    this.finished = metadata.finished !== undefined ? metadata.finished : true; // Si le panneau est coupé aux dimensions finales
    this.labelPosition = metadata.labelPosition || null; // Position d'une étiquette sur le plan
  }

  /**
   * Définit les chants du panneau
   * @param {boolean} top - Chant supérieur
   * @param {boolean} right - Chant droit
   * @param {boolean} bottom - Chant inférieur
   * @param {boolean} left - Chant gauche
   */
  setEdgeBanding(top, right, bottom, left) {
    this.edgeBanding = [
      Boolean(top), 
      Boolean(right), 
      Boolean(bottom), 
      Boolean(left)
    ];
  }

  /**
   * Met à jour l'épaisseur du panneau en fonction du type
   * @param {PanelThickness} panelThickness - Configuration des épaisseurs
   */
  updateThickness(panelThickness) {
    // Cette méthode est surchargée dans les classes dérivées
    this.thickness = panelThickness.getThickness('sides');
  }
  
  /**
   * Définit la position du panneau dans l'espace
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} z - Position Z
   */
  setPosition(x, y, z) {
    this.position = { x, y, z };
  }
  
  /**
   * Ajoute un point de fixation sur le panneau
   * @param {string} targetId - ID du composant cible
   * @param {Object} params - Paramètres de fixation {x, y, type, etc.}
   */
  addFixationPoint(targetId, params = {}) {
    this.fixation.push({
      targetId,
      x: params.x || 0, // Position X sur le panneau (mm depuis le bord gauche)
      y: params.y || 0, // Position Y sur le panneau (mm depuis le bord inférieur)
      side: params.side || 'top', // top, right, bottom, left, front, back
      type: params.type || 'screw', // screw, pin, bracket, glue, etc.
      diameter: params.diameter || 5, // Diamètre du trou en mm si applicable
      depth: params.depth || 0, // Profondeur du trou en mm si applicable
      metadata: params.metadata || {}
    });
  }
  
  /**
   * Ajoute un trou pré-percé sur le panneau
   * @param {number} x - Position X (mm depuis le bord gauche)
   * @param {number} y - Position Y (mm depuis le bord inférieur)
   * @param {Object} params - Paramètres du trou {diamètre, profondeur, etc.}
   */
  addDrillHole(x, y, params = {}) {
    this.drillHoles.push({
      x,
      y,
      side: params.side || 'top', // top, right, bottom, left, front, back
      diameter: params.diameter || 5, // Diamètre du trou en mm
      depth: params.depth || this.thickness, // Profondeur du trou (par défaut = traversant)
      countersink: params.countersink || false, // Si le trou est fraisé
      countersinkDiameter: params.countersinkDiameter || 0, // Diamètre du fraisage
      countersinkDepth: params.countersinkDepth || 0, // Profondeur du fraisage
      purpose: params.purpose || 'fixation', // fixation, shelf-pin, handle, etc.
      metadata: params.metadata || {}
    });
  }
  
  /**
   * Ajoute une découpe dans le panneau
   * @param {string} type - Type de découpe ('rectangle', 'circle', 'polygon', 'custom')
   * @param {Object} params - Paramètres de la découpe
   */
  addCutout(type, params = {}) {
    let cutout = {
      type,
      side: params.side || 'top', // Côté où la découpe est effectuée
      metadata: params.metadata || {}
    };
    
    switch (type) {
      case 'rectangle':
        cutout = {
          ...cutout,
          x: params.x || 0, // Position X du coin supérieur gauche
          y: params.y || 0, // Position Y du coin supérieur gauche
          width: params.width || 0,
          height: params.height || 0,
          cornerRadius: params.cornerRadius || 0 // Rayon des coins si arrondis
        };
        break;
        
      case 'circle':
        cutout = {
          ...cutout,
          centerX: params.centerX || 0,
          centerY: params.centerY || 0,
          radius: params.radius || 0
        };
        break;
        
      case 'polygon':
        cutout = {
          ...cutout,
          points: params.points || [] // Array de points {x, y}
        };
        break;
        
      case 'custom':
        cutout = {
          ...cutout,
          path: params.path || '' // SVG path ou autre représentation de la forme
        };
        break;
    }
    
    this.cutouts.push(cutout);
  }
  
  /**
   * Calcule la surface totale du panneau, y compris les découpes
   * @return {number} Surface totale en m²
   */
  getTotalSurfaceArea() {
    // Surface de base du panneau
    const baseArea = this.getSurfaceArea();
    
    // Soustraire la surface des découpes
    let cutoutArea = 0;
    
    this.cutouts.forEach(cutout => {
      switch (cutout.type) {
        case 'rectangle':
          cutoutArea += (cutout.width * cutout.height) / 1000000;
          break;
          
        case 'circle':
          cutoutArea += Math.PI * (cutout.radius ** 2) / 1000000;
          break;
          
        case 'polygon':
        case 'custom':
          // Pour les formes complexes, une approximation est nécessaire
          // Dans une implémentation réelle, il faudrait implémenter un calcul précis
          break;
      }
    });
    
    return baseArea - cutoutArea;
  }
  
  /**
   * Calcule la longueur totale des chants
   * @return {number} Longueur totale des chants en mètres
   */
  getEdgeBandingLength() {
    let totalLength = 0;
    
    // Chant supérieur
    if (this.edgeBanding[0]) {
      totalLength += this.width / 1000; // Conversion en mètres
    }
    
    // Chant droit
    if (this.edgeBanding[1]) {
      totalLength += this.length / 1000;
    }
    
    // Chant inférieur
    if (this.edgeBanding[2]) {
      totalLength += this.width / 1000;
    }
    
    // Chant gauche
    if (this.edgeBanding[3]) {
      totalLength += this.length / 1000;
    }
    
    return totalLength;
  }
  
  /**
   * Détermine si le panneau a besoin d'être coupé en biais
   * @return {boolean} Vrai si une coupe en biais est nécessaire
   */
  needsAngledCut() {
    return this.cutAngle !== 0;
  }
  
  /**
   * Calcule la vue en développé du panneau (pour les documents techniques)
   * @return {Object} Données pour le dessin technique
   */
  generateTechnicalDrawingData() {
    // Point de référence (0,0) est le coin inférieur gauche
    const drawing = {
      width: this.width,
      height: this.length,
      outline: [
        { x: 0, y: 0 },
        { x: this.width, y: 0 },
        { x: this.width, y: this.length },
        { x: 0, y: this.length },
        { x: 0, y: 0 }
      ],
      edgeBanding: this.generateEdgeBandingLines(),
      drillHoles: this.formatDrillHolesForDrawing(),
      cutouts: this.formatCutoutsForDrawing(),
      labelPosition: this.labelPosition || { x: this.width / 2, y: this.length / 2 },
      orientation: this.orientation,
      thickness: this.thickness,
      grain: this.grain
    };
    
    return drawing;
  }
  
  /**
   * Génère les lignes représentant les chants pour le dessin technique
   * @return {Array} Tableau de lignes pour les chants
   */
  generateEdgeBandingLines() {
    const lines = [];
    
    // Ligne supérieure
    if (this.edgeBanding[0]) {
      lines.push({
        x1: 0,
        y1: this.length,
        x2: this.width,
        y2: this.length,
        thickness: 2 // Épaisseur de ligne pour le dessin
      });
    }
    
    // Ligne droite
    if (this.edgeBanding[1]) {
      lines.push({
        x1: this.width,
        y1: 0,
        x2: this.width,
        y2: this.length,
        thickness: 2
      });
    }
    
    // Ligne inférieure
    if (this.edgeBanding[2]) {
      lines.push({
        x1: 0,
        y1: 0,
        x2: this.width,
        y2: 0,
        thickness: 2
      });
    }
    
    // Ligne gauche
    if (this.edgeBanding[3]) {
      lines.push({
        x1: 0,
        y1: 0,
        x2: 0,
        y2: this.length,
        thickness: 2
      });
    }
    
    return lines;
  }
  
  /**
   * Formate les trous pour le dessin technique
   * @return {Array} Tableau de trous formatés
   */
  formatDrillHolesForDrawing() {
    return this.drillHoles.map(hole => ({
      x: hole.x,
      y: hole.y,
      diameter: hole.diameter,
      depth: hole.depth,
      countersink: hole.countersink,
      side: hole.side,
      purpose: hole.purpose
    }));
  }
  
  /**
   * Formate les découpes pour le dessin technique
   * @return {Array} Tableau de découpes formatées
   */
  formatCutoutsForDrawing() {
    return this.cutouts.map(cutout => {
      const formatted = {
        type: cutout.type,
        side: cutout.side
      };
      
      switch (cutout.type) {
        case 'rectangle':
          return {
            ...formatted,
            x: cutout.x,
            y: cutout.y,
            width: cutout.width,
            height: cutout.height,
            cornerRadius: cutout.cornerRadius
          };
          
        case 'circle':
          return {
            ...formatted,
            centerX: cutout.centerX,
            centerY: cutout.centerY,
            radius: cutout.radius
          };
          
        case 'polygon':
          return {
            ...formatted,
            points: cutout.points
          };
          
        case 'custom':
          return {
            ...formatted,
            path: cutout.path
          };
      }
      
      return formatted;
    });
  }
  
  /**
   * Convertit un objet JSON en instance de Panel
   * @param {Object} data - Données JSON
   * @param {Function} materialResolver - Fonction pour résoudre les références aux matériaux
   * @return {Panel} Instance de Panel
   */
  static fromJSON(data, materialResolver) {
    const material = materialResolver ? materialResolver(data.materialId) : null;
    
    const panel = new Panel(
      data.id,
      data.name,
      material,
      data.width,
      data.length,
      data.thickness,
      data.quantity,
      data.metadata || {}
    );
    
    // Restaurer les propriétés spécifiques
    panel.edgeBanding = data.edgeBanding || [false, false, false, false];
    panel.cutAngle = data.cutAngle || 0;
    panel.cornerRadius = data.cornerRadius || 0;
    panel.position = data.position || null;
    panel.orientation = data.orientation || 'horizontal';
    panel.visibilityFactor = data.visibilityFactor || 1.0;
    panel.grain = data.grain || 'lengthwise';
    panel.fixation = data.fixation || [];
    panel.drillHoles = data.drillHoles || [];
    panel.cutouts = data.cutouts || [];
    panel.finished = data.finished !== undefined ? data.finished : true;
    panel.labelPosition = data.labelPosition || null;
    
    return panel;
  }
  
  /**
   * Retourne une représentation JSON de l'objet
   * @return {Object} Représentation JSON
   */
  toJSON() {
    const json = super.toJSON();
    return {
      ...json,
      edgeBanding: this.edgeBanding,
      cutAngle: this.cutAngle,
      cornerRadius: this.cornerRadius,
      position: this.position,
      orientation: this.orientation,
      visibilityFactor: this.visibilityFactor,
      grain: this.grain,
      fixation: this.fixation,
      drillHoles: this.drillHoles,
      cutouts: this.cutouts,
      finished: this.finished,
      labelPosition: this.labelPosition
    };
  }
  
  /**
   * Crée un clone de ce panneau
   * @return {Panel} Un nouveau Panel avec les mêmes propriétés
   */
  clone() {
    const clonedMetadata = {
      ...this.metadata,
      edgeBanding: [...this.edgeBanding],
      cutAngle: this.cutAngle,
      cornerRadius: this.cornerRadius,
      position: this.position ? { ...this.position } : null,
      orientation: this.orientation,
      visibilityFactor: this.visibilityFactor,
      grain: this.grain,
      fixation: JSON.parse(JSON.stringify(this.fixation)),
      drillHoles: JSON.parse(JSON.stringify(this.drillHoles)),
      cutouts: JSON.parse(JSON.stringify(this.cutouts)),
      finished: this.finished,
      labelPosition: this.labelPosition ? { ...this.labelPosition } : null
    };
    
    const clone = new Panel(
      `${this.id}_clone`,
      this.name,
      this.material,
      this.width,
      this.length,
      this.thickness,
      this.quantity,
      clonedMetadata
    );
    
    // La méthode setEdgeBanding a déjà été appelée via le constructeur avec edgeBanding des metadata
    
    return clone;
  }
  
  /**
   * Génère une représentation textuelle du panneau pour le débogage
   * @return {string} Description du panneau
   */
  toString() {
    return `Panneau ${this.name} (${this.width}×${this.length}×${this.thickness} mm)`;
  }
}
