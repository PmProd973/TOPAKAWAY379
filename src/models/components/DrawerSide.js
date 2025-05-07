// src/models/components/DrawerSide.js
import { Panel } from './Panel.js';

/**
 * Classe représentant un côté de tiroir
 */
export class DrawerSide extends Panel {
  /**
   * Crée un nouveau côté de tiroir
   * @param {string} id - Identifiant unique du côté
   * @param {string} name - Nom descriptif du côté
   * @param {string} materialId - Identifiant du matériau
   * @param {number} width - Largeur en mm (hauteur du côté)
   * @param {number} length - Longueur en mm (profondeur du côté)
   * @param {number} thickness - Épaisseur en mm
   * @param {number} quantity - Quantité de ce côté
   * @param {Object} metadata - Métadonnées supplémentaires
   */
  constructor(id, name, materialId, width, length, thickness, quantity, metadata = {}) {
    super(id, name, materialId, width, length, thickness, quantity, metadata);
    this.type = 'drawer_side';
    this.zoneIndex = metadata.zoneIndex !== undefined ? metadata.zoneIndex : null;
    this.drawerIndex = metadata.drawerIndex !== undefined ? metadata.drawerIndex : null;
    this.subZone = metadata.subZone || null;
    this.side = metadata.side || 'left'; // 'left' ou 'right'
    
    // Configuration par défaut des chants pour un côté de tiroir
    this.setEdgeBanding(true, this.side === 'right', true, this.side === 'left');
  }
  
  /**
   * Met à jour l'épaisseur du côté
   * @param {PanelThickness} panelThickness - Configuration des épaisseurs
   */
  updateThickness(panelThickness) {
    this.thickness = panelThickness.getThickness('drawerSides');
  }
  
  /**
   * Convertit un objet JSON en instance de DrawerSide
   * @param {Object} data - Données JSON
   * @param {Function} materialResolver - Fonction pour résoudre les références aux matériaux
   * @return {DrawerSide} Instance de DrawerSide
   */
  static fromJSON(data, materialResolver) {
    const materialId = data.materialId || null;
    
    const side = new DrawerSide(
      data.id,
      data.name,
      materialId,
      data.width,
      data.length,
      data.thickness,
      data.quantity,
      data.metadata || {}
    );
    
    side.edgeBanding = data.edgeBanding || [true, false, true, false];
    side.zoneIndex = data.zoneIndex;
    side.drawerIndex = data.drawerIndex;
    side.subZone = data.subZone;
    side.side = data.side || 'left';
    
    return side;
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
      side: this.side
    };
  }
}