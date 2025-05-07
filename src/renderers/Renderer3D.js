// src/renderers/Renderer3D.js
// Garder UNE SEULE importation de Three.js
//import * as THREE from "../node_modules/three/build/three.module.js";
//import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
//import * as THREE from "./node_modules/three/build/three.module.js";
//import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js";
// Importation de Three.js
//import * as THREE from 'three';

// Importation de modules spécifiques
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
/// src/renderers/Renderer3D.js
//import * as THREE from "../../node_modules/three/build/three.module.js";
//import { OrbitControls } from "../../node_modules/three/examples/jsm/controls/OrbitControls.js";
// src/renderers/Renderer3D.js
// Utiliser les importations CDN
//import * as THREE from "https://unpkg.com/three@0.157.0/build/three.module.js";
//import { OrbitControls } from "https://unpkg.com/three@0.157.0/examples/jsm/controls/OrbitControls.js";
//import * as THREE from "https://unpkg.com/three@0.176.0/build/three.module.js";
//import { OrbitControls } from "https://unpkg.com/three@0.176.0/examples/jsm/controls/OrbitControls.js";
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Classe pour gérer le rendu 3D du configurateur de dressing
 */
export class Renderer3D {
  /**
   * Crée une nouvelle instance du moteur de rendu 3D
   * @param {string} containerId - ID du conteneur HTML où le rendu sera affiché
   */
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.furnitureGroup = null;
    this.materialCache = new Map(); // Cache pour les matériaux Three.js
    this.textureLoader = null;
    this.drawerOpenState = new Map(); // État d'ouverture des tiroirs (pour animation)
    this.lightingSetup = 'standard'; // Type d'éclairage (standard, studio, showroom)
    
    // États d'affichage
    this.showDimensions = true;
    this.showLabels = false;
    this.explodedView = false;
    this.explodedFactor = 0;
    
