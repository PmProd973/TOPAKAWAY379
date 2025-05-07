// src/managers/ConfiguratorManager.js
import { MaterialManager } from './MaterialManager.js';
import { ProjectManager } from './ProjectManager.js';
import { PanelThickness } from '../models/PanelThickness.js';
import { FurnitureProject } from '../models/FurnitureProject.js';
import { Dimensions } from '../models/Dimensions.js';

/**
 * Gestionnaire principal du configurateur
 */
export class ConfiguratorManager {
  /**
   * Crée un nouveau gestionnaire de configurateur
   * @param {Object} options - Options de configuration
   */
  constructor(options = {}) {
    this.materialManager = new MaterialManager(options.materialManager);
    this.projectManager = new ProjectManager(options.projectManager);
    this.currentProject = null;
    this.panelThickness = new PanelThickness(options.thicknessSettings);
    
    // Renderers (à initialiser plus tard)
    this.renderer3D = null;
    this.technicalDrawings = null;
    
    // Paramètres globaux
    this.settings = {
      units: options.units || 'mm',
      language: options.language || 'fr',
      autoSave: options.autoSave !== undefined ? options.autoSave : true,
      showPrices: options.showPrices !== undefined ? options.showPrices : true,
      roundDimensions: options.roundDimensions !== undefined ? options.roundDimensions : true,
      roundStep: options.roundStep || 10,
      defaultProjectName: options.defaultProjectName || "Nouveau Dressing",
      enforceConstraints: options.enforceConstraints !== undefined ? options.enforceConstraints : true,
      maxProjectHistory: options.maxProjectHistory || 20,
      defaultDimensions: options.defaultDimensions || { width: 2000, height: 2400, depth: 600 },
      minDimensions: options.minDimensions || { width: 300, height: 300, depth: 200 },
      maxDimensions: options.maxDimensions || { width: 6000, height: 3000, depth: 1000 }
    };
    
    // Gestion de l'état pour l'annulation/rétablissement
    this.undoStack = [];
    this.redoStack = [];
    this.isPerformingUndoRedo = false;
    this.lastSavedState = null;
    
    // Gestionnaire de textures et modèles 3D
    this.assetManager = options.assetManager || null;
    
    // Gestionnaire de prix et devis
    this.pricingManager = options.pricingManager || null;
    
    // Verrouillages et protections
    this.locks = {
      dimensions: false,
      dividers: false,
      zones: {},
      materials: false
    };
    
    // Référence aux meubles du catalogue
    this.catalogItems = [];
    
    // Événements
    this.onProjectChanged = null;
    this.onMaterialsChanged = null;
    this.onThicknessChanged = null;
    this.onSettingsChanged = null;
    this.onRenderingUpdated = null;
    this.onError = null;
    this.onWarning = null;
    this.onActionComplete = null;
    this.onExportComplete = null;
    this.onUndoRedoStatusChanged = null;
    
    // Valeurs dérivées calculées à partir du modèle
    this.derivedValues = {
      totalCost: 0,
      totalWeight: 0,
      complexity: 'medium',
      lastUpdate: null,
      validationStatus: { isValid: true, issues: [] }
    };
    
    // Rendre l'instance accessible globalement (utile pour les renderers)
    window.configurator = this;
  }
  
