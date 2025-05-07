// src/managers/ProjectManager.js
import { FurnitureProject } from '../models/FurnitureProject.js';

/**
 * Gestionnaire des projets de meubles
 */
export class ProjectManager {
  /**
   * Crée un nouveau gestionnaire de projets
   * @param {Object} options - Options de configuration
   */
  constructor(options = {}) {
    this.storagePrefix = options.storagePrefix || 'furniture_project_';
    this.autosavePrefix = 'furniture_autosave_';
    this.templatePrefix = 'furniture_template_';
    this.maxAutosaves = options.maxAutosaves || 5;
    this.autosaveInterval = options.autosaveInterval || 300000; // 5 minutes par défaut
    this.autosaveEnabled = options.autosaveEnabled !== undefined ? options.autosaveEnabled : true;
    this.timerId = null;
    
    // Gestionnaire de synchronisation cloud (à implémenter si nécessaire)
    this.cloudSync = options.cloudSync || null;
    
    // Événements
    this.onProjectSaved = null;
    this.onProjectLoaded = null;
    this.onProjectDeleted = null;
    this.onAutoSaved = null;
  }
  
  /**
   * Initialise le gestionnaire de projets
   */
  initialize() {
    // Nettoyer les anciennes sauvegardes automatiques
    this.cleanupAutosaves();
    
    // Démarrer la sauvegarde automatique si activée
    if (this.autosaveEnabled) {
      this.startAutosave();
    }
  }
  
  /**
   * Crée un nouveau projet
   * @param {string} name - Nom du projet
   * @param {string} materialId - Identifiant du matériau par défaut
   * @param {Object} options - Options supplémentaires
   * @return {FurnitureProject} Projet créé
   */
  createProject(name = "Nouveau Projet", materialId = null, options = {}) {
    const project = new FurnitureProject(name);
    
    // Initialiser le projet avec les options spécifiées
    project.initialize(materialId);
    
    // Appliquer des dimensions personnalisées si spécifiées
    if (options.dimensions) {
      project.updateDimensions(options.dimensions);
    }
    
    // Appliquer d'autres options
    if (options.hasBack !== undefined) {
      project.hasBack = options.hasBack;
    }
    
    if (options.thicknessSettings) {
      project.thicknessSettings = {
        ...project.thicknessSettings,
        ...options.thicknessSettings
      };
    }
    
    if (options.metadata) {
      project.metadata = {
        ...project.metadata,
        ...options.metadata
      };
    }
    
    // Régénérer les composants pour prendre en compte toutes les options
    project.regenerateComponents();
    
    return project;
  }
  
  /**
   * Crée un nouveau projet à partir d'un modèle
   * @param {string} templateId - Identifiant du modèle
   * @param {string} name - Nom du nouveau projet (optionnel)
   * @return {FurnitureProject|null} Projet créé ou null en cas d'échec
   */
  createProjectFromTemplate(templateId, name = null) {
    const template = this.loadTemplate(templateId);
    if (!template) {
      console.error(`Modèle ${templateId} non trouvé`);
      return null;
    }
    
    // Créer un nouveau projet basé sur le modèle
    const project = FurnitureProject.fromJSON(template);
    
    // Générer un nouvel ID et mettre à jour les dates
    project.id = project.generateId();
    project.createdAt = new Date();
    project.updatedAt = new Date();
    
    // Mettre à jour le nom si spécifié
    if (name) {
      project.name = name;
    } else {
      project.name = `${template.name} (copie)`;
    }
    
    return project;
  }
  
