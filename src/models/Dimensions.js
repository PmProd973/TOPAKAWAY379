// src/models/Dimensions.js
/**
 * Classe représentant les dimensions d'un objet (largeur, hauteur, profondeur)
 */
export class Dimensions {
  /**
   * Crée un nouvel objet dimensions
   * @param {number} width - Largeur en mm
   * @param {number} height - Hauteur en mm
   * @param {number} depth - Profondeur en mm
   */
  constructor(width = 0, height = 0, depth = 0) {
    this.width = parseFloat(width.toFixed(2));
    this.height = parseFloat(height.toFixed(2));
    this.depth = parseFloat(depth.toFixed(2));
  }

  /**
   * Crée une copie de l'objet dimensions
   * @return {Dimensions} Une nouvelle instance avec les mêmes valeurs
   */
  clone() {
    return new Dimensions(this.width, this.height, this.depth);
  }
  
  /**
   * Définit toutes les dimensions d'un coup
   * @param {number} width - Largeur en mm
   * @param {number} height - Hauteur en mm
   * @param {number} depth - Profondeur en mm
   * @return {Dimensions} Cette instance pour chaînage
   */
  set(width, height, depth) {
    this.width = parseFloat(width.toFixed(2));
    this.height = parseFloat(height.toFixed(2));
    this.depth = parseFloat(depth.toFixed(2));
    return this;
  }
  
  /**
   * Applique un facteur d'échelle à toutes les dimensions
   * @param {number} factor - Facteur d'échelle
   * @return {Dimensions} Cette instance pour chaînage
   */
  scale(factor) {
    this.width = parseFloat((this.width * factor).toFixed(2));
    this.height = parseFloat((this.height * factor).toFixed(2));
    this.depth = parseFloat((this.depth * factor).toFixed(2));
    return this;
  }
  
  /**
   * Ajoute des dimensions à celles-ci
   * @param {Dimensions} other - Dimensions à ajouter
   * @return {Dimensions} Cette instance pour chaînage
   */
  add(other) {
    this.width = parseFloat((this.width + other.width).toFixed(2));
    this.height = parseFloat((this.height + other.height).toFixed(2));
    this.depth = parseFloat((this.depth + other.depth).toFixed(2));
    return this;
  }
  
  /**
   * Soustrait des dimensions de celles-ci
   * @param {Dimensions} other - Dimensions à soustraire
   * @return {Dimensions} Cette instance pour chaînage
   */
  subtract(other) {
    this.width = Math.max(0, parseFloat((this.width - other.width).toFixed(2)));
    this.height = Math.max(0, parseFloat((this.height - other.height).toFixed(2)));
    this.depth = Math.max(0, parseFloat((this.depth - other.depth).toFixed(2)));
    return this;
  }
  
  /**
   * Calcule le volume en mm³
   * @return {number} Volume en mm³
   */
  getVolume() {
    return this.width * this.height * this.depth;
  }
  
  /**
   * Calcule le volume en m³
   * @return {number} Volume en m³
   */
  getVolumeInCubicMeters() {
    return this.getVolume() / 1000000000;
  }
  
  /**
   * Calcule la surface frontale (largeur x hauteur) en mm²
   * @return {number} Surface en mm²
   */
  getFrontalArea() {
    return this.width * this.height;
  }
  
  /**
   * Calcule la surface latérale (profondeur x hauteur) en mm²
   * @return {number} Surface en mm²
   */
  getLateralArea() {
    return this.depth * this.height;
  }
  
  /**
   * Calcule la surface horizontale (largeur x profondeur) en mm²
   * @return {number} Surface en mm²
   */
  getHorizontalArea() {
    return this.width * this.depth;
  }
  
  /**
   * Calcule la surface totale (somme de toutes les faces) en mm²
   * @return {number} Surface en mm²
   */
  getTotalSurfaceArea() {
    return 2 * (this.getFrontalArea() + this.getLateralArea() + this.getHorizontalArea());
  }
  
  /**
   * Calcule la surface totale en m²
   * @return {number} Surface en m²
   */
  getTotalSurfaceAreaInSquareMeters() {
    return this.getTotalSurfaceArea() / 1000000;
  }
  
