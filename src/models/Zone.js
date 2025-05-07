// src/models/Zone.js

/**
 * Classe représentant une zone dans le meuble
 */
export class Zone {
  /**
   * Crée une nouvelle zone
   * @param {number|string} index - Index ou identifiant de la zone
   * @param {number} position - Position horizontale de la zone (depuis la gauche) en mm
   * @param {number} width - Largeur de la zone en mm
   * @param {number} height - Hauteur de la zone en mm
   */
  constructor(index, position, width, height) {
    this.index = index;
    this.position = parseFloat(position.toFixed(2));
    this.width = parseFloat(width.toFixed(2));
    this.height = parseFloat(height.toFixed(2));
    this.contentType = 'empty'; // Type de contenu (shelves, drawers, wardrobe, horizontal_separation)
    this.settings = {}; // Paramètres spécifiques au contenu
    this.materialId = null; // Matériau par défaut pour cette zone spécifique
    this.customName = null; // Nom personnalisé de la zone
    this.visible = true; // Si la zone est visible dans l'interface
    this.locked = false; // Si la zone est verrouillée (non modifiable)
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.metadata = {}; // Métadonnées supplémentaires
    this.tags = []; // Étiquettes pour filtrage et organisation
  }
  
  /**
   * Définit le type de contenu de la zone
   * @param {string} type - Type de contenu
   */
  setContentType(type) {
    this.contentType = type;
    this.updatedAt = new Date();
    
    // Initialiser les paramètres par défaut selon le type
    switch(type) {
      case 'shelves':
        this.settings = {
          shelfCount: 3,
          shelfRetraction: 0,
          shelfSpacing: 'equal', // equal, custom
          customShelfPositions: [], // positions en mm depuis le bas
          materialId: this.materialId
        };
        break;
        
      case 'drawers':
        this.settings = {
          drawerCount: 3,
          faceHeight: 150,
          operationalGap: 3,
          drawerType: 'standard', // standard, supplier, custom
          drawerDepth: 500, // Profondeur des tiroirs en mm
          handleType: 'bar', // bar, knob, integrated, none
          handlePosition: 'center', // top, center, bottom
          materialId: this.materialId
        };
        break;
        
      case 'wardrobe':
        this.settings = {
          railHeight: 60, // Distance depuis le haut en mm
          railType: 'standard', // standard, oval, heavy-duty
          railMaterial: 'metal',
          hangingRods: [
            {
              position: 'top',
              length: this.width - 40, // Légèrement moins large que la zone
              height: this.height - 60 // Hauteur par défaut
            }
          ],
          hasShelf: true, // Étagère au-dessus de la tringle
          shelfHeight: this.height - 300, // Hauteur de l'étagère (si présente)
          shelfRetraction: 0,
          materialId: this.materialId
        };
        break;
        
      case 'horizontal_separation':
        this.settings = {
          separationHeight: Math.round(this.height * 0.5), // ~50% de la hauteur
          hasSecondSeparation: false,
          secondSeparationHeight: Math.round(this.height * 0.75), // ~75% de la hauteur
          materialId: this.materialId,
          subZones: {
            upper: { contentType: 'empty', settings: {} },
            middle: { contentType: 'empty', settings: {} },
            lower: { contentType: 'empty', settings: {} }
          }
        };
        break;
        
      default:
        this.settings = {
          materialId: this.materialId
        };
        break;
    }
  }
  
  /**
   * Met à jour les paramètres de la zone
   * @param {Object} newSettings - Nouveaux paramètres
   */
  updateSettings(newSettings) {
    // Mise à jour des paramètres avec fusion
    this.settings = { ...this.settings, ...newSettings };
    
    // Traitement spécifique pour les sous-zones
    if (newSettings.subZones) {
      if (!this.settings.subZones) {
        this.settings.subZones = {};
      }
      
      Object.keys(newSettings.subZones).forEach(position => {
        const subZoneSettings = newSettings.subZones[position];
        
        if (this.settings.subZones[position]) {
          // Fusionner les paramètres de la sous-zone existante
          this.settings.subZones[position] = {
            ...this.settings.subZones[position],
            ...subZoneSettings
          };
          
          // Fusion spéciale pour les settings imbriqués de la sous-zone
          if (subZoneSettings.settings && this.settings.subZones[position].settings) {
            this.settings.subZones[position].settings = {
              ...this.settings.subZones[position].settings,
              ...subZoneSettings.settings
            };
          }
        } else {
          // Créer une nouvelle sous-zone
          this.settings.subZones[position] = { ...subZoneSettings };
        }
      });
    }
    
    this.updatedAt = new Date();
  }
  
