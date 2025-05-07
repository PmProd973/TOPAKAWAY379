// src/models/Material.js
/**
 * Classe représentant un matériau utilisé dans la construction du meuble
 */
export class Material {
  /**
   * Crée un nouveau matériau
   * @param {string} id - Identifiant unique du matériau
   * @param {string} name - Nom du matériau
   * @param {string} color - Code couleur hexadécimal
   * @param {string|null} texture - URL de la texture (optionnel)
   * @param {number} price - Prix au m² (optionnel)
   * @param {Object} properties - Propriétés supplémentaires du matériau
   */
  constructor(id, name, color, texture = null, price = 0, properties = {}) {
    this.id = id;
    this.name = name;
    this.color = color; // Code hexadécimal
    this.texture = texture; // URL de la texture
    this.price = parseFloat(price.toFixed(2)); // Prix au m²
    this.properties = {
      density: properties.density || 650, // kg/m³ (valeur par défaut pour le bois)
      type: properties.type || 'wood', // Type de matériau (wood, metal, glass, etc.)
      edgeBandingAvailable: properties.edgeBandingAvailable !== undefined ? properties.edgeBandingAvailable : true,
      maxThickness: properties.maxThickness || 30, // Épaisseur maximale disponible en mm
      minThickness: properties.minThickness || 8, // Épaisseur minimale disponible en mm
      grainDirection: properties.grainDirection || 'vertical', // Direction du grain (vertical, horizontal, none)
      environmentalRating: properties.environmentalRating || 'standard', // Classement environnemental (eco, standard, premium)
      waterResistant: properties.waterResistant || false, // Résistance à l'eau
      ...properties // Autres propriétés personnalisées
    };
  }
  
  /**
   * Obtenir la couleur au format hexadécimal
   * @return {string} Code couleur hexadécimal
   */
  getHexColor() {
    return this.color;
  }
  
  /**
   * Obtenir la couleur au format RGB
   * @return {Object} Objet contenant les valeurs R, G, B
   */
  getRgbColor() {
    const hex = this.color.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }
  
  /**
   * Obtenir l'URL de la texture
   * @return {string|null} URL de la texture ou null
   */
  getTextureUrl() {
    return this.texture;
  }
  
  /**
   * Calculer le prix pour une surface donnée
   * @param {number} surfaceArea - Surface en m²
   * @return {number} Prix total
   */
  calculatePrice(surfaceArea) {
    return this.price * surfaceArea;
  }
  
  /**
   * Calculer le poids pour un volume donné
   * @param {number} volume - Volume en m³
   * @return {number} Poids en kg
   */
  calculateWeight(volume) {
    return this.properties.density * volume;
  }
  
  /**
   * Vérifier si le matériau est disponible dans une épaisseur donnée
   * @param {number} thickness - Épaisseur en mm
   * @return {boolean} Disponibilité
   */
  isAvailableInThickness(thickness) {
    return thickness >= this.properties.minThickness && thickness <= this.properties.maxThickness;
  }
  
  /**
   * Obtenir les épaisseurs standard disponibles pour ce matériau
   * @return {Array} Liste des épaisseurs standard en mm
   */
  getStandardThicknesses() {
    const standardThicknesses = [];
    // Générer les épaisseurs standard disponibles en fonction des limites du matériau
    if (this.properties.minThickness <= 8 && this.properties.maxThickness >= 8) standardThicknesses.push(8);
    if (this.properties.minThickness <= 12 && this.properties.maxThickness >= 12) standardThicknesses.push(12);
    if (this.properties.minThickness <= 16 && this.properties.maxThickness >= 16) standardThicknesses.push(16);
    if (this.properties.minThickness <= 19 && this.properties.maxThickness >= 19) standardThicknesses.push(19);
    if (this.properties.minThickness <= 22 && this.properties.maxThickness >= 22) standardThicknesses.push(22);
    if (this.properties.minThickness <= 25 && this.properties.maxThickness >= 25) standardThicknesses.push(25);
    if (this.properties.minThickness <= 30 && this.properties.maxThickness >= 30) standardThicknesses.push(30);
    
    return standardThicknesses;
  }
  
