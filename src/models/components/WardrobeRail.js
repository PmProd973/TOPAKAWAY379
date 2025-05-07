// src/models/components/WardrobeRail.js
import { Component } from './Component.js';

/**
 * Classe représentant une tringle de penderie
 */
export class WardrobeRail extends Component {
  /**
   * Crée une nouvelle tringle de penderie
   * @param {string} id - Identifiant unique de la tringle
   * @param {string} name - Nom descriptif de la tringle
   * @param {string} materialId - Identifiant du matériau
   * @param {number} length - Longueur en mm
   * @param {number} diameter - Diamètre en mm
   * @param {number} quantity - Quantité de cette tringle
   * @param {Object} metadata - Métadonnées supplémentaires
   */
  constructor(id, name, materialId, length, diameter = 25, quantity = 1, metadata = {}) {
    // Pour une tringle cylindrique: width = height = diameter
    super(id, name, materialId, diameter, length, diameter, quantity, metadata);
    this.type = 'wardrobe_rail';
    this.diameter = diameter;
    this.zoneIndex = metadata.zoneIndex !== undefined ? metadata.zoneIndex : null;
    this.subZone = metadata.subZone || null;
    this.position = metadata.position || { x: 0, y: 0, z: 0 };
    this.supportType = metadata.supportType || 'standard'; // Type de support (standard, wall_mounted, etc.)
    this.capacity = metadata.capacity || this.calculateCapacity(); // Capacité en kg
  }
  
  /**
   * Calcule la capacité de charge de la tringle
   * @return {number} Capacité en kg
   */
  calculateCapacity() {
    // Formule simplifiée pour estimer la capacité de charge
    // basée sur le diamètre et la longueur
    const baseCapacity = (this.diameter / 25) * 50; // 50kg pour 25mm
    const lengthFactor = Math.min(1, 1000 / this.length); // Réduit la capacité si longueur > 1000mm
    
    return Math.round(baseCapacity * lengthFactor);
  }
  
  /**
   * Calcule la surface occupée par la tringle
   * @return {number} Surface en mm²
   */
  getSurfaceArea() {
    // Surface d'un cylindre = 2πr² + 2πr*h
    const radius = this.diameter / 2;
    return 2 * Math.PI * radius * radius + 2 * Math.PI * radius * this.length;
  }
  
  /**
   * Vérifie si la tringle est compatible avec un certain type de cintre
   * @param {string} hangerType - Type de cintre (standard, wide, slim, etc.)
   * @return {boolean} Compatibilité
   */
  isCompatibleWithHanger(hangerType = 'standard') {
    const compatibilityMap = {
      'standard': this.diameter >= 20 && this.diameter <= 30,
      'wide': this.diameter >= 25,
      'slim': this.diameter <= 25,
      'heavy_duty': this.diameter >= 30
    };
    
    return compatibilityMap[hangerType] || false;
  }
  
  /**
   * Vérifie si la longueur est adaptée pour un certain nombre de vêtements
   * @param {number} clothingCount - Nombre de vêtements
   * @param {number} spacePerItem - Espace par vêtement en mm
   * @return {boolean} True si la longueur est suffisante
   */
  canAccommodate(clothingCount, spacePerItem = 50) {
    return this.length >= clothingCount * spacePerItem;
  }
  
  /**
   * Convertit un objet JSON en instance de WardrobeRail
   * @param {Object} data - Données JSON
   * @param {Function} materialResolver - Fonction pour résoudre les références aux matériaux
   * @return {WardrobeRail} Instance de WardrobeRail
   */
  static fromJSON(data, materialResolver) {
    const materialId = data.materialId || null;
    
    const rail = new WardrobeRail(
      data.id,
      data.name,
      materialId,
      data.length || data.width, // Compatibilité avec différentes structures
      data.diameter || data.thickness || 25, // Différentes façons de spécifier
      data.quantity || 1,
      data.metadata || {}
    );
    
    // Restaurer les propriétés spécifiques
    if (data.position) rail.position = data.position;
    if (data.zoneIndex !== undefined) rail.zoneIndex = data.zoneIndex;
    if (data.subZone) rail.subZone = data.subZone;
    if (data.supportType) rail.supportType = data.supportType;
    if (data.capacity) rail.capacity = data.capacity;
    
    return rail;
  }
  
  /**
   * Retourne une représentation JSON de l'objet
   * @return {Object} Représentation JSON
   */
  toJSON() {
    const json = super.toJSON();
    return {
      ...json,
      diameter: this.diameter,
      zoneIndex: this.zoneIndex,
      subZone: this.subZone,
      position: this.position,
      supportType: this.supportType,
      capacity: this.capacity
    };
  }
}