  /**
   * Obtient les dimensions d'une sous-zone spécifique
   * @param {string} subZonePosition - Position de la sous-zone (upper, middle, lower)
   * @param {number} sepThickness - Épaisseur des séparations horizontales
   * @return {Object} Dimensions de la sous-zone {height, startY, endY}
   */
  getSubZoneDimensions(subZonePosition, sepThickness = 19) {
    if (this.contentType !== 'horizontal_separation' || !this.settings.separationHeight) {
      console.warn("Cette zone n'a pas de séparation horizontale");
      return null;
    }
    
    const sep1Height = this.settings.separationHeight;
    const sep2Height = this.settings.hasSecondSeparation ? this.settings.secondSeparationHeight : 0;
    const halfThickness = sepThickness / 2;
    
    switch(subZonePosition) {
      case 'upper':
        if (this.settings.hasSecondSeparation) {
          // Entre la deuxième séparation et le haut
          return {
            startY: sep2Height + halfThickness,
            endY: this.height,
            height: this.height - (sep2Height + halfThickness)
          };
        } else {
          // Entre la première séparation et le haut
          return {
            startY: sep1Height + halfThickness,
            endY: this.height,
            height: this.height - (sep1Height + halfThickness)
          };
        }
        
      case 'middle':
        if (!this.settings.hasSecondSeparation) return null;
        
        // Entre les deux séparations
        return {
          startY: sep1Height + halfThickness,
          endY: sep2Height - halfThickness,
          height: sep2Height - sep1Height - sepThickness
        };
        
      case 'lower':
        // Entre le bas et la première séparation
        return {
          startY: 0,
          endY: sep1Height - halfThickness,
          height: sep1Height - halfThickness
        };
        
      default:
        console.warn(`Position de sous-zone inconnue: ${subZonePosition}`);
        return null;
    }
  }
  
  /**
   * Configure une sous-zone
   * @param {string} position - Position de la sous-zone (upper, middle, lower)
   * @param {string} contentType - Type de contenu
   * @param {Object} settings - Paramètres de la sous-zone
   */
  configureSubZone(position, contentType, settings = {}) {
    if (this.contentType !== 'horizontal_separation') {
      console.warn("Impossible de configurer une sous-zone dans une zone sans séparation horizontale");
      return;
    }
    
    if (!this.settings.subZones) {
      this.settings.subZones = {};
    }
    
    // Vérifier la validité de la position
    if (!['upper', 'middle', 'lower'].includes(position)) {
      console.warn(`Position de sous-zone invalide: ${position}`);
      return;
    }
    
    // Vérifier si la sous-zone middle peut être configurée
    if (position === 'middle' && !this.settings.hasSecondSeparation) {
      console.warn("Impossible de configurer la sous-zone du milieu sans deuxième séparation");
      return;
    }
    
    // Initialiser la sous-zone
    this.settings.subZones[position] = {
      contentType,
      settings: { ...settings }
    };
    
    this.updatedAt = new Date();
  }
  
  /**
   * Calcule le nombre maximum d'étagères pour la zone
   * @param {number} minSpacing - Espace minimum entre les étagères en mm
   * @param {number} shelfThickness - Épaisseur des étagères en mm
   * @return {number} Nombre maximum d'étagères
   */
  calculateMaxShelves(minSpacing = 300, shelfThickness = 19) {
    // Espace disponible = hauteur - épaisseur d'une étagère
    const availableSpace = this.height - shelfThickness;
    
    // Espace requis par étagère = minSpacing + épaisseur
    const requiredSpacePerShelf = minSpacing + shelfThickness;
    
    // Nombre maximum = espace disponible / espace requis, arrondi à l'entier inférieur
    return Math.floor(availableSpace / requiredSpacePerShelf);
  }
  
