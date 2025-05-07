// src/ui/LoadingScreen.js

/**
 * Gère l'écran de chargement
 */
export class LoadingScreen {
  constructor() {
    this.loadingElement = null;
    this.mainElement = null;
    this.spinnerElement = null;
    this.messageElement = null;
  }

  /**
   * Initialise l'écran de chargement
   */
  initialize() {
    console.log("Initialisation de l'écran de chargement");
    
    // Créer l'élément de chargement s'il n'existe pas
    if (!this.loadingElement) {
      this.loadingElement = document.getElementById('loading-screen');
      
      // S'il n'existe pas dans le HTML, le créer dynamiquement
      if (!this.loadingElement) {
        this.loadingElement = document.createElement('div');
        this.loadingElement.id = 'loading-screen';
        this.loadingElement.innerHTML = `
          <div class="loading-content">
            <h1>Configurateur de Dressing</h1>
            <div class="spinner"></div>
            <p class="loading-message">Chargement en cours...</p>
          </div>
        `;
        document.body.appendChild(this.loadingElement);
      }
      
      // Récupérer les éléments internes
      this.spinnerElement = this.loadingElement.querySelector('.spinner');
      this.messageElement = this.loadingElement.querySelector('.loading-message');
    }
    
    // Référencer le conteneur principal
    this.mainElement = document.getElementById('main-container');
    if (!this.mainElement) {
      console.warn("Conteneur principal non trouvé lors de l'initialisation de l'écran de chargement");
    } else {
      this.mainElement.style.display = 'none';
    }
    
    // Assurer que l'écran de chargement est visible
    this.show();
    
    console.log('Écran de chargement initialisé');
  }
  
  /**
   * Affiche l'écran de chargement
   */
  show() {
    if (this.loadingElement) {
      this.loadingElement.style.display = 'flex';
      this.loadingElement.style.opacity = '1';
      this.loadingElement.classList.remove('fade-out');
    }
    
    if (this.mainElement) {
      this.mainElement.style.display = 'none';
    }
  }
  
  /**
   * Cache l'écran de chargement et affiche l'interface principale
   */
  hide() {
    console.log('Tentative de masquer l\'écran de chargement');
    
    if (this.loadingElement) {
      // Ajouter une classe pour l'animation de transition
      this.loadingElement.classList.add('fade-out');
      
      // Attendre la fin de l'animation avant de cacher complètement
      setTimeout(() => {
        if (this.loadingElement) {
          this.loadingElement.style.display = 'none';
          console.log('Écran de chargement masqué');
        }
      }, 500);
    } else {
      console.warn('Élément d\'écran de chargement non trouvé lors de la tentative de masquage');
    }
    
    // Méthode principale pour afficher le conteneur principal
    this.showMainContainer();
  }
  
  /**
   * Méthode dédiée pour afficher le conteneur principal
   * Utilise plusieurs stratégies de secours
   */
  showMainContainer() {
    // Stratégie 1: Utiliser la référence stockée
    if (this.mainElement) {
      this.mainElement.style.display = 'block';
      console.log('Conteneur principal affiché (méthode principale)');
      return;
    }
    
    // Stratégie 2: Essayer de trouver à nouveau l'élément
    this.mainElement = document.getElementById('main-container');
    if (this.mainElement) {
      this.mainElement.style.display = 'block';
      console.log('Conteneur principal affiché (après nouvelle recherche)');
      return;
    }
    
    // Stratégie 3: Rechercher par sélecteur plus générique
    const possibleContainers = document.querySelectorAll('div[id$="container"], main, .content, .main-content');
    if (possibleContainers.length > 0) {
      for (const container of possibleContainers) {
        if (container.id !== 'loading-screen' && container.id !== 'notifications-container') {
          container.style.display = 'block';
          console.log(`Conteneur alternatif affiché: ${container.id || container.className}`);
          return;
        }
      }
    }
    
    // Stratégie 4: Dernier recours - afficher tous les div enfants directs du body
    console.warn('Élément de conteneur principal non trouvé lors de la tentative d\'affichage. Activation du mécanisme de secours.');
    document.querySelectorAll('body > div').forEach(div => {
      if (div.id !== 'loading-screen' && div.id !== 'notifications-container') {
        div.style.display = 'block';
        console.log('Forçage de l\'affichage de: ' + (div.id || 'div sans id'));
      }
    });
  }
  
  /**
   * Met à jour le message de chargement
   * @param {string} message - Message à afficher
   */
  updateMessage(message) {
    if (this.messageElement) {
      this.messageElement.textContent = message;
      console.log('Message de chargement mis à jour: ' + message);
    } else if (this.loadingElement) {
      const messageElement = this.loadingElement.querySelector('.loading-message');
      if (messageElement) {
        messageElement.textContent = message;
        this.messageElement = messageElement;
        console.log('Message de chargement mis à jour: ' + message);
      }
    }
  }
  
  /**
   * Ajoute un bouton pour réessayer
   * @param {Function} onRetry - Fonction à exécuter lors du clic sur le bouton
   */
  addRetryButton(onRetry) {
    if (!this.loadingElement) return;
    
    // Vérifier si le bouton existe déjà
    if (this.loadingElement.querySelector('.retry-button')) return;
    
    const content = this.loadingElement.querySelector('.loading-content');
    if (!content) return;
    
    // Masquer le spinner
    if (this.spinnerElement) {
      this.spinnerElement.style.display = 'none';
    }
    
    // Créer le bouton
    const button = document.createElement('button');
    button.className = 'retry-button';
    button.textContent = 'Réessayer';
    button.style.cssText = `
      padding: 10px 20px;
      margin-top: 20px;
      background-color: white;
      color: var(--primary-color, #4A90E2);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    `;
    
    button.addEventListener('click', onRetry);
    content.appendChild(button);
    
    // Ajouter également un bouton pour forcer l'affichage (en mode debug)
    const debugButton = document.createElement('button');
    debugButton.className = 'debug-button';
    debugButton.textContent = 'Forcer l\'affichage';
    debugButton.style.cssText = `
      padding: 10px 20px;
      margin-top: 10px;
      background-color: rgba(255, 255, 255, 0.3);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8em;
    `;
    
    debugButton.addEventListener('click', () => {
      this.forceDisplay();
    });
    
    content.appendChild(debugButton);
  }
  
  /**
   * Force l'affichage de l'interface principale
   */
  forceDisplay() {
    if (this.loadingElement) {
      this.loadingElement.style.display = 'none';
    }
    
    // Essayer toutes les stratégies pour afficher le contenu
    this.showMainContainer();
    
    // Stratégie supplémentaire: rendre tous les enfants directs du body visibles
    document.body.childNodes.forEach(node => {
      if (node.nodeType === 1 && node.id !== 'loading-screen') { // 1 = ELEMENT_NODE
        node.style.display = 'block';
      }
    });
    
    console.log('Affichage forcé manuellement');
  }
}