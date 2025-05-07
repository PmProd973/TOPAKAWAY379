// src/app.js
import { ConfiguratorManager } from './managers/ConfiguratorManager.js';
import { Material } from './models/Material.js';

/**
 * Point d'entrée principal du configurateur de dressing
 */
class App {
  /**
   * Initialise l'application
   */
  constructor() {
    this.configurator = null;
    this.init();
  }
  
  /**
   * Initialise l'application
   */
  async init() {
    try {
      // Créer et initialiser le gestionnaire du configurateur
      this.configurator = new ConfiguratorManager();
      
      // Initialiser le configurateur
      await this.configurator.initialize();
      
      // Configurer les gestionnaires d'événements
      this.setupEventHandlers();
      
      // Initialiser l'interface utilisateur
      this.initUI();
      
      console.log('Configurateur initialisé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
    }
  }
  
  /**
   * Configure les gestionnaires d'événements
   */
  setupEventHandlers() {
    this.configurator.setEventHandlers({
      onProjectChanged: (project) => {
        console.log('Projet modifié:', project);
        this.updateUI(project);
      },
      onMaterialsChanged: (materials) => {
        console.log('Matériaux modifiés:', materials);
        this.populateMaterialSelector(materials);
      },
      onThicknessChanged: (thickness) => {
        console.log('Épaisseurs modifiées:', thickness);
        this.updateThicknessUI(thickness);
      },
      onError: (code, message, error) => {
        console.error(`Erreur (${code}):`, message, error);
        this.showNotification(message, 'error');
      },
      onWarning: (code, message) => {
        console.warn(`Avertissement (${code}):`, message);
        this.showNotification(message, 'warning');
      },
      onActionComplete: (action, message) => {
        console.log(`Action (${action}):`, message);
        this.showNotification(message, 'success');
      }
    });
  }
  
  /**
   * Initialise l'interface utilisateur
   */
  initUI() {
    // Connecter les contrôles d'interface utilisateur
    this.setupDimensionsForm();
    this.setupMaterialControls();
    this.setupThicknessForm();
    this.setupProjectControls();
    this.setupTabControls();
    
    // Populer les données initiales
    this.populateMaterialSelector(this.configurator.getMaterials());
    this.populateProjectsList(this.configurator.listProjects());
    
    // Mettre à jour l'UI avec le projet actuel
    if (this.configurator.currentProject) {
      this.updateUI(this.configurator.currentProject);
    }
  }
  
  /**
   * Configure le formulaire de dimensions
   */
  setupDimensionsForm() {
    const dimensionsForm = document.getElementById('dimensions-form');
    if (dimensionsForm) {
      dimensionsForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const width = parseFloat(document.getElementById('width').value);
        const height = parseFloat(document.getElementById('height').value);
        const depth = parseFloat(document.getElementById('depth').value);
        
        this.configurator.updateDimensions({ width, height, depth });
      });
      
      // Gestion du fond
      const hasBackCheckbox = document.getElementById('has-back');
      if (hasBackCheckbox) {
        hasBackCheckbox.addEventListener('change', () => {
          this.configurator.updateHasBack(hasBackCheckbox.checked);
        });
      }
    }
  }
  
  /**
   * Configure les contrôles de matériaux
   */
  setupMaterialControls() {
    const applyMaterialBtn = document.getElementById('apply-material');
    if (applyMaterialBtn) {
      applyMaterialBtn.addEventListener('click', () => {
        const selector = document.getElementById('material-selector');
        if (selector && selector.value) {
          this.configurator.updateProjectMaterial(selector.value);
        }
      });
    }
  }
  
  /**
   * Configure le formulaire d'épaisseurs
   */
  setupThicknessForm() {
    const thicknessForm = document.getElementById('thickness-form');
    if (thicknessForm) {
      thicknessForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const sidesThickness = parseFloat(document.getElementById('sides-thickness').value);
        const shelvesThickness = parseFloat(document.getElementById('shelves-thickness').value);
        const backThickness = parseFloat(document.getElementById('back-thickness').value);
        
        this.configurator.updatePanelThicknesses({
          sides: sidesThickness,
          shelves: shelvesThickness,
          back: backThickness
        });
      });
    }
  }
  
  /**
   * Configure les contrôles de projet
   */
  setupProjectControls() {
    // Bouton Nouveau Projet
    const newProjectBtn = document.getElementById('new-project');
    if (newProjectBtn) {
      newProjectBtn.addEventListener('click', () => {
        const projectName = prompt('Nom du nouveau projet:');
        if (projectName) {
          this.configurator.createNewProject(projectName);
        }
      });
    }
    
    // Bouton Sauvegarder
    const saveProjectBtn = document.getElementById('save-project');
    if (saveProjectBtn) {
      saveProjectBtn.addEventListener('click', () => {
        const success = this.configurator.saveCurrentProject();
        if (success) {
          // Mettre à jour la liste des projets
          this.populateProjectsList(this.configurator.listProjects());
        }
      });
    }
    
    // Bouton Exporter
    const exportProjectBtn = document.getElementById('export-project');
    if (exportProjectBtn) {
      exportProjectBtn.addEventListener('click', () => {
        const blob = this.configurator.exportCurrentProject();
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${this.configurator.currentProject.name}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      });
    }
    
    // Bouton Importer
    const importButton = document.getElementById('import-button');
    const importInput = document.getElementById('import-project');
    if (importButton && importInput) {
      importButton.addEventListener('click', () => {
        importInput.click();
      });
      
      importInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          this.configurator.importProjectFromFile(file)
            .then(success => {
              if (success) {
                // Mettre à jour la liste des projets
                this.populateProjectsList(this.configurator.listProjects());
              }
            })
            .catch(error => {
              console.error('Erreur lors de l\'import:', error);
            });
        }
      });
    }
  }
  
  /**
   * Configure les contrôles d'onglets
   */
  setupTabControls() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Désactiver tous les onglets
        tabButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        
        // Activer l'onglet cliqué
        button.classList.add('active');
        const target = button.dataset.target;
        if (target) {
          const tabContent = document.getElementById(target);
          if (tabContent) {
            tabContent.classList.add('active');
          }
        }
      });
    });
  }
  
  /**
   * Peuple le sélecteur de matériaux
   * @param {Array} materials - Liste des matériaux
   */
  populateMaterialSelector(materials) {
    const materialSelector = document.getElementById('material-selector');
    if (!materialSelector) return;
    
    // Vider le sélecteur
    materialSelector.innerHTML = '';
    
    // Ajouter les options
    materials.forEach(material => {
      const option = document.createElement('option');
      option.value = material.id;
      option.textContent = material.name;
      option.style.backgroundColor = material.color;
      
      materialSelector.appendChild(option);
    });
  }
  
  /**
   * Peuple la liste des projets
   * @param {Array} projects - Liste des projets
   */
  populateProjectsList(projects) {
    const projectsList = document.getElementById('projects-list');
    if (!projectsList) return;
    
    // Vider la liste
    projectsList.innerHTML = '';
    
    // Ajouter les projets
    projects.forEach(project => {
      const projectItem = document.createElement('div');
      projectItem.className = 'project-item';
      projectItem.innerHTML = `
        <div class="project-name">${project.name}</div>
        <div class="project-date">${this.formatDate(project.updatedAt)}</div>
        <div class="project-actions">
          <button class="load-project" data-project-id="${project.id}">Charger</button>
          <button class="delete-project" data-project-id="${project.id}">Supprimer</button>
        </div>
      `;
      
      projectsList.appendChild(projectItem);
    });
    
    // Ajouter les gestionnaires d'événements
    document.querySelectorAll('.load-project').forEach(button => {
      button.addEventListener('click', (event) => {
        const projectId = event.target.dataset.projectId;
        this.configurator.loadProject(projectId);
      });
    });
    
    document.querySelectorAll('.delete-project').forEach(button => {
      button.addEventListener('click', (event) => {
        const projectId = event.target.dataset.projectId;
        if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
          // Supprimer le projet
          const success = this.configurator.projectManager.deleteProject(projectId);
          if (success) {
            // Mettre à jour la liste des projets
            this.populateProjectsList(this.configurator.listProjects());
          }
        }
      });
    });
  }
  
  /**
   * Met à jour l'interface utilisateur avec les données du projet
   * @param {FurnitureProject} project - Projet courant
   */
  updateUI(project) {
    // Mettre à jour le titre du projet
    const projectTitle = document.getElementById('project-title');
    if (projectTitle) {
      projectTitle.textContent = project.name;
    }
    
    // Mettre à jour les champs de dimensions
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const depthInput = document.getElementById('depth');
    
    if (widthInput) widthInput.value = project.dimensions.width;
    if (heightInput) heightInput.value = project.dimensions.height;
    if (depthInput) depthInput.value = project.dimensions.depth;
    
    // Mettre à jour l'option de fond
    const hasBackCheckbox = document.getElementById('has-back');
    if (hasBackCheckbox) {
      hasBackCheckbox.checked = project.hasBack;
    }
    
    // Mettre à jour la liste des zones
    this.updateZonesList(project.zones);
    
    // Mettre à jour la liste des composants
    this.updateComponentsList(project.components);
    
    // Mettre à jour le coût total
    const totalCost = this.configurator.calculateTotalCost().toFixed(2);
    const totalCostElement = document.getElementById('total-cost');
    if (totalCostElement) {
      totalCostElement.textContent = `${totalCost} €`;
    }
  }
  
  /**
   * Met à jour l'interface utilisateur des épaisseurs
   * @param {PanelThickness} thickness - Épaisseurs
   */
  updateThicknessUI(thickness) {
    const sidesThicknessInput = document.getElementById('sides-thickness');
    const shelvesThicknessInput = document.getElementById('shelves-thickness');
    const backThicknessInput = document.getElementById('back-thickness');
    
    if (sidesThicknessInput) sidesThicknessInput.value = thickness.sides;
    if (shelvesThicknessInput) shelvesThicknessInput.value = thickness.shelves;
    if (backThicknessInput) backThicknessInput.value = thickness.back;
  }
  
  /**
   * Met à jour la liste des zones
   * @param {Array} zones - Liste des zones
   */
  updateZonesList(zones) {
    const zonesList = document.getElementById('zones-list');
    if (!zonesList) return;
    
    // Vider la liste
    zonesList.innerHTML = '';
    
    // Ajouter les zones
    zones.forEach(zone => {
      const zoneItem = document.createElement('div');
      zoneItem.className = 'zone-item';
      zoneItem.innerHTML = `
        <div class="zone-header">
          <span class="zone-name">Zone ${zone.index + 1}</span>
          <span class="zone-type">${this.getContentTypeLabel(zone.contentType)}</span>
        </div>
        <div class="zone-details">
          <div>Largeur: ${zone.width} mm</div>
          <div>Position: ${zone.position} mm</div>
        </div>
        <div class="zone-actions">
          <button class="edit-zone" data-zone-index="${zone.index}">Modifier</button>
        </div>
      `;
      
      zonesList.appendChild(zoneItem);
    });
    
    // Ajouter les gestionnaires d'événements
    document.querySelectorAll('.edit-zone').forEach(button => {
      button.addEventListener('click', (event) => {
        const zoneIndex = parseInt(event.target.dataset.zoneIndex);
        this.showZoneEditDialog(zoneIndex);
      });
    });
  }
  
  /**
   * Met à jour la liste des composants
   * @param {Array} components - Liste des composants
   */
  updateComponentsList(components) {
    const componentsListBody = document.getElementById('components-list-body');
    if (!componentsListBody) return;
    
    // Vider la liste
    componentsListBody.innerHTML = '';
    
    // Ajouter les composants
    components.forEach(component => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${component.type || 'N/A'}</td>
        <td>${component.name || 'N/A'}</td>
        <td>${this.formatDimensions(component)}</td>
        <td>${this.getMaterialName(component.materialId)}</td>
        <td>${component.quantity || 1}</td>
      `;
      
      componentsListBody.appendChild(row);
    });
  }
  
  /**
   * Formate les dimensions d'un composant
   * @param {Object} component - Composant
   * @return {string} Dimensions formatées
   */
  formatDimensions(component) {
    const width = component.width ? `${component.width} mm` : 'N/A';
    const length = component.length ? `${component.length} mm` : 'N/A';
    const thickness = component.thickness ? `${component.thickness} mm` : 'N/A';
    return `${width} × ${length} × ${thickness}`;
  }
  
  /**
   * Obtient le nom d'un matériau
   * @param {string} materialId - Identifiant du matériau
   * @return {string} Nom du matériau
   */
  getMaterialName(materialId) {
    if (!materialId) return 'N/A';
    
    const material = this.configurator.materialManager.getMaterialById(materialId);
    return material ? material.name : materialId;
  }
  
  /**
   * Affiche un dialogue de modification de zone
   * @param {number} zoneIndex - Index de la zone
   */
  showZoneEditDialog(zoneIndex) {
    // Pour l'instant, juste afficher un message dans la console
    console.log(`Édition de la zone ${zoneIndex} (à implémenter)`);
    
    // Exemple simple pour changer le contenu de la zone
    const contentType = prompt('Type de contenu (shelves, drawers, wardrobe, horizontal_separation):');
    if (contentType) {
      this.configurator.updateZoneContent(zoneIndex, contentType);
    }
  }
  
  /**
   * Affiche une notification
   * @param {string} message - Message à afficher
   * @param {string} type - Type de notification (success, error, warning)
   */
  showNotification(message, type = 'info') {
    const statusMessage = document.getElementById('status-message');
    if (!statusMessage) return;
    
    // Définir la classe selon le type
    statusMessage.className = `status-message ${type}`;
    statusMessage.textContent = message;
    
    // Effacer après un délai
    setTimeout(() => {
      statusMessage.textContent = '';
      statusMessage.className = 'status-message';
    }, 5000);
  }
  
  /**
   * Formate une date pour l'affichage
   * @param {Date|string} date - Date à formater
   * @return {string} Date formatée
   */
  formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  /**
   * Obtient le libellé d'un type de contenu
   * @param {string} contentType - Type de contenu
   * @return {string} Libellé
   */
  getContentTypeLabel(contentType) {
    const labels = {
      'empty': 'Vide',
      'shelves': 'Étagères',
      'drawers': 'Tiroirs',
      'wardrobe': 'Penderie',
      'horizontal_separation': 'Séparation horizontale'
    };
    
    return labels[contentType] || contentType;
  }
}

// Initialiser l'application
window.app = new App();