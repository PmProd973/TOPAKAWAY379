// src/components/furniture3d/FurnitureDesigner.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box as MuiBox, 
  Typography, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Paper,
  useMediaQuery, 
  useTheme, 
  Divider,
  Tooltip,
  Button,
  Snackbar,
  Alert
} from '@mui/material';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SettingsIcon from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StraightenIcon from '@mui/icons-material/Straighten';
import HelpIcon from '@mui/icons-material/Help';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GridOnIcon from '@mui/icons-material/GridOn';

// Importer le store
import { useFurnitureStore } from './FurnitureDesigner/store/index';
import AuthenticadepFix from './FurnitureDesigner/AuthenticadepFix';
import Scene3D from './FurnitureDesigner/Scene3D';

// Nouveaux composants pour l'interface avec popups
import ToolsSidebar from './FurnitureDesigner/components/ToolsSidebar';
import ConfigDialog from './FurnitureDesigner/components/dialogs/ConfigDialog'; // Gardé pour Settings et Help

// Importer les dialogues spécifiques
import FurnitureV2Dialog from './FurnitureDesigner/components/dialogs/FurnitureV2Dialog';
import RoomDialog from './FurnitureDesigner/components/dialogs/RoomDialog';
import DisplayOptionsDialog from './FurnitureDesigner/components/dialogs/DisplayOptionsDialog';
import FurnitureListDialog from './FurnitureDesigner/components/dialogs/FurnitureListDialog';
import SeparationsDialog from './FurnitureDesigner/components/dialogs/SeparationsDialog';
import HelpDialog from './FurnitureDesigner/components/dialogs/HelpDialog';
import SettingsDialog from './FurnitureDesigner/components/dialogs/SettingsDialog';

// Palette de couleurs pour le thème
const appTheme = {
  primary: "#1976d2", // Bleu principal
  menuBackground: "#1e2433", // Fond sombre pour le menu latéral (comme dans l'image)
  menuActiveBackground: "#233044", // Fond plus clair pour l'élément actif
  menuActiveColor: "#4fc3f7", // Couleur de surbrillance pour l'élément actif
  menuTextColor: "rgba(255, 255, 255, 0.7)", // Texte gris clair pour le menu
  menuTextActiveColor: "#ffffff", // Texte blanc pour l'élément actif
  background: "#ffffff", // Fond blanc pour le contenu principal
  paper: "#ffffff", // Fond blanc pour les composants Paper
  text: {
    primary: "#333333", // Texte principal gris foncé
    secondary: "#757575" // Texte secondaire gris moyen
  },
  divider: "#e0e0e0", // Ligne séparatrice gris clair
  action: {
    active: "#1976d2", // Couleur des actions (boutons, etc.)
    hover: "rgba(25, 118, 210, 0.08)" // Couleur au survol
  }
};

