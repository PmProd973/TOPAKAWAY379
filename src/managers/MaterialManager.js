// src/managers/MaterialManager.js
import { Material } from '../models/Material.js';

/**
 * Gestionnaire des matériaux disponibles
 */
export class MaterialManager {
  /**
   * Crée un nouveau gestionnaire de matériaux
   * @param {Object} options - Options de configuration
   */
  constructor(options = {}) {
    this.materials = [];
    this.defaultMaterial = null;
    this.customMaterials = []; // Matériaux créés par l'utilisateur
    this.favorites = []; // IDs des matériaux favoris
    this.categories = {}; // Catégories de matériaux
    this.storagePrefix = options.storagePrefix || 'furniture_material_';
    this.texturesBasePath = options.texturesBasePath || 'assets/textures/';
    
    // Gestionnaire de textures
    this.textureLoader = options.textureLoader || null;
    
    // Événements
    this.onMaterialAdded = null;
    this.onMaterialUpdated = null;
    this.onMaterialRemoved = null;
    this.onMaterialsLoaded = null;
    this.onDefaultMaterialChanged = null;
  }
  
  /**
   * Initialise le gestionnaire de matériaux
   */
  initialize() {
    // Charger d'abord depuis le stockage local
    const loadedFromStorage = this.loadFromStorage();
    
    // Si aucun matériau n'est disponible, charger les matériaux prédéfinis
    if (!loadedFromStorage || this.materials.length === 0) {
      this.loadPredefinedMaterials();
      this.saveToStorage();
    }
    
    // Initialiser les catégories
    this.initializeCategories();
    
    // Déclencher l'événement de chargement
    if (this.onMaterialsLoaded) {
      this.onMaterialsLoaded(this.materials);
    }
  }
  
  /**
   * Initialise les catégories de matériaux
   */
  initializeCategories() {
    // Réinitialiser les catégories
    this.categories = {
      'wood': { name: 'Bois', materials: [] },
      'melamine': { name: 'Mélamine', materials: [] },
      'glass': { name: 'Verre', materials: [] },
      'metal': { name: 'Métal', materials: [] },
      'plastic': { name: 'Plastique', materials: [] },
      'other': { name: 'Autre', materials: [] }
    };
    
    // Classer les matériaux par catégorie
    this.materials.forEach(material => {
      const category = material.properties?.type || 'other';
      if (this.categories[category]) {
        this.categories[category].materials.push(material.id);
      } else {
        this.categories.other.materials.push(material.id);
      }
    });
  }
  
