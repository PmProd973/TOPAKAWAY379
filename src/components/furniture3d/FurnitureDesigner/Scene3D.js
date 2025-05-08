// src/components/furniture3d/FurnitureDesigner/Scene3D.js
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useFurnitureStore } from './store';

// Objets globaux pour éviter les re-rendus
let sceneInitialized = false;
let sceneRef = null;
let cameraRef = null;
let rendererRef = null;
let controlsRef = null;
let animationFrameId = null;
let hasGeneratedScene = false; // Drapeau pour éviter les régénérations multiples

const Scene3D = ({ darkMode = false }) => {
  console.log('Scene3D component initialized', Date.now());
  const containerRef = useRef(null);
  
  // Récupérer le store complet
  const furnitureStore = useFurnitureStore();
  
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
    
    // Fonction d'animation - CRUCIAL POUR LES CONTRÔLES INTERACTIFS
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Cette ligne est essentielle pour que les contrôles fonctionnent
      if (controlsRef) {
        controlsRef.update();
      }
      
      if (rendererRef && sceneRef && cameraRef) {
        rendererRef.render(sceneRef, cameraRef);
      }
    };
    
    // Démarrer l'animation immédiatement
    animate();
    
    // Marquer comme initialisé
    sceneInitialized = true;
    
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
    };
    
    window.addEventListener('resize', handleResize);
    
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
            const secondResizeTimer = setTimeout(handleResize, 500);
            
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
      
      if (resizeRAF) {
        cancelAnimationFrame(resizeRAF);
      }
      
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      
      clearTimeout(initialResizeTimer);
      
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
      
      // Réinitialiser les références
      sceneRef = null;
      cameraRef = null;
      rendererRef = null;
      controlsRef = null;
      animationFrameId = null;
      sceneInitialized = false;
    };
  }, [darkMode]); // Dépendance sur darkMode pour réinitialiser la scène si le mode change
  
  // Effet séparé pour écouter seulement les changements des objets de la scène
  useEffect(() => {
    if (!sceneInitialized || !sceneRef) return;
    
    try {
      console.log("Mise à jour des objets dans la scène");
      
      // Supprimer les objets existants (sauf lumières et grille)
      const objectsToRemove = [];
      sceneRef.traverse(object => {
        if (object instanceof THREE.Mesh && 
            !(object instanceof THREE.GridHelper) &&
            !(object instanceof THREE.Light)) {
          objectsToRemove.push(object);
        }
      });
      
      objectsToRemove.forEach(object => {
        sceneRef.remove(object);
      });
      
      console.log("Ajout de", furnitureStore.sceneObjects?.length || 0, "objets à la scène");
      
      // Ajouter les nouveaux objets
      if (furnitureStore.sceneObjects && Array.isArray(furnitureStore.sceneObjects)) {
        furnitureStore.sceneObjects.forEach(obj => {
          try {
            if (obj.type === 'floor' || obj.type === 'ceiling') {
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
              console.log(`Ajouté: ${obj.type}`);
            } else if (obj.type === 'wall') {
              const geometry = new THREE.BoxGeometry(
                obj.dimensions?.width || 10,
                obj.dimensions?.height || 10,
                obj.dimensions?.depth || 0.1
              );
              
              const material = new THREE.MeshStandardMaterial({
                color: obj.color || '#E0E0E0',
                transparent: true,
                opacity: 0.7,
                depthWrite: true
              });
              
              const mesh = new THREE.Mesh(geometry, material);
              // Amélioration: ordre de rendu et ombres pour les murs
              mesh.renderOrder = 2; // Rendre APRÈS la grille et le sol
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
              console.log(`Ajouté: ${obj.type}`);
            } else if (obj.type === 'piece') {
              // Gestion des pièces individuelles
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
              
              sceneRef.add(mesh);
              console.log(`Ajouté: ${obj.type}`);
            } else if (obj.type === 'furnitureGroup' && obj.children) {
              const group = new THREE.Group();
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
              
              sceneRef.add(group);
              console.log(`Ajouté: furnitureGroup avec ${obj.children.length} enfants`);
            }
          } catch (objError) {
            console.error("Erreur lors de l'ajout d'un objet:", objError);
          }
        });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la scène:", error);
    }
  }, [furnitureStore.sceneObjects]); // Dépendance uniquement sur sceneObjects
  
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
    
    // Mise à jour du mode d'affichage (wireframe, solid, etc.)
    const updateViewMode = () => {
      const viewMode = furnitureStore.displayOptions?.viewMode || 'solid';
      console.log("Mise à jour du mode d'affichage:", viewMode);
      
      // Appliquer le mode d'affichage à tous les objets pertinents
      sceneRef.traverse(object => {
        if (object instanceof THREE.Mesh && object.material) {
          // Copier le matériau pour éviter de modifier les références partagées
          if (Array.isArray(object.material)) {
            object.material = object.material.map(mat => mat.clone());
          } else {
            object.material = object.material.clone();
          }
          
          // Appliquer les propriétés selon le mode
          if (viewMode === 'wireframe') {
            object.material.wireframe = true;
          } else if (viewMode === 'solid') {
            object.material.wireframe = false;
            object.material.flatShading = true;
          } else if (viewMode === 'realistic') {
            object.material.wireframe = false;
            object.material.flatShading = false;
            // Ajouter d'autres propriétés pour un rendu réaliste si nécessaire
          }
        }
      });
    };
    
    // Exécuter toutes les mises à jour
    updateGridVisibility();
    updateShadows();
    updateViewMode();
    
  }, [furnitureStore.displayOptions, darkMode]); // Dépendance sur displayOptions et darkMode
  
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