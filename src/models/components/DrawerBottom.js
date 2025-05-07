// src/models/components/DrawerBottom.js
import { Panel } from './Panel.js';

/**
 * Classe représentant un fond de tiroir
 */
export class DrawerBottom extends Panel {
  /**
   * Crée un nouveau fond de tiroir
   * @param {string} id - Identifiant unique du fond
   * @param {string} name - Nom descriptif du fond
   * @param {string} materialId - Identifiant du matériau
   * @param {number} width - Largeur en mm (largeur interne du tiroir)
   * @param {number} length - Longueur en mm (profondeur interne du tiroir)
   * @param {number} thickness - Épaisseur en mm
   * @param {number} quantity - Quantité de ce fond
   * @param {Object} metadata - Métadonnées supplémentaires
   */
  constructor(id, name, materialId, width, length, thickness, quantity, metadata = {}) {
    super(id, name, materialId, width, length, thickness, quantity, metadata);
    this.type = 'drawer_bottom';
    this.zoneIndex = metadata.zoneIndex !== undefined ? metadata.zoneIndex : null;
    this.drawerIndex = metadata.drawerIndex !== undefined ? metadata.drawerIndex : null;
    this.subZone = metadata.subZone || null;
    this.orientation = metadata.orientation || 'horizontal';
    
    // Les fonds de tiroir n'ont généralement pas de chants
    this.setEdgeBanding(false, false, false, false);
  }
  
  /**
   * Met à jour l'épaisseur du fond
   * @param {PanelThickness} panelThickness - Configuration des épaisseurs
   */
  updateThickness(panelThickness) {
    this.thickness = panelThickness.getThickness('drawerBottom');
  }
  
  /**
   * Vérifie si les dimensions sont suffisantes pour supporter le poids prévu
   * @param {number} expectedLoad - Charge attendue en kg
   * @return {boolean} True si les dimensions sont suffisantes
   */
  canSupportLoad(expectedLoad = 10) {
    // Calcul simple pour estimer si le fond est assez solide (à affiner selon les matériaux)
    const maxSpan = Math.max(this.width, this.length);
    const thicknessRatio = this.thickness / 8; // 8mm est l'épaisseur de référence
    
    // Plus le span est grand, plus le fond doit être épais
    const maxLoad = 30 * thicknessRatio * (500 / maxSpan);
    
    return expectedLoad <= maxLoad;
  }
  
  /**
   * Suggère une épaisseur minimale pour supporter une charge donnée
   * @param {number} expectedLoad - Charge attendue en kg
   * @param {number} maxSpan - Portée maximale en mm (par défaut, utilise la dimension maximale actuelle)
   * @return {number} Épaisseur recommandée en mm
   */
  suggestMinThickness(expectedLoad = 10, maxSpan = null) {
    if (!maxSpan) {
      maxSpan = Math.max(this.width, this.length);
    }
    
    // Formule inversée du calcul de charge
    return Math.ceil((expectedLoad * 8 * maxSpan) / (30 * 500));
  }
  
  /**
   * Convertit un objet JSON en instance de DrawerBottom
   * @param {Object} data - Données JSON
   * @param {Function} materialResolver - Fonction pour résoudre les références aux matériaux
   * @return {DrawerBottom} Instance de DrawerBottom
   */
  static fromJSON(data, materialResolver) {
    const materialId = data.materialId || null;
    
    const bottom = new DrawerBottom(
      data.id,
      data.name,
      materialId,
      data.width,
      data.length,
      data.thickness,
      data.quantity,
      data.metadata || {}
    );
    
    bottom.edgeBanding = data.edgeBanding || [false, false, false, false];
    bottom.zoneIndex = data.zoneIndex;
    bottom.drawerIndex = data.drawerIndex;
    bottom.subZone = data.subZone;
    bottom.orientation = data.orientation || 'horizontal';
    
    return bottom;
  }
  
  /**
   * Retourne une représentation JSON de l'objet
   * @return {Object} Représentation JSON
   */
  toJSON() {
    const json = super.toJSON();
    return {
      ...json,
      zoneIndex: this.zoneIndex,
      drawerIndex: this.drawerIndex,
      subZone: this.subZone,
      orientation: this.orientation
    };
  }
}