// src/ui/UserInterface.js
import { Zone } from '../models/Zone.js';
import { Material } from '../models/Material.js';

/**
 * Classe gérant l'interface utilisateur du configurateur
 */
export class UserInterface {
  /**
   * Crée une nouvelle instance de l'interface utilisateur
   * @param {ConfiguratorManager} configurator - Instance du gestionnaire de configurateur
   * @param {Object} options - Options de configuration
   */
  constructor(configurator, options = {}) {
    this.configurator = configurator;
    this.renderer3DContainer = options.renderer3DContainer || 'renderer-container';
    this.technicalContainer = options.technicalContainer || 'technical-container';
    this.componentsContainer = options.componentsContainer || 'components-list-body';
    this.zonesContainer = options.zonesContainer || 'zones-list';
    this.projectsContainer = options.projectsContainer || 'projects-list';
    this.materialsContainer = options.materialsContainer || 'material-selector';
    this.lastTooltipId = 0;
    
    // État de l'interface
    this.activeTab = 'view-3d';
    this.activePanelConfig = null;
    this.selectedComponent = null;
    this.draggedDivider = null;
    
    // Options d'interface
    this.options = {
      showGrid: options.showGrid !== undefined ? options.showGrid : true,
      showDimensions: options.showDimensions !== undefined ? options.showDimensions : true,
      showTooltips: options.showTooltips !== undefined ? options.showTooltips : true,
      snapToGrid: options.snapToGrid !== undefined ? options.snapToGrid : true,
      gridSize: options.gridSize || 10,
      theme: options.theme || 'light',
      locale: options.locale || 'fr-FR',
      confirmDelete: options.confirmDelete !== undefined ? options.confirmDelete : true,
      ...options
    };
  }
  
  /**
   * Initialise l'interface utilisateur
   */
  initialize() {
    // Initialiser les contrôles de l'interface
    this.initializeTabs();
    this.initializeDimensionsForm();
    this.initializeThicknessForm();
    this.initializeProjectControls();
    this.initializeMaterialControls();
    this.initializeZoneControls();
    this.initializeComponentsList();
    this.initializeDialogs();
    this.initializeKeyboardShortcuts();
    
    // Appliquer le thème
    this.applyTheme(this.options.theme);
    
    // Configurer les événements de redimensionnement
    window.addEventListener('resize', this.handleResize.bind(this));
    
    console.log('Interface utilisateur initialisée');
  }
  
  /**
   * Initialise les onglets
   */
  initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    if (!tabButtons.length) return;
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Désactiver tous les onglets
        tabButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        
        // Activer l'onglet cliqué
        button.classList.add('active');
        const targetId = button.dataset.target;
        this.activeTab = targetId;
        
        if (targetId) {
          const targetTab = document.getElementById(targetId);
          if (targetTab) {
            targetTab.classList.add('active');
          }
        }
      });
    });
  }
  
  /**
   * Initialise le formulaire de dimensions
   */
  initializeDimensionsForm() {
    const form = document.getElementById('dimensions-form');
    if (!form) return;
    
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      
      const width = parseFloat(document.getElementById('width').value);
      const height = parseFloat(document.getElementById('height').value);
      const depth = parseFloat(document.getElementById('depth').value);
      
      this.configurator.updateDimensions({ width, height, depth });
    });
    
    // Gestion du fond du meuble
    const hasBackCheckbox = document.getElementById('has-back');
    if (hasBackCheckbox) {
      hasBackCheckbox.addEventListener('change', () => {
        this.configurator.updateHasBack(hasBackCheckbox.checked);
      });
    }
  }
  
  /**
   * Initialise le formulaire d'épaisseurs
   */
  initializeThicknessForm() {
    const form = document.getElementById('thickness-form');
    if (!form) return;
    
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      
      const thicknessSettings = {};
      
      // Récupérer toutes les valeurs d'épaisseur
      const sidesInput = document.getElementById('sides-thickness');
      if (sidesInput) thicknessSettings.sides = parseFloat(sidesInput.value);
      
      const shelvesInput = document.getElementById('shelves-thickness');
      if (shelvesInput) thicknessSettings.shelves = parseFloat(shelvesInput.value);
      
      const backInput = document.getElementById('back-thickness');
      if (backInput) thicknessSettings.back = parseFloat(backInput.value);
      
      const drawerFrontInput = document.getElementById('drawer-front-thickness');
      if (drawerFrontInput) thicknessSettings.drawerFront = parseFloat(drawerFrontInput.value);
      
      const drawerSidesInput = document.getElementById('drawer-sides-thickness');
      if (drawerSidesInput) thicknessSettings.drawerSides = parseFloat(drawerSidesInput.value);
      
      const drawerBottomInput = document.getElementById('drawer-bottom-thickness');
      if (drawerBottomInput) thicknessSettings.drawerBottom = parseFloat(drawerBottomInput.value);
      
      // Mettre à jour les épaisseurs
      this.configurator.updatePanelThicknesses(thicknessSettings);
    });
  }
  
  /**
   * Initialise les contrôles de projet
   */
  initializeProjectControls() {
    // Bouton Nouveau Projet
    const newProjectBtn = document.getElementById('new-project');
    if (newProjectBtn) {
      newProjectBtn.addEventListener('click', () => {
        const name = prompt('Nom du nouveau projet:');
        if (name) {
          this.configurator.createNewProject(name);
        }
      });
    }
    
    // Bouton Sauvegarder Projet
    const saveProjectBtn = document.getElementById('save-project');
    if (saveProjectBtn) {
      saveProjectBtn.addEventListener('click', () => {
        this.configurator.saveCurrentProject();
        this.refreshProjectsList();
      });
    }
    
    // Bouton Exporter Projet
    const exportProjectBtn = document.getElementById('export-project');
    if (exportProjectBtn) {
      exportProjectBtn.addEventListener('click', () => {
        const blob = this.configurator.exportCurrentProject();
        if (blob) {
          this.downloadFile(blob, `${this.configurator.currentProject.name}.json`);
        }
      });
    }
    
    // Bouton Importer Projet
    const importProjectBtn = document.getElementById('import-button');
    const importInput = document.getElementById('import-project');
    if (importProjectBtn && importInput) {
      importProjectBtn.addEventListener('click', () => {
        importInput.click();
      });
      
      importInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          this.configurator.importProjectFromFile(file)
            .then(() => {
              this.refreshProjectsList();
            })
            .catch(error => {
              console.error('Erreur lors de l\'import:', error);
              this.showNotification('Erreur lors de l\'import du projet', 'error');
            });
        }
      });
    }
  }
  // Dans UserInterface.js - méthode initialize() ou une nouvelle méthode initializeRenderer3DControls()