  /**
   * Calcule les positions optimales des étagères
   * @param {number} shelfCount - Nombre d'étagères
   * @param {number} shelfThickness - Épaisseur des étagères en mm
   * @return {Array} Positions des étagères en mm depuis le bas
   */
  calculateShelfPositions(shelfCount, shelfThickness = 19) {
    if (shelfCount <= 0) return [];
    
    const positions = [];
    
    if (this.settings.shelfSpacing === 'custom' && 
        this.settings.customShelfPositions && 
        this.settings.customShelfPositions.length === shelfCount) {
      // Utiliser les positions personnalisées
      return [...this.settings.customShelfPositions];
    } else {
      // Calculer des positions réparties uniformément
      const effectiveHeight = this.height - (shelfCount * shelfThickness);
      const spacing = effectiveHeight / (shelfCount + 1);
      
      for (let i = 0; i < shelfCount; i++) {
        // Position = espace + (espace + épaisseur) * index de l'étagère
        const position = spacing + (spacing + shelfThickness) * i;
        positions.push(position);
      }
    }
    
    return positions;
  }
  
  /**
   * Calcule les positions des tiroirs
   * @param {number} drawerCount - Nombre de tiroirs
   * @param {number} faceHeight - Hauteur des façades en mm
   * @param {number} gap - Espace entre les tiroirs en mm
   * @return {Array} Positions des tiroirs en mm depuis le bas
   */
  calculateDrawerPositions(drawerCount, faceHeight, gap = 3) {
    if (drawerCount <= 0) return [];
    
    const positions = [];
    const totalGap = gap * (drawerCount - 1);
    const availableHeight = this.height - totalGap;
    
    // Si la hauteur est spécifiée, l'utiliser
    if (faceHeight > 0) {
      // Vérifier si les tiroirs rentrent dans la zone
      const totalDrawerHeight = faceHeight * drawerCount + totalGap;
      if (totalDrawerHeight > this.height) {
        console.warn(`Impossible de placer ${drawerCount} tiroirs de ${faceHeight}mm dans une zone de ${this.height}mm`);
        faceHeight = (availableHeight / drawerCount); // Ajuster la hauteur
      }
      
      for (let i = 0; i < drawerCount; i++) {
        // Position = hauteur totale - (hauteur de façade + espace) * (index + 1) + espace
        const position = this.height - (faceHeight + gap) * (i + 1) + gap;
        positions.push(position);
      }
    } else {
      // Calculer la hauteur des façades à partir de la zone
      faceHeight = availableHeight / drawerCount;
      
      for (let i = 0; i < drawerCount; i++) {
        const position = this.height - (faceHeight + gap) * (i + 1) + gap;
        positions.push(position);
      }
    }
    
    return positions;
  }
  
  /**
   * Vérifie si la zone peut accueillir une penderie
   * @param {number} minHeight - Hauteur minimale requise pour les vêtements en mm
   * @return {boolean} True si une penderie peut être installée
   */
  canFitWardrobe(minHeight = 1000) {
    return this.height >= minHeight;
  }
  
  /**
   * Vérifie si la zone peut accueillir un tiroir en bas
   * @param {number} minHeight - Hauteur minimale pour le tiroir en mm
   * @return {boolean} True si un tiroir peut être ajouté en bas
   */
  canFitDrawerAtBottom(minHeight = 150) {
    // Si c'est déjà une zone de tiroirs, retourner true
    if (this.contentType === 'drawers') return true;
    
    // Pour une zone de penderie, vérifier l'espace disponible
    if (this.contentType === 'wardrobe') {
      const railPos = this.settings.railHeight || 60;
      const availableHeight = this.height - railPos;
      return railPos >= minHeight;
    }
    
    // Pour une zone d'étagères, vérifier l'espace entre le sol et la première étagère
    if (this.contentType === 'shelves' && this.settings.shelfCount > 0) {
      const firstShelfPos = this.calculateShelfPositions(this.settings.shelfCount)[0];
      return firstShelfPos >= minHeight;
    }
    
    // Pour une zone avec séparation horizontale, vérifier la hauteur de la zone inférieure
    if (this.contentType === 'horizontal_separation') {
      const lowerZone = this.getSubZoneDimensions('lower');
      return lowerZone && lowerZone.height >= minHeight;
    }
    
    // Zone vide ou autre type
    return this.height >= minHeight;
  }
  
