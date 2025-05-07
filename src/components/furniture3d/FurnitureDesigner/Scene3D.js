import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useFurnitureStore } from './store'; // Ajustez le chemin selon votre structure

const Scene3D = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const requestRef = useRef(null);
  const gridRef = useRef(null);
  const furnitureRef = useRef(null);
  
  // Récupérer le store
  const furnitureStore = useFurnitureStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // Fonction pour désactiver l'élément authenticadepApp qui interfère avec la scène 3D
  const disableAuthenticadepApp = () => {
    // Recherche de l'élément par ID
    const authenticadepApp = document.getElementById('authenticadepApp');
    if (authenticadepApp) {
      // Désactiver l'élément en le cachant et en réduisant sa taille
      authenticadepApp.style.display = 'none';
      authenticadepApp.style.height = '0';
      authenticadepApp.style.width = '0';
      authenticadepApp.style.overflow = 'hidden';
      authenticadepApp.style.position = 'absolute';
      authenticadepApp.style.zIndex = '-9999';
      console.log('authenticadepApp désactivé avec succès');
    }
    
    // Recherche de l'élément par classe ou autres attributs
    const potentialOverlays = document.querySelectorAll('div[style*="position: fixed"]');
    potentialOverlays.forEach(element => {
      const rect = element.getBoundingClientRect();
      // Si l'élément a une taille proche de celle rapportée (1131px x 954px)
      if (rect.width > 1000 && rect.height > 900) {
        element.style.display = 'none';
        element.style.zIndex = '-9999';
        console.log('Overlay potentiel désactivé:', element);
      }
    });
  };

  // Initialisation de la scène et des éléments 3D
  useEffect(() => {
    // Désactiver l'élément problématique
    disableAuthenticadepApp();
    
    // Initialiser la scène Three.js
    const initThreeJS = () => {
      if (!containerRef.current) return;
      
      // Créer la scène
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color(0xf0f0f0);
      
      // Créer la caméra
      const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      const camera = new THREE.PerspectiveCamera(45, aspect, 1, 10000);
      camera.position.set(1000, 1000, 1000);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;
      
      // Créer le renderer avec antialiasing
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
      
      // Ajouter les contrôles de caméra
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.screenSpacePanning = false;
      controls.minDistance = 10;
      controls.maxDistance = 3000;
      controls.maxPolarAngle = Math.PI / 2;
      controlsRef.current = controls;
      
      // Ajouter les lumières
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1000, 1000, 1000);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 1;
      directionalLight.shadow.camera.far = 5000;
      directionalLight.shadow.camera.left = -1000;
      directionalLight.shadow.camera.right = 1000;
      directionalLight.shadow.camera.top = 1000;
      directionalLight.shadow.camera.bottom = -1000;
      scene.add(directionalLight);
      
      // Ajouter une grille de référence
      const grid = new THREE.GridHelper(2000, 20, 0x888888, 0xcccccc);
      scene.add(grid);
      gridRef.current = grid;
      
      // Ajouter un sol
      const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
      const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xcccccc, 
        roughness: 0.8,
        transparent: true,
        opacity: 0.5
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);
      
      // Créer un meuble par défaut
      createFurniture();
      
      // Marquer comme initialisé
      setIsInitialized(true);
    };
    
    // Gérer le redimensionnement de la fenêtre
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    // Boucle d'animation
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    // Initialiser la scène et démarrer l'animation
    initThreeJS();
    window.addEventListener('resize', handleResize);
    requestRef.current = requestAnimationFrame(animate);
    
    // Nettoyage lors du démontage du composant
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);
  
  // Surveiller les changements de dimensions et mettre à jour le meuble
  useEffect(() => {
    if (!isInitialized || !furnitureStore) return;
    
    // Récréer le meuble quand les dimensions changent
    createFurniture();
    
    // Pour les vues prédéfinies, adapter la caméra
    if (furnitureStore.currentView) {
      changeView(furnitureStore.currentView);
    }
    
    // Pour la grille, mettre à jour la visibilité
    if (gridRef.current && furnitureStore.showGrid !== undefined) {
      gridRef.current.visible = furnitureStore.showGrid;
    }
    
  }, [
    isInitialized, 
    furnitureStore?.width, 
    furnitureStore?.height, 
    furnitureStore?.depth,
    furnitureStore?.currentView,
    furnitureStore?.displayMode,
    furnitureStore?.showGrid
  ]);

  // Créer un meuble avec les dimensions du store
  const createFurniture = () => {
    if (!sceneRef.current || !furnitureStore) return;
    
    // Supprimer l'ancien meuble s'il existe
    if (furnitureRef.current) {
      sceneRef.current.remove(furnitureRef.current);
    }
    
    // Récupérer les dimensions du store (mm)
    const width = furnitureStore.width || 1000;
    const height = furnitureStore.height || 2000;
    const depth = furnitureStore.depth || 600;
    
    // Créer un groupe pour contenir tous les éléments du meuble
    const furnitureGroup = new THREE.Group();
    
    // Créer le corps principal (caisson)
    const cabinetGeometry = new THREE.BoxGeometry(width, height, depth);
    const cabinetMaterial = new THREE.MeshStandardMaterial({ 
      color: furnitureStore.displayMode === 'realistic' ? 0x8B4513 : 0xB8860B, 
      roughness: furnitureStore.displayMode === 'realistic' ? 0.7 : 0.9,
      metalness: furnitureStore.displayMode === 'realistic' ? 0.1 : 0
    });
    const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
    cabinet.position.y = height / 2; // Placer sur le sol
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    furnitureGroup.add(cabinet);
    
    // Si mode réaliste, ajouter plus de détails
    if (furnitureStore.displayMode === 'realistic') {
      // Ajouter des étagères
      const shelfHeight = 20; // 20mm d'épaisseur
      const shelfMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xa0522d, 
        roughness: 0.6,
        metalness: 0.2
      });
      
      for (let i = 1; i <= 3; i++) {
        const shelfGeometry = new THREE.BoxGeometry(width - 40, shelfHeight, depth - 40);
        const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
        shelf.position.y = (height / 4) * i;
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        furnitureGroup.add(shelf);
      }
      
      // Ajouter des portes
      const doorWidth = width / 2 - 5; // Légèrement moins que la moitié pour l'espace
      const doorDepth = 20; // Épaisseur de la porte
      const doorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xd2b48c, 
        roughness: 0.5,
        metalness: 0.1
      });
      
      // Porte gauche
      const leftDoorGeometry = new THREE.BoxGeometry(doorWidth, height - 10, doorDepth);
      const leftDoor = new THREE.Mesh(leftDoorGeometry, doorMaterial);
      leftDoor.position.set(-width/4, height/2, depth/2 - doorDepth/2);
      leftDoor.castShadow = true;
      furnitureGroup.add(leftDoor);
      
      // Porte droite
      const rightDoorGeometry = new THREE.BoxGeometry(doorWidth, height - 10, doorDepth);
      const rightDoor = new THREE.Mesh(rightDoorGeometry, doorMaterial);
      rightDoor.position.set(width/4, height/2, depth/2 - doorDepth/2);
      rightDoor.castShadow = true;
      furnitureGroup.add(rightDoor);
      
      // Ajouter des poignées
      const handleGeometry = new THREE.CylinderGeometry(5, 5, 30, 16);
      const handleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xc0c0c0, 
        roughness: 0.2,
        metalness: 0.8
      });
      
      // Poignée gauche
      const leftHandle = new THREE.Mesh(handleGeometry, handleMaterial);
      leftHandle.rotation.z = Math.PI / 2; // Rotation pour orientation horizontale
      leftHandle.position.set(-width/4 + doorWidth/2 - 20, height/2, depth/2 + 15);
      leftHandle.castShadow = true;
      furnitureGroup.add(leftHandle);
      
      // Poignée droite
      const rightHandle = new THREE.Mesh(handleGeometry, handleMaterial);
      rightHandle.rotation.z = Math.PI / 2; // Rotation pour orientation horizontale
      rightHandle.position.set(width/4 - doorWidth/2 + 20, height/2, depth/2 + 15);
      rightHandle.castShadow = true;
      furnitureGroup.add(rightHandle);
    }
    
    // Ajouter le meuble à la scène
    sceneRef.current.add(furnitureGroup);
    furnitureRef.current = furnitureGroup;
    
    // Centrer la caméra sur le meuble
    centerCameraOnFurniture();
  };
  
  // Fonction pour changer de vue
  const changeView = (viewName) => {
    if (!cameraRef.current || !controlsRef.current || !furnitureRef.current) return;
    
    // Calculer la boîte englobante du meuble
    const box = new THREE.Box3().setFromObject(furnitureRef.current);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Distance de caméra basée sur la taille du meuble
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 1.5;
    
    // Définir les positions de caméra pour chaque vue
    switch (viewName) {
      case 'front':
        cameraRef.current.position.set(center.x, center.y, center.z + distance);
        break;
      case 'back':
        cameraRef.current.position.set(center.x, center.y, center.z - distance);
        break;
      case 'left':
        cameraRef.current.position.set(center.x - distance, center.y, center.z);
        break;
      case 'right':
        cameraRef.current.position.set(center.x + distance, center.y, center.z);
        break;
      case 'top':
        cameraRef.current.position.set(center.x, center.y + distance, center.z);
        break;
      case 'bottom':
        cameraRef.current.position.set(center.x, center.y - distance, center.z);
        break;
      case 'home':
      default:
        cameraRef.current.position.set(
          center.x + distance,
          center.y + distance,
          center.z + distance
        );
        break;
    }
    
    // Définir le point de vue
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  };
  
  // Centrer la caméra sur le meuble
  const centerCameraOnFurniture = () => {
    if (!furnitureRef.current || !cameraRef.current || !controlsRef.current) return;
    
    // Calculer la boîte englobante du meuble
    const box = new THREE.Box3().setFromObject(furnitureRef.current);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Définir la distance de caméra en fonction de la taille du meuble
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2.5;
    
    // Positionner la caméra
    cameraRef.current.position.set(
      center.x + distance,
      center.y + distance,
      center.z + distance
    );
    
    // Définir le point de vue
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
};

export default Scene3D;