  /**
   * Initialise le configurateur
   * @param {Object} renderers - Objets de rendu 3D et technique
   * @return {Promise} Promesse résolue lorsque l'initialisation est terminée
   */
  async initialize(renderers = {}) {
    try {
      // Initialiser les gestionnaires
      await this.materialManager.initialize();
      this.projectManager.initialize();
      
      // Initialiser le renderer 3D s'il n'est pas fourni
      if (!renderers.renderer3D && !this.renderer3D) {
        try {
          // Import dynamique du renderer
          const { Renderer3D } = await import('../renderers/Renderer3D.js');
          this.renderer3D = new Renderer3D('renderer-container');
          await this.renderer3D.initialize();
          console.log('Renderer 3D initialisé avec succès');
        } catch (error) {
          console.error('Erreur lors de l\'initialisation du renderer 3D:', error);
          // Ne pas bloquer l'initialisation si le renderer 3D échoue
        }
      } else if (renderers.renderer3D) {
        this.renderer3D = renderers.renderer3D;
      }
      
      // Initialiser le renderer de plans techniques s'il n'est pas fourni
      if (!renderers.technicalDrawings && !this.technicalDrawings) {
        try {
          // Import dynamique du renderer
          const { TechnicalDrawings } = await import('../renderers/TechnicalDrawings.js');
          this.technicalDrawings = new TechnicalDrawings('technical-container');
          await this.technicalDrawings.initialize();
          console.log('Renderer de plans techniques initialisé avec succès');
        } catch (error) {
          console.error('Erreur lors de l\'initialisation du renderer de plans techniques:', error);
          // Ne pas bloquer l'initialisation si le renderer technique échoue
        }
      } else if (renderers.technicalDrawings) {
        this.technicalDrawings = renderers.technicalDrawings;
      }
      
      // Configurer les événements entre gestionnaires
      this.setupEventHandlers();
      
      // Créer un projet par défaut si aucun n'est en cours
      if (!this.currentProject) {
        this.createNewProject();
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du configurateur:', error);
      this.handleError('init_error', 'Erreur lors de l\'initialisation du configurateur', error);
      return false;
    }
  }
  
  /**
   * Configure les gestionnaires d'événements entre les différentes parties
   */
  setupEventHandlers() {
    // MaterialManager events
    this.materialManager.setEventHandlers({
      onMaterialsLoaded: (materials) => {
        if (this.onMaterialsChanged) {
          this.onMaterialsChanged(materials);
        }
      },
      onMaterialAdded: (material) => {
        if (this.onMaterialsChanged) {
          this.onMaterialsChanged(this.materialManager.materials);
        }
      },
      onMaterialUpdated: (material) => {
        if (this.onMaterialsChanged) {
          this.onMaterialsChanged(this.materialManager.materials);
        }
        // Mettre à jour les matériaux dans le projet si nécessaire
        if (this.currentProject && material.id === this.currentProject.materialId) {
          this.refreshProjectView();
        }
      },
      onMaterialRemoved: (material) => {
        if (this.onMaterialsChanged) {
          this.onMaterialsChanged(this.materialManager.materials);
        }
      },
      onDefaultMaterialChanged: (material) => {
        if (this.onMaterialsChanged) {
          this.onMaterialsChanged(this.materialManager.materials);
        }
      }
    });
    
    // ProjectManager events
    this.projectManager.setEventHandlers({
      onProjectSaved: (project) => {
        this.lastSavedState = this.getCurrentState();
        if (this.onActionComplete) {
          this.onActionComplete('save', 'Projet sauvegardé avec succès');
        }
      },
      onProjectLoaded: (project) => {
        // Mettre à jour les épaisseurs avec celles du projet
        this.panelThickness = new PanelThickness(project.thicknessSettings);
        if (this.onThicknessChanged) {
          this.onThicknessChanged(this.panelThickness);
        }
        
        // Notifier du changement de projet
        this.refreshProjectView();
      },
      onProjectDeleted: (projectId) => {
        if (this.currentProject && this.currentProject.id === projectId) {
          this.createNewProject();
        }
      },
      onAutoSaved: (project, autosaveId) => {
        if (this.onActionComplete) {
          this.onActionComplete('autosave', 'Sauvegarde automatique effectuée');
        }
      }
    });
  }
  
  /**
   * Obtient le statut actuel d'annulation/rétablissement
   * @return {Object} État d'annulation/rétablissement {canUndo, canRedo}
   */
  getUndoRedoStatus() {
    return {
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0
    };
  }
  
  /**
   * Notifie du changement de statut d'annulation/rétablissement
   */
  notifyUndoRedoStatusChanged() {
    if (this.onUndoRedoStatusChanged) {
      this.onUndoRedoStatusChanged(this.getUndoRedoStatus());
    }
  }
  
  /**
   * Crée un nouvel état pour l'historique d'annulation/rétablissement
   */
  createUndoPoint() {
    if (this.isPerformingUndoRedo || !this.currentProject) return;
    
    // Sauvegarder l'état actuel
    const currentState = this.getCurrentState();
    
    // Ajouter à la pile d'annulation
    this.undoStack.push(currentState);
    
    // Vider la pile de rétablissement car un nouvel état a été créé
    this.redoStack = [];
    
    // Limiter la taille de la pile d'annulation
    if (this.undoStack.length > this.settings.maxProjectHistory) {
      this.undoStack.shift(); // Supprimer le plus ancien
    }
    
    // Notifier du changement
    this.notifyUndoRedoStatusChanged();
  }
  
  /**
   * Obtient l'état actuel pour l'historique
   * @return {Object} État actuel
   * @private
   */
  getCurrentState() {
    if (!this.currentProject) return null;
    
    // Créer une copie de l'état actuel
    return {
      project: JSON.stringify(this.currentProject.toJSON()),
      thicknessSettings: { ...this.panelThickness.toJSON() },
      timestamp: Date.now()
    };
  }
  
  /**
   * Restaure un état à partir de l'historique
   * @param {Object} state - État à restaurer
   * @private
   */
  restoreState(state) {
    if (!state) return;
    
    try {
      // Restaurer le projet
      const projectData = JSON.parse(state.project);
      this.currentProject = FurnitureProject.fromJSON(projectData);
      
      // Restaurer les épaisseurs
      this.panelThickness = new PanelThickness(state.thicknessSettings);
      
      // Notifier des changements
      this.refreshProjectView();
      
      if (this.onThicknessChanged) {
        this.onThicknessChanged(this.panelThickness);
      }
    } catch (error) {
      console.error('Erreur lors de la restauration de l\'état:', error);
      this.handleError('restore_error', 'Erreur lors de la restauration de l\'état', error);
    }
  }
  
  /**
   * Annule la dernière action
   * @return {boolean} Succès de l'opération
   */
  undo() {
    if (this.undoStack.length === 0) return false;
    
    this.isPerformingUndoRedo = true;
    
    try {
      // Sauvegarder l'état actuel dans la pile de rétablissement
      const currentState = this.getCurrentState();
      this.redoStack.push(currentState);
      
      // Récupérer et appliquer l'état précédent
      const previousState = this.undoStack.pop();
      this.restoreState(previousState);
      
      // Notifier du changement
      this.notifyUndoRedoStatusChanged();
      
      if (this.onActionComplete) {
        this.onActionComplete('undo', 'Action annulée');
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      this.handleError('undo_error', 'Erreur lors de l\'annulation', error);
      return false;
    } finally {
      this.isPerformingUndoRedo = false;
    }
  }
  
  /**
   * Rétablit la dernière action annulée
   * @return {boolean} Succès de l'opération
   */
  redo() {
    if (this.redoStack.length === 0) return false;
    
    this.isPerformingUndoRedo = true;
    
    try {
      // Sauvegarder l'état actuel dans la pile d'annulation
      const currentState = this.getCurrentState();
      this.undoStack.push(currentState);
      
      // Récupérer et appliquer l'état suivant
      const nextState = this.redoStack.pop();
      this.restoreState(nextState);
      
      // Notifier du changement
      this.notifyUndoRedoStatusChanged();
      
      if (this.onActionComplete) {
        this.onActionComplete('redo', 'Action rétablie');
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors du rétablissement:', error);
      this.handleError('redo_error', 'Erreur lors du rétablissement', error);
      return false;
    } finally {
      this.isPerformingUndoRedo = false;
    }
  }
  
  /**
   * Crée un nouveau projet
   * @param {string} name - Nom du projet
   * @param {Object} options - Options de création
   * @return {FurnitureProject} Projet créé
   */
  createNewProject(name = null, options = {}) {
    // Utiliser le matériau par défaut
    const defaultMaterial = this.materialManager.defaultMaterial;
    const materialId = defaultMaterial ? defaultMaterial.id : null;
    
    // Utiliser le nom par défaut ou celui fourni
    const projectName = name || this.settings.defaultProjectName;
    
    // Dimensions par défaut ou personnalisées
    const dimensions = options.dimensions || this.settings.defaultDimensions;
    
    try {
      // Créer le projet
      this.currentProject = this.projectManager.createProject(projectName, materialId, {
        dimensions: dimensions,
        hasBack: options.hasBack !== undefined ? options.hasBack : true,
        thicknessSettings: this.panelThickness.toJSON(),
        metadata: options.metadata || {}
      });
      
      // Démarrer la sauvegarde automatique si activée
      if (this.settings.autoSave) {
        this.projectManager.startAutosave(this.currentProject);
      }
      
      // Réinitialiser les piles d'annulation/rétablissement
      this.undoStack = [];
      this.redoStack = [];
      this.notifyUndoRedoStatusChanged();
      
      // Enregistrer comme dernier état sauvegardé
      this.lastSavedState = this.getCurrentState();
      
      // Déclencher l'événement de changement de projet
      this.refreshProjectView();
      
      if (this.onActionComplete) {
        this.onActionComplete('new_project', 'Nouveau projet créé');
      }
      
      return this.currentProject;
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error);
      this.handleError('create_project_error', 'Erreur lors de la création du projet', error);
      return null;
    }
  }
  
  /**
   * Crée un nouveau projet à partir d'un modèle
   * @param {string} templateId - Identifiant du modèle
   * @param {string} name - Nom du nouveau projet (optionnel)
   * @return {FurnitureProject|null} Projet créé ou null en cas d'échec
   */
  createProjectFromTemplate(templateId, name = null) {
    try {
      const project = this.projectManager.createProjectFromTemplate(templateId, name);
      if (project) {
        this.currentProject = project;
        
        // Mettre à jour les épaisseurs avec celles du projet
        this.panelThickness = new PanelThickness(project.thicknessSettings);
        
        // Démarrer la sauvegarde automatique si activée
        if (this.settings.autoSave) {
          this.projectManager.startAutosave(this.currentProject);
        }
        
        // Réinitialiser les piles d'annulation/rétablissement
        this.undoStack = [];
        this.redoStack = [];
        this.notifyUndoRedoStatusChanged();
        
        // Enregistrer comme dernier état sauvegardé
        this.lastSavedState = this.getCurrentState();
        
        // Déclencher l'événement de changement de projet
        this.refreshProjectView();
        
        if (this.onActionComplete) {
          this.onActionComplete('new_from_template', 'Projet créé à partir du modèle');
        }
        
        return project;
      }
    } catch (error) {
      console.error('Erreur lors de la création du projet depuis le modèle:', error);
      this.handleError('template_error', 'Erreur lors de la création du projet depuis le modèle', error);
    }
    
    return null;
  }
  
  /**
   * Charge un projet existant
   * @param {string} projectId - Identifiant du projet
   * @return {FurnitureProject|null} Projet chargé ou null
   */
  loadProject(projectId) {
    try {
      const project = this.projectManager.loadProject(projectId);
      if (project) {
        this.currentProject = project;
        
        // Mettre à jour les épaisseurs avec celles du projet
        this.panelThickness = new PanelThickness(project.thicknessSettings);
        
        // Démarrer la sauvegarde automatique si activée
        if (this.settings.autoSave) {
          this.projectManager.startAutosave(this.currentProject);
        }
        
        // Réinitialiser les piles d'annulation/rétablissement
        this.undoStack = [];
        this.redoStack = [];
        this.notifyUndoRedoStatusChanged();
        
        // Enregistrer comme dernier état sauvegardé
        this.lastSavedState = this.getCurrentState();
        
        // Déclencher l'événement de changement de projet
        this.refreshProjectView();
        
        if (this.onActionComplete) {
          this.onActionComplete('load_project', 'Projet chargé');
        }
      }
      return project;
    } catch (error) {
      console.error(`Erreur lors du chargement du projet ${projectId}:`, error);
      this.handleError('load_error', 'Erreur lors du chargement du projet', error);
      return null;
    }
  }
  
  /**
   * Sauvegarde le projet courant
   * @return {boolean} Succès de l'opération
   */
  saveCurrentProject() {
    if (!this.currentProject) {
      this.handleWarning('no_project', 'Aucun projet courant à sauvegarder');
      return false;
    }
    
    try {
      // Mettre à jour les paramètres d'épaisseur dans le projet
      this.currentProject.thicknessSettings = this.panelThickness.toJSON();
      
      // Sauvegarder le projet
      const success = this.projectManager.saveProject(this.currentProject);
      
      if (success) {
        // Enregistrer comme dernier état sauvegardé
        this.lastSavedState = this.getCurrentState();
        
        if (this.onActionComplete) {
          this.onActionComplete('save_project', 'Projet sauvegardé');
        }
      }
      
      return success;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du projet:', error);
      this.handleError('save_error', 'Erreur lors de la sauvegarde du projet', error);
      return false;
    }
  }
  
  /**
   * Vérifie si le projet actuel a des modifications non sauvegardées
   * @return {boolean} True si le projet a des modifications non sauvegardées
   */
  hasUnsavedChanges() {
    if (!this.currentProject || !this.lastSavedState) return false;
    
    const currentState = this.getCurrentState();
    return currentState.project !== this.lastSavedState.project;
  }
  
  /**
   * Rafraîchit la vue du projet actuel
   */
  refreshProjectView() {
    if (!this.currentProject) return;
    
    try {
      // Mettre à jour les renderers
      this.updateRenderers();
      
      // Mettre à jour les valeurs dérivées
      this.updateDerivedValues();
      
      // Déclencher l'événement de changement de projet
      if (this.onProjectChanged) {
        this.onProjectChanged(this.currentProject);
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de la vue:', error);
      this.handleError('refresh_error', 'Erreur lors du rafraîchissement de la vue', error);
    }
  }
  
  /**
   * Met à jour les renderers
   * @private
   */
  updateRenderers() {
    // Mettre à jour le renderer 3D si disponible
    if (this.renderer3D && typeof this.renderer3D.updateFurniture === 'function') {
      try {
        this.renderer3D.updateFurniture(this.currentProject);
        console.log('Rendu 3D mis à jour');
      } catch (error) {
        console.error('Erreur lors de la mise à jour du rendu 3D:', error);
      }
    }
    
    // Mettre à jour le renderer de plans techniques si disponible
    if (this.technicalDrawings && typeof this.technicalDrawings.generateDrawings === 'function') {
      try {
        this.technicalDrawings.generateDrawings(this.currentProject);
        console.log('Plans techniques mis à jour');
      } catch (error) {
        console.error('Erreur lors de la mise à jour des plans techniques:', error);
      }
    }
    
    // Notifier de la mise à jour du rendu
    if (this.onRenderingUpdated) {
      this.onRenderingUpdated();
    }
  }
  
  /**
   * Met à jour les valeurs dérivées du projet
   * @private
   */
  updateDerivedValues() {
    if (!this.currentProject) return;
    
    // Calculer le coût total
    if (this.pricingManager && typeof this.pricingManager.calculateTotalCost === 'function') {
      this.derivedValues.totalCost = this.pricingManager.calculateTotalCost(this.currentProject);
    } else {
      this.derivedValues.totalCost = this.currentProject.calculateTotalCost(materialId => {
        const material = this.materialManager.getMaterialById(materialId);
        return material ? material.price : 0;
      });
    }
    
    // Calculer le poids total (estimation simple)
    this.derivedValues.totalWeight = this.estimateTotalWeight();
    
    // Évaluer la complexité du projet
    this.derivedValues.complexity = this.evaluateProjectComplexity();
    
    // Valider le projet
    this.derivedValues.validationStatus = this.validateProject();
    
    // Mettre à jour l'horodatage
    this.derivedValues.lastUpdate = new Date();
  }
  
  /**
   * Estime le poids total du meuble
   * @return {number} Poids estimé en kg
   * @private
   */
  estimateTotalWeight() {
    if (!this.currentProject) return 0;
    
    let totalWeight = 0;
    
    this.currentProject.components.forEach(component => {
      const material = this.materialManager.getMaterialById(component.materialId);
      if (!material) return;
      
      const density = material.properties?.density || 650; // kg/m³
      
      // Calculer le volume en m³
      let volume = 0;
      if (component.width && component.length && component.thickness) {
        volume = (component.width * component.length * component.thickness * component.quantity) / 1000000000;
      }
      
      totalWeight += volume * density;
    });
    
    return parseFloat(totalWeight.toFixed(2));
  }
  
  /**
   * Évalue la complexité du projet
   * @return {string} Complexité (low, medium, high, very_high)
   * @private
   */
  evaluateProjectComplexity() {
    if (!this.currentProject) return 'low';
    
    // Facteurs de complexité
    const componentCount = this.currentProject.components.length;
    const zoneCount = this.currentProject.zones.length;
    const hasCustomDrawers = this.currentProject.components.some(c => 
      c.type?.includes('drawer') && c.metadata?.drawerType === 'custom');
    const hasHorizontalSeparations = this.currentProject.zones.some(z => 
      z.contentType === 'horizontal_separation');
    
    // Logique d'évaluation
    if (componentCount > 50 || (hasHorizontalSeparations && zoneCount > 4)) {
      return 'very_high';
    } else if (componentCount > 30 || hasCustomDrawers || hasHorizontalSeparations) {
      return 'high';
    } else if (componentCount > 15 || zoneCount > 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }
  
  /**
   * Valide le projet actuel
   * @return {Object} Résultat de validation {isValid: boolean, issues: Array}
   * @private
   */
  validateProject() {
    if (!this.currentProject) {
      return { isValid: false, issues: ['Aucun projet courant'] };
    }
    
    const issues = [];
    
    // Vérifier les dimensions globales
    const { width, height, depth } = this.currentProject.dimensions;
    const { minDimensions, maxDimensions } = this.settings;
    
    if (width < minDimensions.width) {
      issues.push(`Largeur insuffisante: ${width}mm (min: ${minDimensions.width}mm)`);
    }
    
    if (width > maxDimensions.width) {
      issues.push(`Largeur excessive: ${width}mm (max: ${maxDimensions.width}mm)`);
    }
    
    if (height < minDimensions.height) {
      issues.push(`Hauteur insuffisante: ${height}mm (min: ${minDimensions.height}mm)`);
    }
    
    if (height > maxDimensions.height) {
      issues.push(`Hauteur excessive: ${height}mm (max: ${maxDimensions.height}mm)`);
    }
    
    if (depth < minDimensions.depth) {
      issues.push(`Profondeur insuffisante: ${depth}mm (min: ${minDimensions.depth}mm)`);
    }
    
    if (depth > maxDimensions.depth) {
      issues.push(`Profondeur excessive: ${depth}mm (max: ${maxDimensions.depth}mm)`);
    }
    
    // Vérifier les zones (au moins une zone doit exister)
    if (this.currentProject.zones.length === 0) {
      issues.push('Aucune zone définie dans le projet');
    }
    
    // Vérifier la présence de composants
    if (this.currentProject.components.length === 0) {
      issues.push('Aucun composant généré');
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }
  
  /**
   * Met à jour les dimensions du projet courant
   * @param {Object} newDimensions - Nouvelles dimensions
   * @return {boolean} Succès de l'opération
   */
  updateDimensions(newDimensions) {
    if (!this.currentProject) {
      this.handleWarning('no_project', 'Aucun projet courant');
      return false;
    }
    
    // Vérifier le verrouillage des dimensions
    if (this.locks.dimensions) {
      this.handleWarning('dimensions_locked', 'Les dimensions sont verrouillées');
      return false;
    }
    
    try {
      // Valider les dimensions
      const dimensions = { ...this.currentProject.dimensions.toJSON(), ...newDimensions };
      const validation = this.validateDimensions(dimensions);
      
      if (!validation.isValid && this.settings.enforceConstraints) {
        this.handleWarning('invalid_dimensions', 'Dimensions invalides', { issues: validation.issues });
        return false;
      }
      
      // Créer un point d'annulation
      this.createUndoPoint();
      
      // Arrondir les dimensions si nécessaire
      if (this.settings.roundDimensions) {
        if (newDimensions.width) {
          newDimensions.width = Math.round(newDimensions.width / this.settings.roundStep) * this.settings.roundStep;
        }
        
        if (newDimensions.height) {
          newDimensions.height = Math.round(newDimensions.height / this.settings.roundStep) * this.settings.roundStep;
        }
        
        if (newDimensions.depth) {
          newDimensions.depth = Math.round(newDimensions.depth / this.settings.roundStep) * this.settings.roundStep;
        }
       
      }
      
      // Mettre à jour les dimensions
      this.currentProject.updateDimensions(newDimensions);
      
      // Rafraîchir la vue
      this.refreshProjectView();
      
      if (this.onActionComplete) {
        this.onActionComplete('update_dimensions', 'Dimensions mises à jour');
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des dimensions:', error);
      this.handleError('dimensions_error', 'Erreur lors de la mise à jour des dimensions', error);
      return false;
    }
  }
  
  /**
   * Valide des dimensions
   * @param {Object} dimensions - Dimensions à valider
   * @return {Object} Résultat de validation {isValid: boolean, issues: Array}
   */
  validateDimensions(dimensions) {
    const issues = [];
    const { minDimensions, maxDimensions } = this.settings;
    
    if (dimensions.width < minDimensions.width) {
      issues.push(`Largeur insuffisante: ${dimensions.width}mm (min: ${minDimensions.width}mm)`);
    }
    
    if (dimensions.width > maxDimensions.width) {
      issues.push(`Largeur excessive: ${dimensions.width}mm (max: ${maxDimensions.width}mm)`);
    }
    
    if (dimensions.height < minDimensions.height) {
      issues.push(`Hauteur insuffisante: ${dimensions.height}mm (min: ${minDimensions.height}mm)`);
    }
    
    if (dimensions.height > maxDimensions.height) {
      issues.push(`Hauteur excessive: ${dimensions.height}mm (max: ${maxDimensions.height}mm)`);
    }
    
    if (dimensions.depth < minDimensions.depth) {
      issues.push(`Profondeur insuffisante: ${dimensions.depth}mm (min: ${minDimensions.depth}mm)`);
    }
    
    if (dimensions.depth > maxDimensions.depth) {
      issues.push(`Profondeur excessive: ${dimensions.depth}mm (max: ${maxDimensions.depth}mm)`);
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }
  
  /**
   * Ajoute un séparateur vertical au projet courant
   * @param {number} position - Position horizontale en mm
   * @return {Object|null} Séparateur ajouté ou null en cas d'échec
   */
  addVerticalDivider(position) {
    if (!this.currentProject) {
      this.handleWarning('no_project', 'Aucun projet courant');
      return null;
    }
    
    // Vérifier le verrouillage des séparateurs
    if (this.locks.dividers) {
      this.handleWarning('dividers_locked', 'Les séparateurs sont verrouillés');
      return null;
    }
    
    try {
      // Valider la position
      if (position <= 0 || position >= this.currentProject.dimensions.width) {
        this.handleWarning('invalid_position', 'Position invalide pour le séparateur');
        return null;
      }
      
      // Vérifier que la position n'est pas trop proche d'un séparateur existant
      const minDistance = 150; // Distance minimale entre deux séparateurs
      const tooClose = this.currentProject.dividers.some(d => 
        Math.abs(d.position - position) < minDistance);
      
      if (tooClose && this.settings.enforceConstraints) {
        this.handleWarning('divider_too_close', 'Position trop proche d\'un séparateur existant');
        return null;
      }
      
      // Créer un point d'annulation
      this.createUndoPoint();
      
      // Ajouter le séparateur
      const divider = this.currentProject.addVerticalDivider(position);
      
      // Rafraîchir la vue
      this.refreshProjectView();
      
      if (this.onActionComplete) {
        this.onActionComplete('add_divider', 'Séparateur vertical ajouté');
      }
      
      return divider;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du séparateur:', error);
      this.handleError('divider_error', 'Erreur lors de l\'ajout du séparateur', error);
      return null;
    }
  }
  
  /**
   * Supprime un séparateur vertical du projet courant
   * @param {number} index - Index du séparateur à supprimer
   * @return {boolean} Succès de l'opération
   */
  removeVerticalDivider(index) {
    if (!this.currentProject) {
      this.handleWarning('no_project', 'Aucun projet courant');
      return false;
    }
    
    // Vérifier le verrouillage des séparateurs
    if (this.locks.dividers) {
      this.handleWarning('dividers_locked', 'Les séparateurs sont verrouillés');
      return false;
    }
    
    try {
      // Vérifier que le séparateur existe
      if (index < 0 || index >= this.currentProject.dividers.length) {
        this.handleWarning('invalid_divider', 'Séparateur invalide');
        return false;
      }
      
      // Créer un point d'annulation
      this.createUndoPoint();
      
      // Supprimer le séparateur
      const success = this.currentProject.removeVerticalDivider(index);
      
      if (success) {
        // Rafraîchir la vue
        this.refreshProjectView();
        
        if (this.onActionComplete) {
          this.onActionComplete('remove_divider', 'Séparateur vertical supprimé');
        }
      }
      
      return success;
    } catch (error) {
      console.error('Erreur lors de la suppression du séparateur:', error);
      this.handleError('divider_error', 'Erreur lors de la suppression du séparateur', error);
      return false;
    }
  }
  
  /**
   * Met à jour la position d'un séparateur vertical
   * @param {number} index - Index du séparateur
   * @param {number} newPosition - Nouvelle position horizontale en mm
   * @return {boolean} Succès de l'opération
   */
  updateDividerPosition(index, newPosition) {
    if (!this.currentProject) {
      this.handleWarning('no_project', 'Aucun projet courant');
      return false;
    }
    
    // Vérifier le verrouillage des séparateurs
    if (this.locks.dividers) {
      this.handleWarning('dividers_locked', 'Les séparateurs sont verrouillés');
      return false;
    }
    
    try {
      // Valider la position
      if (newPosition <= 0 || newPosition >= this.currentProject.dimensions.width) {
        this.handleWarning('invalid_position', 'Position invalide pour le séparateur');
        return false;
      }
      
      // Vérifier que la position n'est pas trop proche d'un autre séparateur
      const minDistance = 150; // Distance minimale entre deux séparateurs
      const tooClose = this.currentProject.dividers.some((d, i) => 
        i !== index && Math.abs(d.position - newPosition) < minDistance);
      
      if (tooClose && this.settings.enforceConstraints) {
        this.handleWarning('divider_too_close', 'Position trop proche d\'un séparateur existant');
        return false;
      }
      
      // Créer un point d'annulation
      this.createUndoPoint();
      
      // Mettre à jour la position
      const success = this.currentProject.updateDividerPosition(index, newPosition);
      
      if (success) {
        // Rafraîchir la vue
        this.refreshProjectView();
        
        if (this.onActionComplete) {
          this.onActionComplete('update_divider', 'Position du séparateur mise à jour');
        }
      }
      
      return success;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la position du séparateur:', error);
      this.handleError('divider_error', 'Erreur lors de la mise à jour de la position du séparateur', error);
      return false;
    }
  }
  
  /**
   * Met à jour le contenu d'une zone
   * @param {number} zoneIndex - Index de la zone
   * @param {string} contentType - Type de contenu
   * @param {Object} settings - Paramètres spécifiques
   * @return {boolean} Succès de l'opération
   */
  updateZoneContent(zoneIndex, contentType, settings = {}) {
    if (!this.currentProject) {
      this.handleWarning('no_project', 'Aucun projet courant');
      return false;
    }
    
    // Vérifier le verrouillage de la zone
    if (this.locks.zones[zoneIndex]) {
      this.handleWarning('zone_locked', `La zone ${zoneIndex} est verrouillée`);
      return false;
    }
    
    try {
      // Vérifier que la zone existe
      const zone = this.currentProject.zones.find(z => z.index === zoneIndex);
      if (!zone) {
        this.handleWarning('invalid_zone', `Zone ${zoneIndex} invalide`);
        return false;
      }
      
      // Créer un point d'annulation
      this.createUndoPoint();
      
      // Mettre à jour le contenu
      const success = this.currentProject.updateZoneContent(zoneIndex, contentType, settings);
      
      if (success) {
        // Rafraîchir la vue
        this.refreshProjectView();
        
        if (this.onActionComplete) {
          this.onActionComplete('update_zone', `Contenu de la zone ${zoneIndex} mis à jour`);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du contenu de la zone:', error);
      this.handleError('zone_error', 'Erreur lors de la mise à jour du contenu de la zone', error);
      return false;
    }
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
    if (!this.currentProject) {
      this.handleWarning('no_project', 'Aucun projet courant');
      return false;
    }
    
    // Vérifier le verrouillage de la zone
    if (this.locks.zones[zoneIndex]) {
      this.handleWarning('zone_locked', `La zone ${zoneIndex} est verrouillée`);
      return false;
    }
    
    try {
      // Créer un point d'annulation
      this.createUndoPoint();
      
      // Mettre à jour le contenu de la sous-zone
      const success = this.currentProject.updateSubZoneContent(zoneIndex, subZonePosition, contentType, settings);
      
      if (success) {
        // Rafraîchir la vue
        this.refreshProjectView();
        
        if (this.onActionComplete) {
          this.onActionComplete('update_subzone', `Contenu de la sous-zone ${subZonePosition} de la zone ${zoneIndex} mis à jour`);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du contenu de la sous-zone:', error);
      this.handleError('subzone_error', 'Erreur lors de la mise à jour du contenu de la sous-zone', error);
      return false;
    }
  }
  
  /**
   * Met à jour le matériau d'un composant
   * @param {string} componentId - Identifiant du composant
   * @param {string} materialId - Identifiant du matériau
   * @return {boolean} Succès de l'opération
   */
  updateComponentMaterial(componentId, materialId) {
    if (!this.currentProject) {
      this.handleWarning('no_project', 'Aucun projet courant');
      return false;
    }
    
    // Vérifier le verrouillage des matériaux
    if (this.locks.materials) {
      this.handleWarning('materials_locked', 'Les matériaux sont verrouillés');
      return false;
    }
    
    try {
      // Vérifier que le matériau existe
      const material = this.materialManager.getMaterialById(materialId);
      if (!material) {
        this.handleWarning('invalid_material', `Matériau ${materialId} invalide`);
        return false;
      }
      
      // Créer un point d'annulation
      this.createUndoPoint();
      
      // Mettre à jour le matériau
      const success = this.currentProject.updateComponentMaterial(componentId, materialId);
      
      if (success) {
        // Rafraîchir la vue
        this.refreshProjectView();
        
        if (this.onActionComplete) {
          this.onActionComplete('update_material', `Matériau du composant mis à jour`);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du matériau:', error);
      this.handleError('material_error', 'Erreur lors de la mise à jour du matériau', error);
      return false;
    }
  }
  
  /**
   * Met à jour le matériau principal du projet
   * @param {string} materialId - Identifiant du matériau
   * @return {boolean} Succès de l'opération
   */
  updateProjectMaterial(materialId) {
    if (!this.currentProject) {
      this.handleWarning('no_project', 'Aucun projet courant');
      return false;
    }
    
    // Vérifier le verrouillage des matériaux
    if (this.locks.materials) {
      this.handleWarning('materials_locked', 'Les matériaux sont verrouillés');
      return false;
    }
    
    try {
      // Vérifier que le matériau existe
      const material = this.materialManager.getMaterialById(materialId);
      if (!material) {
        this.handleWarning('invalid_material', `Matériau ${materialId} invalide`);
        return false;
      }
      
      // Créer un point d'annulation
      this.createUndoPoint();
      
      // Mettre à jour le matériau principal
      this.currentProject.materialId = materialId;
      
      // Mettre à jour tous les composants structuraux
      const count = this.currentProject.updateStructuralMaterials(materialId);
      
      // Rafraîchir la vue
      this.refreshProjectView();
      
      if (this.onActionComplete) {
        this.onActionComplete('update_project_material', `Matériau principal mis à jour (${count} composants)`);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du matériau principal:', error);
      this.handleError('material_error', 'Erreur lors de la mise à jour du matériau principal', error);
      return false;
    }
  }
  
  /**
   * Met à jour les épaisseurs de panneaux
   * @param {Object} thicknessSettings - Paramètres d'épaisseur
   * @return {boolean} Succès de l'opération
   */
  updatePanelThicknesses(thicknessSettings) {
    if (!this.currentProject) {
      this.handleWarning('no_project', 'Aucun projet courant');
      return false;
    }
    
    try {
      // Créer un nouvel objet d'épaisseurs
      const newThickness = new PanelThickness({
        ...this.panelThickness.toJSON(),
        ...thicknessSettings
      });
      
      // Valider les épaisseurs
      const validation = newThickness.validateThicknesses();
      if (!validation.isValid && this.settings.enforceConstraints) {
        this.handleWarning('invalid_thickness', 'Épaisseurs invalides', { issues: validation.issues });
        return false;
      }
      
      // Créer un point d'annulation
      this.createUndoPoint();
      
      // Mettre à jour les épaisseurs
      this.panelThickness = newThickness;
      
      // Mettre à jour le projet
      this.currentProject.recalculateWithThicknesses(this.panelThickness.toJSON());
      
      // Rafraîchir la vue
      this.refreshProjectView();
      
      // Notifier du changement
      if (this.onThicknessChanged) {
        this.onThicknessChanged(this.panelThickness);
      }
      
      if (this.onActionComplete) {
        this.onActionComplete('update_thickness', 'Épaisseurs mises à jour');
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des épaisseurs:', error);
      this.handleError('thickness_error', 'Erreur lors de la mise à jour des épaisseurs', error);
      return false;
    }
  }
  
  /**
   * Met à jour la propriété de fond du meuble
   * @param {boolean} hasBack - Présence d'un fond
   * @return {boolean} Succès de l'opération
   */
  updateHasBack(hasBack) {
    if (!this.currentProject) {
      this.handleWarning('no_project', 'Aucun projet courant');
      return false;
    }
    
    try {
      // Créer un point d'annulation
      this.createUndoPoint();
      
      // Mettre à jour la propriété
      this.currentProject.updateHasBack(hasBack);
      
      // Rafraîchir la vue
      this.refreshProjectView();
      
      if (this.onActionComplete) {
        this.onActionComplete('update_has_back', `Fond ${hasBack ? 'ajouté' : 'retiré'}`);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la propriété de fond:', error);
      this.handleError('back_error', 'Erreur lors de la mise à jour de la propriété de fond', error);
      return false;
    }
  }
  
  /**
   * Liste tous les projets sauvegardés
   * @return {Array} Liste des en-têtes de projets
   */
  listProjects() {
    return this.projectManager.listProjects();
  }
  
  /**
   * Liste tous les modèles disponibles
   * @return {Array} Liste des en-têtes de modèles
   */
  listTemplates() {
    return this.projectManager.listTemplates();
  }
  
  /**
   * Liste toutes les sauvegardes automatiques pour le projet courant
   * @return {Array} Liste des sauvegardes automatiques
   */
  listAutosaves() {
    if (!this.currentProject) {
      return [];
    }
    
    return this.projectManager.listAutosaves(this.currentProject.id);
  }
  
  /**
   * Obtient la liste de tous les matériaux disponibles
   * @return {Array} Liste des matériaux
   */
  getMaterials() {
    return this.materialManager.materials;
  }
  
  /**
   * Obtient la liste des matériaux par catégorie
   * @param {string} category - Catégorie de matériau
   * @return {Array} Liste des matériaux de la catégorie
   */
  getMaterialsByCategory(category) {
    return this.materialManager.getMaterialsByCategory(category);
  }
  
  /**
   * Ajoute ou met à jour un matériau
   * @param {Material} material - Matériau à ajouter/mettre à jour
   * @param {boolean} isCustom - Indique si c'est un matériau personnalisé
   * @return {Material} Matériau ajouté/mis à jour
   */
  updateMaterial(material, isCustom = true) {
    return this.materialManager.addMaterial(material, isCustom);
  }
  
  /**
   * Exporte le projet courant dans un fichier
   * @return {Blob|null} Blob contenant les données du projet ou null
   */
  exportCurrentProject() {
    if (!this.currentProject) {
      this.handleWarning('no_project', 'Aucun projet courant à exporter');
      return null;
    }
    
    try {
      const blob = this.projectManager.exportProjectToFile(this.currentProject);
      
      if (this.onExportComplete) {
        this.onExportComplete('json', blob, this.currentProject.name);
      }
      
      return blob;
    } catch (error) {
      console.error('Erreur lors de l\'export du projet:', error);
      this.handleError('export_error', 'Erreur lors de l\'export du projet', error);
      return null;
    }
  }
  
  /**
   * Exporte le projet courant au format PDF (plans)
   * @return {Blob|null} Blob contenant le PDF ou null
   */
  exportProjectToPDF() {
    if (!this.currentProject) {
      this.handleWarning('no_project', 'Aucun projet courant à exporter');
      return null;
    }
    
    if (!this.technicalDrawings) {
      this.handleWarning('no_renderer', 'Renderer de plans techniques non disponible');
      return null;
    }
    
    try {
      const blob = this.projectManager.exportProjectToPDF(this.currentProject, this.technicalDrawings);
      
      if (blob && this.onExportComplete) {
        this.onExportComplete('pdf', blob, this.currentProject.name);
      }
      
      return blob;
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      this.handleError('export_error', 'Erreur lors de l\'export PDF', error);
      return null;
    }
  }
  
  /**
   * Exporte la liste des composants au format Excel/CSV
   * @return {Object|null} Données formatées pour export ou null
   */
  exportComponentsList() {
    if (!this.currentProject) {
      this.handleWarning('no_project', 'Aucun projet courant à exporter');
      return null;
    }
    
    try {
      const data = this.currentProject.exportToExcel();
      
      if (this.onExportComplete) {
        this.onExportComplete('excel', data, this.currentProject.name);
      }
      
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'export de la liste des composants:', error);
      this.handleError('export_error', 'Erreur lors de l\'export de la liste des composants', error);
      return null;
    }
  }
  
  /**
   * Importe un projet depuis un fichier
   * @param {File} file - Fichier à importer
   * @return {Promise<boolean>} Promesse résolue avec le succès de l'opération
   */
  importProjectFromFile(file) {
    return new Promise((resolve, reject) => {
      this.projectManager.importProjectFromFile(file)
        .then(project => {
          if (project) {
            this.currentProject = project;
            
            // Mettre à jour les épaisseurs avec celles du projet
            this.panelThickness = new PanelThickness(project.thicknessSettings);
            
            // Réinitialiser les piles d'annulation/rétablissement
            this.undoStack = [];
            this.redoStack = [];
            this.notifyUndoRedoStatusChanged();
            
            // Enregistrer comme dernier état sauvegardé
            this.lastSavedState = this.getCurrentState();
            
            // Rafraîchir la vue
            this.refreshProjectView();
            
            if (this.onThicknessChanged) {
              this.onThicknessChanged(this.panelThickness);
            }
            
            if (this.onActionComplete) {
              this.onActionComplete('import_project', 'Projet importé');
            }
            
            resolve(true);
          } else {
            this.handleWarning('import_failed', 'Échec de l\'import du projet');
            resolve(false);
          }
        })
        .catch(error => {
          console.error('Erreur lors de l\'import du projet:', error);
          this.handleError('import_error', 'Erreur lors de l\'import du projet', error);
          reject(error);
        });
    });
  }
  
  /**
   * Met à jour les paramètres globaux
   * @param {Object} newSettings - Nouveaux paramètres
   * @return {boolean} Succès de l'opération
   */
  updateSettings(newSettings) {
    try {
      // Fusionner les paramètres
      this.settings = {
        ...this.settings,
        ...newSettings
      };
      
      // Sauvegarder les paramètres dans localStorage
      localStorage.setItem('furniture_configurator_settings', JSON.stringify(this.settings));
      
      // Mettre à jour la sauvegarde automatique si nécessaire
      if (newSettings.autoSave !== undefined) {
        if (newSettings.autoSave) {
          this.projectManager.startAutosave(this.currentProject);
        } else {
          this.projectManager.stopAutosave();
        }
      }
      
      // Notifier du changement
      if (this.onSettingsChanged) {
        this.onSettingsChanged(this.settings);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      this.handleError('settings_error', 'Erreur lors de la mise à jour des paramètres', error);
      return false;
    }
  }
  
  /**
   * Verrouille ou déverrouille un aspect du projet
   * @param {string} aspect - Aspect à verrouiller ('dimensions', 'dividers', 'zone', 'materials')
   * @param {number|string} id - Identifiant (pour les zones)
   * @param {boolean} locked - État de verrouillage
   * @return {boolean} Succès de l'opération
   */
  setLock(aspect, id = null, locked = true) {
    try {
      switch (aspect) {
        case 'dimensions':
          this.locks.dimensions = locked;
          break;
        case 'dividers':
          this.locks.dividers = locked;
          break;
        case 'zone':
          if (id !== null) {
            this.locks.zones[id] = locked;
          }
          break;
        case 'materials':
          this.locks.materials = locked;
          break;
        default:
          this.handleWarning('invalid_aspect', `Aspect "${aspect}" invalide`);
          return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors du verrouillage/déverrouillage:', error);
      this.handleError('lock_error', 'Erreur lors du verrouillage/déverrouillage', error);
      return false;
    }
  }
  
  /**
   * Vérifie si un aspect est verrouillé
   * @param {string} aspect - Aspect à vérifier ('dimensions', 'dividers', 'zone', 'materials')
   * @param {number|string} id - Identifiant (pour les zones)
   * @return {boolean} État de verrouillage
   */
  isLocked(aspect, id = null) {
    try {
      switch (aspect) {
        case 'dimensions':
          return this.locks.dimensions;
        case 'dividers':
          return this.locks.dividers;
        case 'zone':
          if (id !== null) {
            return this.locks.zones[id] || false;
          }
          return false;
        case 'materials':
          return this.locks.materials;
        default:
          return false;
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du verrouillage:', error);
      return false;
    }
  }
  
  /**
   * Calcule le coût total du projet
   * @return {number} Coût total
   */
  calculateTotalCost() {
    if (!this.currentProject) return 0;
    
    return this.derivedValues.totalCost;
  }
  
  /**
   * Récupère les valeurs dérivées du projet
   * @return {Object} Valeurs dérivées
   */
  getDerivedValues() {
    return { ...this.derivedValues };
  }
  
  /**
   * Définit les gestionnaires d'événements
   * @param {Object} handlers - Objet contenant les gestionnaires d'événements
   */
  // À la fin de la méthode setEventHandlers()
  setEventHandlers(handlers) {
    if (handlers.onProjectChanged) {
      this.onProjectChanged = handlers.onProjectChanged;
    }
    
    if (handlers.onMaterialsChanged) {
      this.onMaterialsChanged = handlers.onMaterialsChanged;
    }
    
    if (handlers.onThicknessChanged) {
      this.onThicknessChanged = handlers.onThicknessChanged;
    }
    
    if (handlers.onSettingsChanged) {
      this.onSettingsChanged = handlers.onSettingsChanged;
    }
    
    if (handlers.onRenderingUpdated) {
      this.onRenderingUpdated = handlers.onRenderingUpdated;
    }
    
    if (handlers.onError) {
      this.onError = handlers.onError;
    }
    
    if (handlers.onWarning) {
      this.onWarning = handlers.onWarning;
    }
    
    if (handlers.onActionComplete) {
      this.onActionComplete = handlers.onActionComplete;
    }
    
    if (handlers.onExportComplete) {
      this.onExportComplete = handlers.onExportComplete;
    }
    
    if (handlers.onUndoRedoStatusChanged) {
      this.onUndoRedoStatusChanged = handlers.onUndoRedoStatusChanged;
      
      // Notifier immédiatement du statut actuel
      this.notifyUndoRedoStatusChanged();
    }
  }
  
  /**
   * Gère une erreur
   * @param {string} code - Code d'erreur
   * @param {string} message - Message d'erreur
   * @param {Error|Object} error - Objet d'erreur ou données supplémentaires
   * @private
   */
  handleError(code, message, error = null) {
    console.error(`Erreur [${code}]: ${message}`, error);
    
    if (this.onError) {
      this.onError(code, message, error);
    }
  }
  
  /**
   * Gère un avertissement
   * @param {string} code - Code d'avertissement
   * @param {string} message - Message d'avertissement
   * @param {Object} data - Données supplémentaires
   * @private
   */
  handleWarning(code, message, data = null) {
    console.warn(`Avertissement [${code}]: ${message}`, data);
    
    if (this.onWarning) {
      this.onWarning(code, message, data);
    }
  }
  
  /**
   * Nettoie les ressources utilisées par le gestionnaire
   */
  dispose() {
    // Arrêter la sauvegarde automatique
    this.projectManager.stopAutosave();
    
    // Nettoyer les renderers
    if (this.renderer3D && typeof this.renderer3D.dispose === 'function') {
      this.renderer3D.dispose();
    }
    
    if (this.technicalDrawings && typeof this.technicalDrawings.dispose === 'function') {
      this.technicalDrawings.dispose();
    }
    
    // Supprimer la référence globale
    if (window.configurator === this) {
      delete window.configurator;
    }
    
    // Nettoyer les événements
    this.onProjectChanged = null;
    this.onMaterialsChanged = null;
    this.onThicknessChanged = null;
    this.onSettingsChanged = null;
    this.onRenderingUpdated = null;
    this.onError = null;
    this.onWarning = null;
    this.onActionComplete = null;
    this.onExportComplete = null;
    this.onUndoRedoStatusChanged = null;
  }
}
