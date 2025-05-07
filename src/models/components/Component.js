// src/models/components/Component.js

/**
 * Classe de base pour tous les composants du meuble
 */
export class Component {
  /**
   * Crée un nouveau composant de base
   * @param {string} id - Identifiant unique du composant
   * @param {string} name - Nom descriptif du composant
   * @param {Material} material - Matériau du composant
   * @param {number} width - Largeur en mm
   * @param {number} length - Longueur en mm
   * @param {number} thickness - Épaisseur en mm
   * @param {number} quantity - Quantité de ce composant
   * @param {Object} metadata - Métadonnées supplémentaires
   */
  constructor(id, name, material, width, length, thickness, quantity = 1, metadata = {}) {
    this.id = id;
    this.name = name;
    this.material = material;
    this.materialId = material ? material.id : null;
    this.width = parseFloat(width) || 0;
    this.length = parseFloat(length) || 0;
    this.thickness = parseFloat(thickness) || 0;
    this.quantity = parseInt(quantity) || 1;
    this.metadata = metadata || {};
    this.type = 'component'; // Type de base, à surcharger dans les classes dérivées
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.tags = metadata.tags || []; // Étiquettes pour filtrage et organisation
    this.notes = metadata.notes || ""; // Notes pour la fabrication ou l'assemblage
    this.unitCost = metadata.unitCost || 0; // Coût unitaire du composant (sans matériau)
    this.customProperties = metadata.customProperties || {}; // Propriétés personnalisées
    this.manufacturingInstructions = metadata.manufacturingInstructions || []; // Instructions spécifiques
    this.attachments = metadata.attachments || []; // Pièces jointes ou fichiers associés
    this.partNumber = metadata.partNumber || null; // Numéro de pièce pour catalogage
    this.status = metadata.status || 'active'; // État du composant (active, deprecated, etc.)
  }

  /**
   * Calcule le volume du composant
   * @return {number} Volume en m³
   */
  getVolume() {
    return (this.width * this.length * this.thickness * this.quantity) / 1000000000; // en m³
  }

  /**
   * Calcule la surface du composant
   * @return {number} Surface en m²
   */
  getSurfaceArea() {
    return (this.width * this.length * this.quantity) / 1000000; // en m²
  }

  /**
   * Calcule le poids du composant (estimation)
   * @param {number} density - Densité du matériau en kg/m³
   * @return {number} Poids en kg
   */
  getWeight(density = 650) { // Densité moyenne pour le bois
    return this.getVolume() * density;
  }

  /**
   * Calcule le prix du composant en fonction du matériau
   * @return {number} Prix en unité monétaire
   */
  getCost() {
    let cost = this.unitCost * this.quantity;
    
    // Ajouter le coût du matériau si disponible
    if (this.material && this.material.price) {
      cost += this.getSurfaceArea() * this.material.price;
    }
    
    return parseFloat(cost.toFixed(2));
  }
  
  /**
   * Met à jour les propriétés du composant
   * @param {Object} properties - Nouvelles propriétés à appliquer
   * @return {Component} Le composant mis à jour pour chaînage
   */
  update(properties) {
    // Mettre à jour les propriétés de base
    if (properties.name !== undefined) this.name = properties.name;
    if (properties.material !== undefined) {
      this.material = properties.material;
      this.materialId = properties.material ? properties.material.id : null;
    }
    if (properties.materialId !== undefined) this.materialId = properties.materialId;
    if (properties.width !== undefined) this.width = parseFloat(properties.width);
    if (properties.length !== undefined) this.length = parseFloat(properties.length);
    if (properties.thickness !== undefined) this.thickness = parseFloat(properties.thickness);
    if (properties.quantity !== undefined) this.quantity = parseInt(properties.quantity);
    
    // Mettre à jour les propriétés spécifiques
    if (properties.tags !== undefined) this.tags = properties.tags;
    if (properties.notes !== undefined) this.notes = properties.notes;
    if (properties.unitCost !== undefined) this.unitCost = parseFloat(properties.unitCost);
    if (properties.customProperties !== undefined) this.customProperties = properties.customProperties;
    if (properties.manufacturingInstructions !== undefined) this.manufacturingInstructions = properties.manufacturingInstructions;
    if (properties.attachments !== undefined) this.attachments = properties.attachments;
    if (properties.partNumber !== undefined) this.partNumber = properties.partNumber;
    if (properties.status !== undefined) this.status = properties.status;
    
    // Mettre à jour les métadonnées spécifiques
    if (properties.metadata) {
      this.metadata = { ...this.metadata, ...properties.metadata };
    }
    
    // Mettre à jour la date de modification
    this.updatedAt = new Date();
    
    return this;
  }
  