const FurnitureDesigner = ({ currentUser, firestore, userSubscription, onSaveProject, projectId, standaloneMode = false }) => {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(1); // Commencer par l'onglet Liste de meubles (index 1)
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // État pour les dialogues
  const [openDialogs, setOpenDialogs] = useState({
    furnitureV2: false,
    furnitureList: false,
    separations: false,
    room: false,
    display: false,
    settings: false,
    help: false
  });
  
  const [projectData, setProjectData] = useState({
    projectInfo: {
      id: projectId || `furniture_${Date.now()}`,
      name: 'Nouveau projet',
      createdAt: new Date()
    },
    furnitureType: 'Bibliothèque',
    dimensions: {
      width: 1000,
      height: 2000,
      depth: 600
    },
    materials: [],
    components: []
  });
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Récupérer le store de meubles
  const furnitureStore = useFurnitureStore();
  
  // Flag pour suivre si le store a déjà été initialisé
  const storeInitialized = useRef(false);

  // Effet modifié pour l'initialisation du store - exécuté UNE SEULE FOIS
  useEffect(() => {
    if (furnitureStore && !storeInitialized.current) {
      console.log("Initialisation initiale du store furnitureStore");
      
      // Initialiser les utilisateurs et abonnements si disponibles
      if (currentUser) {
        furnitureStore.setUser(currentUser);
      }
      
      if (userSubscription) {
        furnitureStore.setSubscription(userSubscription);
      }
      
      // Initialiser la liste des meubles si cette fonction existe
      if (furnitureStore.initializeFurnitureList) {
        furnitureStore.initializeFurnitureList();
      }
      
      // Utiliser un flag pour éviter les multiples mises à jour
      let needsUpdate = false;
      
      // Initialiser seulement au premier chargement
      // Définir des valeurs par défaut UNIQUEMENT si le store est vide
      if (!furnitureStore.room || furnitureStore.room.width === undefined) {
        try {
          furnitureStore.updateRoomDimensions('width', 4000, false);
          needsUpdate = true;
        } catch (e) {
          console.error("Erreur lors de la mise à jour de la largeur de la pièce:", e);
        }
      }
      
      if (!furnitureStore.room || furnitureStore.room.height === undefined) {
        try {
          furnitureStore.updateRoomDimensions('height', 2500, false);
          needsUpdate = true;
        } catch (e) {
          console.error("Erreur lors de la mise à jour de la hauteur de la pièce:", e);
        }
      }
      
      if (!furnitureStore.room || furnitureStore.room.depth === undefined) {
        try {
          furnitureStore.updateRoomDimensions('depth', 3000, false);
          needsUpdate = true;
        } catch (e) {
          console.error("Erreur lors de la mise à jour de la profondeur de la pièce:", e);
        }
      }
      
      // S'assurer que les options d'affichage sont correctement initialisées
      const displayOptions = furnitureStore.displayOptions || {};
      
      if (displayOptions.showGrid === undefined) {
        try {
          furnitureStore.setDisplayOption('showGrid', true, false);
          needsUpdate = true;
        } catch (e) {
          console.error("Erreur lors de l'initialisation de showGrid:", e);
        }
      }
      
      if (displayOptions.showAxes === undefined) {
        try {
          furnitureStore.setDisplayOption('showAxes', true, false);
          needsUpdate = true;
        } catch (e) {
          console.error("Erreur lors de l'initialisation de showAxes:", e);
        }
      }
      
      if (displayOptions.showDimensions === undefined) {
        try {
          furnitureStore.setDisplayOption('showDimensions', true, false);
          needsUpdate = true;
        } catch (e) {
          console.error("Erreur lors de l'initialisation de showDimensions:", e);
        }
      }
      
      if (displayOptions.showFurnitureDimensions === undefined) {
        try {
          furnitureStore.setDisplayOption('showFurnitureDimensions', false, false); // Désactivé par défaut
          needsUpdate = true;
        } catch (e) {
          console.error("Erreur lors de l'initialisation de showFurnitureDimensions:", e);
        }
      }
      
      if (displayOptions.furnitureOpacity === undefined) {
        try {
          furnitureStore.setDisplayOption('furnitureOpacity', 1.0, false);
          needsUpdate = true;
        } catch (e) {
          console.error("Erreur lors de l'initialisation de furnitureOpacity:", e);
        }
      }
      
      // N'appeler regenerateScene qu'une seule fois si nécessaire
      if (needsUpdate) {
        console.log("Mise à jour nécessaire, régénération de la scène");
        setTimeout(() => {
          try {
            furnitureStore.regenerateScene();
          } catch (e) {
            console.error("Erreur lors de la régénération de la scène:", e);
          }
        }, 200);
      }
      
      // Marquer comme initialisé
      storeInitialized.current = true;
    }
  }, [currentUser, userSubscription]); // Dépendances nécessaires
  
  // Désactiver l'élément authenticadepApp qui cause des problèmes
  useEffect(() => {
    console.log("Application du correctif AuthenticadepFix depuis FurnitureDesigner");
    const cleanup = AuthenticadepFix();
    
    // Réappliquer le correctif après un délai pour s'assurer qu'il fonctionne
    const reapplyTimer = setTimeout(() => {
      AuthenticadepFix();
    }, 2000);
    
    return () => {
      clearTimeout(reapplyTimer);
      if (cleanup) cleanup();
    };
  }, []);
  
  // Gérer la sauvegarde du projet
  const handleSave = async () => {
    console.log("Sauvegarde du projet");
    
    try {
      // Récupérer les données actuelles du store
      const currentStoreData = {
        width: furnitureStore.furniture?.dimensions?.width || 0,
        height: furnitureStore.furniture?.dimensions?.height || 0,
        depth: furnitureStore.furniture?.dimensions?.depth || 0,
        furnitureList: furnitureStore.furnitureList || []
      };
      
      // Mettre à jour les données du projet
      const updatedProjectData = {
        ...projectData,
        dimensions: {
          ...projectData.dimensions,
          ...currentStoreData
        },
        furnitureList: currentStoreData.furnitureList,
        updatedAt: new Date()
      };
      
      // Mettre à jour l'état local
      setProjectData(updatedProjectData);
      
      // Sauvegarder dans Firestore via la fonction parent
      if (onSaveProject) {
        await onSaveProject(updatedProjectData);
        
        // Afficher un message de succès
        setSnackbarMessage('Projet sauvegardé avec succès');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du projet:", error);
      
      // Afficher un message d'erreur
      setSnackbarMessage('Erreur lors de la sauvegarde du projet');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Toggle le menu latéral
  const toggleDrawer = () => {
    console.log(`Toggle du menu: ${drawerOpen} -> ${!drawerOpen}`);
    
    // Mettre à jour l'état
    setDrawerOpen(!drawerOpen);
    
    // Créer un événement personnalisé pour informer Scene3D du changement de menu
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('menuToggled', {
        detail: { 
          isOpen: !drawerOpen,
          timestamp: Date.now()
        }
      }));
      
      console.log("Événement menuToggled émis");
      
      // Forcer une mise à jour additionnelle après l'animation complète
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('menuAnimationComplete', {
          detail: { 
            isOpen: !drawerOpen,
            timestamp: Date.now()
          }
        }));
        
        console.log("Événement menuAnimationComplete émis");
      }, 300); // 300ms pour la durée typique de l'animation
    }, 50);
  };
  
  // Fonctions pour gérer les dialogues
  const handleOpenDialog = (dialogName) => {
    setOpenDialogs(prev => ({
      ...prev,
      [dialogName]: true
    }));
    
    // Informer la scène 3D du changement d'interface
    window.dispatchEvent(new CustomEvent('interfaceChanged', {
      detail: { 
        type: 'dialogOpened',
        dialog: dialogName,
        timestamp: Date.now()
      }
    }));
  };

  const handleCloseDialog = (dialogName) => {
    setOpenDialogs(prev => ({
      ...prev,
      [dialogName]: false
    }));
    
    // Informer la scène 3D du changement d'interface
    window.dispatchEvent(new CustomEvent('interfaceChanged', {
      detail: { 
        type: 'dialogClosed',
        dialog: dialogName,
        timestamp: Date.now()
      }
    }));
  };
  
  // Assurer que le focus reste sur la scène 3D après les interactions avec les menus
  const handleMenuInteraction = () => {
    // Émettre un événement personnalisé pour forcer une mise à jour des étiquettes
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('sceneInteraction', {
        detail: { 
          type: 'menuInteraction',
          timestamp: Date.now()
        }
      }));
    }, 100);
  };
  
  // Configurer un effet pour gérer les ajustements après le redimensionnement
  useEffect(() => {
    const handleWindowResize = () => {
      // Attendre que toutes les animations et recalculs du DOM soient terminés
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('windowResized', {
          detail: {
            timestamp: Date.now(),
            width: window.innerWidth,
            height: window.innerHeight
          }
        }));
      }, 200);
    };
    
    // Ajouter l'écouteur d'événements
    window.addEventListener('resize', handleWindowResize);
    
    // Nettoyage
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);
  
  // Déterminer si les étiquettes doivent être masquées (pour le CSS conditionnel)
  const shouldHideRoomDimensions = furnitureStore.displayOptions?.showDimensions === false;
  const shouldHideFurnitureDimensions = furnitureStore.displayOptions?.showFurnitureDimensions !== true;

  // Fermer le Snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };
  
  // Wrapper pour les boutons désactivés dans les Tooltip
  const TooltipWrapper = ({ children, title }) => {
    if (!children.props.disabled) {
      return <Tooltip title={title}>{children}</Tooltip>;
    }
    
    return (
      <Tooltip title={title}>
        <span>
          {children}
        </span>
      </Tooltip>
    );
  };
  
  // Obtenir les dimensions actuelles pour la barre d'état
  const dimensions = {
    width: furnitureStore.furniture?.dimensions?.width || 0,
    height: furnitureStore.furniture?.dimensions?.height || 0,
    depth: furnitureStore.furniture?.dimensions?.depth || 0
  };

  // Nombre de meubles dans la liste
  const furnitureCount = furnitureStore.furnitureList?.length || 0;
  
  return (
    <MuiBox 
      sx={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        bgcolor: appTheme.background,
        color: appTheme.text.primary,
        overflow: 'hidden' // Évite les barres de défilement inutiles
      }}
      onClick={handleMenuInteraction}
    >
      {/* Barre de titre principale */}
      <AppBar 
        position="static" 
        sx={{ 
          bgcolor: appTheme.primary,
          boxShadow: 1,
          zIndex: 1201 // S'assurer que la barre est au-dessus du drawer
        }}
      >
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'white' }}>
            OptiCoupe 3D
          </Typography>
          
          <Tooltip title="Sauvegarder">
            <IconButton color="inherit" onClick={handleSave}>
              <SaveIcon />
            </IconButton>
          </Tooltip>
          
          <TooltipWrapper title="Annuler">
            <IconButton 
              color="inherit" 
              onClick={furnitureStore.canUndo ? furnitureStore.undo : undefined} 
              disabled={!furnitureStore.canUndo || !furnitureStore.canUndo()}
            >
              <UndoIcon />
            </IconButton>
          </TooltipWrapper>
          
          <TooltipWrapper title="Refaire">
            <IconButton 
              color="inherit" 
              onClick={furnitureStore.canRedo ? furnitureStore.redo : undefined} 
              disabled={!furnitureStore.canRedo || !furnitureStore.canRedo()}
            >
              <RedoIcon />
            </IconButton>
          </TooltipWrapper>
          
          <Tooltip title="Aide">
            <IconButton color="inherit" onClick={() => handleOpenDialog('help')}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      {/* Contenu principal avec interface améliorée */}
      <MuiBox sx={{ 
        display: 'flex', 
        flexGrow: 1, 
        overflow: 'hidden', 
        position: 'relative' 
      }}>
        {/* Barre d'outils latérale */}
        <ToolsSidebar
          collapsed={!drawerOpen}
          onOpenFurnitureV2={() => handleOpenDialog('furnitureV2')}
          onOpenFurnitureList={() => handleOpenDialog('furnitureList')}
          onOpenSeparations={() => handleOpenDialog('separations')}
          onOpenRoom={() => handleOpenDialog('room')}
          onOpenDisplay={() => handleOpenDialog('display')}
          onOpenHelp={() => handleOpenDialog('help')}
          onOpenSettings={() => handleOpenDialog('settings')}
        />
        
        {/* Zone d'affichage 3D */}
        <MuiBox sx={{ 
          flexGrow: 1, 
          position: 'relative',
          zIndex: 1,
          className: 'scene-container'
        }}>
          <Scene3D darkMode={false} />
        </MuiBox>
      </MuiBox>
      
      {/* Barre de statut */}
      <Paper sx={{ 
        py: 0.5, 
        px: 2, 
        display: 'flex', 
        justifyContent: 'space-between',
        borderTop: `1px solid ${appTheme.divider}`,
        backgroundColor: 'white'
      }}>
        <Typography variant="body2" color="text.secondary">
          {furnitureCount} meuble{furnitureCount > 1 ? 's' : ''}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {dimensions.width} × {dimensions.height} × {dimensions.depth} mm
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Vue: Isométrique
        </Typography>
      </Paper>
      
      {/* Popups de configuration - Utilisation des dialogues spécifiques */}
      <FurnitureV2Dialog 
        open={openDialogs.furnitureV2} 
        onClose={() => handleCloseDialog('furnitureV2')} 
      />
      
      <FurnitureListDialog 
        open={openDialogs.furnitureList} 
        onClose={() => handleCloseDialog('furnitureList')} 
      />
      
      <SeparationsDialog 
        open={openDialogs.separations} 
        onClose={() => handleCloseDialog('separations')} 
      />
      
      <RoomDialog 
        open={openDialogs.room} 
        onClose={() => handleCloseDialog('room')} 
      />
      
      <DisplayOptionsDialog 
        open={openDialogs.display} 
        onClose={() => handleCloseDialog('display')} 
      />
      
      {/* Utilisation des dialogues spécifiques pour les paramètres et l'aide */}
