// src/models/components/DrawerFront.js
import { Panel } from './Panel.js';

/**
 * Classe représentant une façade de tiroir
 */
export class DrawerFront extends Panel {
  /**
   * Crée une nouvelle façade de tiroir
   * @param {string} id - Identifiant unique de la façade
   * @param {string} name - Nom descriptif de la façade
   * @param {Material} material - Matériau de la façade
   * @param {number} width - Largeur en mm (hauteur de la façade)
   * @param {number} length - Longueur en mm (largeur de la façade)
   * @param {number} thickness - Épaisseur en mm
   * @param {number} quantity - Quantité de cette façade
   * @param {Object} metadata - Métadonnées supplémentaires
   */
  constructor(id, name, material, width, length, thickness, quantity = 1, metadata = {}) {
    super(id, name, material, width, length, thickness, quantity, metadata);
    this.type = 'drawer_front';
    this.zoneIndex = metadata.zoneIndex !== undefined ? metadata.zoneIndex : null;
    this.drawerIndex = metadata.drawerIndex !== undefined ? metadata.drawerIndex : null;
    this.subZone = metadata.subZone || null; // Identifiant de la sous-zone éventuelle
    this.height = metadata.height || null; // Hauteur depuis le bas du meuble
    this.handle = metadata.handle || 'bar'; // Type de poignée: 'bar', 'knob', 'integrated', 'none'
    this.handlePosition = metadata.handlePosition || 'center'; // Position de la poignée: 'top', 'center', 'bottom'
    this.gapSize = metadata.gapSize || 3; // Taille de l'espace entre les façades en mm
    
    // Tous les chants par défaut pour les façades de tiroir
    this.setEdgeBanding(true, true, true, true);
  }

  /**
   * Met à jour l'épaisseur de la façade
   * @param {PanelThickness} panelThickness - Configuration des épaisseurs
   */
  updateThickness(panelThickness) {
    this.thickness = panelThickness.getThickness('drawerFront');
  }
  
  /**
   * Calcule la position verticale de la façade dans la zone
   * @param {number} zoneHeight - Hauteur totale de la zone en mm
   * @param {number} drawerCount - Nombre total de tiroirs dans la zone
   * @return {number} Position Y depuis le bas de la zone en mm
   */
  calculatePositionY(zoneHeight, drawerCount) {
    if (this.drawerIndex === null || drawerCount === 0) return 0;
    
    const drawerHeight = zoneHeight / drawerCount;
    // Les tiroirs sont numérotés de haut en bas (0 = le plus haut)
    return zoneHeight - (this.drawerIndex + 1) * drawerHeight + this.gapSize;
  }
  
  /**
   * Calcule la hauteur de la façade en fonction de la taille de la zone
   * @param {number} zoneHeight - Hauteur totale de la zone en mm
   * @param {number} drawerCount - Nombre total de tiroirs dans la zone
   * @return {number} Hauteur de la façade en mm
   */
  calculateHeight(zoneHeight, drawerCount) {
    if (drawerCount === 0) return zoneHeight;
    
    // Hauteur égale pour tous les tiroirs, moins les espaces entre eux
    return (zoneHeight / drawerCount) - (this.gapSize * 2);
  }
  
  /**
   * Génère les dimensions du corps de tiroir associé à cette façade
   * @param {number} drawerDepth - Profondeur du tiroir en mm
   * @param {PanelThickness} thicknessSettings - Configuration des épaisseurs
   * @return {Object} Dimensions du corps de tiroir {width, height, depth}
   */
  generateDrawerBodyDimensions(drawerDepth, thicknessSettings) {
    // Le corps est légèrement plus petit que la façade
    const sideThickness = thicknessSettings.drawerSides || 12;
    
    return {
      width: this.length - (this.gapSize * 2), // Largeur = longueur de la façade moins espaces
      height: this.width - (this.gapSize * 2), // Hauteur = largeur de la façade moins espaces
      depth: drawerDepth || 500 // Profondeur standard ou spécifiée
    };
  }
  
  /**
   * Définit le type de poignée de la façade
   * @param {string} handleType - Type de poignée ('bar', 'knob', 'integrated', 'none')
   * @param {string} position - Position de la poignée ('top', 'center', 'bottom')
   */
  setHandle(handleType, position = 'center') {
    this.handle = handleType;
    this.handlePosition = position;
  }
  
  /**
   * Calcule la surface visible de la façade
   * @return {number} Surface visible en m²
   */
  getVisibleSurfaceArea() {
    // La surface visible est la face avant uniquement
    return (this.width * this.length) / 1000000; // en m²
  }
  
  /**
   * Convertit un objet JSON en instance de DrawerFront
   * @param {Object} data - Données JSON
   * @param {Function} materialResolver - Fonction pour résoudre les références aux matériaux
   * @return {DrawerFront} Instance de DrawerFront
   */
  static fromJSON(data, materialResolver) {
    const material = materialResolver ? materialResolver(data.materialId) : null;
    
    const front = new DrawerFront(
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
    front.edgeBanding = data.edgeBanding || [true, true, true, true];
    front.zoneIndex = data.zoneIndex;
    front.drawerIndex = data.drawerIndex;
    front.subZone = data.subZone;
    front.height = data.height;
    front.handle = data.handle || 'bar';
    front.handlePosition = data.handlePosition || 'center';
    front.gapSize = data.gapSize || 3;
    
    return front;
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
      height: this.height,
      handle: this.handle,
      handlePosition: this.handlePosition,
      gapSize: this.gapSize
    };
  }
  
  /**
   * Crée un clone de cette façade de tiroir
   * @return {DrawerFront} Un nouveau DrawerFront avec les mêmes propriétés
   */
  clone() {
    const clonedMetadata = { 
      ...this.metadata, 
      zoneIndex: this.zoneIndex,
      drawerIndex: this.drawerIndex,
      subZone: this.subZone,
      height: this.height,
      handle: this.handle,
      handlePosition: this.handlePosition,
      gapSize: this.gapSize
    };
    
    const clone = new DrawerFront(
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
}