  /**
   * Charge la liste des matériaux prédéfinis
   * @return {Array} Liste des matériaux chargés
   */
  loadPredefinedMaterials() {
    // Matériaux de base
    const predefinedMaterials = [
      // Mélamine
      new Material('white_melamine', 'Blanc', '#FFFFFF', null, 25, {
        type: 'melamine',
        density: 720,
        edgeBandingAvailable: true,
        minThickness: 8,
        maxThickness: 25,
        grainDirection: 'none'
      }),
      new Material('black_melamine', 'Noir', '#000000', null, 30, {
        type: 'melamine',
        density: 720,
        edgeBandingAvailable: true,
        minThickness: 8,
        maxThickness: 25,
        grainDirection: 'none'
      }),
      new Material('gray_melamine', 'Gris', '#808080', null, 28, {
        type: 'melamine',
        density: 720,
        edgeBandingAvailable: true,
        minThickness: 8,
        maxThickness: 25,
        grainDirection: 'none'
      }),
      new Material('beige_melamine', 'Beige', '#F5F5DC', null, 26, {
        type: 'melamine',
        density: 720,
        edgeBandingAvailable: true,
        minThickness: 8,
        maxThickness: 25,
        grainDirection: 'none'
      }),
      
      // Bois
      new Material('oak', 'Chêne', '#D2B48C', this.texturesBasePath + 'oak.jpg', 45, {
        type: 'wood',
        density: 680,
        edgeBandingAvailable: true,
        minThickness: 12,
        maxThickness: 30,
        grainDirection: 'vertical',
        environmentalRating: 'premium'
      }),
      new Material('walnut', 'Noyer', '#654321', this.texturesBasePath + 'walnut.jpg', 60, {
        type: 'wood',
        density: 640,
        edgeBandingAvailable: true,
        minThickness: 12,
        maxThickness: 30,
        grainDirection: 'vertical',
        environmentalRating: 'premium'
      }),
      new Material('cherry', 'Cerisier', '#954535', this.texturesBasePath + 'cherry.jpg', 55, {
        type: 'wood',
        density: 590,
        edgeBandingAvailable: true,
        minThickness: 12,
        maxThickness: 30,
        grainDirection: 'vertical',
        environmentalRating: 'premium'
      }),
      new Material('maple', 'Érable', '#E8D4AD', this.texturesBasePath + 'maple.jpg', 50, {
        type: 'wood',
        density: 620,
        edgeBandingAvailable: true,
        minThickness: 12,
        maxThickness: 30,
        grainDirection: 'vertical',
        environmentalRating: 'premium'
      }),
      
      // Verre
      new Material('clear_glass', 'Verre transparent', '#D9F5FF', null, 70, {
        type: 'glass',
        density: 2500,
        edgeBandingAvailable: false,
        minThickness: 4,
        maxThickness: 12,
        grainDirection: 'none',
        opacity: 0.1,
        reflectivity: 0.3
      }),
      new Material('frosted_glass', 'Verre dépoli', '#E8F4F8', null, 85, {
        type: 'glass',
        density: 2500,
        edgeBandingAvailable: false,
        minThickness: 4,
        maxThickness: 12,
        grainDirection: 'none',
        opacity: 0.6,
        reflectivity: 0.1
      }),
      
      // Métal
      new Material('stainless_steel', 'Acier inoxydable', '#E8E8E8', this.texturesBasePath + 'stainless_steel.jpg', 90, {
        type: 'metal',
        density: 7850,
        edgeBandingAvailable: false,
        minThickness: 0.5,
        maxThickness: 3,
        grainDirection: 'none',
        reflectivity: 0.7
      }),
      new Material('brushed_aluminum', 'Aluminium brossé', '#D6D6D6', this.texturesBasePath + 'brushed_aluminum.jpg', 75, {
        type: 'metal',
        density: 2700,
        edgeBandingAvailable: false,
        minThickness: 0.5,
        maxThickness: 5,
        grainDirection: 'horizontal',
        reflectivity: 0.5
      })
    ];
    
    this.materials = predefinedMaterials;
    this.defaultMaterial = this.materials[0]; // Blanc par défaut
    
    return this.materials;
  }
  
  /**
   * Recherche un matériau par son identifiant
   * @param {string} id - Identifiant du matériau
   * @return {Material|null} Matériau trouvé ou null
   */
  getMaterialById(id) {
    if (!id) return this.defaultMaterial;
    return this.materials.find(m => m.id === id) || this.defaultMaterial;
  }
  
  /**
   * Recherche des matériaux par critères
   * @param {Object} criteria - Critères de recherche (propriétés du matériau)
   * @return {Array} Liste des matériaux correspondants
   */
  searchMaterials(criteria) {
    if (!criteria || Object.keys(criteria).length === 0) {
      return this.materials;
    }
    
    return this.materials.filter(material => {
      // Vérifier chaque critère
      for (const [key, value] of Object.entries(criteria)) {
        // Recherche dans les propriétés de base
        if (material[key] !== undefined) {
          if (typeof material[key] === 'string' && typeof value === 'string') {
            // Recherche de sous-chaîne pour les chaînes
            if (!material[key].toLowerCase().includes(value.toLowerCase())) {
              return false;
            }
          } else if (material[key] !== value) {
            return false;
          }
        } 
        // Recherche dans les propriétés avancées
        else if (material.properties && material.properties[key] !== undefined) {
          if (typeof material.properties[key] === 'string' && typeof value === 'string') {
            if (!material.properties[key].toLowerCase().includes(value.toLowerCase())) {
              return false;
            }
          } else if (material.properties[key] !== value) {
            return false;
          }
        } else {
          return false;
        }
      }
      return true;
    });
  }
  
  /**
   * Obtient la liste des matériaux par catégorie
   * @param {string} category - Catégorie de matériau ('wood', 'melamine', etc.)
   * @return {Array} Liste des matériaux de la catégorie
   */
  getMaterialsByCategory(category) {
    if (!this.categories[category]) {
      return [];
    }
    
    return this.categories[category].materials.map(id => this.getMaterialById(id)).filter(m => m);
  }
  
