// src/models/components/DrawerBack.js
import { Panel } from './Panel.js';

/**
 * Classe représentant un dos de tiroir
 */
export class DrawerBack extends Panel {
  /**
   * Crée un nouveau dos de tiroir
   * @param {string} id - Identifiant unique du dos
   * @param {string} name - Nom descriptif du dos
   * @param {string} materialId - Identifiant du matériau
   * @param {number} width - Largeur en mm (hauteur du dos)
   * @param {number} length - Longueur en mm (largeur interne du tiroir)
   * @param {number} thickness - Épaisseur en mm
   * @param {number} quantity - Quantité de ce dos
   * @param {Object} metadata - Métadonnées supplémentaires
   */
  constructor(id, name, materialId, width, length, thickness, quantity, metadata = {}) {
    super(id, name, materialId, width, length, thickness, quantity, metadata);
    this.type = 'drawer_back';
    this.zoneIndex = metadata.zoneIndex !== undefined ? metadata.zoneIndex : null;
    this.drawerIndex = metadata.drawerIndex !== undefined ? metadata.drawerIndex : null;
    this.subZone = metadata.subZone || null;
    
    // Configuration par défaut des chants pour un dos de tiroir
    // Généralement seul le bord supérieur est visible
    this.setEdgeBanding(true, false, false, false);
  }
  
  /**
   * Met à jour l'épaisseur du dos
   * @param {PanelThickness} panelThickness - Configuration des épaisseurs
   */
  updateThickness(panelThickness) {
    this.thickness = panelThickness.getThickness('drawerBack');
  }
  
  /**
   * Calcule la position du dos par rapport au tiroir complet
   * @param {Object} drawerDimensions - Dimensions du tiroir {width, height, depth}
   * @param {number} frontThickness - Épaisseur de la façade
   * @return {Object} Position {x, y, z}
   */
  calculatePosition(drawerDimensions, frontThickness) {
    return {
      x: 0, // Aligné au côté gauche
      y: 0, // Aligné au bas
      z: drawerDimensions.depth - this.thickness // Au fond du tiroir
    };
  }
  
  /**
   * Convertit un objet JSON en instance de DrawerBack
   * @param {Object} data - Données JSON
   * @param {Function} materialResolver - Fonction pour résoudre les références aux matériaux
   * @return {DrawerBack} Instance de DrawerBack
   */
  static fromJSON(data, materialResolver) {
    const materialId = data.materialId || null;
    
    const back = new DrawerBack(
      data.id,
      data.name,
      materialId,
      data.width,
      data.length,
      data.thickness,
      data.quantity,
      data.metadata || {}
    );
    
    back.edgeBanding = data.edgeBanding || [true, false, false, false];
    back.zoneIndex = data.zoneIndex;
    back.drawerIndex = data.drawerIndex;
    back.subZone = data.subZone;
    
    return back;
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
      subZone: this.subZone
    };
  }
}