<SettingsDialog
  open={openDialogs.settings}
  onClose={() => handleCloseDialog('settings')}
/>

<HelpDialog
  open={openDialogs.help}
  onClose={() => handleCloseDialog('help')}
/>
      
      {/* Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
      {/* Style global pour corriger les problèmes d'affichage */}
      <style>
        {`
          #authenticadepApp {
            display: none !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
            position: absolute !important;
            z-index: -9999 !important;
          }
          
          canvas {
            width: 100% !important;
            height: 100% !important;
            outline: none;
          }
          
          .scene-container {
            z-index: 5 !important;
            position: relative !important;
          }
          
          .dimension-labels-container {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            pointer-events: none !important;
            z-index: 10 !important;
            overflow: visible !important;
          }
          
          .dimension-label {
            pointer-events: none !important;
            font-family: Arial, sans-serif !important;
            font-size: 12px !important;
            color: white !important;
            background-color: rgba(0, 0, 0, 0.7) !important;
            padding: 3px 6px !important;
            border-radius: 3px !important;
            white-space: nowrap !important;
            text-align: center !important;
            z-index: 20 !important;
            transition: opacity 0.3s ease !important;
            opacity: 1 !important;
            display: block !important;
            visibility: visible !important;
            box-shadow: 0 0 3px rgba(0,0,0,0.3) !important;
            font-weight: bold !important;
          }
          
          /* Style spécifique pour les dimensions de mur */
          .dimension-label.room-dimension {
            border-left: 3px solid #2196F3 !important;
          }
          
          /* Style spécifique pour les dimensions de meuble */
          .dimension-label.furniture-dimension {
            border-left: 3px solid #4CAF50 !important; 
          }
          
          /* Style conditionnel pour masquer/afficher les étiquettes de dimension des murs */
          ${shouldHideRoomDimensions ? `
            .dimension-label.room-dimension {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
            }
          ` : ''}
          
          /* Style conditionnel pour masquer/afficher les étiquettes de dimension du meuble */
          ${shouldHideFurnitureDimensions ? `
            .dimension-label.furniture-dimension {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
            }
          ` : ''}
          
          /* AMÉLIORATIONS CSS POUR L'AFFICHAGE VERTICAL DES CHAMPS */
          
          /* 1. Container pour les champs de dimension en vertical */
          .dimension-field-container {
            display: flex;
            flex-direction: column !important;
            margin-bottom: 16px !important;
            width: 100% !important;
          }
          
          /* 2. Style pour les sections (titres bleus avec séparateurs) */
          .section-title {
            color: #1976d2 !important;
            font-weight: 500 !important;
            font-size: 1rem !important;
            margin-top: 16px !important;
            margin-bottom: 8px !important;
            padding-bottom: 4px !important;
            border-bottom: 1px solid #e0e0e0 !important;
          }
          
          /* 3. Amélioration des champs de texte */
          .MuiTextField-root {
            width: 100% !important;
            min-width: 90px !important;
            margin-bottom: 12px !important;
          }
          
          .MuiInputBase-root {
            background-color: white !important;
            padding: 8px 6px !important;
          }
          
          .MuiInputBase-input {
            padding: 6px 4px !important;
            height: auto !important;
          }
          
          /* 4. Amélioration des étiquettes */
          .MuiInputLabel-root, 
          .MuiFormLabel-root {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: clip !important;
            display: block !important;
            line-height: 1.2 !important;
            min-height: 1.5em !important;
            font-weight: 500 !important;
            color: #444444 !important;
            margin-bottom: 4px !important;
          }
          
          /* 5. Unités (mm) */
          .MuiInputAdornment-root {
            padding-left: 4px !important;
            flex-shrink: 0 !important;
            color: #666666 !important;
            font-size: 0.85rem !important;
          }
          
          /* 6. Cases à cocher */
          .MuiFormControlLabel-root {
            margin-left: -9px !important;
            margin-bottom: 8px !important;
            display: block !important;
          }
          
          .MuiFormControlLabel-label {
            white-space: normal !important;
            line-height: 1.2 !important;
            font-size: 0.875rem !important;
          }
          
          /* 7. Container pour les sections */
          .form-section {
            margin-bottom: 24px !important;
            padding-bottom: 8px !important;
          }
          
          /* 8. Suppression des marges de grille pour les remplacer par notre layout vertical */
          .MuiGrid-container {
            margin-bottom: 0 !important;
          }
          
          .MuiGrid-item {
            padding: 0 !important;
          }
          
          /* 9. Gestion des inputs désactivés */
          .Mui-disabled {
            opacity: 0.7 !important;
            background-color: #f5f5f5 !important;
          }
          
          /* 10. Style pour le papier de fond des sections */
          .section-paper {
            padding: 16px !important;
            margin-bottom: 16px !important;
          }
        `}
      </style>
    </MuiBox>
  );
};

export default FurnitureDesigner;