    // Métriques de performance
    this.lastRenderTime = 0;
    this.frameCount = 0;
  }

  /**
   * Initialise le moteur de rendu 3D
   * @return {boolean} Succès de l'initialisation
   */
  initialize() {
    try {
      // Obtenir le conteneur
      this.container = document.getElementById(this.containerId);
      if (!this.container) {
        console.error(`Conteneur avec ID ${this.containerId} non trouvé`);
        return false;
      }
      
      // Créer la scène
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xf0f0f0);
      
      // Créer la caméra
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
      this.camera.position.set(1000, 1000, 1500);
      this.camera.lookAt(0, 0, 0);
      
      // Créer le renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(width, height);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.container.appendChild(this.renderer.domElement);
      
      // Créer les contrôles de caméra
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.25;
      this.controls.screenSpacePanning = false;
      this.controls.minDistance = 500;
      this.controls.maxDistance = 4000;
      this.controls.maxPolarAngle = Math.PI / 2;
      
      // Créer le groupe pour le meuble
      this.furnitureGroup = new THREE.Group();
      this.scene.add(this.furnitureGroup);
      
      // Initialiser le chargeur de textures
      this.textureLoader = new THREE.TextureLoader();
      
      // Ajouter les lumières
      this.setupLighting(this.lightingSetup);
      
      // Ajouter un sol
      this.addFloor();
      
      // Gérer le redimensionnement de la fenêtre
      window.addEventListener('resize', () => this.onWindowResize());
      
      // Démarrer la boucle de rendu
      this.animate();
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du rendu 3D:', error);
      return false;
    }
  }

  /**
   * Crée la configuration d'éclairage de la scène
   * @param {string} setup - Type d'éclairage (standard, studio, showroom)
   */
  setupLighting(setup = 'standard') {
    // Supprimer les lumières existantes
    this.scene.children.forEach(child => {
      if (child instanceof THREE.Light) {
        this.scene.remove(child);
      }
    });
    
    switch (setup) {
      case 'studio':
        // Éclairage de studio (plus doux, ombres subtiles)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const softBox1 = new THREE.DirectionalLight(0xffffff, 0.5);
        softBox1.position.set(1000, 1000, 500);
        softBox1.castShadow = true;
        this.scene.add(softBox1);
        
        const softBox2 = new THREE.DirectionalLight(0xffffff, 0.3);
        softBox2.position.set(-1000, 800, -500);
        softBox2.castShadow = true;
        this.scene.add(softBox2);
        
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.2);
        fillLight.position.set(0, -500, 1000);
        this.scene.add(fillLight);
        break;
        
      case 'showroom':
        // Éclairage de showroom (plus dramatique)
        const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambient);
        
        const spotLight1 = new THREE.SpotLight(0xffffff, 0.8);
        spotLight1.position.set(1000, 1500, 1000);
        spotLight1.angle = Math.PI / 6;
        spotLight1.penumbra = 0.2;
        spotLight1.castShadow = true;
        this.scene.add(spotLight1);
        
        const spotLight2 = new THREE.SpotLight(0xffffee, 0.6);
        spotLight2.position.set(-1000, 1500, -500);
        spotLight2.angle = Math.PI / 6;
        spotLight2.penumbra = 0.2;
        spotLight2.castShadow = false;
        this.scene.add(spotLight2);
        
        const groundReflection = new THREE.DirectionalLight(0xffffff, 0.15);
        groundReflection.position.set(0, -1, 0);
        this.scene.add(groundReflection);
        break;
        
      case 'standard':
      default:
        // Éclairage standard (bon pour visualisation technique)
        const ambient1 = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient1);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.5);
        mainLight.position.set(1000, 1000, 1000);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 500;
        mainLight.shadow.camera.far = 4000;
        mainLight.shadow.camera.left = -2000;
        mainLight.shadow.camera.right = 2000;
        mainLight.shadow.camera.top = 2000;
        mainLight.shadow.camera.bottom = -2000;
        this.scene.add(mainLight);
        
        const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight1.position.set(-1000, 500, -500);
        this.scene.add(fillLight1);
        break;
    }
    
    this.lightingSetup = setup;
  }

  /**
   * Ajoute un sol à la scène
   */
  addFloor() {
    const floorGeometry = new THREE.PlaneGeometry(5000, 5000);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -5;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  /**
   * Gère le redimensionnement de la fenêtre
   */
  onWindowResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }

  /**
   * Boucle d'animation pour le rendu continu
   */
  animate() {
    requestAnimationFrame(() => this.animate());
    
    if (this.controls) {
      this.controls.update();
    }
    
    this.render();
    
    // Calculer les FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastRenderTime > 1000) {
      this.lastRenderTime = now;
      this.frameCount = 0;
    }
  }

  /**
   * Effectue le rendu de la scène
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Met à jour le meuble 3D en fonction du projet
   * @param {FurnitureProject} project - Projet de meuble à afficher
   */
  updateFurniture(project) {
    if (!project) return;
    
    // Effacer le meuble existant
    while (this.furnitureGroup.children.length > 0) {
      const child = this.furnitureGroup.children[0];
      this.furnitureGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
    
    // Créer le nouveau meuble
    this.createFurniture(project);
    
    // Centrer le meuble dans la vue
    this.centerFurnitureInView(project);
  }

  /**
   * Crée le meuble 3D à partir des données du projet
   * @param {FurnitureProject} project - Projet de meuble à afficher
   */
  createFurniture(project) {
    // Créer tous les composants
    project.components.forEach(component => {
      const mesh = this.createComponentMesh(component, project);
      if (mesh) {
        this.furnitureGroup.add(mesh);
      }
    });
    
    // Appliquer la vue éclatée si nécessaire
    if (this.explodedView) {
      this.applyExplodedView(this.explodedFactor);
    }
    
    // Ajouter des indicateurs de dimension si nécessaire
    if (this.showDimensions) {
      this.addDimensionIndicators(project);
    }
    
    // Ajouter des étiquettes si nécessaire
    if (this.showLabels) {
      this.addComponentLabels(project);
    }
  }

  /**
   * Crée un maillage 3D pour un composant
   * @param {Component} component - Composant à afficher
   * @param {FurnitureProject} project - Projet parent
   * @return {THREE.Mesh} Maillage 3D créé
   */
  createComponentMesh(component, project) {
    // Obtenir le matériau Three.js correspondant au matériau du composant
    const material = this.getMaterialForComponent(component, project);
    
    // Position et dimensions du composant
    let width, height, depth, posX, posY, posZ;
    
    // Données par défaut
    width = component.width || 10;
    depth = component.length || 10;
    height = component.thickness || 10;
    posX = 0;
    posY = 0;
    posZ = 0;
    
    // Déterminer le type de composant et ajuster en conséquence
    switch (component.type) {
      case 'panel':
        // Pour les panneaux latéraux
        if (component.id.includes('side_left')) {
          posX = -project.dimensions.width / 2 + component.thickness / 2;
          posY = component.width / 2;
          posZ = -component.length / 2 + project.dimensions.depth / 2;
          width = component.thickness;
          height = component.width;
          depth = component.length;
        } 
        else if (component.id.includes('side_right')) {
          posX = project.dimensions.width / 2 - component.thickness / 2;
          posY = component.width / 2;
          posZ = -component.length / 2 + project.dimensions.depth / 2;
          width = component.thickness;
          height = component.width;
          depth = component.length;
        }
        // Pour les panneaux horizontaux (dessus, bas)
        else if (component.id.includes('top')) {
          posX = 0;
          posY = project.dimensions.height - component.thickness / 2;
          posZ = -component.length / 2 + project.dimensions.depth / 2;
          width = component.width;
          height = component.thickness;
          depth = component.length;
        }
        else if (component.id.includes('bottom')) {
          posX = 0;
          posY = component.thickness / 2;
          posZ = -component.length / 2 + project.dimensions.depth / 2;
          width = component.width;
          height = component.thickness;
          depth = component.length;
        }
        // Pour les séparateurs verticaux
        else if (component.id.includes('divider_')) {
          // Obtenir la position du séparateur
          const dividerIndex = parseInt(component.id.split('_')[1]);
          const divider = project.dividers[dividerIndex];
          if (divider) {
            posX = divider.position - project.dimensions.width / 2;
            posY = component.width / 2;
            posZ = -component.length / 2 + project.dimensions.depth / 2;
            width = component.thickness;
            height = component.width;
            depth = component.length;
          }
        }
        // Pour le fond
        else if (component.id.includes('back')) {
          posX = 0;
          posY = component.width / 2 + component.thickness / 2;
          posZ = -project.dimensions.depth / 2 + component.thickness / 2;
          width = component.length;
          height = component.width;
          depth = component.thickness;
        }
        break;
        
      case 'shelf':
        // Trouver la zone et la position Y
        if (component.metadata && component.metadata.zoneIndex !== undefined) {
          const zone = project.zones.find(z => z.index === component.metadata.zoneIndex);
          if (zone) {
            const shelfIndex = component.metadata.shelfIndex || 0;
            const shelfCount = zone.settings.shelfCount || 1;
            const shelfSpacing = zone.height / (shelfCount + 1);
            const shelfY = (shelfIndex + 1) * shelfSpacing;
            
            posX = zone.position - project.dimensions.width / 2 + zone.width / 2;
            posY = shelfY;
            posZ = -component.length / 2 + project.dimensions.depth / 2;
            
            if (component.metadata.retraction > 0) {
              posZ += component.metadata.retraction / 2;
            }
            
            width = component.width;
            height = component.thickness;
            depth = component.length;
          }
        }
        break;
        
      case 'drawer_front':
        // Trouver la zone et la position Y
        if (component.metadata && component.metadata.zoneIndex !== undefined) {
          const zone = project.zones.find(z => z.index === component.metadata.zoneIndex);
          if (zone) {
            const drawerIndex = component.metadata.drawerIndex || 0;
            const drawerCount = zone.settings.drawerCount || 1;
            const drawerSpacing = zone.height / drawerCount;
            const drawerY = zone.height - (drawerIndex + 0.5) * drawerSpacing;
            
            posX = zone.position - project.dimensions.width / 2 + zone.width / 2;
            posY = drawerY;
            posZ = project.dimensions.depth / 2 - component.thickness / 2;
            
            // Si le tiroir est ouvert, décaler la façade
            if (this.drawerOpenState.get(component.id)) {
              posZ -= 400; // Valeur d'ouverture en mm
            }
            
            width = component.length;
            height = component.width;
            depth = component.thickness;
          }
        }
        break;
        
      // Ajouter d'autres types de composants au besoin
        
      default:
        console.warn(`Type de composant non géré pour le rendu 3D: ${component.type}`);
        return null;
    }
    
    // Créer la géométrie
    const geometry = new THREE.BoxGeometry(width, height, depth);
    
    // Créer le maillage
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(posX, posY, posZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Stocker une référence à l'ID du composant pour les interactions
    mesh.userData.componentId = component.id;
    mesh.userData.componentType = component.type;
    
    return mesh;
  }

  /**
   * Obtient le matériau Three.js pour un composant
   * @param {Component} component - Composant à afficher
   * @param {FurnitureProject} project - Projet parent
   * @return {THREE.Material} Matériau Three.js
   */
  getMaterialForComponent(component, project) {
    // Si pas de matériau défini, utiliser le matériau par défaut du projet
    const materialId = component.materialId || project.materialId;
    
    // Vérifier si le matériau est déjà en cache
    if (this.materialCache.has(materialId)) {
      return this.materialCache.get(materialId);
    }
    
    // Valeurs par défaut
    let color = 0xf5f5dc; // Beige par défaut
    let roughness = 0.7;
    let metalness = 0.0;
    let texture = null;
    
    // Cas spécial pour le matériau "metal" (tringle)
    if (materialId === 'metal') {
      color = 0xc0c0c0;
      roughness = 0.3;
      metalness = 0.8;
    } 
    // Pour d'autres matériaux, essayer de les récupérer depuis le MaterialManager
    else if (window.configurator && window.configurator.materialManager) {
      const materialData = window.configurator.materialManager.getMaterialById(materialId);
      if (materialData) {
        color = new THREE.Color(materialData.color);
        
        // Charger la texture si disponible
        if (materialData.texture) {
          texture = this.textureLoader.load(materialData.texture);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(1, 1);
        }
      }
    }
    
    // Créer le matériau
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness,
      metalness: metalness,
      map: texture
    });
    
    // Mettre en cache pour réutilisation
    this.materialCache.set(materialId, material);
    
    return material;
  }

  /**
   * Centre le meuble dans la vue 3D
   * @param {FurnitureProject} project - Projet de meuble
   */
  centerFurnitureInView(project) {
    // Calculer la boîte englobante
    const boundingBox = new THREE.Box3().setFromObject(this.furnitureGroup);
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    
    // Centrer le groupe dans la scène
    this.furnitureGroup.position.x = -center.x;
    this.furnitureGroup.position.y = -center.y;
    this.furnitureGroup.position.z = -center.z;
    
    // Ajuster la position de la caméra
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5; // Facteur d'ajustement
    
    this.camera.position.set(cameraZ, cameraZ, cameraZ);
    this.camera.lookAt(0, size.y / 2, 0);
    
    // Mettre à jour les contrôles
    this.controls.target.set(0, size.y / 2, 0);
    this.controls.update();
  }

  /**
   * Active ou désactive la vue éclatée du meuble
   * @param {number} factor - Facteur d'explosion (0 = vue normale, 1 = vue éclatée complète)
   */
  applyExplodedView(factor) {
    this.explodedView = (factor > 0);
    this.explodedFactor = Math.max(0, Math.min(1, factor));
    
    // Appliquer l'explosion à tous les composants
    this.furnitureGroup.children.forEach(mesh => {
      if (!mesh.userData.originalPosition) {
        mesh.userData.originalPosition = {
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z
        };
      }
      
      const origPos = mesh.userData.originalPosition;
      
      // Facteur d'explosion différent selon le type de composant
      let explodeDir = new THREE.Vector3(
        origPos.x * this.explodedFactor * 0.7,
        origPos.y * this.explodedFactor * 0.5,
        origPos.z * this.explodedFactor * 0.7
      );
      
      // Cas spéciaux
      if (mesh.userData.componentType === 'drawer_front' || 
          mesh.userData.componentType === 'drawer_side' ||
          mesh.userData.componentType === 'drawer_bottom') {
        // Les tiroirs se déplacent vers l'avant
        explodeDir.z += 300 * this.explodedFactor;
      }
      
      mesh.position.set(
        origPos.x + explodeDir.x,
        origPos.y + explodeDir.y,
        origPos.z + explodeDir.z
      );
    });
  }

  /**
   * Ajoute des indicateurs de dimension au meuble
   * @param {FurnitureProject} project - Projet de meuble
   */
  addDimensionIndicators(project) {
    // Exemple: ajouter des lignes pour montrer les dimensions
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });
    
    // Dimension de la largeur (en bas)
    const widthPoints = [];
    widthPoints.push(new THREE.Vector3(-project.dimensions.width / 2, 0, project.dimensions.depth / 2 + 50));
    widthPoints.push(new THREE.Vector3(project.dimensions.width / 2, 0, project.dimensions.depth / 2 + 50));
    
    const widthGeometry = new THREE.BufferGeometry().setFromPoints(widthPoints);
    const widthLine = new THREE.Line(widthGeometry, material);
    this.furnitureGroup.add(widthLine);
    
    // Dimension de la hauteur (côté droit)
    const heightPoints = [];
    heightPoints.push(new THREE.Vector3(project.dimensions.width / 2 + 50, 0, project.dimensions.depth / 2));
    heightPoints.push(new THREE.Vector3(project.dimensions.width / 2 + 50, project.dimensions.height, project.dimensions.depth / 2));
    
    const heightGeometry = new THREE.BufferGeometry().setFromPoints(heightPoints);
    const heightLine = new THREE.Line(heightGeometry, material);
    this.furnitureGroup.add(heightLine);
    
    // Dimension de la profondeur (côté droit en haut)
    const depthPoints = [];
    depthPoints.push(new THREE.Vector3(project.dimensions.width / 2, project.dimensions.height, -project.dimensions.depth / 2));
    depthPoints.push(new THREE.Vector3(project.dimensions.width / 2, project.dimensions.height, project.dimensions.depth / 2));
    
    const depthGeometry = new THREE.BufferGeometry().setFromPoints(depthPoints);
    const depthLine = new THREE.Line(depthGeometry, material);
    this.furnitureGroup.add(depthLine);
  }

  /**
   * Ajoute des étiquettes de composants au rendu 3D
   * @param {FurnitureProject} project - Projet de meuble
   */
  addComponentLabels(project) {
    // Cette méthode nécessiterait l'utilisation d'un système d'étiquettes HTML ou de sprites Three.js
    // Pour simplifier, elle n'est pas implémentée complètement ici
    console.log('La méthode addComponentLabels() nécessite une implémentation spécifique');
  }

  /**
   * Capture l'état actuel de la vue 3D en tant qu'image
   * @param {number} width - Largeur de l'image (optionnel)
   * @param {number} height - Hauteur de l'image (optionnel)
   * @return {string} URL de données de l'image
   */
  captureImage(width, height) {
    if (!this.renderer) return null;
    
    // Sauvegarder les dimensions actuelles
    const currentWidth = this.renderer.domElement.width;
    const currentHeight = this.renderer.domElement.height;
    
    // Redimensionner le renderer si nécessaire
    if (width && height) {
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
    
    // Rendre la scène
    this.renderer.render(this.scene, this.camera);
    
    // Capturer l'image
    const imageData = this.renderer.domElement.toDataURL('image/png');
    
    // Restaurer les dimensions originales
    if (width && height) {
      this.renderer.setSize(currentWidth, currentHeight);
      this.camera.aspect = currentWidth / currentHeight;
      this.camera.updateProjectionMatrix();
    }
    
    return imageData;
  }

  /**
   * Change l'angle de vue pour une vue prédéfinie
   * @param {string} viewName - Nom de la vue ('front', 'side', 'top', 'iso')
   */
  setViewAngle(viewName) {
    // Calculer la boîte englobante
    const boundingBox = new THREE.Box3().setFromObject(this.furnitureGroup);
    const size = boundingBox.getSize(new THREE.Vector3());
    const center = new THREE.Vector3(0, size.y / 2, 0);
    
    // Distance de la caméra
    const fov = this.camera.fov * (Math.PI / 180);
    const maxDim = Math.max(size.x, size.y, size.z);
    let distance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    distance *= 1.5; // Facteur d'ajustement
    
    switch (viewName) {
      case 'front':
        this.camera.position.set(0, size.y / 2, distance);
        break;
      case 'side':
        this.camera.position.set(distance, size.y / 2, 0);
        break;
      case 'top':
        this.camera.position.set(0, distance, 0);
        break;
      case 'iso':
      default:
        this.camera.position.set(distance * 0.7, distance * 0.7, distance * 0.7);
        break;
    }
    
    this.camera.lookAt(center);
    this.controls.target.copy(center);
    this.controls.update();
  }

  /**
   * Met à jour l'état d'ouverture d'un tiroir
   * @param {string} componentId - ID du composant de façade de tiroir
   * @param {boolean} isOpen - État d'ouverture
   */
  setDrawerOpenState(componentId, isOpen) {
    this.drawerOpenState.set(componentId, isOpen);
    
    // Mettre à jour la vue
    this.furnitureGroup.children.forEach(mesh => {
      if (mesh.userData.componentId === componentId) {
        // Logique d'animation ou de déplacement du tiroir
        // Cette implémentation simplifiée nécessiterait une mise à jour complète
        this.updateFurniture(window.configurator.currentProject);
      }
    });
  }

  /**
   * Change le schéma de couleurs pour un aperçu de matériaux spécifiques
   * @param {string} materialId - ID du matériau à prévisualiser
   * @param {boolean} applyToAll - Appliquer à tous les composants
   * @param {FurnitureProject} project - Projet de meuble
   */
  previewMaterial(materialId, applyToAll, project) {
    if (!project) return;
    
    // Récupérer le matériau
    const material = this.getMaterialForComponent({ materialId: materialId }, project);
    
    // Appliquer le matériau en prévisualisation
    this.furnitureGroup.children.forEach(mesh => {
      if (applyToAll) {
        mesh.material = material;
      } else {
        // Appliquer uniquement aux composants sélectionnés
        // Cette logique dépendrait de votre système de sélection
      }
    });
  }

  /**
   * Nettoie les ressources du renderer
   */
  dispose() {
    // Supprimer l'écouteur d'événement de redimensionnement
    window.removeEventListener('resize', this.onWindowResize);
    
    // Supprimer tous les objets de la scène
    this.scene.traverse(object => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => {
            Object.values(material).forEach(property => {
              if (property && typeof property.dispose === 'function') {
                property.dispose();
              }
            });
            material.dispose();
          });
        } else {
          Object.values(object.material).forEach(property => {
            if (property && typeof property.dispose === 'function') {
              property.dispose();
            }
          });
          object.material.dispose();
        }
      }
    });
    
    // Supprimer le rendu
    if (this.renderer) {
      this.renderer.dispose();
      if (this.container) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
    
    // Vider le cache des matériaux
    this.materialCache.clear();
    
    // Supprimer les références
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.furnitureGroup = null;
    this.textureLoader = null;
  }
}