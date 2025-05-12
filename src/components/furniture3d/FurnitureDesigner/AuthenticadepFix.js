/**
 * Utilitaire pour désactiver l'élément authenticadepApp qui interfère avec la scène 3D
 * @returns {Function} Fonction de nettoyage pour useEffect
 */

const AuthenticadepFix = () => {
  console.log("Application du correctif AuthenticadepFix");
  
  // Fonction pour désactiver l'élément problématique
  const disableOverlay = () => {
    // Recherche de l'élément par ID
    const authenticadepApp = document.getElementById('authenticadepApp');
    if (authenticadepApp) {
      console.log('authenticadepApp trouvé et désactivé');
      // Désactiver l'élément en le cachant et en réduisant sa taille
      authenticadepApp.style.display = 'none';
      authenticadepApp.style.height = '0';
      authenticadepApp.style.width = '0';
      authenticadepApp.style.overflow = 'hidden';
      authenticadepApp.style.position = 'absolute';
      authenticadepApp.style.zIndex = '-9999';
      return true;
    }
    
    // Recherche plus large pour tous les éléments fixed qui pourraient interférer
    // basé sur les attributs et dimensions (1131px x 954px)
    const potentialOverlays = document.querySelectorAll(
      'div[style*="position: fixed"], div[style*="position:fixed"], div[style*="z-index: 9999"], div[style*="z-index:9999"]'
    );
    
    let found = false;
    
    potentialOverlays.forEach(element => {
      // Vérifier si l'élément est visible et potentiellement intrusif
      const styles = window.getComputedStyle(element);
      if (styles.display !== 'none' && styles.visibility !== 'hidden') {
        const rect = element.getBoundingClientRect();
        
        // Si l'élément est grand et positionné de manière à couvrir l'interface
        if ((rect.width > 600 && rect.height > 500) || 
            parseInt(styles.zIndex, 10) > 1000) {
          console.log('Overlay potentiel trouvé et désactivé:', element);
          element.style.display = 'none';
          element.style.height = '0';
          element.style.width = '0';
          element.style.overflow = 'hidden';
          element.style.position = 'absolute';
          element.style.zIndex = '-9999';
          found = true;
        }
      }
    });
    
    return found;
  };

  // Appeler immédiatement
  const found = disableOverlay();
  
  // Réessayer plusieurs fois pour s'assurer que l'élément est désactivé même s'il apparaît plus tard
  let attempts = 0;
  const maxAttempts = 10; // Augmenté pour plus de fiabilité
  
  const attemptInterval = setInterval(() => {
    attempts++;
    console.log(`Tentative ${attempts}/${maxAttempts} de désactivation d'authenticadepApp`);
    if (disableOverlay() || attempts >= maxAttempts) {
      clearInterval(attemptInterval);
    }
  }, 500); // Plus fréquent pour une meilleure efficacité
  
  // Ajouter un style global pour s'assurer que l'élément reste désactivé
  const style = document.createElement('style');
  style.innerHTML = `
    #authenticadepApp, 
    div[id*="authenticadep"],
    div[class*="authenticadep"] {
      display: none !important;
      height: 0 !important;
      width: 0 !important;
      overflow: hidden !important;
      position: absolute !important;
      z-index: -9999 !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    
    /* S'assurer que rien ne vient au-dessus de la scène 3D */
    canvas {
      z-index: 10 !important;
      position: relative !important;
    }
    
    /* Garantir que le conteneur parent est visible */
    .scene-container, 
    div[class*="scene-container"],
    div[id*="scene-container"] {
      z-index: 5 !important;
      position: relative !important;
      overflow: hidden !important;
    }
  `;
  document.head.appendChild(style);
  
  // Observer le DOM pour détecter si authenticadepApp est ajouté dynamiquement
  let observer;
  try {
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          disableOverlay();
        }
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } catch (error) {
    console.warn("MutationObserver non supporté, fallback:", error);
  }
  
  // Fonction de nettoyage pour useEffect
  return () => {
    clearInterval(attemptInterval);
    if (observer) {
      observer.disconnect();
    }
    try {
      document.head.removeChild(style);
    } catch (error) {
      console.error("Erreur lors du nettoyage du style:", error);
    }
  };
};

export default AuthenticadepFix;