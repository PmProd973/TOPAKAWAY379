// src/models/components/HorizontalSeparator.js
import { Panel } from './Panel.js';

/**
 * Classe représentant un séparateur horizontal
 */
export class HorizontalSeparator extends Panel {
  /**
   * Crée un nouveau séparateur horizontal
   * @param {string} id - Identifiant unique du séparateur
   * @param {string} name - Nom descriptif du séparateur
   * @param {string} materialId - Identifiant du matériau
   * @param {number} width - Largeur en mm (largeur de la zone)
   * @param {number} length - Longueur en mm (profondeur du meuble)
   * @param {number} thickness - Épaisseur en mm
   * @param {number} quantity - Quantité de ce séparateur
   * @param {Object} metadata - Métadonnées supplémentaires
   */
  constructor(id, name, materialId, width, length, thickness, quantity, metadata = {}) {
    super(id, name, materialId, width, length, thickness, quantity, metadata);
    this.type = 'horizontal_separator';
    this.zoneIndex = metadata.zoneIndex !== undefined ? metadata.zoneIndex : null;
    this.separationIndex = metadata.separationIndex || 1; // 1 pour la première, 2 pour la seconde, etc.
    this.position = metadata.position || { x: 0, y: 0, z: 0 };
    this.isStructural = metadata.isStructural !== undefined ? metadata.isStructural : true;
    
    // Chants par défaut pour un séparateur horizontal (avant et côtés)
    this.setEdgeBanding(true, true, false, true);
  }
  
  /**
   * Met à jour l'épaisseur du séparateur
   * @param {PanelThickness} panelThickness - Configuration des épaisseurs
   */
  updateThickness(panelThickness) {
    this.thickness = panelThickness.getThickness('horizontalDividers');
  }
  
  /**
   * Calcule les dimensions des sous-zones créées par ce séparateur
   * @param {number} totalHeight - Hauteur totale de la zone
   * @param {number|null} otherSeparatorHeight - Hauteur d'un autre séparateur (si présent)
   * @return {Object} Dimensions des sous-zones {upper, lower, middle?}
   */
  calculateSubZoneDimensions(totalHeight, otherSeparatorHeight = null) {
    const result = {};
    const y = this.position.y; // Hauteur du séparateur depuis le bas
    
    // Si c'est le seul séparateur
    if (otherSeparatorHeight === null) {
      // Zone inférieure
      result.lower = {
        height: y,
        startY: 0,
        endY: y
      };
      
      // Zone supérieure
      result.upper = {
        height: totalHeight - y - this.thickness,
        startY: y + this.thickness,
        endY: totalHeight
      };
    } 
    // S'il y a deux séparateurs
    else {
      // Si ce séparateur est plus bas que l'autre
      if (y < otherSeparatorHeight) {
        // Zone inférieure
        result.lower = {
          height: y,
          startY: 0,
          endY: y
        };
        
        // Zone du milieu
        result.middle = {
          height: otherSeparatorHeight - y - this.thickness,
          startY: y + this.thickness,
          endY: otherSeparatorHeight
        };
        
        // Zone supérieure
        result.upper = {
          height: totalHeight - otherSeparatorHeight - this.thickness,
          startY: otherSeparatorHeight + this.thickness,
          endY: totalHeight
        };
      } 
      // Si ce séparateur est plus haut que l'autre
      else {
        // Zone inférieure
        result.lower = {
          height: otherSeparatorHeight,
          startY: 0,
          endY: otherSeparatorHeight
        };
        
        // Zone du milieu
        result.middle = {
          height: y - otherSeparatorHeight - this.thickness,
          startY: otherSeparatorHeight + this.thickness,
          endY: y
        };
        
        // Zone supérieure
        result.upper = {
          height: totalHeight - y - this.thickness,
          startY: y + this.thickness,
          endY: totalHeight
        };
      }
    }
    
    return result;
  }
  
  /**
   * Vérifie si la position du séparateur est structurellement solide
   * @param {number} minHeight - Hauteur minimale recommandée pour une sous-zone
   * @param {number} totalHeight - Hauteur totale de la zone
   * @return {Object} Résultat de validation {isValid: boolean, issues: Array}
   */
  validatePosition(minHeight = 300, totalHeight = 2400) {
    const issues = [];
    const y = this.position.y;
    
    // Vérifier que le séparateur n'est pas trop bas
    if (y < minHeight) {
      issues.push(`Séparateur trop bas: ${y}mm (min: ${minHeight}mm)`);
    }
    
    // Vérifier que le séparateur n'est pas trop haut
    if (y > totalHeight - minHeight - this.thickness) {
      issues.push(`Séparateur trop haut: ${y}mm (max: ${totalHeight - minHeight - this.thickness}mm)`);
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }
  
  /**
   * Convertit un objet JSON en instance de HorizontalSeparator
   * @param {Object} data - Données JSON
   * @param {Function} materialResolver - Fonction pour résoudre les références aux matériaux
   * @return {HorizontalSeparator} Instance de HorizontalSeparator
   */
  static fromJSON(data, materialResolver) {
    const materialId = data.materialId || null;
    
    const separator = new HorizontalSeparator(
      data.id,
      data.name,
      materialId,
      data.width,
      data.length,
      data.thickness,
      data.quantity,
      data.metadata || {}
    );
    
    separator.edgeBanding = data.edgeBanding || [true, true, false, true];
    separator.zoneIndex = data.zoneIndex;
    separator.separationIndex = data.separationIndex || 1;
    separator.position = data.position || { x: 0, y: 0, z: 0 };
    separator.isStructural = data.isStructural !== undefined ? data.isStructural : true;
    
    return separator;
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
      separationIndex: this.separationIndex,
      position: this.position,
      isStructural: this.isStructural
    };
  }
}