initializeRenderer3DControls() {
  // Boutons de vue
  document.getElementById('view-front')?.addEventListener('click', () => {
    if (this.configurator.renderer3D) {
      this.configurator.renderer3D.setViewAngle('front');
    }
  });
  
  document.getElementById('view-side')?.addEventListener('click', () => {
    if (this.configurator.renderer3D) {
      this.configurator.renderer3D.setViewAngle('side');
    }
  });
  
  document.getElementById('view-top')?.addEventListener('click', () => {
    if (this.configurator.renderer3D) {
      this.configurator.renderer3D.setViewAngle('top');
    }
  });
  
  document.getElementById('view-iso')?.addEventListener('click', () => {
    if (this.configurator.renderer3D) {
      this.configurator.renderer3D.setViewAngle('iso');
    }
  });
  
  // Checkbox des dimensions
  const showDimensions = document.getElementById('show-dimensions');
  if (showDimensions) {
    showDimensions.addEventListener('change', () => {
      if (this.configurator.renderer3D) {
        this.configurator.renderer3D.showDimensions = showDimensions.checked;
        this.configurator.renderer3D.updateFurniture(this.configurator.currentProject);
      }
    });
  }
  
  // Checkbox des étiquettes
  const showLabels = document.getElementById('show-labels');
  if (showLabels) {
    showLabels.addEventListener('change', () => {
      if (this.configurator.renderer3D) {
        this.configurator.renderer3D.showLabels = showLabels.checked;
        this.configurator.renderer3D.updateFurniture(this.configurator.currentProject);
      }
    });
  }
  
  // Contrôle de vue éclatée
  const explodedView = document.getElementById('exploded-view');
  if (explodedView) {
    explodedView.addEventListener('input', () => {
      if (this.configurator.renderer3D) {
        const factor = parseInt(explodedView.value) / 100;
        this.configurator.renderer3D.applyExplodedView(factor);
      }
    });
  }
  
  // Sélection de l'éclairage
  const lightingSetup = document.getElementById('lighting-setup');
  if (lightingSetup) {
    lightingSetup.addEventListener('change', () => {
      if (this.configurator.renderer3D) {
        this.configurator.renderer3D.setupLighting(lightingSetup.value);
      }
    });
  }
}
  /**
   * Initialise les contrôles de matériaux
   */
  initializeMaterialControls() {
    // Bouton d'application du matériau
    const applyMaterialBtn = document.getElementById('apply-material');
    const materialSelector = document.getElementById(this.materialsContainer);
    
    if (applyMaterialBtn && materialSelector) {
      applyMaterialBtn.addEventListener('click', () => {
        const materialId = materialSelector.value;
        if (materialId) {
          if (this.selectedComponent) {
            this.configurator.updateComponentMaterial(this.selectedComponent, materialId);
          } else {
            this.configurator.updateProjectMaterial(materialId);
          }
        }
      });
    }
    
    // Formulaire d'ajout de matériau personnalisé
    const materialForm = document.getElementById('material-form');
    if (materialForm) {
      materialForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const id = `custom_${Date.now()}`;
        const name = document.getElementById('material-name').value;
        const color = document.getElementById('material-color').value;
        const price = parseFloat(document.getElementById('material-price').value);
        
        const newMaterial = new Material(id, name, color, null, price);
        this.configurator.updateMaterial(newMaterial, true);
        
        materialForm.reset();
        this.populateMaterialSelector();
      });
    }
  }
  
  /**
   * Initialise les contrôles de zones
   */
  initializeZoneControls() {
    // Le conteneur de zones est mis à jour dynamiquement, donc nous utilisons la délégation d'événements
    const zonesListContainer = document.getElementById(this.zonesContainer);
    if (zonesListContainer) {
      zonesListContainer.addEventListener('click', (event) => {
        // Gestion du bouton d'édition de zone
        if (event.target.classList.contains('edit-zone')) {
          const zoneIndex = parseInt(event.target.dataset.zoneIndex);
          this.showZoneEditDialog(zoneIndex);
        }
        
        // Gestion du bouton de suppression de zone
        if (event.target.classList.contains('delete-zone')) {
          const zoneIndex = parseInt(event.target.dataset.zoneIndex);
          if (this.options.confirmDelete) {
            if (confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) {
              // Dans une implémentation complète, nous aurions une méthode pour supprimer une zone
              console.log(`Suppression de la zone ${zoneIndex} (fonctionnalité à implémenter)`);
            }
          } else {
            // Dans une implémentation complète, nous aurions une méthode pour supprimer une zone
            console.log(`Suppression de la zone ${zoneIndex} (fonctionnalité à implémenter)`);
          }
        }
      });
    }
    
    // Gestion des séparateurs (à implémenter si l'interface le permet)
    // Cela pourrait inclure le glisser-déposer pour repositionner les séparateurs, etc.
  }
  
  /**
   * Initialise la liste des composants
   */
  initializeComponentsList() {
    // Délégation d'événements pour la liste des composants
    const componentsList = document.getElementById(this.componentsContainer);
    if (componentsList) {
      componentsList.addEventListener('click', (event) => {
        const row = event.target.closest('tr');
        if (row) {
          // Gérer la sélection du composant
          const componentId = row.dataset.componentId;
          if (componentId) {
            this.selectComponent(componentId);
            
            // Mise en évidence visuelle
            document.querySelectorAll('#' + this.componentsContainer + ' tr').forEach(tr => {
              tr.classList.remove('selected');
            });
            row.classList.add('selected');
          }
        }
      });
    }
    
    // Filtres de composants (si présent)
    const componentFilter = document.getElementById('component-filter');
    if (componentFilter) {
      componentFilter.addEventListener('change', () => {
        this.filterComponents(componentFilter.value);
      });
    }
  }
  
  /**
   * Initialise les boîtes de dialogue
   */
  initializeDialogs() {
    // Nous utilisons des boîtes de dialogue modales personnalisées plutôt que les alertes/prompts natifs
    
    // Fermeture des dialogues lors d'un clic à l'extérieur
    document.addEventListener('click', (event) => {
      const dialogs = document.querySelectorAll('.modal-dialog');
      dialogs.forEach(dialog => {
        if (dialog.classList.contains('active')) {
          const dialogContent = dialog.querySelector('.dialog-content');
          if (dialogContent && !dialogContent.contains(event.target) && 
              !event.target.classList.contains('dialog-trigger')) {
            dialog.classList.remove('active');
          }
        }
      });
    });
    
    // Boutons de fermeture dans les dialogues
    document.querySelectorAll('.dialog-close').forEach(button => {
      button.addEventListener('click', () => {
        const dialog = button.closest('.modal-dialog');
        if (dialog) {
          dialog.classList.remove('active');
        }
      });
    });
  }
  
  /**
   * Initialise les raccourcis clavier
   */
  initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Vérifier que l'événement ne provient pas d'un champ de saisie
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Undo/Redo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        if (event.shiftKey) {
          // Ctrl+Shift+Z ou Cmd+Shift+Z pour refaire
          this.configurator.redo();
        } else {
          // Ctrl+Z ou Cmd+Z pour annuler
          this.configurator.undo();
        }
        event.preventDefault();
      }
      
      // Sauvegarder (Ctrl+S)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        this.configurator.saveCurrentProject();
        event.preventDefault();
      }
      
      // Autres raccourcis à ajouter selon les besoins
    });
  }
  
  /**
   * Affiche un dialogue d'édition de zone
   * @param {number} zoneIndex - Index de la zone à éditer
   */
  showZoneEditDialog(zoneIndex) {
    // Créer ou afficher le dialogue d'édition de zone
    let dialog = document.getElementById('zone-edit-dialog');
    
    // Si le dialogue n'existe pas, le créer
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'zone-edit-dialog';
      dialog.className = 'modal-dialog';
      
      dialog.innerHTML = `
        <div class="dialog-content">
          <div class="dialog-header">
            <h3>Modifier la zone <span id="zone-edit-title"></span></h3>
            <button class="dialog-close">&times;</button>
          </div>
          <div class="dialog-body">
            <form id="zone-edit-form">
              <div class="form-group">
                <label for="zone-content-type">Type de contenu</label>
                <select id="zone-content-type">
                  <option value="empty">Vide</option>
                  <option value="shelves">Étagères</option>
                  <option value="drawers">Tiroirs</option>
                  <option value="wardrobe">Penderie</option>
                  <option value="horizontal_separation">Séparation horizontale</option>
                </select>
              </div>
              
              <!-- Paramètres spécifiques aux étagères -->
              <div id="shelves-params" class="content-params">
                <div class="form-group">
                  <label for="shelves-count">Nombre d'étagères</label>
                  <input type="number" id="shelves-count" min="1" max="10" value="3">
                </div>
                <div class="form-group">
                  <label for="shelves-retraction">Retrait (mm)</label>
                  <input type="number" id="shelves-retraction" min="0" max="100" value="0">
                </div>
                <div class="form-group">
                  <label for="shelves-material">Matériau</label>
                  <select id="shelves-material"></select>
                </div>
              </div>
              
              <!-- Paramètres spécifiques aux tiroirs -->
              <div id="drawers-params" class="content-params">
                <div class="form-group">
                  <label for="drawers-count">Nombre de tiroirs</label>
                  <input type="number" id="drawers-count" min="1" max="6" value="3">
                </div>
                <div class="form-group">
                  <label for="drawers-face-height">Hauteur de façade (mm)</label>
                  <input type="number" id="drawers-face-height" min="100" max="300" value="150">
                </div>
                <div class="form-group">
                  <label for="drawers-gap">Espacement (mm)</label>
                  <input type="number" id="drawers-gap" min="1" max="10" value="3">
                </div>
                <div class="form-group">
                  <label for="drawers-type">Type de tiroir</label>
                  <select id="drawers-type">
                    <option value="standard">Standard</option>
                    <option value="supplier">Fournisseur</option>
                    <option value="custom">Sur mesure</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="drawers-material">Matériau</label>
                  <select id="drawers-material"></select>
                </div>
              </div>
              
              <!-- Paramètres spécifiques à la penderie -->
              <div id="wardrobe-params" class="content-params">
                <div class="form-group">
                  <label for="wardrobe-rail-height">Hauteur de la tringle (mm)</label>
                  <input type="number" id="wardrobe-rail-height" min="100" max="500" value="200">
                </div>
                <div class="form-group">
                  <label for="wardrobe-material">Matériau</label>
                  <select id="wardrobe-material"></select>
                </div>
              </div>
              
              <!-- Paramètres spécifiques à la séparation horizontale -->
              <div id="horizontal-separation-params" class="content-params">
                <div class="form-group">
                  <label for="separation-height">Hauteur séparation 1 (mm)</label>
                  <input type="number" id="separation-height" min="300" max="2000" value="1200">
                </div>
                <div class="form-group">
                  <label for="has-second-separation">Seconde séparation</label>
                  <input type="checkbox" id="has-second-separation">
                </div>
                <div class="form-group second-separation">
                  <label for="second-separation-height">Hauteur séparation 2 (mm)</label>
                  <input type="number" id="second-separation-height" min="300" max="2000" value="1800">
                </div>
                <div class="form-group">
                  <label for="separation-material">Matériau</label>
                  <select id="separation-material"></select>
                </div>
                <div class="subzones-config">
                  <h4>Configuration des sous-zones</h4>
                  <!-- Configuration des sous-zones -->
                  <!-- Cette partie serait dynamique et assez complexe -->
                </div>
              </div>
              
              <div class="form-actions">
                <button type="submit" class="primary-button">Appliquer</button>
                <button type="button" class="secondary-button dialog-close">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      `;
      
      // Ajouter le dialogue au document
      document.body.appendChild(dialog);
      
      // Initialiser le comportement du formulaire d'édition de zone
      this.initializeZoneEditForm();
    }
    
    // Récupérer la zone à éditer
    const zone = this.configurator.currentProject.zones.find(z => z.index === zoneIndex);
    if (!zone) {
      console.error(`Zone ${zoneIndex} introuvable`);
      return;
    }
    
    // Mettre à jour le titre du dialogue
    const zoneTitle = dialog.querySelector('#zone-edit-title');
    if (zoneTitle) {
      zoneTitle.textContent = `${zoneIndex + 1}`;
    }
    
    // Remplir le formulaire avec les valeurs actuelles de la zone
    this.populateZoneEditForm(zone);
    
    // Afficher le dialogue
    dialog.classList.add('active');
  }
  
  /**
   * Initialise le formulaire d'édition de zone
   */
  initializeZoneEditForm() {
    const form = document.getElementById('zone-edit-form');
    if (!form) return;
    
    // Changement de type de contenu
    const contentTypeSelect = document.getElementById('zone-content-type');
    if (contentTypeSelect) {
      contentTypeSelect.addEventListener('change', () => {
        this.updateZoneEditFormVisibility(contentTypeSelect.value);
      });
    }
    
    // Gestion de la seconde séparation
    const hasSecondSeparation = document.getElementById('has-second-separation');
    if (hasSecondSeparation) {
      hasSecondSeparation.addEventListener('change', () => {
        const secondSeparationFields = document.querySelectorAll('.second-separation');
        secondSeparationFields.forEach(field => {
          field.style.display = hasSecondSeparation.checked ? 'flex' : 'none';
        });
      });
    }
    
    // Soumission du formulaire
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.saveZoneSettings();
    });
    
    // Populer les sélecteurs de matériaux
    this.populateMaterialSelectors();
  }
  
  /**
   * Met à jour la visibilité des sections du formulaire d'édition de zone
   * @param {string} contentType - Type de contenu sélectionné
   */
  updateZoneEditFormVisibility(contentType) {
    // Masquer tous les panneaux de paramètres
    document.querySelectorAll('.content-params').forEach(panel => {
      panel.style.display = 'none';
    });
    
    // Afficher le panneau correspondant au type sélectionné
    switch (contentType) {
      case 'shelves':
        document.getElementById('shelves-params').style.display = 'block';
        break;
      case 'drawers':
        document.getElementById('drawers-params').style.display = 'block';
        break;
      case 'wardrobe':
        document.getElementById('wardrobe-params').style.display = 'block';
        break;
      case 'horizontal_separation':
        document.getElementById('horizontal-separation-params').style.display = 'block';
        
        // Mettre à jour la visibilité de la section de seconde séparation
        const hasSecondSeparation = document.getElementById('has-second-separation');
        if (hasSecondSeparation) {
          const secondSeparationFields = document.querySelectorAll('.second-separation');
          secondSeparationFields.forEach(field => {
            field.style.display = hasSecondSeparation.checked ? 'flex' : 'none';
          });
        }
        break;
    }
  }
  
  /**
   * Remplit le formulaire d'édition de zone avec les valeurs de la zone
   * @param {Zone} zone - Zone à éditer
   */
  populateZoneEditForm(zone) {
    // Sélectionner le type de contenu
    const contentTypeSelect = document.getElementById('zone-content-type');
    if (contentTypeSelect) {
      contentTypeSelect.value = zone.contentType;
      this.updateZoneEditFormVisibility(zone.contentType);
    }
    // Dans UserInterface.js
document.getElementById('capture-3d')?.addEventListener('click', () => {
  if (this.configurator.renderer3D) {
    // Capture l'image
    const imageData = this.configurator.renderer3D.captureImage();
    
    // Crée un lien de téléchargement
    const a = document.createElement('a');
    a.href = imageData;
    a.download = `${this.configurator.currentProject.name || 'dressing'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    this.showNotification('Image exportée avec succès', 'success');
  }
});
    // Remplir les champs selon le type de contenu
    switch (zone.contentType) {
      case 'shelves':
        const shelfCount = document.getElementById('shelves-count');
        if (shelfCount) shelfCount.value = zone.settings.shelfCount || 3;
        
        const shelfRetraction = document.getElementById('shelves-retraction');
        if (shelfRetraction) shelfRetraction.value = zone.settings.shelfRetraction || 0;
        
        const shelvesMaterial = document.getElementById('shelves-material');
        if (shelvesMaterial) shelvesMaterial.value = zone.settings.materialId || this.configurator.currentProject.materialId;
        break;
        
      case 'drawers':
        const drawerCount = document.getElementById('drawers-count');
        if (drawerCount) drawerCount.value = zone.settings.drawerCount || 3;
        
        const faceFront = document.getElementById('drawers-face-height');
        if (faceFront) faceFront.value = zone.settings.faceHeight || 150;
        
        const drawerGap = document.getElementById('drawers-gap');
        if (drawerGap) drawerGap.value = zone.settings.operationalGap || 3;
        
        const drawerType = document.getElementById('drawers-type');
        if (drawerType) drawerType.value = zone.settings.drawerType || 'standard';
        
        const drawersMaterial = document.getElementById('drawers-material');
        if (drawersMaterial) drawersMaterial.value = zone.settings.materialId || this.configurator.currentProject.materialId;
        break;
        
      case 'wardrobe':
        const railHeight = document.getElementById('wardrobe-rail-height');
        if (railHeight) railHeight.value = zone.settings.railHeight || 200;
        
        const wardrobeMaterial = document.getElementById('wardrobe-material');
        if (wardrobeMaterial) wardrobeMaterial.value = zone.settings.materialId || this.configurator.currentProject.materialId;
        break;
        
      case 'horizontal_separation':
        const separationHeight = document.getElementById('separation-height');
        if (separationHeight) separationHeight.value = zone.settings.separationHeight || 1200;
        
        const hasSecondSeparation = document.getElementById('has-second-separation');
        if (hasSecondSeparation) {
          hasSecondSeparation.checked = zone.settings.hasSecondSeparation || false;
          
          // Mettre à jour la visibilité
          const secondSeparationFields = document.querySelectorAll('.second-separation');
          secondSeparationFields.forEach(field => {
            field.style.display = hasSecondSeparation.checked ? 'flex' : 'none';
          });
        }
        
        const secondSeparationHeight = document.getElementById('second-separation-height');
        if (secondSeparationHeight) secondSeparationHeight.value = zone.settings.secondSeparationHeight || 1800;
        
        const separationMaterial = document.getElementById('separation-material');
        if (separationMaterial) separationMaterial.value = zone.settings.materialId || this.configurator.currentProject.materialId;
        
        // Configuration des sous-zones (à implémenter)
        // Cette partie serait plus complexe et nécessiterait une interface dynamique
        break;
    }
    
    // Stocker l'index de la zone active pour la sauvegarde
    this.activePanelConfig = zone.index;
  }
  
  /**
   * Remplit les sélecteurs de matériaux
   */
  populateMaterialSelectors() {
    const selectors = [
      'shelves-material',
      'drawers-material',
      'wardrobe-material',
      'separation-material'
    ];
    
    const materials = this.configurator.getMaterials();
    
    selectors.forEach(selectorId => {
      const selector = document.getElementById(selectorId);
      if (selector) {
        // Vider le sélecteur
        selector.innerHTML = '';
        
        // Ajouter l'option "Matériau du projet"
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Matériau du projet';
        selector.appendChild(defaultOption);
        
        // Ajouter les matériaux
        materials.forEach(material => {
          const option = document.createElement('option');
          option.value = material.id;
          option.textContent = material.name;
          option.style.backgroundColor = material.color;
          selector.appendChild(option);
        });
      }
    });
  }
  
  /**
   * Sauvegarde les paramètres de la zone
   */
  saveZoneSettings() {
    if (this.activePanelConfig === null) return;
    
    const zoneIndex = this.activePanelConfig;
    const contentType = document.getElementById('zone-content-type').value;
    let settings = {};
    
    // Récupérer les paramètres selon le type de contenu
    switch (contentType) {
      case 'shelves':
        const shelfCount = document.getElementById('shelves-count');
        const shelfRetraction = document.getElementById('shelves-retraction');
        const shelvesMaterial = document.getElementById('shelves-material');
        
        settings = {
          shelfCount: shelfCount ? parseInt(shelfCount.value) : 3,
          shelfRetraction: shelfRetraction ? parseInt(shelfRetraction.value) : 0
        };
        
        if (shelvesMaterial && shelvesMaterial.value) {
          settings.materialId = shelvesMaterial.value;
        }
        break;
        
      case 'drawers':
        const drawerCount = document.getElementById('drawers-count');
        const faceHeight = document.getElementById('drawers-face-height');
        const operationalGap = document.getElementById('drawers-gap');
        const drawerType = document.getElementById('drawers-type');
        const drawersMaterial = document.getElementById('drawers-material');
        
        settings = {
          drawerCount: drawerCount ? parseInt(drawerCount.value) : 3,
          faceHeight: faceHeight ? parseInt(faceHeight.value) : 150,
          operationalGap: operationalGap ? parseInt(operationalGap.value) : 3,
          drawerType: drawerType ? drawerType.value : 'standard'
        };
        
        if (drawersMaterial && drawersMaterial.value) {
          settings.materialId = drawersMaterial.value;
        }
        break;
        
      case 'wardrobe':
        const railHeight = document.getElementById('wardrobe-rail-height');
        const wardrobeMaterial = document.getElementById('wardrobe-material');
        
        settings = {
          railHeight: railHeight ? parseInt(railHeight.value) : 200
        };
        
        if (wardrobeMaterial && wardrobeMaterial.value) {
          settings.materialId = wardrobeMaterial.value;
        }
        break;
        
      case 'horizontal_separation':
        const separationHeight = document.getElementById('separation-height');
        const hasSecondSeparation = document.getElementById('has-second-separation');
        const secondSeparationHeight = document.getElementById('second-separation-height');
        const separationMaterial = document.getElementById('separation-material');
        
        settings = {
          separationHeight: separationHeight ? parseInt(separationHeight.value) : 1200,
          hasSecondSeparation: hasSecondSeparation ? hasSecondSeparation.checked : false,
          secondSeparationHeight: secondSeparationHeight ? parseInt(secondSeparationHeight.value) : 1800
        };
        
        if (separationMaterial && separationMaterial.value) {
          settings.materialId = separationMaterial.value;
        }
        
        // Configuration des sous-zones (à implémenter)
        // Cette partie serait plus complexe et nécessiterait une interface dynamique
        break;
    }
    
    // Mettre à jour la zone
    this.configurator.updateZoneContent(zoneIndex, contentType, settings);
    
    // Fermer le dialogue
    const dialog = document.getElementById('zone-edit-dialog');
    if (dialog) {
      dialog.classList.remove('active');
    }
  }
  
  /**
   * Rafraîchit l'interface utilisateur
   * @param {FurnitureProject} project - Projet courant
   */
  refreshControls(project) {
    if (!project) return;
    
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
    this.refreshZonesList(project.zones);
    
    // Mettre à jour la liste des composants
    this.refreshComponentsList(project.components);
    
    // Mettre à jour le coût total
    this.updateTotalCost();
  }
  
  /**
   * Met à jour les contrôles d'épaisseur
   * @param {PanelThickness} thickness - Épaisseurs de panneaux
   */
  refreshThicknessControls(thickness) {
    const sidesInput = document.getElementById('sides-thickness');
    const shelvesInput = document.getElementById('shelves-thickness');
    const backInput = document.getElementById('back-thickness');
    const drawerFrontInput = document.getElementById('drawer-front-thickness');
    const drawerSidesInput = document.getElementById('drawer-sides-thickness');
    const drawerBottomInput = document.getElementById('drawer-bottom-thickness');
    
    if (sidesInput) sidesInput.value = thickness.sides;
    if (shelvesInput) shelvesInput.value = thickness.shelves;
    if (backInput) backInput.value = thickness.back;
    if (drawerFrontInput) drawerFrontInput.value = thickness.drawerFront;
    if (drawerSidesInput) drawerSidesInput.value = thickness.drawerSides;
    if (drawerBottomInput) drawerBottomInput.value = thickness.drawerBottom;
  }
  
  /**
   * Raffraîchit la liste des projets
   */
  refreshProjectsList() {
    const projectsList = this.configurator.listProjects();
    this.populateProjectsList(projectsList);
  }
  
  /**
   * Remplit la liste des projets
   * @param {Array} projects - Liste des projets
   */
  populateProjectsList(projects) {
    const projectsContainer = document.getElementById(this.projectsContainer);
    if (!projectsContainer) return;
    
    // Vider la liste
    projectsContainer.innerHTML = '';
    
    if (projects.length === 0) {
      projectsContainer.innerHTML = '<div class="empty-list">Aucun projet sauvegardé</div>';
      return;
    }
    
    // Ajouter les projets
    projects.forEach(project => {
      const projectItem = document.createElement('div');
      projectItem.className = 'project-item';
      
      // Ajouter la classe 'current' si c'est le projet actuel
      if (this.configurator.currentProject && this.configurator.currentProject.id === project.id) {
        projectItem.classList.add('current');
      }
      
      projectItem.innerHTML = `
        <div class="project-name">${project.name}</div>
        <div class="project-date">${this.formatDate(project.updatedAt)}</div>
        <div class="project-actions">
          <button class="load-project" data-project-id="${project.id}">Charger</button>
          <button class="delete-project" data-project-id="${project.id}">Supprimer</button>
        </div>
      `;
      
      projectsContainer.appendChild(projectItem);
    });
    
    // Ajouter les gestionnaires d'événements
    projectsContainer.querySelectorAll('.load-project').forEach(button => {
      button.addEventListener('click', (event) => {
        const projectId = event.target.dataset.projectId;
        this.configurator.loadProject(projectId);
      });
    });
    
    projectsContainer.querySelectorAll('.delete-project').forEach(button => {
      button.addEventListener('click', (event) => {
        const projectId = event.target.dataset.projectId;
        if (this.options.confirmDelete) {
          if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
            this.configurator.projectManager.deleteProject(projectId);
            this.refreshProjectsList();
          }
        } else {
          this.configurator.projectManager.deleteProject(projectId);
          this.refreshProjectsList();
        }
      });
    });
  }
  
  /**
   * Remplit le sélecteur de matériaux
   * @param {Array} materials - Liste des matériaux
   */
  populateMaterialSelector(materials) {
    if (!materials) {
      materials = this.configurator.getMaterials();
    }
    
    const materialSelector = document.getElementById(this.materialsContainer);
    if (!materialSelector) return;
    
    // Vider le sélecteur
    materialSelector.innerHTML = '';
    
    // Ajouter les matériaux
    materials.forEach(material => {
      const option = document.createElement('option');
      option.value = material.id;
      option.textContent = material.name;
      option.style.backgroundColor = material.color;
      
      materialSelector.appendChild(option);
    });
  }
  
  /**
   * Raffraîchit la liste des zones
   * @param {Array} zones - Liste des zones
   */
  refreshZonesList(zones) {
    const zonesContainer = document.getElementById(this.zonesContainer);
    if (!zonesContainer) return;
    
    // Vider la liste
    zonesContainer.innerHTML = '';
    
    if (zones.length === 0) {
      zonesContainer.innerHTML = '<div class="empty-list">Aucune zone définie</div>';
      return;
    }
    
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
      
      zonesContainer.appendChild(zoneItem);
    });
  }
  
  /**
   * Raffraîchit la liste des composants
   * @param {Array} components - Liste des composants
   */
  refreshComponentsList(components) {
    const componentsContainer = document.getElementById(this.componentsContainer);
    if (!componentsContainer) return;
    
    // Vider la liste
    componentsContainer.innerHTML = '';
    
    if (components.length === 0) {
      componentsContainer.innerHTML = '<tr><td colspan="5" class="empty-list">Aucun composant généré</td></tr>';
      return;
    }
    
    // Ajouter les composants
    components.forEach(component => {
      const row = document.createElement('tr');
      row.dataset.componentId = component.id;
      
      // Ajouter la classe 'selected' si c'est le composant sélectionné
      if (this.selectedComponent === component.id) {
        row.classList.add('selected');
      }
      
      row.innerHTML = `
        <td>${this.getComponentTypeLabel(component.type)}</td>
        <td>${component.name}</td>
        <td>${this.formatDimensions(component)}</td>
        <td>${this.getMaterialName(component.materialId)}</td>
        <td>${component.quantity}</td>
      `;
      
      componentsContainer.appendChild(row);
    });
  }
  
  /**
   * Sélectionne un composant
   * @param {string} componentId - Identifiant du composant
   */
  selectComponent(componentId) {
    this.selectedComponent = componentId;
    
    // Mise en évidence dans le rendu 3D
    if (this.configurator.renderer3D && typeof this.configurator.renderer3D.highlightComponent === 'function') {
      this.configurator.renderer3D.highlightComponent(componentId);
    }
    
    // Mise à jour de l'interface
    document.querySelectorAll('#' + this.componentsContainer + ' tr').forEach(tr => {
      tr.classList.remove('selected');
      if (tr.dataset.componentId === componentId) {
        tr.classList.add('selected');
      }
    });
    
    // Mise à jour de l'info-bulle
    this.showComponentTooltip(componentId);
  }
  
  /**
   * Filtre les composants par type
   * @param {string} type - Type de composant ou 'all' pour tous
   */
  filterComponents(type) {
    const componentsContainer = document.getElementById(this.componentsContainer);
    if (!componentsContainer) return;
    
    const rows = componentsContainer.querySelectorAll('tr');
    
    if (type === 'all') {
      // Afficher tous les composants
      rows.forEach(row => {
        row.style.display = '';
      });
    } else {
      // Filtrer par type
      rows.forEach(row => {
        const componentType = row.querySelector('td:first-child').textContent;
        if (componentType === this.getComponentTypeLabel(type)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }
  }
  
  /**
   * Affiche une info-bulle pour un composant
   * @param {string} componentId - Identifiant du composant
   */
  showComponentTooltip(componentId) {
    if (!this.options.showTooltips) return;
    
    // Trouver le composant
    const component = this.configurator.currentProject.components.find(c => c.id === componentId);
    if (!component) return;
    
    // Créer ou mettre à jour l'info-bulle
    let tooltip = document.getElementById('component-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'component-tooltip';
      tooltip.className = 'component-tooltip';
      document.body.appendChild(tooltip);
    }
    
    // Contenu de l'info-bulle
    tooltip.innerHTML = `
      <div class="tooltip-header">${component.name}</div>
      <div class="tooltip-content">
        <div><strong>Type:</strong> ${this.getComponentTypeLabel(component.type)}</div>
        <div><strong>Dimensions:</strong> ${this.formatDimensions(component)}</div>
        <div><strong>Matériau:</strong> ${this.getMaterialName(component.materialId)}</div>
        <div><strong>Quantité:</strong> ${component.quantity}</div>
      </div>
    `;
    
    // Positionner l'info-bulle (à adapter selon l'implémentation)
    // Dans une implémentation complète, l'info-bulle suivrait la souris ou serait positionnée près du composant
  }
  
  /**
   * Obtient le nom d'un matériau
   * @param {string} materialId - Identifiant du matériau
   * @return {string} Nom du matériau
   */
  getMaterialName(materialId) {
    if (!materialId) return 'Par défaut';
    
    const material = this.configurator.materialManager.getMaterialById(materialId);
    return material ? material.name : materialId;
  }
  
  /**
   * Formate les dimensions d'un composant
   * @param {Object} component - Composant
   * @return {string} Dimensions formatées
   */
  formatDimensions(component) {
    if (component.type === 'wardrobe_rail') {
      // Pour les tringles, le format est différent
      return `L: ${component.length} mm, Ø: ${component.diameter || component.thickness} mm`;
    }
    
    // Format standard
    return `${component.width} × ${component.length} × ${component.thickness} mm`;
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
  
  /**
   * Obtient le libellé d'un type de composant
   * @param {string} componentType - Type de composant
   * @return {string} Libellé
   */
  getComponentTypeLabel(componentType) {
    const labels = {
      'component': 'Composant',
      'panel': 'Panneau',
      'shelf': 'Étagère',
      'drawer_front': 'Façade tiroir',
      'drawer_side': 'Côté tiroir',
      'drawer_bottom': 'Fond tiroir',
      'drawer_back': 'Dos tiroir',
      'horizontal_separator': 'Séparation H',
      'wardrobe_rail': 'Tringle'
    };
    
    return labels[componentType] || componentType;
  }
  
  /**
   * Obtient le nom d'une position de sous-zone
   * @param {string} position - Position (upper, middle, lower)
   * @return {string} Nom de la position
   */
  getSubZonePositionName(position) {
    const names = {
      'upper': 'Supérieure',
      'middle': 'Centrale',
      'lower': 'Inférieure'
    };
    
    return names[position] || position;
  }
  
  /**
   * Met à jour le coût total affiché
   */
  updateTotalCost() {
    const totalCost = this.configurator.calculateTotalCost();
    const totalCostElement = document.getElementById('total-cost');
    if (totalCostElement) {
      totalCostElement.textContent = `${totalCost.toFixed(2)} €`;
    }
  }
  
  /**
   * Applique un thème
   * @param {string} theme - Thème (light, dark)
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.options.theme = theme;
  }
  
  /**
   * Gère le redimensionnement de la fenêtre
   */
  handleResize() {
    // Ajuster les renderers
    if (this.configurator.renderer3D && typeof this.configurator.renderer3D.resize === 'function') {
      this.configurator.renderer3D.resize();
    }
    
    if (this.configurator.technicalDrawings && typeof this.configurator.technicalDrawings.resize === 'function') {
      this.configurator.technicalDrawings.resize();
    }
  }
  
  /**
   * Affiche une notification
   * @param {string} message - Message à afficher
   * @param {string} type - Type de notification (success, error, warning, info)
   * @param {number} duration - Durée d'affichage en ms (0 pour permanent)
   */
  showNotification(message, type = 'info', duration = 3000) {
    const notificationId = 'notification-' + (++this.lastTooltipId);
    
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.id = notificationId;
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">${message}</div>
      <button class="notification-close">&times;</button>
    `;
    
    // Ajouter au conteneur de notifications (à créer s'il n'existe pas)
    let notificationsContainer = document.getElementById('notifications-container');
    if (!notificationsContainer) {
      notificationsContainer = document.createElement('div');
      notificationsContainer.id = 'notifications-container';
      document.body.appendChild(notificationsContainer);
    }
    
    notificationsContainer.appendChild(notification);
    
    // Gérer la fermeture
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        notification.classList.add('closing');
        setTimeout(() => {
          notification.remove();
        }, 300); // Durée de l'animation de fermeture
      });
    }
    
    // Fermeture automatique
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.classList.add('closing');
          setTimeout(() => {
            notification.remove();
          }, 300);
        }
      }, duration);
    }
    
    return notificationId;
  }
  
  /**
   * Télécharge un fichier
   * @param {Blob} blob - Blob contenant les données
   * @param {string} filename - Nom du fichier
   */
  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Formate une date pour l'affichage
   * @param {Date|string} date - Date à formater
   * @return {string} Date formatée
   */
  formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString(this.options.locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}