  /**
   * Ajoute un nouveau matériau ou met à jour un matériau existant
   * @param {Material} material - Matériau à ajouter/mettre à jour
   * @param {boolean} isCustom - Indique si c'est un matériau personnalisé
   * @return {Material} Matériau ajouté/mis à jour
   */
  addMaterial(material, isCustom = false) {
    // Vérifier que le matériau est une instance de Material
    if (!(material instanceof Material)) {
      throw new Error('Le matériau doit être une instance de Material');
    }
    
    // Vérifier si le matériau existe déjà
    const existingIndex = this.materials.findIndex(m => m.id === material.id);
    const isUpdate = existingIndex >= 0;
    
    if (isUpdate) {
      // Mettre à jour le matériau existant
      this.materials[existingIndex] = material;
      
      // Mettre à jour le matériau par défaut si nécessaire
      if (this.defaultMaterial && this.defaultMaterial.id === material.id) {
        this.defaultMaterial = material;
      }
      
      // Déclencher l'événement de mise à jour
      if (this.onMaterialUpdated) {
        this.onMaterialUpdated(material);
      }
    } else {
      // Ajouter un nouveau matériau
      this.materials.push(material);
      
      // Si c'est un matériau personnalisé, l'ajouter à la liste des personnalisés
      if (isCustom) {
        this.customMaterials.push(material.id);
      }
      
      // Déclencher l'événement d'ajout
      if (this.onMaterialAdded) {
        this.onMaterialAdded(material);
      }
    }
    
    // Mettre à jour les catégories
    this.initializeCategories();
    
    // Sauvegarder les modifications
    this.saveToStorage();
    
    return material;
  }
  
  /**
   * Supprime un matériau par son identifiant
   * @param {string} id - Identifiant du matériau
   * @return {boolean} Succès de l'opération
   */
  removeMaterial(id) {
    // Vérifier si c'est un matériau personnalisé
    const isCustom = this.customMaterials.includes(id);
    
    // Ne pas permettre la suppression des matériaux prédéfinis
    if (!isCustom) {
      console.warn(`Le matériau ${id} est prédéfini et ne peut pas être supprimé`);
      return false;
    }
    
    const initialLength = this.materials.length;
    const materialToRemove = this.getMaterialById(id);
    
    this.materials = this.materials.filter(m => m.id !== id);
    this.customMaterials = this.customMaterials.filter(mId => mId !== id);
    
    // Retirer des favoris si présent
    this.favorites = this.favorites.filter(favId => favId !== id);
    
    // Si le matériau supprimé était le matériau par défaut, définir un nouveau matériau par défaut
    if (this.defaultMaterial && this.defaultMaterial.id === id) {
      this.defaultMaterial = this.materials.length > 0 ? this.materials[0] : null;
      
      // Déclencher l'événement de changement de matériau par défaut
      if (this.onDefaultMaterialChanged) {
        this.onDefaultMaterialChanged(this.defaultMaterial);
      }
    }
    
    // Mettre à jour les catégories
    this.initializeCategories();
    
    // Sauvegarder les modifications
    this.saveToStorage();
    
    // Déclencher l'événement de suppression
    if (this.materials.length < initialLength && this.onMaterialRemoved) {
      this.onMaterialRemoved(materialToRemove);
    }
    
    return this.materials.length < initialLength;
  }
  
  /**
   * Définit le matériau par défaut
   * @param {string} id - Identifiant du matériau
   * @return {Material|null} Matériau par défaut ou null
   */
  setDefaultMaterial(id) {
    const material = this.getMaterialById(id);
    if (material) {
      this.defaultMaterial = material;
      
      // Sauvegarder la préférence
      localStorage.setItem('furniture_default_material', id);
      
      // Déclencher l'événement de changement de matériau par défaut
      if (this.onDefaultMaterialChanged) {
        this.onDefaultMaterialChanged(material);
      }
      
      return material;
    }
    return null;
  }
  
