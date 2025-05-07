// src/models/FurnitureProject.js
import { Dimensions } from './Dimensions.js';
import { Zone } from './Zone.js';
import { Panel } from './components/Panel.js';
import { Shelf } from './components/Shelf.js';
import { DrawerFront } from './components/DrawerFront.js';
import { DrawerSide } from './components/DrawerSide.js';
import { DrawerBottom } from './components/DrawerBottom.js';
import { DrawerBack } from './components/DrawerBack.js';
import { WardrobeRail } from './components/WardrobeRail.js';
import { HorizontalSeparator } from './components/HorizontalSeparator.js';

/**
 * Classe principale représentant un projet de meuble complet
 */
export class FurnitureProject {
  /**
   * Crée un nouveau projet de meuble
   * @param {string} name - Nom du projet
   */
  constructor(name = "Nouveau Projet") {
    this.id = this.generateId();
    this.name = name;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    // Propriétés du meuble
    this.dimensions = new Dimensions(2000, 2400, 600);
    this.materialId = null; // Référence au matériau par défaut
    this.hasBack = true;
    
    // Structure du meuble
    this.zones = [];
    this.dividers = [];
    this.components = [];
    
    // Configuration des épaisseurs
    this.thicknessSettings = {
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
    };
    
    // États pour l'annulation/rétablissement
    this.stateHistory = [];
    this.currentStateIndex = -1;
    
    // Métadonnées du projet
    this.metadata = {
      tags: [],
      category: 'dressing',
      description: '',
      customerInfo: {},
      notes: '',
      version: '1.0.0'
    };
  }
  