  /**
   * Ajoute une étiquette au composant
   * @param {string} tag - Étiquette à ajouter
   * @return {Component} Le composant mis à jour pour chaînage
   */
  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
    return this;
  }
  
  /**
   * Supprime une étiquette du composant
   * @param {string} tag - Étiquette à supprimer
   * @return {Component} Le composant mis à jour pour chaînage
   */
  removeTag(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    this.updatedAt = new Date();
    return this;
  }
  
  /**
   * Ajoute une instruction de fabrication spécifique
   * @param {string} instruction - Instruction à ajouter
   * @param {Object} params - Paramètres supplémentaires de l'instruction
   * @return {Component} Le composant mis à jour pour chaînage
   */
  addManufacturingInstruction(instruction, params = {}) {
    this.manufacturingInstructions.push({
      instruction,
      params,
      timestamp: new Date().toISOString()
    });
    this.updatedAt = new Date();
    return this;
  }
  
  /**
   * Définit ou met à jour une propriété personnalisée
   * @param {string} key - Clé de la propriété
   * @param {any} value - Valeur de la propriété
   * @return {Component} Le composant mis à jour pour chaînage
   */
  setCustomProperty(key, value) {
    this.customProperties[key] = value;
    this.updatedAt = new Date();
    return this;
  }
  
  /**
   * Vérifie si les dimensions du composant respectent les contraintes
   * @param {Object} constraints - Contraintes de dimensions {minWidth, maxWidth, etc.}
   * @return {boolean} Vrai si les dimensions sont valides
   */
  validateDimensions(constraints = {}) {
    // Valider la largeur
    if (constraints.minWidth !== undefined && this.width < constraints.minWidth) return false;
    if (constraints.maxWidth !== undefined && this.width > constraints.maxWidth) return false;
    
    // Valider la longueur
    if (constraints.minLength !== undefined && this.length < constraints.minLength) return false;
    if (constraints.maxLength !== undefined && this.length > constraints.maxLength) return false;
    
    // Valider l'épaisseur
    if (constraints.minThickness !== undefined && this.thickness < constraints.minThickness) return false;
    if (constraints.maxThickness !== undefined && this.thickness > constraints.maxThickness) return false;
    
    // Valider le ratio dimensions
    if (constraints.maxWidthToLengthRatio !== undefined) {
      const ratio = this.width / this.length;
      if (ratio > constraints.maxWidthToLengthRatio) return false;
    }
    
    // Valider la surface
    if (constraints.maxSurfaceArea !== undefined) {
      const surfaceArea = this.width * this.length / 1000000; // m²
      if (surfaceArea > constraints.maxSurfaceArea) return false;
    }
    
    return true;
  }
  
  /**
   * Redimensionne le composant en maintenant les proportions
   * @param {number} factor - Facteur d'échelle (1 = pas de changement)
   * @return {Component} Le composant mis à jour pour chaînage
   */
  scale(factor) {
    if (factor <= 0) throw new Error("Le facteur d'échelle doit être positif");
    
    this.width *= factor;
    this.length *= factor;
    // Généralement, on ne modifie pas l'épaisseur lors d'une mise à l'échelle
    
    this.updatedAt = new Date();
    return this;
  }
  
  /**
   * Vérifie si le composant a le même matériau qu'un autre
   * @param {Component} otherComponent - Composant à comparer
   * @return {boolean} Vrai si les matériaux sont identiques
   */
  hasSameMaterial(otherComponent) {
    // Vérifier si les deux composants ont des matériaux
    if (!this.material || !otherComponent.material) return false;
    
    // Comparer les IDs des matériaux
    return this.material.id === otherComponent.material.id;
  }
  
  /**
   * Génère une description textuelle du composant pour l'affichage
   * @param {boolean} detailed - Si true, inclut plus de détails
   * @return {string} Description du composant
   */
  getDescription(detailed = false) {
    let desc = `${this.name} (${this.width} × ${this.length} × ${this.thickness} mm)`;
    
    if (detailed) {
      desc += `\nType: ${this.type}`;
      desc += `\nMatériau: ${this.material ? this.material.name : 'Non défini'}`;
      desc += `\nQuantité: ${this.quantity}`;
      
      if (this.notes) {
        desc += `\nNotes: ${this.notes}`;
      }
      
      if (this.tags.length > 0) {
        desc += `\nÉtiquettes: ${this.tags.join(', ')}`;
      }
    }
    
    return desc;
  }
  
  /**
   * Convertit un objet JSON en instance de Component
   * @param {Object} data - Données JSON
   * @param {Function} materialResolver - Fonction pour résoudre les références aux matériaux
   * @return {Component} Instance de Component
   */
  static fromJSON(data, materialResolver) {
    const material = materialResolver ? materialResolver(data.materialId) : null;
    
    const component = new Component(
      data.id,
      data.name,
      material,
      data.width,
      data.length,
      data.thickness,
      data.quantity,
      data.metadata || {}
    );
    
    // Restaurer les propriétés supplémentaires
    component.materialId = data.materialId;
    component.type = data.type || 'component';
    component.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    component.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    component.tags = data.tags || [];
    component.notes = data.notes || "";
    component.unitCost = data.unitCost || 0;
    component.customProperties = data.customProperties || {};
    component.manufacturingInstructions = data.manufacturingInstructions || [];
    component.attachments = data.attachments || [];
    component.partNumber = data.partNumber || null;
    component.status = data.status || 'active';
    
    return component;
  }
  
  /**
   * Retourne une représentation JSON de l'objet
   * @return {Object} Représentation JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      materialId: this.materialId,
      width: this.width,
      length: this.length,
      thickness: this.thickness,
      quantity: this.quantity,
      metadata: this.metadata,
      type: this.type,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      tags: this.tags,
      notes: this.notes,
      unitCost: this.unitCost,
      customProperties: this.customProperties,
      manufacturingInstructions: this.manufacturingInstructions,
      attachments: this.attachments,
      partNumber: this.partNumber,
      status: this.status
    };
  }
  
  /**
   * Crée un clone de ce composant
   * @return {Component} Un nouveau Component avec les mêmes propriétés
   */
  clone() {
    const clonedMetadata = {
      ...this.metadata,
      tags: [...this.tags],
      notes: this.notes,
      unitCost: this.unitCost,
      customProperties: JSON.parse(JSON.stringify(this.customProperties)),
      manufacturingInstructions: JSON.parse(JSON.stringify(this.manufacturingInstructions)),
      attachments: [...this.attachments],
      partNumber: this.partNumber,
      status: this.status
    };
    
    const clone = new Component(
      `${this.id}_clone`,
      this.name,
      this.material,
      this.width,
      this.length,
      this.thickness,
      this.quantity,
      clonedMetadata
    );
    
    clone.materialId = this.materialId;
    clone.type = this.type;
    
    return clone;
  }
  
  /**
   * Génère une représentation textuelle du composant pour le débogage
   * @return {string} Description du composant
   */
  toString() {
    return `${this.type} ${this.name} (${this.width}×${this.length}×${this.thickness} mm)`;
  }
}