  /**
   * Ajoute ou retire un matériau des favoris
   * @param {string} id - Identifiant du matériau
   * @param {boolean} isFavorite - État de favori (true = ajouter, false = retirer)
   * @return {boolean} Nouvel état de favori
   */
  toggleFavorite(id, isFavorite = null) {
    const material = this.getMaterialById(id);
    if (!material) {
      console.error(`Matériau ${id} introuvable`);
      return false;
    }
    
    // Déterminer le nouvel état
    const newState = isFavorite !== null ? isFavorite : !this.isFavorite(id);
    
    if (newState && !this.favorites.includes(id)) {
      // Ajouter aux favoris
      this.favorites.push(id);
    } else if (!newState && this.favorites.includes(id)) {
      // Retirer des favoris
      this.favorites = this.favorites.filter(favId => favId !== id);
    }
    
    // Sauvegarder les modifications
    this.saveToStorage();
    
    return newState;
  }
  
  /**
   * Vérifie si un matériau est dans les favoris
   * @param {string} id - Identifiant du matériau
   * @return {boolean} True si le matériau est en favori
   */
  isFavorite(id) {
    return this.favorites.includes(id);
  }
  
  /**
   * Obtient la liste des matériaux favoris
   * @return {Array} Liste des matériaux favoris
   */
  getFavorites() {
    return this.favorites.map(id => this.getMaterialById(id)).filter(m => m);
  }
  
  /**
   * Vérifie si un matériau est personnalisé
   * @param {string} id - Identifiant du matériau
   * @return {boolean} True si le matériau est personnalisé
   */
  isCustomMaterial(id) {
    return this.customMaterials.includes(id);
  }
  
  /**
   * Obtient la liste des matériaux personnalisés
   * @return {Array} Liste des matériaux personnalisés
   */
  getCustomMaterials() {
    return this.customMaterials.map(id => this.getMaterialById(id)).filter(m => m);
  }
  
  /**
   * Charge une texture pour un matériau
   * @param {string} id - Identifiant du matériau
   * @return {Promise|null} Promesse de chargement de texture ou null
   */
  loadTexture(id) {
    if (!this.textureLoader) {
      console.warn("Aucun loader de texture configuré");
      return null;
    }
    
    const material = this.getMaterialById(id);
    if (!material || !material.texture) {
      return null;
    }
    
    return this.textureLoader.load(material.texture);
  }
  
