// src/components/furniture3d/FurnitureDesigner/Scene3D.js
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useFurnitureStore } from './store';

const Scene3D = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const objectsRef = useRef({});
  
  const { 
    sceneObjects, 
    cameraPosition, 
    setCameraPosition,
    displayOptions,
    selectedObjectId,
    setSelectedObjectId
  } = useFurnitureStore();
  
  // Initialisation de la scène
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Création de la scène
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(displayOptions.backgroundColor || 0xf0f0f0);
    sceneRef.current = scene;
    
    // Création de la caméra
    const camera = new THREE.PerspectiveCamera(
      50, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(...cameraPosition);
    cameraRef.current = camera;
    
    // Création du renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = displayOptions.showShadows;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Contrôles de caméra
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2;
    controlsRef.current = controls;
    
    // Éclairage
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = displayOptions.showShadows;
    scene.add(directionalLight);
    
    // Grid et axes
    if (displayOptions.showGrid) {
      const gridHelper = new THREE.GridHelper(
        20, 
        20, 
        0x888888, 
        0xcccccc
      );
      scene.add(gridHelper);
    }
    
    if (displayOptions.showAxes) {
      const axesHelper = new THREE.AxesHelper(5);
      scene.add(axesHelper);
    }
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();
    
    // Gestion du redimensionnement
    const handleResize = () => {
      if (
        containerRef.current && 
        cameraRef.current && 
        rendererRef.current
      ) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        
        rendererRef.current.setSize(width, height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Nettoyage
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Nettoyage des objets Three.js
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.geometry) {
            object.geometry.dispose();
          }
          
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, [cameraPosition, displayOptions]);
  
  // Fonction pour créer un mesh sans rotation
  const createMeshForObject = (obj, applyRotation = true) => {
    let mesh;
    
    // Récupération de l'opacité globale du meuble (si définie)
    const furnitureOpacity = displayOptions.furnitureOpacity !== undefined 
      ? displayOptions.furnitureOpacity 
      : 1.0;
      
    // Opacité spécifique à la pièce (prioritaire si définie)
    const pieceOpacity = obj.piece && obj.piece.opacity !== undefined 
      ? obj.piece.opacity 
      : furnitureOpacity;
    
    // Transparence activée si opacité < 1
    const isTransparent = pieceOpacity < 1.0;
    
    switch (obj.type) {
      case 'floor':
      case 'ceiling':
        // Plan pour le sol et le plafond
        const planeGeometry = new THREE.PlaneGeometry(
          obj.dimensions.width,
          obj.dimensions.height
        );
        
        const planeMaterial = new THREE.MeshStandardMaterial({
          color: obj.color,
          side: THREE.DoubleSide
        });
        
        mesh = new THREE.Mesh(planeGeometry, planeMaterial);
        mesh.position.set(...obj.position);
        if (applyRotation) {
          mesh.rotation.set(...obj.rotation);
        }
        break;
        
      case 'wall':
        // Box pour les murs
        const wallGeometry = new THREE.BoxGeometry(
          obj.dimensions.width,
          obj.dimensions.height,
          obj.dimensions.depth
        );
        
        const wallMaterial = new THREE.MeshStandardMaterial({
          color: obj.color,
          transparent: true,
          opacity: 0.85
        });
        
        mesh = new THREE.Mesh(wallGeometry, wallMaterial);
        mesh.position.set(...obj.position);
        if (applyRotation) {
          mesh.rotation.set(...obj.rotation);
        }
        break;
        
      case 'piece':
        // Pour les pièces du meuble
        const pieceGeometry = new THREE.BoxGeometry(1, 1, 1);
        const pieceMaterial = new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          transparent: isTransparent,
          opacity: pieceOpacity,
          // Configuration améliorée pour la transparence
          depthWrite: !isTransparent,
          side: isTransparent ? THREE.DoubleSide : THREE.FrontSide
        });
        
        mesh = new THREE.Mesh(pieceGeometry, pieceMaterial);
        mesh.position.set(...obj.position);
        
        if (applyRotation && obj.rotation) {
          mesh.rotation.set(...obj.rotation);
        }
        
        if (obj.dimensions) {
          mesh.scale.set(
            obj.dimensions.width,
            obj.dimensions.height,
            obj.dimensions.depth
          );
        }
        break;
        
      case 'rod':
        // Pour les tringles
        const rodGeometry = new THREE.CylinderGeometry(
          obj.dimensions.height / 2,
          obj.dimensions.height / 2,
          obj.dimensions.width,
          32
        );
        const rodMaterial = new THREE.MeshStandardMaterial({
          color: 0xCCCCCC,
          metalness: 0.7,
          roughness: 0.2,
          transparent: isTransparent,
          opacity: pieceOpacity
        });
        
        mesh = new THREE.Mesh(rodGeometry, rodMaterial);
        mesh.position.set(...obj.position);
        // Rotation pour que le cylindre soit horizontal
        mesh.rotation.set(0, 0, Math.PI / 2);
        if (applyRotation && obj.rotation) {
          const rotation = new THREE.Euler(...obj.rotation);
          mesh.rotation.x += rotation.x;
          mesh.rotation.y += rotation.y;
          mesh.rotation.z += rotation.z;
        }
        break;
        
      case 'door':
        // Pour les portes
        const doorGeometry = new THREE.BoxGeometry(1, 1, 1);
        const doorMaterial = new THREE.MeshStandardMaterial({
          color: 0xAAAAAA,
          transparent: isTransparent,
          opacity: pieceOpacity
        });
        
        mesh = new THREE.Mesh(doorGeometry, doorMaterial);
        mesh.position.set(...obj.position);
        if (applyRotation && obj.rotation) {
          mesh.rotation.set(...obj.rotation);
        }
        
        if (obj.dimensions) {
          mesh.scale.set(
            obj.dimensions.width,
            obj.dimensions.height,
            obj.dimensions.depth
          );
        }
        break;
        
      default:
        return null;
    }
    
    // Ajouter ID et propriétés pour la sélection
    if (mesh) {
      mesh.userData.id = obj.id;
      mesh.userData.type = obj.type;
      
      // Stocker des informations supplémentaires pour la transparence
      mesh.userData.pieceOpacity = pieceOpacity;
      mesh.userData.isTransparent = isTransparent;
    }
    
    return mesh;
  };
  
  // Mise à jour des objets de la scène
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Supprimer les anciens objets
    Object.keys(objectsRef.current).forEach(key => {
      const obj = objectsRef.current[key];
      if (obj && sceneRef.current) {
        sceneRef.current.remove(obj);
      }
      
      if (obj && obj.geometry) {
        obj.geometry.dispose();
      }
      
      if (obj && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(material => material.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    
    // Réinitialiser la référence des objets
    objectsRef.current = {};
    
    // Ajouter les nouveaux objets
    sceneObjects.forEach(obj => {
      // Traitement spécial pour les groupes de meuble
      if (obj.type === 'furnitureGroup') {
        // Créer un groupe pour le meuble
        const group = new THREE.Group();
        group.position.set(...obj.position);
        group.rotation.set(...obj.rotation);
        
        // Ajouter toutes les pièces du meuble au groupe
        obj.children.forEach(childObj => {
          let childMesh = createMeshForObject(childObj, false);
          if (childMesh) {
            // Stocker l'ID original du childMesh pour la sélection
            const originalId = childMesh.userData.id;
            
            group.add(childMesh);
            
            // Mettre à jour les références pour inclure les enfants
            objectsRef.current[originalId] = childMesh;
          }
        });
        
        // Ajouter le groupe à la scène et aux références
        group.userData.id = obj.id;
        group.userData.type = obj.type;
        sceneRef.current.add(group);
        objectsRef.current[obj.id] = group;
      } else {
        // Traitement normal pour les autres types d'objets
        let mesh = createMeshForObject(obj);
        
        if (mesh) {
          // Ajouter à la scène et aux références
          sceneRef.current.add(mesh);
          objectsRef.current[obj.id] = mesh;
        }
      }
    });
    
  }, [sceneObjects, displayOptions]);
  
  // Mise à jour de la position de la caméra
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.position.set(...cameraPosition);
    }
  }, [cameraPosition]);
  
  // Mise à jour de la sélection
  useEffect(() => {
    Object.keys(objectsRef.current).forEach(key => {
      const obj = objectsRef.current[key];
      if (obj) {
        // Réinitialiser le matériau
        if (obj.type === 'furnitureGroup') {
          // Pour les groupes, parcourir les enfants
          obj.children.forEach(child => {
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(material => {
                  material.emissive = new THREE.Color(0x000000);
                });
              } else {
                child.material.emissive = new THREE.Color(0x000000);
              }
            }
          });
        } else if (obj.material) {
          // Pour les objets simples
          if (Array.isArray(obj.material)) {
            obj.material.forEach(material => {
              material.emissive = new THREE.Color(0x000000);
            });
          } else {
            obj.material.emissive = new THREE.Color(0x000000);
          }
        }
      }
    });
    
    // Mettre en surbrillance l'objet sélectionné
    if (selectedObjectId && objectsRef.current[selectedObjectId]) {
      const obj = objectsRef.current[selectedObjectId];
      
      if (obj.type === 'furnitureGroup') {
        // Pour les groupes, mettre en surbrillance tous les enfants
        obj.children.forEach(child => {
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => {
                material.emissive = new THREE.Color(0x333333);
              });
            } else {
              child.material.emissive = new THREE.Color(0x333333);
            }
          }
        });
      } else if (obj.material) {
        // Pour les objets simples
        if (Array.isArray(obj.material)) {
          obj.material.forEach(material => {
            material.emissive = new THREE.Color(0x333333);
          });
        } else {
          obj.material.emissive = new THREE.Color(0x333333);
        }
      }
    }
  }, [selectedObjectId]);
  
  // Gestion des clics pour la sélection
  useEffect(() => {
    if (!containerRef.current || !sceneRef.current || !cameraRef.current) {
      return;
    }
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const handleClick = (event) => {
      // Calculer la position de la souris
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;
      
      // Lancer un rayon
      raycaster.setFromCamera(mouse, cameraRef.current);
      
      // Obtenir les intersections
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
      
      if (intersects.length > 0) {
        const selected = intersects[0].object;
        let selectId = null;
        
        // Vérifier si l'objet a un ID utilisateur
        if (selected.userData && selected.userData.id) {
          selectId = selected.userData.id;
        } else {
          // Chercher dans les parents
          let parent = selected.parent;
          while(parent && !selectId) {
            if (parent.userData && parent.userData.id) {
              selectId = parent.userData.id;
            }
            parent = parent.parent;
          }
        }
        
        if (selectId) {
          setSelectedObjectId(selectId);
        }
      } else {
        setSelectedObjectId(null);
      }
    };
    
    containerRef.current.addEventListener('click', handleClick);
    
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('click', handleClick);
      }
    };
  }, [setSelectedObjectId]);
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'absolute',
        top: 0,
        left: 0
      }}
    />
  );
};

export default Scene3D;