  /**
   * Calcule la surface totale nécessaire pour les panneaux de la zone
   * @param {Object} thicknessSettings - Configuration des épaisseurs
   * @return {Object} Surface en m² par type de panneau {shelves, drawers, etc.}
   */
  calculateRequiredPanelArea(thicknessSettings) {
    const result = {
      shelves: 0,
      drawerFront: 0,
      drawerSide: 0,
      drawerBottom: 0,
      drawerBack: 0,
      separator: 0,
      total: 0
    };
    
    const mmToM2 = (width, length) => (width * length) / 1000000;
    
    // Calculer la surface selon le type de contenu
    switch (this.contentType) {
      case 'shelves':
        const shelfCount = this.settings.shelfCount || 0;
        const shelfThickness = thicknessSettings.shelves || 19;
        
        // Surface des étagères
        result.shelves = mmToM2(this.width, this.width) * shelfCount;
        break;
        
      case 'drawers':
        const drawerCount = this.settings.drawerCount || 0;
        const faceHeight = this.settings.faceHeight || 150;
        const drawerSideThickness = thicknessSettings.drawerSides || 12;
        const drawerBackThickness = thicknessSettings.drawerBack || 12;
        const drawerBottomThickness = thicknessSettings.drawerBottom || 8;
        const operationalGap = this.settings.operationalGap || 3;
        const drawerDepth = this.settings.drawerDepth || 500;
        
        // Surface pour les façades de tiroir
        result.drawerFront = mmToM2(this.width - 2 * operationalGap, faceHeight) * drawerCount;
        
        // Surface pour les côtés de tiroir (2 par tiroir)
        result.drawerSide = mmToM2(drawerDepth, faceHeight - 2 * operationalGap) * drawerCount * 2;
        
        // Surface pour le fond de tiroir
        result.drawerBottom = mmToM2(this.width - 2 * operationalGap - 2 * drawerSideThickness, 
                                    drawerDepth - drawerBackThickness) * drawerCount;
        
        // Surface pour l'arrière de tiroir
        result.drawerBack = mmToM2(this.width - 2 * operationalGap - 2 * drawerSideThickness, 
                                  faceHeight - 2 * operationalGap - drawerBottomThickness) * drawerCount;
        break;
        
      case 'horizontal_separation':
        const separatorThickness = thicknessSettings.shelves || 19;
        
        // Surface pour la première séparation
        result.separator += mmToM2(this.width, this.width);
        
        // Surface pour la deuxième séparation si présente
        if (this.settings.hasSecondSeparation) {
          result.separator += mmToM2(this.width, this.width);
        }
        
        // Calculer la surface des sous-zones
        if (this.settings.subZones) {
          Object.entries(this.settings.subZones).forEach(([position, subZone]) => {
            const dimensions = this.getSubZoneDimensions(position, separatorThickness);
            if (dimensions && subZone.contentType) {
              // Créer une nouvelle zone temporaire pour la sous-zone
              const tempZone = new Zone(
                `${this.index}_${position}`,
                this.position,
                this.width,
                dimensions.height
              );
              
              // Configurer le contenu de la zone temporaire
              tempZone.setContentType(subZone.contentType);
              if (subZone.settings) {
                tempZone.updateSettings(subZone.settings);
              }
              
              // Calculer la surface de la sous-zone
              const subArea = tempZone.calculateRequiredPanelArea(thicknessSettings);
              
              // Ajouter à la surface totale
              Object.keys(result).forEach(key => {
                if (key !== 'total' && subArea[key]) {
                  result[key] += subArea[key];
                }
              });
            }
          });
        }
        break;
    }
    
    // Calculer le total
    result.total = Object.values(result).reduce((sum, area) => sum + area, 0);
    
    return result;
  }
  