  /**
   * Génère un identifiant unique pour le projet
   * @return {string} Identifiant unique
   */
  generateId() {
    return Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Génère un identifiant unique pour un composant
   * @param {string} type - Type de composant
   * @param {number|string} zoneIndex - Index de la zone
   * @param {number|string} index - Index du composant
   * @return {string} Identifiant unique
   */
  generateComponentId(type, zoneIndex, index) {
    return `${type}_zone${zoneIndex}_${index}`;
  }
  
  /**
   * Initialise le projet avec une structure par défaut
   * @param {string} materialId - Identifiant du matériau par défaut
   */
  initialize(materialId) {
    this.materialId = materialId;
    this.createDefaultStructure();
    this.saveState(); // Sauvegarde l'état initial pour l'annulation
  }
  
  /**
   * Crée une structure de meuble par défaut
   */
  createDefaultStructure() {
    // Créer une structure par défaut avec 2 zones séparées par un séparateur
    const middlePosition = this.dimensions.width / 2; // Au milieu
    
    // Ajouter le séparateur vertical
    this.addVerticalDivider(middlePosition);
    
    // Créer 2 zones égales
    const zoneWidth = (this.dimensions.width - (this.dividers.length + 1) * this.thicknessSettings.sides) / 2;
    
    const leftZone = new Zone(0, 0, zoneWidth, this.dimensions.height);
    leftZone.setContentType('shelves');
    
    const rightZone = new Zone(1, middlePosition + this.thicknessSettings.sides, zoneWidth, this.dimensions.height);
    rightZone.setContentType('wardrobe');
    
    this.zones = [leftZone, rightZone];
    
    // Générer les composants en fonction de la structure
    this.regenerateComponents();
  }
  
  /**
   * Ajoute un séparateur vertical à la position spécifiée
   * @param {number} position - Position horizontale en mm
   * @return {Object} Séparateur ajouté
   */
  addVerticalDivider(position) {
    const divider = {
      index: this.dividers.length,
      position: parseFloat(position.toFixed(2)),
      thickness: this.thicknessSettings.verticalDividers
    };
    
    this.dividers.push(divider);
    this.sortDividers();
    this.saveState();
    return divider;
  }
  
  /**
   * Supprime un séparateur vertical
   * @param {number} index - Index du séparateur à supprimer
   * @return {boolean} Succès de l'opération
   */
  removeVerticalDivider(index) {
    if (index < 0 || index >= this.dividers.length) {
      console.error(`Séparateur d'index ${index} introuvable`);
      return false;
    }
    
    this.dividers.splice(index, 1);
    this.sortDividers();
    this.recalculateZones();
    this.regenerateComponents();
    this.saveState();
    return true;
  }
  
  /**
   * Trie les séparateurs par position
   */
  sortDividers() {
    this.dividers.sort((a, b) => a.position - b.position);
    
    // Mettre à jour les indices
    this.dividers.forEach((divider, index) => {
      divider.index = index;
    });
  }
  
  /**
   * Met à jour la position d'un séparateur vertical
   * @param {number} index - Index du séparateur
   * @param {number} newPosition - Nouvelle position horizontale en mm
   * @return {boolean} Succès de l'opération
   */
  updateDividerPosition(index, newPosition) {
    if (index < 0 || index >= this.dividers.length) {
      console.error(`Séparateur d'index ${index} introuvable`);
      return false;
    }
    
    // Vérifier que la position est dans les limites du meuble
    if (newPosition <= 0 || newPosition >= this.dimensions.width) {
      console.error(`Position invalide: ${newPosition}mm`);
      return false;
    }
    
    this.dividers[index].position = parseFloat(newPosition.toFixed(2));
    this.sortDividers();
    this.recalculateZones();
    this.regenerateComponents();
    this.saveState();
    return true;
  }
  
  /**
   * Met à jour les dimensions du meuble
   * @param {Object} newDimensions - Nouvelles dimensions
   */
  updateDimensions(newDimensions) {
    let changed = false;
    
    if (newDimensions.width !== undefined) {
      this.dimensions.width = parseFloat(newDimensions.width.toFixed(2));
      changed = true;
    }
    
    if (newDimensions.height !== undefined) {
      this.dimensions.height = parseFloat(newDimensions.height.toFixed(2));
      changed = true;
    }
    
    if (newDimensions.depth !== undefined) {
      this.dimensions.depth = parseFloat(newDimensions.depth.toFixed(2));
      changed = true;
    }
    
    if (changed) {
      // Recalculer les zones après modification des dimensions
      this.recalculateZones();
      this.regenerateComponents();
      this.saveState();
    }
  }
  
  /**
   * Recalcule les dimensions des zones après modification des dimensions ou des séparateurs
   */
  recalculateZones() {
    // Fusionner tous les points de séparation (incluant les bords gauche et droit)
    const separationPoints = [
      0, // Bord gauche
      ...this.dividers.map(d => d.position),
      this.dimensions.width // Bord droit
    ].sort((a, b) => a - b);
    
    // Réinitialiser toutes les zones
    this.zones = [];
    
    // Créer les zones entre chaque paire de points de séparation
    for (let i = 0; i < separationPoints.length - 1; i++) {
      const startPosition = i === 0 ? 0 : separationPoints[i] + this.thicknessSettings.verticalDividers;
      const endPosition = separationPoints[i + 1];
      const width = endPosition - startPosition;
      
      // Ne pas créer de zones trop petites (moins de 100mm)
      if (width >= 100) {
        const zone = new Zone(
          this.zones.length,
          startPosition,
          width,
          this.dimensions.height
        );
        
        // Définir un contenu par défaut pour les nouvelles zones
        zone.setContentType('shelves');
        
        this.zones.push(zone);
      }
    }
    
    // Mettre à jour les indices des zones
    this.zones.forEach((zone, index) => {
      zone.index = index;
    });
  }
  
  /**
   * Met à jour le contenu d'une zone
   * @param {number} zoneIndex - Index de la zone
   * @param {string} contentType - Type de contenu
   * @param {Object} settings - Paramètres spécifiques
   * @return {boolean} Succès de l'opération
   */
  updateZoneContent(zoneIndex, contentType, settings = {}) {
    const zone = this.zones.find(z => z.index === zoneIndex);
    if (!zone) {
      console.error(`Zone ${zoneIndex} non trouvée`);
      return false;
    }
    
    zone.setContentType(contentType);
    zone.updateSettings(settings);
    
    // Régénérer les composants après modification du contenu
    this.regenerateComponents();
    this.saveState();
    return true;
  }
  
  /**
   * Met à jour les paramètres d'une sous-zone
   * @param {number} zoneIndex - Index de la zone parent
   * @param {string} subZonePosition - Position de la sous-zone (upper, middle, lower)
   * @param {string} contentType - Type de contenu
   * @param {Object} settings - Paramètres spécifiques
   * @return {boolean} Succès de l'opération
   */
  updateSubZoneContent(zoneIndex, subZonePosition, contentType, settings = {}) {
    const zone = this.zones.find(z => z.index === zoneIndex);
    if (!zone || zone.contentType !== 'horizontal_separation') {
      console.error(`Zone ${zoneIndex} non trouvée ou n'est pas une séparation horizontale`);
      return false;
    }
    
    if (!zone.settings.subZones || !zone.settings.subZones[subZonePosition]) {
      console.error(`Sous-zone ${subZonePosition} non trouvée`);
      return false;
    }
    
    // Mettre à jour la sous-zone
    zone.settings.subZones[subZonePosition] = {
      contentType: contentType,
      settings: settings
    };
    
    // Régénérer les composants
    this.regenerateComponents();
    this.saveState();
    return true;
  }
  
  /**
   * Régénère la liste complète des composants du meuble
   */
  regenerateComponents() {
    // Vider la liste des composants
    this.components = [];
    
    // Ajouter les panneaux structurels
    this.addStructuralPanels();
    
    // Ajouter les composants de chaque zone
    this.zones.forEach(zone => {
      this.addZoneComponents(zone);
    });
    
    // Mettre à jour la date de modification
    this.updatedAt = new Date();
  }
  
  /**
   * Ajoute les panneaux structurels (côtés, dessus, bas, séparations)
   */
  addStructuralPanels() {
    const { width, height, depth } = this.dimensions;
    
    // Obtenir le matériau principal
    const materialId = this.materialId;
    
    // Côté gauche
    this.components.push(new Panel(
      'side_left',
      'Côté gauche',
      materialId,
      height,
      depth,
      this.thicknessSettings.sides,
      1,
      {
        position: { x: 0, y: 0, z: 0 },
        edgeBanding: [true, true, true, false], // [haut, droite, bas, gauche]
        isStructural: true
      }
    ));
    
    // Côté droit
    this.components.push(new Panel(
      'side_right',
      'Côté droit',
      materialId,
      height,
      depth,
      this.thicknessSettings.sides,
      1,
      {
        position: { x: width - this.thicknessSettings.sides, y: 0, z: 0 },
        edgeBanding: [true, false, true, true], // [haut, droite, bas, gauche]
        isStructural: true
      }
    ));
    
    // Dessus (top)
    this.components.push(new Panel(
      'top',
      'Dessus',
      materialId,
      width - (2 * this.thicknessSettings.sides),
      depth,
      this.thicknessSettings.top,
      1,
      {
        position: { x: this.thicknessSettings.sides, y: height - this.thicknessSettings.top, z: 0 },
        edgeBanding: [true, true, false, true], // [avant, droite, arrière, gauche]
        isStructural: true
      }
    ));
    
    // Bas (bottom)
    this.components.push(new Panel(
      'bottom',
      'Bas',
      materialId,
      width - (2 * this.thicknessSettings.sides),
      depth,
      this.thicknessSettings.bottom,
      1,
      {
        position: { x: this.thicknessSettings.sides, y: 0, z: 0 },
        edgeBanding: [true, true, false, true], // [avant, droite, arrière, gauche]
        isStructural: true
      }
    ));
    
    // Séparateurs verticaux
    this.dividers.forEach((divider, index) => {
      this.components.push(new Panel(
        `divider_v_${index}`,
        `Séparateur vertical ${index + 1}`,
        materialId,
        height,
        depth,
        this.thicknessSettings.verticalDividers,
        1,
        {
          position: { x: divider.position, y: 0, z: 0 },
          edgeBanding: [true, true, true, true], // [haut, droite, bas, gauche]
          isStructural: true,
          dividerIndex: index
        }
      ));
    });
    
    // Fond (si présent)
    if (this.hasBack) {
      this.components.push(new Panel(
        'back',
        'Fond',
        materialId,
        height,
        width,
        this.thicknessSettings.back,
        1,
        {
          position: { x: 0, y: 0, z: depth - this.thicknessSettings.back },
          edgeBanding: [false, false, false, false], // Pas de chants pour le fond
          isStructural: true,
          orientation: 'vertical'
        }
      ));
    }
  }
  
  /**
   * Ajoute les composants spécifiques à une zone
   * @param {Zone} zone - Zone à traiter
   */
  addZoneComponents(zone) {
    // Dispatch selon le type de contenu de la zone
    switch (zone.contentType) {
      case 'shelves':
        this.addShelves(zone);
        break;
      case 'drawers':
        this.addDrawers(zone);
        break;
      case 'wardrobe':
        this.addWardrobe(zone);
        break;
      case 'horizontal_separation':
        this.addHorizontalSeparation(zone);
        break;
      // Autres types à ajouter ici
    }
  }
  
  /**
   * Ajoute des étagères à une zone
   * @param {Zone} zone - Zone à traiter
   */
  addShelves(zone) {
    const shelfCount = zone.settings.shelfCount || 3;
    const shelfRetraction = zone.settings.shelfRetraction || 0;
    const effectiveDepth = this.dimensions.depth - shelfRetraction - (this.hasBack ? this.thicknessSettings.back : 0);
    
    // Calculer l'espacement des étagères
    const availableHeight = zone.height - this.thicknessSettings.top - this.thicknessSettings.bottom;
    const shelfSpacing = availableHeight / (shelfCount + 1);
    
    for (let i = 0; i < shelfCount; i++) {
      // Calculer la hauteur de l'étagère
      const shelfY = this.thicknessSettings.bottom + shelfSpacing * (i + 1);
      
      // Créer l'étagère
      this.components.push(new Shelf(
        this.generateComponentId('shelf', zone.index, i),
        `Étagère ${i + 1} - Zone ${zone.index + 1}`,
        this.materialId,
        zone.width,
        effectiveDepth,
        this.thicknessSettings.shelves,
        1,
        {
          position: { x: zone.position, y: shelfY, z: 0 },
          zoneIndex: zone.index,
          shelfIndex: i,
          retraction: shelfRetraction,
          edgeBanding: [true, true, false, true] // [avant, droite, arrière, gauche]
        }
      ));
    }
  }
  
  /**
   * Ajoute des étagères à une sous-zone
   * @param {Zone} zone - Zone parente
   * @param {Object} subZone - Configuration de la sous-zone
   * @param {string} subZonePosition - Position de la sous-zone (upper, middle, lower)
   * @param {Object} subZoneDimensions - Dimensions de la sous-zone
   */
  addSubZoneShelves(zone, subZone, subZonePosition, subZoneDimensions) {
    if (!subZone || !subZone.settings) return;
    
    const shelfCount = subZone.settings.shelfCount || 2;
    const shelfRetraction = subZone.settings.shelfRetraction || 0;
    const effectiveDepth = this.dimensions.depth - shelfRetraction - (this.hasBack ? this.thicknessSettings.back : 0);
    
    // Calculer l'espacement des étagères
    const availableHeight = subZoneDimensions.height;
    const shelfSpacing = availableHeight / (shelfCount + 1);
    
    for (let i = 0; i < shelfCount; i++) {
      // Calculer la hauteur de l'étagère
      const shelfY = subZoneDimensions.startY + shelfSpacing * (i + 1);
      
      // Créer l'étagère
      this.components.push(new Shelf(
        this.generateComponentId(`shelf_${subZonePosition}`, zone.index, i),
        `Étagère ${i + 1} - ${this.getSubZonePositionName(subZonePosition)} - Zone ${zone.index + 1}`,
        this.materialId,
        zone.width,
        effectiveDepth,
        this.thicknessSettings.shelves,
        1,
        {
          position: { x: zone.position, y: shelfY, z: 0 },
          zoneIndex: zone.index,
          shelfIndex: i,
          retraction: shelfRetraction,
          subZone: subZonePosition,
          edgeBanding: [true, true, false, true] // [avant, droite, arrière, gauche]
        }
      ));
    }
  }
  
  /**
   * Ajoute des tiroirs à une zone
   * @param {Zone} zone - Zone à traiter
   */
  addDrawers(zone) {
    const drawerCount = zone.settings.drawerCount || 3;
    const faceHeight = zone.settings.faceHeight || 150;
    const operationalGap = zone.settings.operationalGap || 3;
    const drawerType = zone.settings.drawerType || 'standard';
    
    // Calculer l'espacement et la position des tiroirs
    const availableHeight = zone.height - this.thicknessSettings.top - this.thicknessSettings.bottom;
    const totalFaceHeight = drawerCount * faceHeight;
    const verticalSpacing = (availableHeight - totalFaceHeight) / (drawerCount + 1);
    
    // Créer chaque tiroir
    for (let i = 0; i < drawerCount; i++) {
      // Position du tiroir
      const drawerY = this.thicknessSettings.bottom + verticalSpacing * (i + 1) + faceHeight * i;
      
      // Façade du tiroir
      this.components.push(new DrawerFront(
        this.generateComponentId('drawer_front', zone.index, i),
        `Façade tiroir ${i + 1} - Zone ${zone.index + 1}`,
        this.materialId,
        faceHeight,
        zone.width - (operationalGap * 2),
        this.thicknessSettings.drawerFront,
        1,
        {
          position: { x: zone.position + operationalGap, y: drawerY, z: 0 },
          zoneIndex: zone.index,
          drawerIndex: i,
          drawerType: drawerType,
          edgeBanding: [true, true, true, true] // Tous les chants pour la façade
        }
      ));
      
      // Ajouter les composants internes du tiroir selon le type
      if (drawerType === 'custom') {
        this.addCustomDrawerComponents(zone, i, faceHeight, operationalGap, drawerY);
      }
      // Pour les autres types (standard, supplier), on peut supposer que les composants 
      // internes sont préfabriqués et n'ont pas besoin d'être détaillés
    }
  }
  
  /**
   * Ajoute des tiroirs à une sous-zone
   * @param {Zone} zone - Zone parente
   * @param {Object} subZone - Configuration de la sous-zone
   * @param {string} subZonePosition - Position de la sous-zone (upper, middle, lower)
   * @param {Object} subZoneDimensions - Dimensions de la sous-zone
   */
  addSubZoneDrawers(zone, subZone, subZonePosition, subZoneDimensions) {
    if (!subZone || !subZone.settings) return;
    
    const drawerCount = subZone.settings.drawerCount || 2;
    const faceHeight = subZone.settings.faceHeight || 120;
    const operationalGap = subZone.settings.operationalGap || 3;
    const drawerType = subZone.settings.drawerType || 'standard';
    
    // Calculer l'espacement des tiroirs
    const availableHeight = subZoneDimensions.height;
    const totalFaceHeight = drawerCount * faceHeight;
    const verticalSpacing = (availableHeight - totalFaceHeight) / (drawerCount + 1);
    
    // Créer chaque tiroir
    for (let i = 0; i < drawerCount; i++) {
      // Position du tiroir
      const drawerY = subZoneDimensions.startY + verticalSpacing * (i + 1) + faceHeight * i;
      
      // Façade du tiroir
      this.components.push(new DrawerFront(
        this.generateComponentId(`drawer_front_${subZonePosition}`, zone.index, i),
        `Façade tiroir ${i + 1} - ${this.getSubZonePositionName(subZonePosition)} - Zone ${zone.index + 1}`,
        this.materialId,
        faceHeight,
        zone.width - (operationalGap * 2),
        this.thicknessSettings.drawerFront,
        1,
        {
          position: { x: zone.position + operationalGap, y: drawerY, z: 0 },
          zoneIndex: zone.index,
          drawerIndex: i,
          subZone: subZonePosition,
          drawerType: drawerType,
          edgeBanding: [true, true, true, true] // Tous les chants pour la façade
        }
      ));
      
      // Ajouter les composants internes du tiroir selon le type
      if (drawerType === 'custom') {
        this.addCustomDrawerComponents(zone, i, faceHeight, operationalGap, drawerY, subZonePosition);
      }
    }
  }
  
  /**
   * Ajoute les composants internes d'un tiroir sur mesure
   * @param {Zone} zone - Zone parente
   * @param {number} drawerIndex - Index du tiroir
   * @param {number} faceHeight - Hauteur de la façade
   * @param {number} operationalGap - Espace opérationnel
   * @param {number} drawerY - Position verticale du tiroir
   * @param {string|null} subZone - Position de la sous-zone (optional)
   */
  addCustomDrawerComponents(zone, drawerIndex, faceHeight, operationalGap, drawerY, subZone = null) {
    // Dimensions internes du tiroir
    const internalHeight = faceHeight - 30; // Hauteur interne légèrement réduite
    const internalWidth = zone.width - (operationalGap * 2) - (this.thicknessSettings.drawerSides * 2);
    const internalDepth = this.dimensions.depth - 80; // Profondeur interne légèrement réduite
    
    const subZonePrefix = subZone ? `${subZone}_` : '';
    const subZoneName = subZone ? ` - ${this.getSubZonePositionName(subZone)}` : '';
    
    // Côtés du tiroir (x2)
    this.components.push(new DrawerSide(
      this.generateComponentId(`drawer_side_${subZonePrefix}left`, zone.index, drawerIndex),
      `Côté gauche tiroir ${drawerIndex + 1}${subZoneName} - Zone ${zone.index + 1}`,
      this.materialId,
      internalHeight,
      internalDepth,
      this.thicknessSettings.drawerSides,
      1,
      {
        position: { x: zone.position + operationalGap, y: drawerY, z: 40 },
        zoneIndex: zone.index,
        drawerIndex: drawerIndex,
        subZone: subZone,
        edgeBanding: [true, true, true, false], // [haut, droite, bas, gauche]
        side: 'left'
      }
    ));
    
    this.components.push(new DrawerSide(
      this.generateComponentId(`drawer_side_${subZonePrefix}right`, zone.index, drawerIndex),
      `Côté droit tiroir ${drawerIndex + 1}${subZoneName} - Zone ${zone.index + 1}`,
      this.materialId,
      internalHeight,
      internalDepth,
      this.thicknessSettings.drawerSides,
      1,
      {
        position: { x: zone.position + operationalGap + internalWidth + this.thicknessSettings.drawerSides, y: drawerY, z: 40 },
        zoneIndex: zone.index,
        drawerIndex: drawerIndex,
        subZone: subZone,
        edgeBanding: [true, false, true, true], // [haut, droite, bas, gauche]
        side: 'right'
      }
    ));
    
    // Dos du tiroir
    this.components.push(new DrawerBack(
      this.generateComponentId(`drawer_back_${subZonePrefix}`, zone.index, drawerIndex),
      `Dos tiroir ${drawerIndex + 1}${subZoneName} - Zone ${zone.index + 1}`,
      this.materialId,
      internalHeight,
      internalWidth,
      this.thicknessSettings.drawerBack,
      1,
      {
        position: { x: zone.position + operationalGap + this.thicknessSettings.drawerSides, y: drawerY, z: 40 + internalDepth - this.thicknessSettings.drawerBack },
        zoneIndex: zone.index,
        drawerIndex: drawerIndex,
        subZone: subZone,
        edgeBanding: [true, false, true, false] // [haut, droite, bas, gauche]
      }
    ));
    
    // Fond du tiroir
    this.components.push(new DrawerBottom(
      this.generateComponentId(`drawer_bottom_${subZonePrefix}`, zone.index, drawerIndex),
      `Fond tiroir ${drawerIndex + 1}${subZoneName} - Zone ${zone.index + 1}`,
      this.materialId,
      internalWidth,
      internalDepth,
      this.thicknessSettings.drawerBottom,
      1,
      {
        position: { x: zone.position + operationalGap + this.thicknessSettings.drawerSides, y: drawerY, z: 40 },
        zoneIndex: zone.index,
        drawerIndex: drawerIndex,
        subZone: subZone,
        edgeBanding: [false, false, false, false], // Pas de chants pour le fond
        orientation: 'horizontal'
      }
    ));
  }
  
  /**
   * Ajoute une penderie à une zone
   * @param {Zone} zone - Zone à traiter
   */
  addWardrobe(zone) {
    const railHeight = zone.settings.railHeight || 200;
    const railPosition = zone.height - this.thicknessSettings.top - railHeight;
    
    // Tringle
    this.components.push(new WardrobeRail(
      this.generateComponentId('rail', zone.index, 0),
      `Tringle - Zone ${zone.index + 1}`,
      'metal', // Matériau spécial
      zone.width - 60, // Un peu plus courte que la largeur de la zone
      25, // Diamètre standard
      1,
      {
        position: { x: zone.position + 30, y: railPosition, z: 300 },
        zoneIndex: zone.index,
        type: 'rail'
      }
    ));
  }
  
  /**
   * Ajoute une penderie à une sous-zone
   * @param {Zone} zone - Zone parente
   * @param {Object} subZone - Configuration de la sous-zone
   * @param {string} subZonePosition - Position de la sous-zone (upper, middle, lower)
   * @param {Object} subZoneDimensions - Dimensions de la sous-zone
   */
  addSubZoneWardrobe(zone, subZone, subZonePosition, subZoneDimensions) {
    if (!subZone || !subZone.settings) return;
    
    const railHeight = subZone.settings.railHeight || 150;
    const railPosition = subZoneDimensions.endY - railHeight;
    
    // Vérifier que la sous-zone est assez haute pour une penderie
    if (subZoneDimensions.height < 300) {
      console.warn(`La sous-zone ${subZonePosition} est trop petite pour une penderie efficace`);
      return;
    }
    
    // Tringle
    this.components.push(new WardrobeRail(
      this.generateComponentId(`rail_${subZonePosition}`, zone.index, 0),
      `Tringle - ${this.getSubZonePositionName(subZonePosition)} - Zone ${zone.index + 1}`,
      'metal', // Matériau spécial
      zone.width - 60, // Un peu plus courte que la largeur de la zone
      25, // Diamètre standard
      1,
      {
        position: { x: zone.position + 30, y: railPosition, z: 300 },
        zoneIndex: zone.index,
        subZone: subZonePosition,
        type: 'rail'
      }
    ));
  }
  
  /**
   * Ajoute des séparations horizontales à une zone
   * @param {Zone} zone - Zone à traiter
   */
  addHorizontalSeparation(zone) {
    const separationHeight = zone.settings.separationHeight || 1200;
    const hasSecondSeparation = zone.settings.hasSecondSeparation || false;
    const secondSeparationHeight = zone.settings.secondSeparationHeight || 1800;
    
    // Première séparation horizontale
    this.components.push(new HorizontalSeparator(
      this.generateComponentId('h_separator', zone.index, 1),
      `Séparation horizontale 1 - Zone ${zone.index + 1}`,
      this.materialId,
      zone.width,
      this.dimensions.depth,
      this.thicknessSettings.horizontalDividers,
      1,
      {
        position: { x: zone.position, y: separationHeight, z: 0 },
        zoneIndex: zone.index,
        separationIndex: 1,
        edgeBanding: [true, true, false, true], // [avant, droite, arrière, gauche]
        isStructural: true
      }
    ));
    
    // Deuxième séparation horizontale si nécessaire
    if (hasSecondSeparation) {
      this.components.push(new HorizontalSeparator(
        this.generateComponentId('h_separator', zone.index, 2),
        `Séparation horizontale 2 - Zone ${zone.index + 1}`,
        this.materialId,
        zone.width,
        this.dimensions.depth,
        this.thicknessSettings.horizontalDividers,
        1,
        {
          position: { x: zone.position, y: secondSeparationHeight, z: 0 },
          zoneIndex: zone.index,
          separationIndex: 2,
          edgeBanding: [true, true, false, true], // [avant, droite, arrière, gauche]
          isStructural: true
        }
      ));
    }
    
    // Traiter les sous-zones
    const subZones = zone.settings.subZones || {};
    const sepThickness = this.thicknessSettings.horizontalDividers;
    
    // Zone inférieure
    if (subZones.lower && subZones.lower.contentType !== 'empty') {
      const lowerDimensions = zone.getSubZoneDimensions('lower', zone.height, sepThickness);
      this.addSubZoneComponents(zone, subZones.lower, 'lower', lowerDimensions);
    }
    
    // Zone du milieu (si seconde séparation)
    if (hasSecondSeparation && subZones.middle && subZones.middle.contentType !== 'empty') {
      const middleDimensions = zone.getSubZoneDimensions('middle', zone.height, sepThickness);
      this.addSubZoneComponents(zone, subZones.middle, 'middle', middleDimensions);
    }
    
    // Zone supérieure
    if (subZones.upper && subZones.upper.contentType !== 'empty') {
      const upperDimensions = zone.getSubZoneDimensions('upper', zone.height, sepThickness);
      this.addSubZoneComponents(zone, subZones.upper, 'upper', upperDimensions);
    }
  }
  
  /**
   * Ajoute les composants à une sous-zone
   * @param {Zone} zone - Zone parente
   * @param {Object} subZone - Configuration de la sous-zone
   * @param {string} subZonePosition - Position de la sous-zone (upper, middle, lower)
   * @param {Object} subZoneDimensions - Dimensions de la sous-zone
   */
  addSubZoneComponents(zone, subZone, subZonePosition, subZoneDimensions) {
    if (!subZone || !subZoneDimensions) return;
    
    // Dispatcher selon le type de contenu de la sous-zone
    switch (subZone.contentType) {
      case 'shelves':
        this.addSubZoneShelves(zone, subZone, subZonePosition, subZoneDimensions);
        break;
      case 'drawers':
        this.addSubZoneDrawers(zone, subZone, subZonePosition, subZoneDimensions);
        break;
      case 'wardrobe':
        this.addSubZoneWardrobe(zone, subZone, subZonePosition, subZoneDimensions);
        break;
      // Autres types à ajouter ici si nécessaire
    }
  }
  
  /**
   * Obtient le nom lisible d'une position de sous-zone
   * @param {string} position - Position (upper, middle, lower)
   * @return {string} Nom lisible
   */
  getSubZonePositionName(position) {
    const names = {
      upper: 'Supérieure',
      middle: 'Centrale',
      lower: 'Inférieure'
    };
    return names[position] || position;
  }
  
  /**
   * Met à jour le matériau d'un composant spécifique
   * @param {string} componentId - Identifiant du composant
   * @param {string} materialId - Identifiant du matériau
   * @return {boolean} Succès de l'opération
   */
  updateComponentMaterial(componentId, materialId) {
    const component = this.components.find(c => c.id === componentId);
    if (!component) {
      console.error(`Composant ${componentId} non trouvé`);
      return false;
    }
    
    component.materialId = materialId;
    this.updatedAt = new Date();
    this.saveState();
    return true;
  }
  
  /**
   * Met à jour tous les composants structurels avec un nouveau matériau
   * @param {string} materialId - Identifiant du matériau
   * @return {number} Nombre de composants mis à jour
   */
  updateStructuralMaterials(materialId) {
    let count = 0;
    
    this.components.forEach(component => {
      if (component.metadata && component.metadata.isStructural) {
        component.materialId = materialId;
        count++;
      }
    });
    
    if (count > 0) {
      this.updatedAt = new Date();
      this.saveState();
    }
    
    return count;
  }
  
  /**
   * Recalcule les dimensions des composants en fonction des épaisseurs
   * @param {Object} thicknessSettings - Paramètres d'épaisseur
   */
  recalculateWithThicknesses(thicknessSettings) {
    // Mettre à jour les paramètres d'épaisseur
    this.thicknessSettings = {
      ...this.thicknessSettings,
      ...thicknessSettings
    };
    
    // Mettre à jour les positions et dimensions des composants existants
    // (Cette partie serait complexe à implémenter complètement...)
    
    // Pour l'instant, la solution la plus simple est de régénérer tous les composants
    this.regenerateComponents();
    this.saveState();
  }
  
  /**
   * Met à jour la propriété de fond du meuble
   * @param {boolean} hasBack - Présence d'un fond
   */
  updateHasBack(hasBack) {
    if (this.hasBack !== hasBack) {
      this.hasBack = hasBack;
      this.regenerateComponents();
      this.saveState();
    }
  }
  
  /**
   * Calcule le coût total du meuble
   * @param {Function} materialPriceResolver - Fonction pour résoudre les prix des matériaux
   * @return {number} Coût total
   */
  calculateTotalCost(materialPriceResolver) {
    if (!materialPriceResolver) {
      console.error("Fonction de résolution des prix manquante");
      return 0;
    }
    
    return this.components.reduce((total, component) => {
      const price = materialPriceResolver(component.materialId);
      if (!price) return total;
      
      // Calcul simple de la surface (pour les panneaux)
      const surface = (component.width * component.length) / 1000000; // en m²
      return total + (surface * price * component.quantity);
    }, 0);
  }
  
  /**
   * Exporte la liste des composants au format Excel/CSV
   * @return {Object} Données formatées pour export
   */
  exportToExcel() {
    const headers = ['Type', 'Nom', 'Matériau', 'Largeur (mm)', 'Longueur (mm)', 'Épaisseur (mm)', 'Quantité'];
    const rows = this.components.map(component => [
      component.type,
      component.name,
      component.materialId || '',
      component.width ? component.width.toFixed(2) : '-',
      component.length ? component.length.toFixed(2) : '-',
      component.thickness ? component.thickness.toFixed(2) : '-',
      component.quantity
    ]);
    
    return {
      headers,
      rows,
      projectName: this.name,
      date: new Date().toLocaleDateString()
    };
  }
  
  /**
   * Sauvegarde l'état actuel pour l'annulation/rétablissement
   */
  saveState() {
    // Limiter la taille de l'historique
    if (this.stateHistory.length > 20) {
      this.stateHistory = this.stateHistory.slice(-20);
    }
    
    // Si nous ne sommes pas au dernier état, supprimer les états suivants
    if (this.currentStateIndex < this.stateHistory.length - 1) {
      this.stateHistory = this.stateHistory.slice(0, this.currentStateIndex + 1);
    }
    
    // Sauvegarder l'état actuel
    this.stateHistory.push(JSON.stringify(this.toJSON()));
    this.currentStateIndex = this.stateHistory.length - 1;
  }
  
  /**
   * Annule la dernière action
   * @return {boolean} Succès de l'opération
   */
  undo() {
    if (this.currentStateIndex <= 0) {
      console.warn("Aucune action à annuler");
      return false;
    }
    
    this.currentStateIndex--;
    const previousState = JSON.parse(this.stateHistory[this.currentStateIndex]);
    this.fromJSON(previousState);
    return true;
  }
  
  /**
   * Rétablit la dernière action annulée
   * @return {boolean} Succès de l'opération
   */
  redo() {
    if (this.currentStateIndex >= this.stateHistory.length - 1) {
      console.warn("Aucune action à rétablir");
      return false;
    }
    
    this.currentStateIndex++;
    const nextState = JSON.parse(this.stateHistory[this.currentStateIndex]);
    this.fromJSON(nextState);
    return true;
  }
  
  /**
   * Charge un état depuis un objet JSON
   * @param {Object} data - Données JSON
   */
  fromJSON(data) {
    this.id = data.id;
    this.name = data.name;
    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
    this.materialId = data.materialId;
    this.hasBack = data.hasBack !== undefined ? data.hasBack : true;
    this.thicknessSettings = data.thicknessSettings || this.thicknessSettings;
    this.dimensions = Dimensions.fromJSON(data.dimensions);
    this.zones = data.zones.map(zoneData => Zone.fromJSON(zoneData));
    this.dividers = data.dividers || [];
    this.components = data.components || [];
    this.metadata = data.metadata || this.metadata;
  }
  
  /**
   * Convertit un objet JSON en instance de FurnitureProject
   * @param {Object} data - Données JSON
   * @return {FurnitureProject} Instance de FurnitureProject
   */
  static fromJSON(data) {
    const project = new FurnitureProject(data.name);
    project.fromJSON(data);
    return project;
  }
  
  /**
   * Retourne une représentation JSON de l'objet
   * @return {Object} Représentation JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      dimensions: this.dimensions.toJSON(),
      materialId: this.materialId,
      hasBack: this.hasBack,
      thicknessSettings: this.thicknessSettings,
      zones: this.zones.map(zone => zone.toJSON()),
      dividers: this.dividers,
      components: this.components.map(component => component.toJSON ? component.toJSON() : component),
      metadata: this.metadata
    };
  }
}