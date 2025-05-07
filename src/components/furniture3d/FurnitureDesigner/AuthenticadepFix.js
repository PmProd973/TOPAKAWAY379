/**
 * Utilitaire pour désactiver l'élément authenticadepApp qui interfère avec la scène 3D
 * @returns {Function} Fonction de nettoyage pour useEffect
 */

const AuthenticadepFix = () => {
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
    
    // Recherche par attributs et dimensions (1131px x 954px)
    const potentialOverlays = document.querySelectorAll('div[style*="position: fixed"], div[style*="position:fixed"]');
    let found = false;
    
    potentialOverlays.forEach(element => {
      const rect = element.getBoundingClientRect();
      // Si l'élément a une taille proche de celle rapportée (1131px x 954px)
      if ((rect.width > 1000 && rect.width < 1200) && (rect.height > 900 && rect.height < 1000)) {
        console.log('Overlay potentiel trouvé et désactivé:', element);
        element.style.display = 'none';
        element.style.height = '0';
        element.style.width = '0';
        element.style.overflow = 'hidden';
        element.style.position = 'absolute';
        element.style.zIndex = '-9999';
        found = true;
      }
    });
    
    return found;
  };

  // Appeler immédiatement
  const found = disableOverlay();
  
  // Réessayer plusieurs fois en cas d'échec immédiat
  if (!found) {
    let attempts = 0;
    const maxAttempts = 5;
    
    const attemptInterval = setInterval(() => {
      attempts++;
      if (disableOverlay() || attempts >= maxAttempts) {
        clearInterval(attemptInterval);
      }
    }, 1000); // Réessayer chaque seconde
    
    // Nettoyer l'intervalle si le composant est démonté
    return () => clearInterval(attemptInterval);
  }
  
  // Ajouter un style global pour s'assurer que l'élément reste désactivé
  const style = document.createElement('style');
  style.innerHTML = `
    #authenticadepApp {
      display: none !important;
      height: 0 !important;
      width: 0 !important;
      overflow: hidden !important;
      position: absolute !important;
      z-index: -9999 !important;
    }
    
    /* Assurez-vous que rien ne vient au-dessus de la scène 3D */
    canvas {
      z-index: 1 !important;
    }
  `;
  document.head.appendChild(style);
  
  // Fonction de nettoyage pour useEffect
  return () => {
    document.head.removeChild(style);
  };
};

export default AuthenticadepFix;