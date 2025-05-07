// src/models/PanelThickness.js
/**
 * Classe gérant les épaisseurs des différents types de panneaux
 */
export class PanelThickness {
  /**
   * Crée un nouvel ensemble d'épaisseurs de panneaux
   * @param {Object} options - Options d'épaisseurs
   */
  constructor(options = {}) {
    this.sides = options.sides || 19;           // Panneaux latéraux
    this.top = options.top || 19;               // Dessus
    this.bottom = options.bottom || 19;         // Bas
    this.shelves = options.shelves || 19;       // Étagères
    this.verticalDividers = options.verticalDividers || 19;  // Séparations verticales
    this.horizontalDividers = options.horizontalDividers || 19; // Séparations horizontales
    this.back = options.back || 8;              // Fond
    this.drawerFront = options.drawerFront || 19; // Façade tiroir
    this.drawerSides = options.drawerSides || 12; // Côtés tiroir
    this.drawerBack = options.drawerBack || 12;  // Dos tiroir
    this.drawerBottom = options.drawerBottom || 8; // Fond tiroir
  }
  
  /**
   * Obtenir l'épaisseur d'un type de panneau spécifique
   * @param {string} type - Type de panneau
   * @return {number} Épaisseur en mm
   */
  getThickness(type) {
    if (this.hasOwnProperty(type)) {
      return this[type];
    }
    console.warn(`Type de panneau inconnu: ${type}, utilisation de l'épaisseur par défaut (19mm)`);
    return 19; // Épaisseur par défaut
  }
  
  /**
   * Définir l'épaisseur d'un type de panneau
   * @param {string} type - Type de panneau
   * @param {number} thickness - Épaisseur en mm
   */
  setThickness(type, thickness) {
    if (this.hasOwnProperty(type)) {
      this[type] = parseFloat(thickness);
    } else {
      console.warn(`Type de panneau inconnu: ${type}, impossible de définir l'épaisseur`);
    }
  }
  
  /**
   * Mettre à jour plusieurs épaisseurs à la fois
   * @param {Object} thicknessSettings - Objet contenant les types et épaisseurs à mettre à jour
   */
  updateThicknesses(thicknessSettings) {
    Object.entries(thicknessSettings).forEach(([type, thickness]) => {
      this.setThickness(type, thickness);
    });
  }
  
  /**
   * Obtenir toutes les épaisseurs sous forme d'objet
   * @return {Object} Objet contenant toutes les épaisseurs
   */
  getAllThicknesses() {
    return {
      sides: this.sides,
      top: this.top,
      bottom: this.bottom,
      shelves: this.shelves,
      verticalDividers: this.verticalDividers,
      horizontalDividers: this.horizontalDividers,
      back: this.back,
      drawerFront: this.drawerFront,
      drawerSides: this.drawerSides,
      drawerBack: this.drawerBack,
      drawerBottom: this.drawerBottom
    };
  }
  
  /**
   * Vérifier si les épaisseurs sont compatibles entre elles
   * (par exemple, l'épaisseur des côtés de tiroir doit être inférieure à celle de la façade)
   * @return {Object} Objet avec les résultats de validation {isValid: boolean, issues: Array}
   */
  validateThicknesses() {
    const issues = [];
    
    // Vérifier que les côtés de tiroir ne sont pas plus épais que la façade
    if (this.drawerSides > this.drawerFront) {
      issues.push("Les côtés de tiroir ne devraient pas être plus épais que la façade");
    }
    
    // Vérifier que le fond de tiroir est moins épais que les côtés
    if (this.drawerBottom > this.drawerSides) {
      issues.push("Le fond de tiroir ne devrait pas être plus épais que les côtés");
    }
    
    // Vérifier que les épaisseurs ne sont pas trop fines pour être structurellement solides
    if (this.sides < 12) {
      issues.push("L'épaisseur des côtés est insuffisante pour assurer la stabilité (min. 12mm)");
    }
    
    if (this.shelves < 12) {
      issues.push("L'épaisseur des étagères est insuffisante pour supporter du poids (min. 12mm)");
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }
  
  /**
   * Calculer l'impact des épaisseurs sur les dimensions intérieures
   * @param {Object} outerDimensions - Dimensions extérieures {width, height, depth}
   * @return {Object} Dimensions intérieures {width, height, depth}
   */
  calculateInnerDimensions(outerDimensions) {
    return {
      width: outerDimensions.width - (this.sides * 2),
      height: outerDimensions.height - this.top - this.bottom,
      depth: outerDimensions.depth - (this.hasBack ? this.back : 0)
    };
  }
  
  /**
   * Charger des épaisseurs prédéfinies selon un type de construction
   * @param {string} presetName - Nom du préréglage ('standard', 'lightweight', 'heavy_duty')
   */
  loadPreset(presetName) {
    const presets = {
      standard: {
        sides: 19,
        top: 19,
        bottom: 19,
        shelves: 19,
        verticalDividers: 19,
        horizontalDividers: 19,
        back: 8,
        drawerFront: 19,
        drawerSides: 12,
        drawerBack: 12,
        drawerBottom: 8
      },
      lightweight: {
        sides: 16,
        top: 16,
        bottom: 16,
        shelves: 16,
        verticalDividers: 16,
        horizontalDividers: 16,
        back: 6,
        drawerFront: 16,
        drawerSides: 10,
        drawerBack: 10,
        drawerBottom: 6
      },
      heavy_duty: {
        sides: 25,
        top: 25,
        bottom: 25,
        shelves: 25,
        verticalDividers: 25,
        horizontalDividers: 25,
        back: 10,
        drawerFront: 25,
        drawerSides: 16,
        drawerBack: 16,
        drawerBottom: 10
      }
    };
    
    const preset = presets[presetName];
    if (preset) {
      this.updateThicknesses(preset);
      return true;
    } 
    
    console.warn(`Préréglage inconnu: ${presetName}`);
    return false;
  }
  
  /**
   * Convertit un objet JSON en instance de PanelThickness
   * @param {Object} data - Données JSON
   * @return {PanelThickness} Instance de PanelThickness
   */
  static fromJSON(data) {
    return new PanelThickness(data);
  }
  
  /**
   * Retourne une représentation JSON de l'objet
   * @return {Object} Représentation JSON
   */
  toJSON() {
    return {
      sides: this.sides,
      top: this.top,
      bottom: this.bottom,
      shelves: this.shelves,
      verticalDividers: this.verticalDividers,
      horizontalDividers: this.horizontalDividers,
      back: this.back,
      drawerFront: this.drawerFront,
      drawerSides: this.drawerSides,
      drawerBack: this.drawerBack,
      drawerBottom: this.drawerBottom
    };
  }
}