  /**
   * Charge les matériaux depuis le stockage local
   * @return {boolean} Succès de l'opération
   */
  loadFromStorage() {
    try {
      // Charger les matériaux
      const materialsJSON = localStorage.getItem('furniture_materials');
      if (materialsJSON) {
        const materialsData = JSON.parse(materialsJSON);
        this.materials = materialsData.map(data => Material.fromJSON(data));
        
        // Charger les matériaux personnalisés
        const customJSON = localStorage.getItem('furniture_custom_materials');
        if (customJSON) {
          this.customMaterials = JSON.parse(customJSON);
        }
        
        // Charger les favoris
        const favoritesJSON = localStorage.getItem('furniture_favorite_materials');
        if (favoritesJSON) {
          this.favorites = JSON.parse(favoritesJSON);
        }
        
        // Restaurer le matériau par défaut
        const defaultId = localStorage.getItem('furniture_default_material');
        if (defaultId) {
          this.defaultMaterial = this.getMaterialById(defaultId);
        } else if (this.materials.length > 0) {
          this.defaultMaterial = this.materials[0];
        }
        
        return true;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des matériaux:', error);
    }
    
    return false;
  }
  
  /**
   * Sauvegarde les matériaux dans le stockage local
   * @return {boolean} Succès de l'opération
   */
  saveToStorage() {
    try {
      // Sauvegarder les matériaux
      const materialsJSON = JSON.stringify(this.materials.map(m => m.toJSON()));
      localStorage.setItem('furniture_materials', materialsJSON);
      
      // Sauvegarder les matériaux personnalisés
      localStorage.setItem('furniture_custom_materials', JSON.stringify(this.customMaterials));
      
      // Sauvegarder les favoris
      localStorage.setItem('furniture_favorite_materials', JSON.stringify(this.favorites));
      
      // Sauvegarder également le matériau par défaut
      if (this.defaultMaterial) {
        localStorage.setItem('furniture_default_material', this.defaultMaterial.id);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des matériaux:', error);
      return false;
    }
  }
  
  /**
   * Exporte les matériaux au format JSON
   * @param {boolean} customOnly - Exporter uniquement les matériaux personnalisés
   * @return {Blob} Blob contenant les données des matériaux
   */
  exportMaterials(customOnly = false) {
    try {
      let materialsToExport;
      
      if (customOnly) {
        materialsToExport = this.getCustomMaterials();
      } else {
        materialsToExport = this.materials;
      }
      
      const materialsJSON = JSON.stringify(materialsToExport.map(m => m.toJSON()));
      return new Blob([materialsJSON], { type: 'application/json' });
    } catch (error) {
      console.error('Erreur lors de l\'export des matériaux:', error);
      return null;
    }
  }
  
  /**
   * Importe des matériaux depuis un fichier JSON
   * @param {File|string} source - Fichier ou chaîne JSON
   * @param {boolean} replaceAll - Remplacer tous les matériaux personnalisés
   * @return {Promise<Array>} Promesse résolue avec la liste des matériaux importés
   */
  importMaterials(source, replaceAll = false) {
    return new Promise((resolve, reject) => {
      const processJSON = (jsonString) => {
        try {
          const materialsData = JSON.parse(jsonString);
          const importedMaterials = [];
          
          // Si replaceAll est true, supprimer tous les matériaux personnalisés existants
          if (replaceAll) {
            // Faire une copie pour éviter les problèmes de modification pendant l'itération
            const customToRemove = [...this.customMaterials];
            customToRemove.forEach(id => this.removeMaterial(id));
          }
          
          // Traiter chaque matériau
          const dataArray = Array.isArray(materialsData) ? materialsData : [materialsData];
          dataArray.forEach(data => {
            // Générer un nouvel ID si le matériau existe déjà
            let materialId = data.id;
            if (this.getMaterialById(materialId) && !this.isCustomMaterial(materialId)) {
              materialId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              data.id = materialId;
            }
            
            // Créer et ajouter le matériau
            const material = Material.fromJSON(data);
            this.addMaterial(material, true);
            importedMaterials.push(material);
          });
          
          resolve(importedMaterials);
        } catch (error) {
          console.error('Erreur lors de l\'import des matériaux:', error);
          reject(error);
        }
      };
      
      // Traiter selon le type de source
      if (typeof source === 'string') {
        processJSON(source);
      } else if (source instanceof File) {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          processJSON(event.target.result);
        };
        
        reader.onerror = (error) => {
          reject(error);
        };
        
        reader.readAsText(source);
      } else {
        reject(new Error('Source invalide pour l\'import'));
      }
    });
  }
  
  /**
   * Crée un nouveau matériau personnalisé basé sur un existant
   * @param {string} baseId - Identifiant du matériau de base
   * @param {Object} modifications - Propriétés à modifier
   * @param {string} newName - Nom du nouveau matériau
   * @return {Material|null} Nouveau matériau ou null en cas d'échec
   */
  createCustomVariant(baseId, modifications = {}, newName = null) {
    const baseMaterial = this.getMaterialById(baseId);
    if (!baseMaterial) {
      console.error(`Matériau de base ${baseId} introuvable`);
      return null;
    }
    
    // Cloner le matériau de base
    const customMaterial = baseMaterial.clone();
    
    // Générer un nouvel ID
    customMaterial.id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Mettre à jour le nom
    customMaterial.name = newName || `${baseMaterial.name} (personnalisé)`;
    
    // Appliquer les modifications
    Object.entries(modifications).forEach(([key, value]) => {
      if (key === 'properties') {
        // Fusionner les propriétés
        customMaterial.properties = { ...customMaterial.properties, ...value };
      } else {
        // Mettre à jour la propriété directe
        customMaterial[key] = value;
      }
    });
    
    // Ajouter le matériau personnalisé
    this.addMaterial(customMaterial, true);
    
    return customMaterial;
  }
  
  /**
   * Valide un matériau pour une utilisation spécifique
   * @param {string} id - Identifiant du matériau
   * @param {string} usage - Type d'utilisation (structure, shelf, drawer, etc.)
   * @param {Object} options - Options supplémentaires (dimensions, etc.)
   * @return {Object} Résultat de validation {valid: boolean, issues: Array, recommendations: Array}
   */
  validateMaterialForUsage(id, usage, options = {}) {
    const material = this.getMaterialById(id);
    if (!material) {
      return {
        valid: false,
        issues: [`Matériau ${id} introuvable`],
        recommendations: []
      };
    }
    
    // Vérifier les contraintes spécifiques à l'usage
    const usageConstraints = material.checkUsageConstraints(usage);
    
    // Vérifier les contraintes d'épaisseur si spécifiées
    let thicknessIssues = [];
    if (options.thickness !== undefined) {
      const thickness = parseFloat(options.thickness);
      if (!material.isAvailableInThickness(thickness)) {
        thicknessIssues.push(`Ce matériau n'est pas disponible en épaisseur ${thickness}mm (plage disponible: ${material.properties.minThickness}-${material.properties.maxThickness}mm)`);
      }
    }
    
    // Vérifier les contraintes de dimensions si spécifiées
    let dimensionIssues = [];
    if (options.width !== undefined && options.height !== undefined) {
      const width = parseFloat(options.width);
      const height = parseFloat(options.height);
      
      // Vérifier si les dimensions sont trop grandes pour le matériau
      if (material.properties.type === 'glass' && (width > 1200 || height > 1200)) {
        dimensionIssues.push(`Les dimensions ${width}x${height}mm sont trop grandes pour le verre standard (max recommandé: 1200x1200mm)`);
      }
    }
    
    // Compiler tous les problèmes
    const allIssues = [
      ...thicknessIssues,
      ...dimensionIssues,
      ...(usageConstraints.suitable ? [] : [`Ce matériau n'est pas recommandé pour cet usage`])
    ];
    
    return {
      valid: allIssues.length === 0,
      issues: allIssues,
      recommendations: usageConstraints.recommendations
    };
  }
  
  /**
   * Suggère des matériaux alternatifs pour un usage spécifique
   * @param {string} currentId - Identifiant du matériau actuel
   * @param {string} usage - Type d'utilisation
   * @param {number} maxSuggestions - Nombre maximum de suggestions
   * @return {Array} Liste des matériaux suggérés
   */
  suggestAlternatives(currentId, usage, maxSuggestions = 3) {
    const currentMaterial = this.getMaterialById(currentId);
    if (!currentMaterial) return [];
    
    // Trouver des matériaux similaires
    return this.materials
      .filter(m => m.id !== currentId) // Exclure le matériau actuel
      .map(m => {
        // Vérifier les contraintes d'usage
        const constraints = m.checkUsageConstraints(usage);
        
        // Calculer un score de similarité (0-100)
        let similarityScore = 0;
        
        // Même type de matériau (+50 points)
        if (m.properties.type === currentMaterial.properties.type) {
          similarityScore += 50;
        }
        
        // Couleur similaire (+30 points max)
        const currentRgb = currentMaterial.getRgbColor();
        const mRgb = m.getRgbColor();
        const colorDiff = Math.abs(currentRgb.r - mRgb.r) + Math.abs(currentRgb.g - mRgb.g) + Math.abs(currentRgb.b - mRgb.b);
        const colorSimilarity = Math.max(0, 30 - (colorDiff / 25));
        similarityScore += colorSimilarity;
        
        // Prix similaire (+20 points max)
        const priceDiff = Math.abs(currentMaterial.price - m.price);
        const priceSimilarity = Math.max(0, 20 - (priceDiff / 5));
        similarityScore += priceSimilarity;
        
        return {
          material: m,
          suitable: constraints.suitable,
          similarityScore: similarityScore,
          recommendations: constraints.recommendations
        };
      })
      .filter(item => item.suitable) // Ne garder que les matériaux adaptés
      .sort((a, b) => b.similarityScore - a.similarityScore) // Trier par score de similarité
      .slice(0, maxSuggestions) // Limiter le nombre de suggestions
      .map(item => ({
        material: item.material,
        recommendations: item.recommendations
      }));
  }
  
  /**
   * Définit les gestionnaires d'événements
   * @param {Object} handlers - Objet contenant les gestionnaires d'événements
   */
  setEventHandlers(handlers) {
    if (handlers.onMaterialAdded) {
      this.onMaterialAdded = handlers.onMaterialAdded;
    }
    
    if (handlers.onMaterialUpdated) {
      this.onMaterialUpdated = handlers.onMaterialUpdated;
    }
    
    if (handlers.onMaterialRemoved) {
      this.onMaterialRemoved = handlers.onMaterialRemoved;
    }
    
    if (handlers.onMaterialsLoaded) {
      this.onMaterialsLoaded = handlers.onMaterialsLoaded;
    }
    
    if (handlers.onDefaultMaterialChanged) {
      this.onDefaultMaterialChanged = handlers.onDefaultMaterialChanged;
    }
  }
}