  /**
   * Charge un projet depuis une chaîne JSON
   * @param {string} jsonData - Données JSON du projet
   * @return {FurnitureProject} Projet chargé
   */
  loadProjectFromJSON(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      return FurnitureProject.fromJSON(data);
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error);
      throw error;
    }
  }
  
  /**
   * Sauvegarde un projet en JSON
   * @param {FurnitureProject} project - Projet à sauvegarder
   * @return {string} Chaîne JSON
   */
  saveProjectToJSON(project) {
    if (!(project instanceof FurnitureProject)) {
      throw new Error('Le projet doit être une instance de FurnitureProject');
    }
    
    // Mettre à jour la date de modification
    project.updatedAt = new Date();
    
    // Sérialiser le projet
    return JSON.stringify(project.toJSON());
  }
  
  /**
   * Charge un projet depuis le stockage local
   * @param {string} projectId - Identifiant du projet
   * @return {FurnitureProject|null} Projet chargé ou null
   */
  loadProject(projectId) {
    try {
      const projectData = localStorage.getItem(this.storagePrefix + projectId);
      if (projectData) {
        const project = this.loadProjectFromJSON(projectData);
        
        // Déclencher l'événement de chargement
        if (this.onProjectLoaded) {
          this.onProjectLoaded(project);
        }
        
        return project;
      }
    } catch (error) {
      console.error(`Erreur lors du chargement du projet ${projectId}:`, error);
    }
    return null;
  }
  
  /**
   * Sauvegarde un projet dans le stockage local
   * @param {FurnitureProject} project - Projet à sauvegarder
   * @return {boolean} Succès de l'opération
   */
  saveProject(project) {
    try {
      const projectData = this.saveProjectToJSON(project);
      localStorage.setItem(this.storagePrefix + project.id, projectData);
      
      // Déclencher l'événement de sauvegarde
      if (this.onProjectSaved) {
        this.onProjectSaved(project);
      }
      
      // Synchroniser avec le cloud si configuré
      this.syncToCloud(project);
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde du projet ${project.id}:`, error);
      return false;
    }
  }
  
  /**
   * Enregistre une version du projet en tant que modèle
   * @param {FurnitureProject} project - Projet à sauvegarder comme modèle
   * @param {string} templateName - Nom du modèle
   * @return {boolean} Succès de l'opération
   */
  saveAsTemplate(project, templateName = null) {
    try {
      // Créer une copie du projet
      const templateData = project.toJSON();
      
      // Modifier les propriétés pour en faire un modèle
      templateData.id = `template_${Date.now()}`;
      templateData.name = templateName || `${project.name} (modèle)`;
      templateData.isTemplate = true;
      templateData.createdAt = new Date().toISOString();
      templateData.updatedAt = new Date().toISOString();
      
      // Sauvegarder le modèle
      localStorage.setItem(this.templatePrefix + templateData.id, JSON.stringify(templateData));
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du modèle:', error);
      return false;
    }
  }
  
  /**
   * Charge un modèle depuis le stockage local
   * @param {string} templateId - Identifiant du modèle
   * @return {Object|null} Données du modèle ou null
   */
  loadTemplate(templateId) {
    try {
      const templateData = localStorage.getItem(this.templatePrefix + templateId);
      if (templateData) {
        return JSON.parse(templateData);
      }
    } catch (error) {
      console.error(`Erreur lors du chargement du modèle ${templateId}:`, error);
    }
    return null;
  }
  
  /**
   * Liste tous les modèles sauvegardés
   * @return {Array} Liste des en-têtes de modèles
   */
  listTemplates() {
    const templatesList = [];
    
    try {
      // Parcourir localStorage pour trouver les modèles
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.templatePrefix)) {
          try {
            const templateData = JSON.parse(localStorage.getItem(key));
            templatesList.push({
              id: templateData.id,
              name: templateData.name,
              createdAt: new Date(templateData.createdAt),
              updatedAt: new Date(templateData.updatedAt),
              dimensions: templateData.dimensions,
              thumbnail: templateData.metadata?.thumbnail || null
            });
          } catch (e) {
            console.warn(`Modèle corrompu: ${key}`, e);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la liste des modèles:', error);
    }
    
    // Trier par nom
    return templatesList.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  /**
   * Supprime un modèle du stockage local
   * @param {string} templateId - Identifiant du modèle
   * @return {boolean} Succès de l'opération
   */
  deleteTemplate(templateId) {
    try {
      localStorage.removeItem(this.templatePrefix + templateId);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression du modèle ${templateId}:`, error);
      return false;
    }
  }
  
  /**
   * Démarre la sauvegarde automatique périodique
   * @param {FurnitureProject} currentProject - Projet actuel
   */
  startAutosave(currentProject) {
    // Arrêter d'abord si un timer existe déjà
    this.stopAutosave();
    
    if (!this.autosaveEnabled) return;
    
    this.timerId = setInterval(() => {
      if (currentProject) {
        this.saveAutosave(currentProject);
      }
    }, this.autosaveInterval);
  }
  
  /**
   * Arrête la sauvegarde automatique
   */
  stopAutosave() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
  
  /**
   * Sauvegarde automatique d'un projet
   * @param {FurnitureProject} project - Projet à sauvegarder
   * @return {boolean} Succès de l'opération
   */
  saveAutosave(project) {
    try {
      // Créer un ID de sauvegarde automatique unique
      const autosaveId = `${project.id}_${Date.now()}`;
      const projectData = this.saveProjectToJSON(project);
      
      // Stocker la sauvegarde automatique
      localStorage.setItem(this.autosavePrefix + autosaveId, projectData);
      
      // Nettoyer les anciennes sauvegardes automatiques
      this.cleanupAutosaves();
      
      // Déclencher l'événement de sauvegarde automatique
      if (this.onAutoSaved) {
        this.onAutoSaved(project, autosaveId);
      }
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde automatique du projet ${project.id}:`, error);
      return false;
    }
  }
  
  /**
   * Nettoie les anciennes sauvegardes automatiques
   */
  cleanupAutosaves() {
    try {
      // Récupérer toutes les clés de sauvegarde automatique
      const autosaveKeys = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.autosavePrefix)) {
          autosaveKeys.push(key);
        }
      }
      
      // Regrouper par ID de projet
      const projectAutosaves = {};
      
      autosaveKeys.forEach(key => {
        const projectId = key.replace(this.autosavePrefix, '').split('_')[0];
        if (!projectAutosaves[projectId]) {
          projectAutosaves[projectId] = [];
        }
        
        projectAutosaves[projectId].push({
          key: key,
          timestamp: parseInt(key.split('_').pop())
        });
      });
      
      // Pour chaque projet, ne garder que les X plus récentes sauvegardes
      Object.values(projectAutosaves).forEach(autosaves => {
        if (autosaves.length > this.maxAutosaves) {
          // Trier par timestamp (du plus récent au plus ancien)
          autosaves.sort((a, b) => b.timestamp - a.timestamp);
          
          // Supprimer les plus anciennes
          autosaves.slice(this.maxAutosaves).forEach(autosave => {
            localStorage.removeItem(autosave.key);
          });
        }
      });
    } catch (error) {
      console.error('Erreur lors du nettoyage des sauvegardes automatiques:', error);
    }
  }
  
  /**
   * Liste les sauvegardes automatiques pour un projet
   * @param {string} projectId - Identifiant du projet
   * @return {Array} Liste des sauvegardes automatiques
   */
  listAutosaves(projectId) {
    const autosaves = [];
    
    try {
      // Parcourir localStorage pour trouver les sauvegardes automatiques du projet
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.autosavePrefix + projectId)) {
          const timestamp = parseInt(key.split('_').pop());
          autosaves.push({
            id: key.replace(this.autosavePrefix, ''),
            timestamp: timestamp,
            date: new Date(timestamp)
          });
        }
      }
    } catch (error) {
      console.error(`Erreur lors de la liste des sauvegardes automatiques pour ${projectId}:`, error);
    }
    
    // Trier par date (du plus récent au plus ancien)
    return autosaves.sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * Charge une sauvegarde automatique
   * @param {string} autosaveId - Identifiant de la sauvegarde automatique
   * @return {FurnitureProject|null} Projet chargé ou null
   */
  loadAutosave(autosaveId) {
    try {
      const projectData = localStorage.getItem(this.autosavePrefix + autosaveId);
      if (projectData) {
        return this.loadProjectFromJSON(projectData);
      }
    } catch (error) {
      console.error(`Erreur lors du chargement de la sauvegarde automatique ${autosaveId}:`, error);
    }
    return null;
  }
  
  /**
   * Liste tous les projets sauvegardés
   * @return {Array} Liste des en-têtes de projets
   */
  listProjects() {
    const projectsList = [];
    
    try {
      // Parcourir localStorage pour trouver les projets
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix)) {
          try {
            const projectData = JSON.parse(localStorage.getItem(key));
            projectsList.push({
              id: projectData.id,
              name: projectData.name,
              createdAt: new Date(projectData.createdAt),
              updatedAt: new Date(projectData.updatedAt),
              dimensions: projectData.dimensions,
              thumbnail: projectData.metadata?.thumbnail || null
            });
          } catch (e) {
            console.warn(`Projet corrompu: ${key}`, e);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la liste des projets:', error);
    }
    
    // Trier par date de modification décroissante (plus récent en premier)
    return projectsList.sort((a, b) => b.updatedAt - a.updatedAt);
  }
  
  /**
   * Supprime un projet du stockage local
   * @param {string} projectId - Identifiant du projet
   * @return {boolean} Succès de l'opération
   */
  deleteProject(projectId) {
    try {
      localStorage.removeItem(this.storagePrefix + projectId);
      
      // Supprimer aussi les sauvegardes automatiques
      const autosaves = this.listAutosaves(projectId);
      autosaves.forEach(autosave => {
        localStorage.removeItem(this.autosavePrefix + autosave.id);
      });
      
      // Déclencher l'événement de suppression
      if (this.onProjectDeleted) {
        this.onProjectDeleted(projectId);
      }
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression du projet ${projectId}:`, error);
      return false;
    }
  }
  
  /**
   * Archive un projet
   * @param {string} projectId - Identifiant du projet
   * @return {boolean} Succès de l'opération
   */
  archiveProject(projectId) {
    try {
      const projectData = localStorage.getItem(this.storagePrefix + projectId);
      if (!projectData) {
        console.error(`Projet ${projectId} introuvable`);
        return false;
      }
      
      // Marquer le projet comme archivé
      const project = JSON.parse(projectData);
      project.archived = true;
      project.archivedAt = new Date().toISOString();
      
      // Sauvegarder avec le statut archivé
      localStorage.setItem(this.storagePrefix + projectId, JSON.stringify(project));
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de l'archivage du projet ${projectId}:`, error);
      return false;
    }
  }
  
  /**
   * Restaure un projet archivé
   * @param {string} projectId - Identifiant du projet
   * @return {boolean} Succès de l'opération
   */
  unarchiveProject(projectId) {
    try {
      const projectData = localStorage.getItem(this.storagePrefix + projectId);
      if (!projectData) {
        console.error(`Projet ${projectId} introuvable`);
        return false;
      }
      
      // Marquer le projet comme actif
      const project = JSON.parse(projectData);
      project.archived = false;
      project.archivedAt = null;
      
      // Sauvegarder avec le statut actif
      localStorage.setItem(this.storagePrefix + projectId, JSON.stringify(project));
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la restauration du projet ${projectId}:`, error);
      return false;
    }
  }
  
  /**
   * Duplique un projet existant
   * @param {string} projectId - Identifiant du projet à dupliquer
   * @param {string} newName - Nom du nouveau projet (optionnel)
   * @return {FurnitureProject|null} Nouveau projet ou null en cas d'échec
   */
  duplicateProject(projectId, newName = null) {
    try {
      const project = this.loadProject(projectId);
      if (!project) {
        console.error(`Projet ${projectId} introuvable`);
        return null;
      }
      
      // Créer une copie du projet
      const duplicatedProject = FurnitureProject.fromJSON(project.toJSON());
      
      // Générer un nouvel ID et mettre à jour les dates
      duplicatedProject.id = duplicatedProject.generateId();
      duplicatedProject.createdAt = new Date();
      duplicatedProject.updatedAt = new Date();
      
      // Mettre à jour le nom
      if (newName) {
        duplicatedProject.name = newName;
      } else {
        duplicatedProject.name = `${project.name} (copie)`;
      }
      
      // Sauvegarder le nouveau projet
      this.saveProject(duplicatedProject);
      
      return duplicatedProject;
    } catch (error) {
      console.error(`Erreur lors de la duplication du projet ${projectId}:`, error);
      return null;
    }
  }
  
  /**
   * Exporte un projet dans un fichier
   * @param {FurnitureProject} project - Projet à exporter
   * @return {Blob} Blob contenant les données du projet
   */
  exportProjectToFile(project) {
    const projectData = this.saveProjectToJSON(project);
    return new Blob([projectData], { type: 'application/json' });
  }
  
  /**
   * Exporte un projet au format PDF (plans)
   * @param {FurnitureProject} project - Projet à exporter
   * @param {Object} renderer - Renderer de plans techniques
   * @return {Blob|null} Blob contenant le PDF ou null en cas d'échec
   */
  exportProjectToPDF(project, renderer) {
    if (!renderer || !renderer.generatePDF) {
      console.error("Renderer de plans non disponible");
      return null;
    }
    
    try {
      return renderer.generatePDF(project);
    } catch (error) {
      console.error(`Erreur lors de l'export PDF du projet ${project.id}:`, error);
      return null;
    }
  }
  
  /**
   * Importe un projet depuis un fichier
   * @param {File} file - Fichier à importer
   * @return {Promise<FurnitureProject>} Promesse résolue avec le projet importé
   */
  importProjectFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const projectData = event.target.result;
          const project = this.loadProjectFromJSON(projectData);
          resolve(project);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsText(file);
    });
  }
  
  /**
   * Importe un projet depuis une URL
   * @param {string} url - URL du fichier projet
   * @return {Promise<FurnitureProject>} Promesse résolue avec le projet importé
   */
  importProjectFromURL(url) {
    return new Promise((resolve, reject) => {
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
          }
          return response.text();
        })
        .then(projectData => {
          const project = this.loadProjectFromJSON(projectData);
          resolve(project);
        })
        .catch(error => {
          reject(error);
        });
    });
  }
  
  /**
   * Synchronise un projet avec le cloud
   * @param {FurnitureProject} project - Projet à synchroniser
   * @return {Promise|null} Promesse de synchronisation ou null
   * @private
   */
  syncToCloud(project) {
    if (!this.cloudSync || !this.cloudSync.syncProject) {
      return null;
    }
    
    return this.cloudSync.syncProject(project)
      .catch(error => {
        console.error(`Erreur de synchronisation cloud pour le projet ${project.id}:`, error);
      });
  }
  
  /**
   * Récupère un projet depuis le cloud
   * @param {string} projectId - Identifiant du projet
   * @return {Promise<FurnitureProject>|null} Promesse du projet ou null
   */
  fetchFromCloud(projectId) {
    if (!this.cloudSync || !this.cloudSync.fetchProject) {
      return null;
    }
    
    return this.cloudSync.fetchProject(projectId)
      .then(projectData => {
        if (!projectData) return null;
        return this.loadProjectFromJSON(projectData);
      })
      .catch(error => {
        console.error(`Erreur lors de la récupération cloud du projet ${projectId}:`, error);
        return null;
      });
  }
  
  /**
   * Définit les gestionnaires d'événements
   * @param {Object} handlers - Objet contenant les gestionnaires d'événements
   */
  setEventHandlers(handlers) {
    if (handlers.onProjectSaved) {
      this.onProjectSaved = handlers.onProjectSaved;
    }
    
    if (handlers.onProjectLoaded) {
      this.onProjectLoaded = handlers.onProjectLoaded;
    }
    
    if (handlers.onProjectDeleted) {
      this.onProjectDeleted = handlers.onProjectDeleted;
    }
    
    if (handlers.onAutoSaved) {
      this.onAutoSaved = handlers.onAutoSaved;
    }
  }
}