  /**
   * Vérifie si les dimensions sont dans les plages acceptables
   * @param {Object} constraints - Contraintes à vérifier {minWidth, maxWidth, minHeight, maxHeight, minDepth, maxDepth}
   * @return {Object} Résultat de validation {isValid: boolean, issues: Array}
   */
  validate(constraints = {}) {
    const {
      minWidth = 100,
      maxWidth = 4000,
      minHeight = 100,
      maxHeight = 3000,
      minDepth = 100,
      maxDepth = 1000
    } = constraints;
    
    const issues = [];
    
    if (this.width < minWidth) {
      issues.push(`Largeur trop petite: ${this.width}mm (min: ${minWidth}mm)`);
    }
    
    if (this.width > maxWidth) {
      issues.push(`Largeur trop grande: ${this.width}mm (max: ${maxWidth}mm)`);
    }
    
    if (this.height < minHeight) {
      issues.push(`Hauteur trop petite: ${this.height}mm (min: ${minHeight}mm)`);
    }
    
    if (this.height > maxHeight) {
      issues.push(`Hauteur trop grande: ${this.height}mm (max: ${maxHeight}mm)`);
    }
    
    if (this.depth < minDepth) {
      issues.push(`Profondeur trop petite: ${this.depth}mm (min: ${minDepth}mm)`);
    }
    
    if (this.depth > maxDepth) {
      issues.push(`Profondeur trop grande: ${this.depth}mm (max: ${maxDepth}mm)`);
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }
  
  /**
   * Arrondit les dimensions aux valeurs standard les plus proches
   * @param {number} step - Pas d'arrondissement (par défaut 10mm)
   * @return {Dimensions} Cette instance pour chaînage
   */
  roundToStandard(step = 10) {
    this.width = parseFloat((Math.round(this.width / step) * step).toFixed(2));
    this.height = parseFloat((Math.round(this.height / step) * step).toFixed(2));
    this.depth = parseFloat((Math.round(this.depth / step) * step).toFixed(2));
    return this;
  }
  
  /**
   * Vérifie si ces dimensions sont égales à d'autres
   * @param {Dimensions} other - Dimensions à comparer
   * @param {number} tolerance - Tolérance en mm
   * @return {boolean} True si égales dans la limite de tolérance
   */
  equals(other, tolerance = 0.01) {
    return (
      Math.abs(this.width - other.width) <= tolerance &&
      Math.abs(this.height - other.height) <= tolerance &&
      Math.abs(this.depth - other.depth) <= tolerance
    );
  }
  
  /**
   * Vérifie si ces dimensions sont inférieures ou égales à d'autres
   * @param {Dimensions} other - Dimensions à comparer
   * @return {boolean} True si toutes les dimensions sont inférieures ou égales
   */
  fitsWithin(other) {
    return (
      this.width <= other.width &&
      this.height <= other.height &&
      this.depth <= other.depth
    );
  }
  
  /**
   * Convertit les dimensions en pouces (pour l'export)
   * @return {Object} Dimensions en pouces {width, height, depth}
   */
  toInches() {
    const mmToInches = 0.0393701;
    return {
      width: parseFloat((this.width * mmToInches).toFixed(2)),
      height: parseFloat((this.height * mmToInches).toFixed(2)),
      depth: parseFloat((this.depth * mmToInches).toFixed(2))
    };
  }
  
  /**
   * Convertit les dimensions en centimètres
   * @return {Object} Dimensions en cm {width, height, depth}
   */
  toCentimeters() {
    return {
      width: parseFloat((this.width / 10).toFixed(2)),
      height: parseFloat((this.height / 10).toFixed(2)),
      depth: parseFloat((this.depth / 10).toFixed(2))
    };
  }
  
  /**
   * Convertit les dimensions en mètres
   * @return {Object} Dimensions en m {width, height, depth}
   */
  toMeters() {
    return {
      width: parseFloat((this.width / 1000).toFixed(3)),
      height: parseFloat((this.height / 1000).toFixed(3)),
      depth: parseFloat((this.depth / 1000).toFixed(3))
    };
  }
  
  /**
   * Définit les dimensions à partir de centimètres
   * @param {number} widthCm - Largeur en cm
   * @param {number} heightCm - Hauteur en cm
   * @param {number} depthCm - Profondeur en cm
   * @return {Dimensions} Cette instance pour chaînage
   */
  setFromCentimeters(widthCm, heightCm, depthCm) {
    this.width = parseFloat((widthCm * 10).toFixed(2));
    this.height = parseFloat((heightCm * 10).toFixed(2));
    this.depth = parseFloat((depthCm * 10).toFixed(2));
    return this;
  }
  
  /**
   * Définit les dimensions à partir de pouces
   * @param {number} widthInches - Largeur en pouces
   * @param {number} heightInches - Hauteur en pouces
   * @param {number} depthInches - Profondeur en pouces
   * @return {Dimensions} Cette instance pour chaînage
   */
  setFromInches(widthInches, heightInches, depthInches) {
    const inchesToMm = 25.4;
    this.width = parseFloat((widthInches * inchesToMm).toFixed(2));
    this.height = parseFloat((heightInches * inchesToMm).toFixed(2));
    this.depth = parseFloat((depthInches * inchesToMm).toFixed(2));
    return this;
  }
  
  /**
   * Génère une chaîne formatée des dimensions
   * @param {string} unit - Unité à utiliser ('mm', 'cm', 'm', 'in')
   * @return {string} Dimensions formatées
   */
  toString(unit = 'mm') {
    let values;
    
    switch (unit) {
      case 'cm':
        values = this.toCentimeters();
        break;
      case 'm':
        values = this.toMeters();
        break;
      case 'in':
        values = this.toInches();
        break;
      case 'mm':
      default:
        values = { width: this.width, height: this.height, depth: this.depth };
    }
    
    return `${values.width} × ${values.height} × ${values.depth} ${unit}`;
  }
  
  /**
   * Convertit un objet JSON en instance de Dimensions
   * @param {Object} data - Données JSON
   * @return {Dimensions} Instance de Dimensions
   */
  static fromJSON(data) {
    return new Dimensions(
      data.width || 0, 
      data.height || 0, 
      data.depth || 0
    );
  }
  
  /**
   * Crée une instance à partir de centimètres
   * @param {number} widthCm - Largeur en cm
   * @param {number} heightCm - Hauteur en cm
   * @param {number} depthCm - Profondeur en cm
   * @return {Dimensions} Nouvelle instance
   */
  static fromCentimeters(widthCm, heightCm, depthCm) {
    const dimensions = new Dimensions();
    return dimensions.setFromCentimeters(widthCm, heightCm, depthCm);
  }
  
  /**
   * Crée une instance à partir de pouces
   * @param {number} widthInches - Largeur en pouces
   * @param {number} heightInches - Hauteur en pouces
   * @param {number} depthInches - Profondeur en pouces
   * @return {Dimensions} Nouvelle instance
   */
  static fromInches(widthInches, heightInches, depthInches) {
    const dimensions = new Dimensions();
    return dimensions.setFromInches(widthInches, heightInches, depthInches);
  }
  
  /**
   * Retourne une représentation JSON de l'objet
   * @return {Object} Représentation JSON
   */
  toJSON() {
    return {
      width: this.width,
      height: this.height,
      depth: this.depth
    };
  }
}