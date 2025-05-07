// src/models/components/Shelf.js
import { Panel } from './Panel.js';

/**
 * Classe représentant une étagère
 */
export class Shelf extends Panel {
  /**
   * Crée une nouvelle étagère
   * @param {string} id - Identifiant unique de l'étagère
   * @param {string} name - Nom descriptif de l'étagère
   * @param {Material} material - Matériau de l'étagère
   * @param {number} width - Largeur en mm
   * @param {number} length - Longueur en mm (profondeur)
   * @param {number} thickness - Épaisseur en mm
   * @param {number} quantity - Quantité de cette étagère
   * @param {Object} metadata - Métadonnées supplémentaires
   */
  constructor(id, name, material, width, length, thickness, quantity = 1, metadata = {}) {
    super(id, name, material, width, length, thickness, quantity, metadata);
    this.type = 'shelf';
    this.retraction = metadata.retraction || 0; // Retrait par rapport à l'avant en mm
    this.zoneIndex = metadata.zoneIndex !== undefined ? metadata.zoneIndex : null;
    this.shelfIndex = metadata.shelfIndex !== undefined ? metadata.shelfIndex : null;
    this.subZone = metadata.subZone || null; // Identifiant de la sous-zone éventuelle
    this.height = metadata.height || null; // Hauteur depuis le bas du meuble en mm
    this.fixationType = metadata.fixationType || 'pins'; // Type de fixation: 'pins', 'brackets', 'integrated'
    this.adjustable = metadata.adjustable !== undefined ? metadata.adjustable : true; // Si l'étagère est ajustable en hauteur
    this.minLoad = metadata.minLoad || 20; // Charge minimale en kg que l'étagère peut supporter
    
    // Définir les chants par défaut pour les étagères (généralement avant et côtés)
    this.setEdgeBanding(false, true, false, true);
  }

  /**
   * Met à jour l'épaisseur de l'étagère
   * @param {PanelThickness} panelThickness - Configuration des épaisseurs
   */
  updateThickness(panelThickness) {
    this.thickness = panelThickness.getThickness('shelves');
  }
  
  /**
   * Calcule la position verticale de l'étagère dans la zone
   * @param {number} zoneHeight - Hauteur totale de la zone en mm
   * @param {number} shelfCount - Nombre total d'étagères dans la zone
   * @return {number} Position Y depuis le bas de la zone en mm
   */
  calculatePositionY(zoneHeight, shelfCount) {
    if (this.shelfIndex === null || shelfCount === 0) return 0;
    
    // Si la hauteur est déjà définie explicitement, l'utiliser
    if (this.height !== null) return this.height;
    
    // Sinon calculer une hauteur répartie uniformément
    const spacing = zoneHeight / (shelfCount + 1);
    return spacing * (this.shelfIndex + 1);
  }
  
  /**
   * Calcule la profondeur effective de l'étagère
   * @param {number} cabinetDepth - Profondeur totale du meuble
   * @param {number} backThickness - Épaisseur du fond (si présent)
   * @return {number} Profondeur effective de l'étagère en mm
   */
  calculateEffectiveDepth(cabinetDepth, backThickness = 0) {
    // Profondeur = profondeur du meuble - retrait - épaisseur du fond (si présent)
    return cabinetDepth - this.retraction - backThickness;
  }
  
  /**
   * Calcule la charge maximale supportée par l'étagère
   * @return {number} Charge maximale en kg
   */
  calculateMaxLoad() {
    // Formule simplifiée pour estimer la charge maximale
    // Basée sur le matériau, l'épaisseur et la largeur
    let materialFactor = 1.0;
    
    // Ajuster le facteur en fonction du matériau
    if (this.material) {
      switch (this.material.id) {
        case 'oak':
        case 'hardwood':
          materialFactor = 1.5;
          break;
        case 'particle_board':
          materialFactor = 0.8;
          break;
        case 'mdf':
          materialFactor = 1.0;
          break;
        case 'metal':
          materialFactor = 2.5;
          break;
        default:
          materialFactor = 1.0;
      }
    }
    
    // L'épaisseur a un impact quadratique sur la résistance
    const thicknessFactor = (this.thickness / 19) ** 2;
    
    // La largeur a un impact inversement proportionnel
    const widthFactor = 1000 / this.width;
    
    // Calcul de la charge estimée
    const maxLoad = this.minLoad * materialFactor * thicknessFactor * widthFactor;
    
    return Math.round(maxLoad);
  }
  
  /**
   * Détermine si l'étagère nécessite un support central
   * @return {boolean} Vrai si un support central est recommandé
   */
  needsCentralSupport() {
    // Si la largeur dépasse 800mm, un support central est généralement recommandé
    return this.width > 800;
  }
  
  /**
   * Calcule la surface visible de l'étagère
   * @return {number} Surface visible en m²
   */
  getVisibleSurfaceArea() {
    // Pour une étagère, généralement la face supérieure et le bord avant sont visibles
    const topSurface = (this.width * this.length) / 1000000;
    const frontEdge = (this.width * this.thickness) / 1000000;
    
    return topSurface + frontEdge;
  }
  
  /**
   * Convertit un objet JSON en instance de Shelf
   * @param {Object} data - Données JSON
   * @param {Function} materialResolver - Fonction pour résoudre les références aux matériaux
   * @return {Shelf} Instance de Shelf
   */
  static fromJSON(data, materialResolver) {
    const material = materialResolver ? materialResolver(data.materialId) : null;
    
    const shelf = new Shelf(
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
    shelf.edgeBanding = data.edgeBanding || [false, true, false, true];
    shelf.retraction = data.retraction || 0;
    shelf.zoneIndex = data.zoneIndex;
    shelf.shelfIndex = data.shelfIndex;
    shelf.subZone = data.subZone;
    shelf.height = data.height;
    shelf.fixationType = data.fixationType || 'pins';
    shelf.adjustable = data.adjustable !== undefined ? data.adjustable : true;
    shelf.minLoad = data.minLoad || 20;
    
    return shelf;
  }
  
  /**
   * Retourne une représentation JSON de l'objet
   * @return {Object} Représentation JSON
   */
  toJSON() {
    const json = super.toJSON();
    return {
      ...json,
      retraction: this.retraction,
      zoneIndex: this.zoneIndex,
      shelfIndex: this.shelfIndex,
      subZone: this.subZone,
      height: this.height,
      fixationType: this.fixationType,
      adjustable: this.adjustable,
      minLoad: this.minLoad
    };
  }
  
  /**
   * Crée un clone de cette étagère
   * @return {Shelf} Une nouvelle Shelf avec les mêmes propriétés
   */
  clone() {
    const clonedMetadata = {
      ...this.metadata,
      retraction: this.retraction,
      zoneIndex: this.zoneIndex,
      shelfIndex: this.shelfIndex,
      subZone: this.subZone,
      height: this.height,
      fixationType: this.fixationType,
      adjustable: this.adjustable,
      minLoad: this.minLoad
    };
    
    const clone = new Shelf(
      `${this.id}_clone`,
      this.name,
      this.material,
      this.width,
      this.length,
      this.thickness,
      this.quantity,
      clonedMetadata
    );
    
    clone.edgeBanding = [...this.edgeBanding];
    
    return clone;
  }
  
  /**
   * Génère une représentation textuelle de l'étagère pour le débogage
   * @return {string} Description de l'étagère
   */
  toString() {
    return `Étagère ${this.name} (${this.width}×${this.length}×${this.thickness} mm)`;
  }
}