  /**
   * Vérifie si la zone est vide (sans contenu)
   * @return {boolean} True si la zone est vide
   */
  isEmpty() {
    return this.contentType === 'empty';
  }
  
  /**
   * Ajoute une étiquette à la zone
   * @param {string} tag - Étiquette à ajouter
   */
  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
  }
  
  /**
   * Supprime une étiquette de la zone
   * @param {string} tag - Étiquette à supprimer
   */
  removeTag(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    this.updatedAt = new Date();
  }
  
  /**
   * Définit le matériau pour la zone et tous ses composants
   * @param {string} materialId - ID du matériau
   */
  setMaterial(materialId) {
    this.materialId = materialId;
    
    // Mettre à jour le matériau dans les paramètres
    if (this.settings) {
      this.settings.materialId = materialId;
    }
    
    // Mettre à jour le matériau dans les sous-zones
    if (this.contentType === 'horizontal_separation' && this.settings.subZones) {
      Object.values(this.settings.subZones).forEach(subZone => {
        if (subZone.settings) {
          subZone.settings.materialId = materialId;
        }
      });
    }
    
    this.updatedAt = new Date();
  }
  
  /**
   * Définit un nom personnalisé pour la zone
   * @param {string} name - Nom personnalisé
   */
  setCustomName(name) {
    this.customName = name;
    this.updatedAt = new Date();
  }
  
  /**
   * Obtient le nom de la zone (personnalisé ou généré)
   * @return {string} Nom de la zone
   */
  getName() {
    if (this.customName) return this.customName;
    
    // Générer un nom basé sur l'index et le contenu
    let contentName = "Zone";
    switch (this.contentType) {
      case 'shelves': contentName = "Étagères"; break;
      case 'drawers': contentName = "Tiroirs"; break;
      case 'wardrobe': contentName = "Penderie"; break;
      case 'horizontal_separation': contentName = "Séparation"; break;
    }
    
    return `${contentName} ${parseInt(this.index) + 1}`;
  }
  
  /**
   * Convertit un objet JSON en instance de Zone
   * @param {Object} data - Données JSON
   * @return {Zone} Instance de Zone
   */
  static fromJSON(data) {
    const zone = new Zone(
      data.index,
      data.position,
      data.width,
      data.height
    );
    
    zone.contentType = data.contentType || 'empty';
    zone.settings = data.settings || {};
    zone.materialId = data.materialId;
    zone.customName = data.customName;
    zone.visible = data.visible !== undefined ? data.visible : true;
    zone.locked = data.locked || false;
    zone.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    zone.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    zone.metadata = data.metadata || {};
    zone.tags = data.tags || [];
    
    return zone;
  }
  
  /**
   * Retourne une représentation JSON de l'objet
   * @return {Object} Représentation JSON
   */
  toJSON() {
    return {
      index: this.index,
      position: this.position,
      width: this.width,
      height: this.height,
      contentType: this.contentType,
      settings: this.settings,
      materialId: this.materialId,
      customName: this.customName,
      visible: this.visible,
      locked: this.locked,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      metadata: this.metadata,
      tags: this.tags
    };
  }
  
  /**
   * Crée un clone de cette zone
   * @return {Zone} Une nouvelle Zone avec les mêmes propriétés
   */
  clone() {
    const clone = new Zone(
      `${this.index}_clone`,
      this.position,
      this.width,
      this.height
    );
    
    clone.contentType = this.contentType;
    clone.settings = JSON.parse(JSON.stringify(this.settings)); // Deep copy
    clone.materialId = this.materialId;
    clone.customName = this.customName ? `${this.customName} (copie)` : null;
    clone.visible = this.visible;
    clone.locked = this.locked;
    clone.metadata = { ...this.metadata };
    clone.tags = [...this.tags];
    
    return clone;
  }
}
