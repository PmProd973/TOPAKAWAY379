// src/components/furniture3d/FurnitureDesigner/Scene3D.js
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { useFurnitureStore } from './store/index';

// Objets globaux pour éviter les re-rendus
let sceneInitialized = false;
let sceneRef = null;
let cameraRef = null;
let rendererRef = null;
let labelRendererRef = null;
let controlsRef = null;
let animationFrameId = null;
let hasGeneratedScene = false; // Drapeau pour éviter les régénérations multiples
let dimensionsGroup = null; // Groupe pour les lignes de dimension
let axesHelper = null; // Référence à l'helper des axes
let furnitureGroups = {}; // Stockage de références aux groupes de meubles par ID

// Fonction utilitaire pour libérer la mémoire des objets 3D
const disposeObject = (obj) => {
  if (obj.geometry) {
    obj.geometry.dispose();
  }

  if (obj.material) {
    if (Array.isArray(obj.material)) {
      obj.material.forEach(material => material.dispose());
    } else {
      obj.material.dispose();
    }
  }

  if (obj.children && obj.children.length > 0) {
    obj.children.forEach(child => disposeObject(child));
  }
};

const Scene3D = ({ darkMode = false }) => {
  console.log('Scene3D component initialized', Date.now());
  const containerRef = useRef(null);
  
  // Récupérer le store complet
  const furnitureStore = useFurnitureStore();
  
  // Fonction pour forcer la mise à jour des étiquettes
  const forceLabelsUpdate = () => {
    if (labelRendererRef && containerRef.current && sceneRef && cameraRef) {
      // Vérifier les deux options de dimensions
      const showRoomDimensions = furnitureStore.displayOptions?.showDimensions !== false;
      const showFurnitureDimensions = furnitureStore.displayOptions?.showFurnitureDimensions === true;
      
      // Redimensionner explicitement
      labelRendererRef.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
      
      // Forcer un rendu
      labelRendererRef.render(sceneRef, cameraRef);
      
      // S'assurer que les dimensions du bon type sont correctement visibles ou masquées
      const dimensionLabels = document.querySelectorAll('.dimension-label');
      dimensionLabels.forEach(label => {
        const dimensionType = label.getAttribute('data-dimension-type') || 'room';
        
        if (dimensionType === 'room') {
          // Étiquettes de dimensions de mur
          label.style.display = showRoomDimensions ? 'block' : 'none';
          label.style.visibility = showRoomDimensions ? 'visible' : 'hidden';
          label.style.opacity = showRoomDimensions ? '1' : '0';
        } else if (dimensionType === 'furniture') {
          // Étiquettes de dimensions de meuble
          label.style.display = showFurnitureDimensions ? 'block' : 'none';
          label.style.visibility = showFurnitureDimensions ? 'visible' : 'hidden';
          label.style.opacity = showFurnitureDimensions ? '1' : '0';
        }
      });
      
      // S'assurer que le groupe de dimensions a la bonne visibilité
      if (dimensionsGroup) {
        dimensionsGroup.traverse((object) => {
          if (object.userData && object.userData.dimensionType) {
            if (object.userData.dimensionType === 'room') {
              // Dimensions de mur
              object.visible = showRoomDimensions;
            } else if (object.userData.dimensionType === 'furniture') {
              // Dimensions de meuble
              object.visible = showFurnitureDimensions;
            }
          }
        });
      }
    }
  };
  
  // Fonction pour créer une ligne de dimension avec son étiquette
  const createDimensionLine = (dimensionLine) => {
    // Déterminer le type de dimension et sa visibilité
    const dimensionType = dimensionLine.dimensionType || 'room'; // Par défaut 'room'
    const showRoomDimensions = furnitureStore.displayOptions?.showDimensions !== false;
    const showFurnitureDimensions = furnitureStore.displayOptions?.showFurnitureDimensions === true;
    
    // Déterminer si cette dimension devrait être visible
    let isVisible = false;
    if (dimensionType === 'room') {
      isVisible = showRoomDimensions;
    } else if (dimensionType === 'furniture') {
      isVisible = showFurnitureDimensions;
    }
    
    // Créer le matériau pour la ligne
    const material = new THREE.LineBasicMaterial({ 
      color: dimensionLine.color || 0x2196F3,
      linewidth: 2
    });
    
    // Créer la géométrie de la ligne
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...dimensionLine.points[0]),
      new THREE.Vector3(...dimensionLine.points[1])
    ]);
    
    // Créer la ligne
    const line = new THREE.Line(geometry, material);
    line.userData.id = dimensionLine.id;
    line.userData.type = 'dimensionLine';
    line.userData.dimensionType = dimensionType; // Stocker le type de dimension
    line.renderOrder = 10; // Ordre de rendu élevé pour s'assurer qu'il est au-dessus
    line.visible = isVisible; // Initialiser la visibilité basée sur les options
    
    // Ajouter l'étiquette si nécessaire
    if (dimensionLine.showLabel) {
      // Calculer la position de l'étiquette
      const midPoint = new THREE.Vector3(
        (dimensionLine.points[0][0] + dimensionLine.points[1][0]) / 2,
        (dimensionLine.points[0][1] + dimensionLine.points[1][1]) / 2,
        (dimensionLine.points[0][2] + dimensionLine.points[1][2]) / 2
      );
      
      // Créer un conteneur HTML pour le texte
      const labelDiv = document.createElement('div');
      labelDiv.className = `dimension-label ${dimensionType}-dimension`; // Ajouter une classe pour le type
      labelDiv.textContent = `${dimensionLine.value} ${dimensionLine.unit}`;
      labelDiv.style.color = 'white';
      labelDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      labelDiv.style.padding = '3px 6px';
      labelDiv.style.borderRadius = '3px';
      labelDiv.style.fontSize = '12px';
      labelDiv.style.fontWeight = 'bold';
      labelDiv.style.boxShadow = '0 0 3px rgba(0,0,0,0.3)';
      labelDiv.style.opacity = isVisible ? '1' : '0';
      labelDiv.style.visibility = isVisible ? 'visible' : 'hidden';
      labelDiv.style.display = isVisible ? 'block' : 'none';
      
      // Ajouter un attribut data pour le type de dimension
      labelDiv.setAttribute('data-dimension-type', dimensionType);
      
      // Créer un objet CSS2DObject pour l'étiquette
      const label = new CSS2DObject(labelDiv);
      label.position.copy(midPoint);
      label.visible = isVisible;
      
      // Ajouter du décalage selon la position spécifiée
      const offset = 0.2;
      switch (dimensionLine.labelPosition) {
        case 'top':
          label.position.y += offset;
          break;
        case 'bottom':
          label.position.y -= offset;
          break;
        case 'left':
          label.position.x -= offset;
          break;
        case 'right':
          label.position.x += offset;
          break;
      }
      
      // Ajouter l'étiquette à la ligne
      line.add(label);
    }
    
    return line;
  };
  
  // Ajouter un observateur de mutations pour s'assurer que les étiquettes restent visibles
  const setupMutationObserver = () => {
    if (!window.MutationObserver) return null;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          // Force un redimensionnement du renderer CSS2D pour s'assurer qu'il reste aligné
          if (labelRendererRef && containerRef.current) {
            labelRendererRef.setSize(
              containerRef.current.clientWidth,
              containerRef.current.clientHeight
            );
          }
        }
      });
    });
    
    // Observer les changements dans le parent du conteneur
    if (containerRef.current && containerRef.current.parentElement) {
      observer.observe(containerRef.current.parentElement, {
        childList: true,
        attributes: true,
        subtree: true,
        attributeFilter: ['style', 'class']
      });
    }
    
    return observer;
  };
  
  // Initialisation de la scène - une seule fois
  useEffect(() => {
    console.log('Scene3D useEffect triggered', Date.now());
    
    // Réinitialiser les états si le composant est démonté puis remonté
    if (containerRef.current && sceneInitialized && !sceneRef) {
      sceneInitialized = false;
    }
    
    if (!containerRef.current || sceneInitialized) return;
    
    console.log("Initialisation de la scène 3D");
    
    // Définir la couleur de fond en fonction du mode
    const bgColor = darkMode ? '#121212' : '#f0f0f0';
    
    // Créer la scène
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);
    sceneRef = scene;
    
    // Créer le groupe pour les arêtes en mode conceptuel
    scene.userData.edgesGroup = new THREE.Group();
    scene.userData.edgesGroup.name = "edgesGroup";
    scene.userData.edgesGroup.visible = false; // Par défaut invisible
    scene.add(scene.userData.edgesGroup);
    
    // Créer la caméra
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 5, 0);
    cameraRef = camera;
    
    // Créer le renderer avec de meilleures options
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Ombres plus douces
    renderer.setClearColor(bgColor, 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef = renderer;
    
    // Créer le renderer CSS2D pour les étiquettes
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    labelRenderer.domElement.style.zIndex = '10'; // Augmenter le z-index
    // Ajouter une classe pour plus de contrôle via CSS
    labelRenderer.domElement.className = 'dimension-labels-container';
    containerRef.current.appendChild(labelRenderer.domElement);
    labelRendererRef = labelRenderer;
    
    // Ajouter le style CSS pour les étiquettes de dimension
    const style = document.createElement('style');
    style.innerHTML = `
      .dimension-labels-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
        overflow: visible;
      }
      
      .dimension-label {
        pointer-events: none;
        font-family: Arial, sans-serif;
        font-size: 12px;
        color: white;
        background-color: rgba(0, 0, 0, 0.6);
        padding: 2px 5px;
        border-radius: 3px;
        white-space: nowrap;
        text-align: center;
        z-index: 20;
        transition: opacity 0.3s ease;
        opacity: 1 !important;
        display: block !important;
        visibility: visible !important;
      }
      
      /* Styles spécifiques pour les types d'étiquettes */
      .dimension-label.room-dimension {
        border-left: 3px solid #2196F3;
      }
      
      .dimension-label.furniture-dimension {
        border-left: 3px solid #4CAF50;
      }
      
      /* Style pour masquer les étiquettes quand showDimensions est désactivé */
      body.hide-room-dimensions .dimension-label.room-dimension {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      
      /* Style pour masquer les étiquettes quand showFurnitureDimensions est désactivé */
      body.hide-furniture-dimensions .dimension-label.furniture-dimension {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
    `;
    document.head.appendChild(style);
    
    // Ajouter les contrôles - AMÉLIORÉ POUR RÉSOUDRE LE PROBLÈME DE FIXITÉ
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enablePan = true;        // Assurer que le déplacement est activé
    controls.enableRotate = true;     // Assurer que la rotation est activée
    controls.enableZoom = true;       // Assurer que le zoom est activé
    controls.screenSpacePanning = true;
    controls.minDistance = 2;         // Distance minimale de zoom
    controls.maxDistance = 50;        // Distance maximale de zoom
    controls.rotateSpeed = 0.7;       // Vitesse de rotation
    controls.zoomSpeed = 1.2;         // Vitesse de zoom
    controls.panSpeed = 0.8;          // Vitesse de déplacement
    controlsRef = controls;
    
    // Ajouter des écouteurs d'événements pour le feedback visuel du curseur
    const handleMouseDown = () => {
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
      }
    };

    const handleMouseUp = () => {
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grab';
      }
    };

    // Ajouter des écouteurs directement au DOM element
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mouseleave', handleMouseUp);
    
    // Ajouter une lumière ambiante
    const ambientLight = new THREE.AmbientLight(0xffffff, darkMode ? 0.3 : 0.5);
    scene.add(ambientLight);
    
    // Ajouter une lumière directionnelle
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Ajouter une seconde lumière pour le mode sombre
    if (darkMode) {
      const secondaryLight = new THREE.DirectionalLight(0xaaaaff, 0.5);
      secondaryLight.position.set(-5, 5, -5);
      scene.add(secondaryLight);
    }
    
    // Ajouter une grille - Mais seulement si l'option est activée
    if (furnitureStore.displayOptions?.showGrid !== false) {
      console.log("Création de la grille initiale");
      const gridHelper = new THREE.GridHelper(20, 20);
      // Modifications pour mieux positionner la grille
      gridHelper.position.y = -0.01; // Maintenir sous le sol
      gridHelper.renderOrder = -1; // Très important: rendre la grille AVANT les autres objets
      gridHelper.material.opacity = darkMode ? 0.3 : 0.5; // Rendre la grille semi-transparente
      gridHelper.material.transparent = true; // Activer la transparence pour la grille
      gridHelper.name = "gridHelper"; // Donner un nom pour faciliter la recherche
      scene.add(gridHelper);
    }
    
    // Ajouter des axes - Mais seulement si l'option est activée
    if (furnitureStore.displayOptions?.showAxes !== false) {
      console.log("Création des axes initiaux");
      axesHelper = new THREE.AxesHelper(10);
      axesHelper.name = "axesHelper";
      axesHelper.position.set(0, 0, 0);
      scene.add(axesHelper);
    }
    
    // Créer le groupe pour les lignes de dimension
    dimensionsGroup = new THREE.Group();
    dimensionsGroup.name = 'dimensions';
    // La visibilité par défaut peut être true, car les objets à l'intérieur auront leur propre visibilité
    scene.add(dimensionsGroup);
    
    // Configurer l'observateur de mutations
    const mutationObserver = setupMutationObserver();
    
    // Fonction d'animation - CRUCIAL POUR LES CONTRÔLES INTERACTIFS
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Cette ligne est essentielle pour que les contrôles fonctionnent
      if (controlsRef) {
        controlsRef.update();
      }
      
      if (rendererRef && sceneRef && cameraRef) {
        rendererRef.render(sceneRef, cameraRef);
        
        // Rendu des étiquettes CSS2D
        if (labelRendererRef) {
          labelRendererRef.render(sceneRef, cameraRef);
        }
      }
    };
    
    // Démarrer l'animation immédiatement
    animate();
    
    // Marquer comme initialisé
    sceneInitialized = true;
    
    // Définir un intervalle pour mettre à jour périodiquement les étiquettes
    const labelsUpdateInterval = setInterval(forceLabelsUpdate, 500);
    
    // Fonction de redimensionnement améliorée
    const handleResize = () => {
      if (!containerRef.current || !cameraRef || !rendererRef) return;
      
      console.log("Redimensionnement de la scène 3D");
      
      // Vérifier si les dimensions ont réellement changé
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      // Éviter les redimensionnements inutiles
      if (rendererRef.domElement.width === width * window.devicePixelRatio && 
          rendererRef.domElement.height === height * window.devicePixelRatio) {
        return;
      }
      
      // Mettre à jour seulement si nécessaire
      cameraRef.aspect = width / height;
      cameraRef.updateProjectionMatrix();
      
      rendererRef.setSize(width, height);
      rendererRef.setPixelRatio(window.devicePixelRatio);
      
      // Mettre à jour également le renderer CSS2D
      if (labelRendererRef) {
        labelRendererRef.setSize(width, height);
      }
      
      // Forcer la mise à jour des étiquettes après le redimensionnement
      forceLabelsUpdate();
    };
    
    // Gestionnaire pour le toggle du menu
    const handleMenuToggle = (event) => {
      console.log("Menu toggled, forcing labels update");
      // Attendre que l'animation soit terminée
      setTimeout(forceLabelsUpdate, 300);
    };
    
    // Ajouter les écouteurs d'événements
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', forceLabelsUpdate);
    document.addEventListener('transitionend', forceLabelsUpdate);
    window.addEventListener('menuToggled', handleMenuToggle);
    
    // Observer les changements de taille du conteneur avec requestAnimationFrame au lieu de setTimeout
    let resizeObserver;
    let resizeRAF;
    
    try {
      resizeObserver = new ResizeObserver(entries => {
        // Annuler l'animation précédente si elle existe
        if (resizeRAF) {
          cancelAnimationFrame(resizeRAF);
        }
        
        // Planifier une nouvelle mise à jour
        resizeRAF = requestAnimationFrame(() => {
          if (!containerRef.current) return;
          handleResize();
          // Mettre à jour les étiquettes également
          forceLabelsUpdate();
        });
      });
      
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
    } catch (err) {
      console.warn("ResizeObserver not supported:", err);
      // Alternative pour les navigateurs sans support pour ResizeObserver
      window.addEventListener('resize', handleResize);
    }
    
    // Forcer un redimensionnement initial après un court délai
    const initialResizeTimer = setTimeout(handleResize, 200);
    
    // Appeler regenerateScene une seule fois au chargement initial
    if (!hasGeneratedScene) {
      const sceneGenerationTimer = setTimeout(() => {
        try {
          if (furnitureStore.regenerateScene) {
            console.log("Régénération initiale de la scène");
            furnitureStore.regenerateScene();
            hasGeneratedScene = true; // Marquer comme déjà générée
            
            // Forcer un second redimensionnement après que les objets soient chargés
            const secondResizeTimer = setTimeout(() => {
              handleResize();
              forceLabelsUpdate();
            }, 500);
            
            return () => {
              clearTimeout(secondResizeTimer);
            };
          }
        } catch (error) {
          console.error("Erreur lors de la régénération de la scène:", error);
        }
      }, 500);
      
      // Nettoyage du timer
      return () => {
        clearTimeout(sceneGenerationTimer);
      };
    }
    
    // Nettoyage
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', forceLabelsUpdate);
      document.removeEventListener('transitionend', forceLabelsUpdate);
      window.removeEventListener('menuToggled', handleMenuToggle);
      
      if (resizeRAF) {
        cancelAnimationFrame(resizeRAF);
      }
      
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
      
      clearTimeout(initialResizeTimer);
      clearInterval(labelsUpdateInterval);
      
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      // Supprimer les écouteurs d'événements
      if (rendererRef && rendererRef.domElement) {
        rendererRef.domElement.removeEventListener('mousedown', handleMouseDown);
        rendererRef.domElement.removeEventListener('mouseup', handleMouseUp);
        rendererRef.domElement.removeEventListener('mouseleave', handleMouseUp);
      }
      
      if (rendererRef && containerRef.current) {
        try {
          containerRef.current.removeChild(rendererRef.domElement);
          rendererRef.dispose();
        } catch (error) {
          console.error("Erreur lors du nettoyage:", error);
        }
      }
      
      // Supprimer le renderer CSS2D
      if (labelRendererRef && containerRef.current) {
        try {
          containerRef.current.removeChild(labelRendererRef.domElement);
        } catch (error) {
          console.error("Erreur lors du nettoyage du labelRenderer:", error);
        }
      }
      
      // Supprimer le style CSS ajouté
      const dimensionLabelStyle = document.querySelector('style');
      if (dimensionLabelStyle) {
        document.head.removeChild(dimensionLabelStyle);
      }
      
      // Réinitialiser les références
      sceneRef = null;
      cameraRef = null;
      rendererRef = null;
      labelRendererRef = null;
      controlsRef = null;
      animationFrameId = null;
      sceneInitialized = false;
      dimensionsGroup = null;
      axesHelper = null;
      furnitureGroups = {};
    };
  }, [darkMode]); // Dépendance sur darkMode pour réinitialiser la scène si le mode change
  
  // Effet séparé pour écouter seulement les changements des objets de la scène
  useEffect(() => {
    if (!sceneInitialized || !sceneRef) return;
    
    try {
      console.log("Mise à jour des objets dans la scène");
      
      // Étape 1: Identifier et maintenir les objets persistants (lumières, helpers)
      const persistentObjects = [];
      const existingFurnitureGroups = [];
      const existingEnvironmentObjects = [];
      
      // Parcourir les objets de la scène et les classer
      sceneRef.traverse(object => {
        // Conserver les lumières et les helpers
        if (object instanceof THREE.Light || 
            object instanceof THREE.GridHelper || 
            object instanceof THREE.AxesHelper ||
            object.name === 'dimensions' ||
            object.name === 'edgesGroup') {
          persistentObjects.push(object);
        }
        // Identifier les groupes de meubles pour nettoyage
        else if (object instanceof THREE.Group && object.userData && object.userData.type === 'furnitureGroup') {
          existingFurnitureGroups.push(object);
        }
        // Identifier les objets de pièce (sol, murs) pour nettoyage
        else if (object.userData && (object.userData.type === 'floor' || 
                                    object.userData.type === 'ceiling' || 
                                    object.userData.type === 'wall')) {
          existingEnvironmentObjects.push(object);
        }
      });
      
      // Étape 2: Nettoyer tous les objets d'environnement existants
      for (const obj of existingEnvironmentObjects) {
        disposeObject(obj);
        sceneRef.remove(obj);
      }
      
      // Étape 3: Nettoyer tous les objets de meuble existants
      for (const group of existingFurnitureGroups) {
        // Disposer des ressources avant de supprimer
        group.traverse(child => {
          if (child !== group) { // Ne pas disposer du groupe lui-même
            disposeObject(child);
          }
        });
        sceneRef.remove(group);
      }
      
      // Vider le dictionnaire des groupes de meubles
      furnitureGroups = {};
      
      // Étape 4: Ajouter les nouveaux objets
      console.log("Ajout de", furnitureStore.sceneObjects?.length || 0, "objets à la scène");
      
      // Dictionnaire pour stocker les nouveaux groupes de meubles
      const newFurnitureGroups = {};
      
      // Ajouter les nouveaux objets
      if (furnitureStore.sceneObjects && Array.isArray(furnitureStore.sceneObjects)) {
        furnitureStore.sceneObjects.forEach(obj => {
          try {
            if (obj.type === 'floor' || obj.type === 'ceiling') {
              // Objets d'environnement (sol et plafond)
              const geometry = new THREE.PlaneGeometry(
                obj.dimensions?.width || 10,
                obj.dimensions?.height || 10
              );
              
              const material = new THREE.MeshStandardMaterial({
                color: obj.color || '#F5F5F5',
                side: THREE.DoubleSide,
                transparent: false,
                depthWrite: true
              });
              
              const mesh = new THREE.Mesh(geometry, material);
              mesh.userData = { ...obj }; // Stocker les données original
              
              // Amélioration: ordre de rendu et ombres pour le sol/plafond
              mesh.renderOrder = 1; // Rendre APRÈS la grille
              mesh.receiveShadow = true;
              
              if (obj.position) {
                mesh.position.set(
                  obj.position[0] || 0,
                  obj.position[1] || 0,
                  obj.position[2] || 0
                );
              }
              
              if (obj.rotation) {
                mesh.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
              }
              
              sceneRef.add(mesh);
            } 
            else if (obj.type === 'wall') {
              // Utiliser directement les dimensions fournies par environmentGenerator
              const geometry = new THREE.BoxGeometry(
                obj.dimensions.width,
                obj.dimensions.height,
                obj.dimensions.depth
              );
              
              const material = new THREE.MeshStandardMaterial({
                color: obj.color || '#E0E0E0',
                transparent: true,
                opacity: 0.7,
                depthWrite: true
              });
              
              const mesh = new THREE.Mesh(geometry, material);
              mesh.userData = { ...obj };
              mesh.renderOrder = 2;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              
              if (obj.position) {
                mesh.position.set(
                  obj.position[0] || 0,
                  obj.position[1] || 0,
                  obj.position[2] || 0
                );
              }
              
              if (obj.rotation) {
                mesh.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
              }
              
              sceneRef.add(mesh);
            }
            else if (obj.type === 'furnitureGroup' && obj.children) {
              // Identifier l'ID du meuble (s'il existe)
              const furnitureId = obj.furnitureId || 'default';
              
              // Créer un nouveau groupe THREE.js pour ce meuble
              const group = new THREE.Group();
              group.userData = { 
                type: 'furnitureGroup',
                furnitureId: furnitureId,
                id: obj.id
              };
              group.renderOrder = 3; // Groupe de meubles après sol/murs
              
              if (obj.position) {
                group.position.set(
                  obj.position[0] || 0,
                  obj.position[1] || 0,
                  obj.position[2] || 0
                );
              }
              
              if (obj.rotation) {
                group.rotation.set(
                  obj.rotation[0] || 0,
                  obj.rotation[1] || 0, 
                  obj.rotation[2] || 0
                );
              }
              
              // Ajouter chaque pièce du meuble au groupe
              if (obj.children && Array.isArray(obj.children)) {
                obj.children.forEach(childObj => {
                  if (childObj.type === 'piece') {
                    const childGeometry = new THREE.BoxGeometry(
                      childObj.dimensions?.width || 1,
                      childObj.dimensions?.height || 1,
                      childObj.dimensions?.depth || 1
                    );
                    
                    const childMaterial = new THREE.MeshStandardMaterial({
                      color: childObj.piece?.color || '#b0bec5',
                      transparent: furnitureStore.displayOptions?.furnitureOpacity < 1,
                      opacity: furnitureStore.displayOptions?.furnitureOpacity || 1,
                      depthWrite: true
                    });
                    
                    const childMesh = new THREE.Mesh(childGeometry, childMaterial);
                    childMesh.userData = { ...childObj };
                    
                    // Amélioration: ombres pour les enfants du groupe
                    childMesh.renderOrder = 3; // Même ordre que le groupe parent
                    childMesh.castShadow = true;
                    childMesh.receiveShadow = true;
                    
                    if (childObj.position) {
                      childMesh.position.set(
                        childObj.position[0] || 0,
                        childObj.position[1] || 0,
                        childObj.position[2] || 0
                      );
                    }
                    
                    group.add(childMesh);
                  }
                });
              }
              
              // Stocker le groupe dans le dictionnaire des groupes de meubles
              newFurnitureGroups[furnitureId] = group;
            }
            else if (obj.type === 'piece') {
              // Pièce individuelle (non groupée)
              const geometry = new THREE.BoxGeometry(
                obj.dimensions?.width || 1,
                obj.dimensions?.height || 1, 
                obj.dimensions?.depth || 1
              );
              
              const material = new THREE.MeshStandardMaterial({
                color: obj.piece?.color || '#b0bec5',
                transparent: furnitureStore.displayOptions?.furnitureOpacity < 1,
                opacity: furnitureStore.displayOptions?.furnitureOpacity || 1,
                depthWrite: true
              });
              
              const mesh = new THREE.Mesh(geometry, material);
              mesh.userData = { ...obj };
              
              // Amélioration: ordre de rendu et ombres pour les pièces
              mesh.renderOrder = 3; // Rendre APRÈS la grille, le sol et les murs
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              
              if (obj.position) {
                mesh.position.set(
                  obj.position[0] || 0,
                  obj.position[1] || 0,
                  obj.position[2] || 0
                );
              }
              
              // Identifier l'ID du meuble (s'il existe)
              const furnitureId = obj.furnitureId || 'default';
              
              // Vérifier si un groupe pour ce meuble existe déjà
              if (!newFurnitureGroups[furnitureId]) {
                // Créer un nouveau groupe
                const group = new THREE.Group();
                group.userData = { 
                  type: 'furnitureGroup',
                  furnitureId: furnitureId,
                  id: `group_${furnitureId}`
                };
                newFurnitureGroups[furnitureId] = group;
              }
              
              // Ajouter la pièce au groupe correspondant
              newFurnitureGroups[furnitureId].add(mesh);
            }
          } catch (objError) {
            console.error("Erreur lors de l'ajout d'un objet:", objError);
          }
        });
      }
      
      // Étape 5: Ajouter les nouveaux groupes de meubles à la scène
      Object.entries(newFurnitureGroups).forEach(([furnitureId, group]) => {
        sceneRef.add(group);
        // Stocker la référence pour usage futur
        furnitureGroups[furnitureId] = group;
      });
      
      console.log(`Ajouté: ${furnitureStore.sceneObjects.length} objets (murs, sol, meubles)`);
      
      // Étape 6: Mettre à jour les lignes de dimension
      // Nettoyer les lignes de dimension existantes
      if (dimensionsGroup) {
        while (dimensionsGroup.children.length > 0) {
          const child = dimensionsGroup.children[0];
          disposeObject(child);
          dimensionsGroup.remove(child);
        }
      } else {
        // Créer le groupe si nécessaire
        dimensionsGroup = new THREE.Group();
        dimensionsGroup.name = 'dimensions';
        sceneRef.add(dimensionsGroup);
      }
      
      // Ajouter les nouvelles lignes de dimension
      if (furnitureStore.dimensionLines && Array.isArray(furnitureStore.dimensionLines)) {
        furnitureStore.dimensionLines.forEach(dimensionLine => {
          try {
            const line = createDimensionLine(dimensionLine);
            dimensionsGroup.add(line);
          } catch (lineError) {
            console.error("Erreur lors de l'ajout d'une ligne de dimension:", lineError);
          }
        });
        
        console.log(`Ajouté: ${furnitureStore.dimensionLines.length} lignes de dimension`);
      }
      
      // Appliquer le mode d'affichage actuel (pour gérer le mode conceptuel si activé)
      updateViewMode();
      
      // Forcer une mise à jour des étiquettes après avoir ajouté de nouveaux objets
      setTimeout(forceLabelsUpdate, 100);
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la scène:", error);
    }
  }, [furnitureStore.sceneObjects, furnitureStore.dimensionLines]); // Dépendance sur sceneObjects et dimensionLines
  
  // Fonction updateViewMode pour gérer le mode conceptuel
  const updateViewMode = () => {
    if (!sceneRef) return;
    
    const viewMode = furnitureStore.displayOptions?.viewMode || 'solid';
    const edgeColor = new THREE.Color(furnitureStore.displayOptions?.edgeColor || "#000000");
    const edgeThickness = furnitureStore.displayOptions?.edgeThickness || 1;
    const showAllEdges = furnitureStore.displayOptions?.showAllEdges || false;
    
    console.log("Mise à jour du mode d'affichage:", viewMode);
    
    // Créer un groupe pour stocker les arêtes en mode conceptuel
    if (!sceneRef.userData.edgesGroup) {
      sceneRef.userData.edgesGroup = new THREE.Group();
      sceneRef.userData.edgesGroup.name = "edgesGroup";
      sceneRef.add(sceneRef.userData.edgesGroup);
    }
    
    // Nettoyer les arêtes existantes
    while (sceneRef.userData.edgesGroup.children.length > 0) {
      const child = sceneRef.userData.edgesGroup.children[0];
      disposeObject(child);
      sceneRef.userData.edgesGroup.remove(child);
    }
    
    // Appliquer le mode d'affichage à tous les objets pertinents
    sceneRef.traverse(object => {
      if (object instanceof THREE.Mesh && object.material) {
        // Supprimer les arêtes précédemment ajoutées (si elles existent)
        if (object.userData.edges) {
          sceneRef.userData.edgesGroup.remove(object.userData.edges);
          disposeObject(object.userData.edges);
          object.userData.edges = null;
        }
        
        // Copier le matériau pour éviter de modifier les références partagées
        if (Array.isArray(object.material)) {
          object.material = object.material.map(mat => mat.clone());
        } else {
          object.material = object.material.clone();
        }
        
        // Appliquer les propriétés selon le mode
        if (viewMode === 'wireframe') {
          object.material.wireframe = true;
          object.material.flatShading = true;
        } 
        else if (viewMode === 'solid') {
          object.material.wireframe = false;
          object.material.flatShading = true;
          object.material.needsUpdate = true;
        } 
        else if (viewMode === 'realistic') {
          object.material.wireframe = false;
          object.material.flatShading = false;
          object.material.needsUpdate = true;
        }
        else if (viewMode === 'conceptual') {
          // Mode conceptuel : matériau simple + arêtes
          object.material.wireframe = false;
          object.material.flatShading = true;
          object.material.needsUpdate = true;
          
          // Éviter de créer des arêtes pour les objets non pertinents (sol, grille, etc.)
          if (object.userData.type === 'piece' || 
              (object.parent && object.parent.userData && object.parent.userData.type === 'furnitureGroup')) {
            
            // Créer les arêtes
            const edgesGeometry = showAllEdges 
              ? new THREE.EdgesGeometry(object.geometry) 
              : new THREE.EdgesGeometry(object.geometry, 30); // Angle de 30° pour n'afficher que les arêtes visibles
            
            const edgesMaterial = new THREE.LineBasicMaterial({ 
              color: edgeColor,
              linewidth: edgeThickness, // Note: linewidth n'est pas supporté par tous les navigateurs
            });
            
            const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
            
            // Copier la position, rotation et échelle de l'objet
            edges.position.copy(object.position);
            edges.rotation.copy(object.rotation);
            edges.scale.copy(object.scale);
            
            // Stocker les arêtes dans les metadata de l'objet pour pouvoir les supprimer plus tard
            object.userData.edges = edges;
            
            // Ajouter au groupe d'arêtes principal
            edges.renderOrder = object.renderOrder + 1; // Assurer que les arêtes sont rendues après l'objet
            edges.userData.parentId = object.id; // Référence à l'objet parent
            
            // Ajouter au groupe global
            sceneRef.userData.edgesGroup.add(edges);
          }
        }
      }
    });
    
    // Assurer que le groupe d'arêtes est visible ou caché selon le mode
    if (sceneRef.userData.edgesGroup) {
      sceneRef.userData.edgesGroup.visible = (viewMode === 'conceptual');
    }
  };
  
  // Effet séparé pour les options d'affichage
  useEffect(() => {
    if (!sceneInitialized || !sceneRef) return;
    
    console.log("Mise à jour des options d'affichage:", furnitureStore.displayOptions);
    
    // Mettre à jour la couleur de fond
    const bgColor = darkMode ? '#121212' : (furnitureStore.displayOptions?.backgroundColor || '#f0f0f0');
    
    if (sceneRef) {
      sceneRef.background = new THREE.Color(bgColor);
      // Mettre à jour également la couleur de fond du renderer
      if (rendererRef) {
        rendererRef.setClearColor(bgColor, 1);
      }
    }
    
    // Gestion spécifique de la grille et des autres options d'affichage
    const updateGridVisibility = () => {
      // Récupérer toutes les grilles existantes
      const existingGrids = [];
      sceneRef.traverse(object => {
        if (object instanceof THREE.GridHelper) {
          existingGrids.push(object);
        }
      });
      
      // Vérifier si la grille doit être visible
      const shouldShowGrid = furnitureStore.displayOptions?.showGrid !== false;
      
      console.log("Mise à jour de la grille - Existantes:", existingGrids.length, "Visible:", shouldShowGrid);
      
      if (existingGrids.length > 0) {
        // Mettre à jour la visibilité des grilles existantes
        existingGrids.forEach(grid => {
          grid.visible = shouldShowGrid;
        });
      } else if (shouldShowGrid) {
        // Créer une nouvelle grille si nécessaire
        console.log("Création d'une nouvelle grille");
        const newGridHelper = new THREE.GridHelper(20, 20);
        newGridHelper.position.y = -0.01;
        newGridHelper.renderOrder = -1;
        newGridHelper.material.opacity = darkMode ? 0.3 : 0.5;
        newGridHelper.material.transparent = true;
        newGridHelper.name = "gridHelper";
        sceneRef.add(newGridHelper);
      }
    };
    
    // Mise à jour des axes - Nouvelle fonction
    const updateAxes = () => {
      // Vérifier si les axes doivent être visibles
      const showAxes = furnitureStore.displayOptions?.showAxes !== false;
      
      console.log("Mise à jour des axes - Visible:", showAxes);
      
      // Chercher les axes existants
      const existingAxes = [];
      sceneRef.traverse(object => {
        if (object.name === "axesHelper") {
          existingAxes.push(object);
        }
      });
      
      if (existingAxes.length > 0) {
        // Mettre à jour la visibilité des axes existants
        existingAxes.forEach(axes => {
          axes.visible = showAxes;
        });
      } else if (showAxes) {
        // Créer de nouveaux axes si nécessaire
        console.log("Création de nouveaux axes");
        axesHelper = new THREE.AxesHelper(10);
        axesHelper.name = "axesHelper";
        sceneRef.add(axesHelper);
      }
    };
    
    // Mise à jour des ombres
    const updateShadows = () => {
      const showShadows = furnitureStore.displayOptions?.showShadows === true;
      console.log("Mise à jour des ombres:", showShadows);
      
      if (rendererRef) {
        rendererRef.shadowMap.enabled = showShadows;
        
        if (showShadows) {
          // Activer les ombres pour tous les objets pertinents
          sceneRef.traverse(object => {
            if (object instanceof THREE.Mesh) {
              if (object.userData.type === 'floor' || object.userData.type === 'wall') {
                object.receiveShadow = true;
              }
              if (object.userData.type === 'piece' || object.userData.type === 'furnitureGroup') {
                object.castShadow = true;
                object.receiveShadow = true;
              }
            }
          });
        }
      }
    };
    
    // Mise à jour des dimensions - Séparation des dimensions mur/meuble
    const updateDimensions = () => {
      // Vérifier les deux options de dimensions
      const showRoomDimensions = furnitureStore.displayOptions?.showDimensions !== false;
      const showFurnitureDimensions = furnitureStore.displayOptions?.showFurnitureDimensions === true;
      
      console.log("Mise à jour des dimensions - Murs:", showRoomDimensions, "Meuble:", showFurnitureDimensions);
      
      // Mettre à jour la visibilité de chaque type de dimension
      if (dimensionsGroup) {
        dimensionsGroup.traverse(object => {
          // Vérifier le type de dimension si disponible
          if (object.userData && object.userData.dimensionType) {
            if (object.userData.dimensionType === 'room') {
              // Dimensions de mur
              object.visible = showRoomDimensions;
            } else if (object.userData.dimensionType === 'furniture') {
              // Dimensions de meuble
              object.visible = showFurnitureDimensions;
            }
          }
        });
      }
      
      // Mettre à jour les étiquettes CSS via leurs classes
      const roomDimensionLabels = document.querySelectorAll('.dimension-label.room-dimension');
      roomDimensionLabels.forEach(label => {
        label.style.display = showRoomDimensions ? 'block' : 'none';
        label.style.visibility = showRoomDimensions ? 'visible' : 'hidden';
        label.style.opacity = showRoomDimensions ? '1' : '0';
      });
      
      const furnitureDimensionLabels = document.querySelectorAll('.dimension-label.furniture-dimension');
      furnitureDimensionLabels.forEach(label => {
        label.style.display = showFurnitureDimensions ? 'block' : 'none';
        label.style.visibility = showFurnitureDimensions ? 'visible' : 'hidden';
        label.style.opacity = showFurnitureDimensions ? '1' : '0';
      });
      
      // Ajouter/supprimer des classes au body pour contrôler les étiquettes via CSS
      if (showRoomDimensions) {
        document.body.classList.remove('hide-room-dimensions');
      } else {
        document.body.classList.add('hide-room-dimensions');
      }
      
      if (showFurnitureDimensions) {
        document.body.classList.remove('hide-furniture-dimensions');
      } else {
        document.body.classList.add('hide-furniture-dimensions');
      }
      
      // Force la mise à jour des étiquettes
      setTimeout(forceLabelsUpdate, 100);
    };
    
    // Mise à jour de l'opacité des meubles
    const updateFurnitureOpacity = () => {
      const opacity = furnitureStore.displayOptions?.furnitureOpacity !== undefined 
        ? furnitureStore.displayOptions.furnitureOpacity
        : 1.0;
      
      console.log("Mise à jour de l'opacité des meubles:", opacity);
      
      // Parcourir tous les groupes de meubles
      Object.values(furnitureGroups).forEach(group => {
        group.traverse(child => {
          if (child instanceof THREE.Mesh && child.material) {
            // Cloner le matériau pour éviter les références partagées
            if (Array.isArray(child.material)) {
              child.material = child.material.map(mat => {
                const newMat = mat.clone();
                newMat.transparent = opacity < 1.0;
                newMat.opacity = opacity;
                return newMat;
              });
            } else {
              const newMat = child.material.clone();
              newMat.transparent = opacity < 1.0;
              newMat.opacity = opacity;
              child.material = newMat;
            }
          }
        });
      });
    };
    
    // Exécuter toutes les mises à jour
    updateGridVisibility();
    updateAxes();
    updateShadows();
    updateViewMode(); // Utilisation de notre fonction updateViewMode mise à jour
    updateDimensions();
    updateFurnitureOpacity();
    
  }, [furnitureStore.displayOptions, darkMode]); // Dépendance sur displayOptions et darkMode
  
  // Effet pour gérer la sélection d'un meuble
  useEffect(() => {
    if (!sceneInitialized || !sceneRef) return;
    
    const activeFurnitureId = furnitureStore.activeFurnitureId;
    
    if (activeFurnitureId) {
      console.log("Mise en évidence du meuble actif:", activeFurnitureId);
      
      // Parcourir tous les groupes de meubles
      Object.entries(furnitureGroups).forEach(([furnitureId, group]) => {
        // Déterminer si ce groupe correspond au meuble actif
        const isActive = furnitureId === activeFurnitureId;
        
        // Appliquer un effet visuel pour distinguer le meuble actif
        group.traverse(child => {
          if (child instanceof THREE.Mesh && child.material) {
            // Cloner le matériau pour éviter les références partagées
            if (Array.isArray(child.material)) {
              child.material = child.material.map(mat => {
                const newMat = mat.clone();
                if (isActive) {
                  // Mettre en évidence le meuble actif 
                  newMat.emissive = new THREE.Color(0x222222);
                } else {
                  // Désactiver la mise en évidence pour les autres meubles
                  newMat.emissive = new THREE.Color(0x000000);
                }
                return newMat;
              });
            } else {
              const newMat = child.material.clone();
              if (isActive) {
                newMat.emissive = new THREE.Color(0x222222);
              } else {
                newMat.emissive = new THREE.Color(0x000000);
              }
              child.material = newMat;
            }
          }
        });
      });
    }
  }, [furnitureStore.activeFurnitureId]);
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        touchAction: 'none',
        zIndex: 0,
        overflow: 'hidden',
        cursor: 'grab', // Indiquer que l'élément est contrôlable
        backgroundColor: darkMode ? '#121212' : '#f0f0f0'
      }}
    />
  );
};

export default Scene3D;