  /**
   * Vérifier si le matériau a des contraintes spécifiques d'utilisation
   * @param {string} usage - Type d'utilisation (structure, shelf, drawer, etc.)
   * @return {Object} Objet avec {suitable: boolean, recommendations: string[]}
   */
  checkUsageConstraints(usage) {
    const constraints = {
      suitable: true,
      recommendations: []
    };
    
    switch (usage) {
      case 'structure':
        // Vérifier si le matériau est adapté pour la structure
        if (this.properties.type === 'glass') {
          constraints.suitable = false;
          constraints.recommendations.push("Le verre n'est pas recommandé pour les éléments structurels");
        } else if (this.properties.density < 600) {
          constraints.suitable = true;
          constraints.recommendations.push("Ce matériau est léger, vérifiez la stabilité globale du meuble");
        }
        break;
        
      case 'shelf':
        // Vérifier si le matériau est adapté pour les étagères
        if (this.properties.density < 550) {
          constraints.suitable = true;
          constraints.recommendations.push("Ce matériau léger peut nécessiter un support central pour les étagères larges");
        }
        if (this.properties.type === 'glass') {
          constraints.suitable = true;
          constraints.recommendations.push("Pour les étagères en verre, une épaisseur d'au moins 8mm est recommandée");
        }
        break;
        
      case 'drawer':
        // Vérifier si le matériau est adapté pour les tiroirs
        if (this.properties.type === 'glass') {
          constraints.suitable = false;
          constraints.recommendations.push("Le verre n'est pas recommandé pour les composants de tiroir");
        }
        if (!this.properties.edgeBandingAvailable) {
          constraints.suitable = true;
          constraints.recommendations.push("Ce matériau ne permet pas les chants, ce qui peut affecter la durabilité des tiroirs");
        }
        break;
        
      case 'back':
        // Vérifier si le matériau est adapté pour le fond
        if (this.properties.type === 'metal') {
          constraints.suitable = true;
          constraints.recommendations.push("Le métal peut être difficile à percer pour la fixation du fond");
        }
        break;
    }
    
    return constraints;
  }
  
  /**
   * Vérifier si deux matériaux sont compatibles ensemble
   * @param {Material} otherMaterial - Autre matériau à comparer
   * @return {Object} Objet avec {compatible: boolean, reasons: string[]}
   */
  checkCompatibility(otherMaterial) {
    const result = {
      compatible: true,
      reasons: []
    };
    
    // Vérifier les combinaisons potentiellement incompatibles
    if (this.properties.type === 'wood' && otherMaterial.properties.type === 'wood') {
      // Vérifier si les grains des bois sont compatibles
      if (this.properties.grainDirection !== otherMaterial.properties.grainDirection) {
        result.reasons.push("Directions de grain différentes, peut affecter l'apparence");
      }
    }
    
    // Vérifier la compatibilité visuelle des couleurs
    const thisRgb = this.getRgbColor();
    const otherRgb = otherMaterial.getRgbColor();
    
    // Calcul simple de contraste
    const contrast = Math.abs(thisRgb.r - otherRgb.r) + 
                     Math.abs(thisRgb.g - otherRgb.g) + 
                     Math.abs(thisRgb.b - otherRgb.b);
    
    if (contrast < 50) {
      result.reasons.push("Faible contraste entre les couleurs, peut créer une apparence uniforme");
    } else if (contrast > 450) {
      result.reasons.push("Contraste élevé entre les couleurs, peut créer un aspect très contrasté");
    }
    
    // La compatibilité reste généralement true, car il s'agit de préférences esthétiques
    return result;
  }
  
  /**
   * Créer une copie du matériau
   * @param {string} newId - Nouvel identifiant (optionnel)
   * @return {Material} Copie du matériau
   */
  clone(newId = null) {
    return new Material(
      newId || `${this.id}_copy`,
      `${this.name} (copie)`,
      this.color,
      this.texture,
      this.price,
      { ...this.properties }
    );
  }
  
  /**
   * Convertit un objet JSON en instance de Material
   * @param {Object} data - Données JSON
   * @return {Material} Instance de Material
   */
  static fromJSON(data) {
    return new Material(
      data.id,
      data.name,
      data.color,
      data.texture || null,
      data.price || 0,
      data.properties || {}
    );
  }
  
  /**
   * Retourne une représentation JSON de l'objet
   * @return {Object} Représentation JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      texture: this.texture,
      price: this.price,
      properties: this.properties
    };
  }
}