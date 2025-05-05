// src/components/furniture3d/FurnitureDesigner/utils/geometryHelpers.js
import * as THREE from 'three';

// Convertir les millimètres en unités Three.js
export const mmToUnits = (mm) => mm / 10;

// Créer un matériau Three.js à partir des propriétés d'un matériau OptiCoupe
export const createMaterialFromProperties = (material) => {
  if (!material) {
    // Matériau par défaut si aucun n'est fourni
    return new THREE.MeshStandardMaterial({
      color: '#b0bec5',
      roughness: 0.7,
      metalness: 0.1
    });
  }

  // Extraire la couleur ou utiliser une couleur par défaut
  let color = '#b0bec5';
  
  if (material.color) {
    color = material.color;
  } else if (material.name) {
    // Générer une couleur pseudo-aléatoire basée sur le nom du matériau
    const hash = [...material.name].reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    color = `hsl(${hash % 360}, 70%, 70%)`;
  }

  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: material.roughness || 0.7,
    metalness: material.metalness || 0.1,
    side: THREE.DoubleSide // Visible des deux côtés
  });
};

// Créer un mesh 3D à partir d'une pièce 2D
export const createPieceMesh = (piece, material, position = [0, 0, 0], rotation = [0, 0, 0]) => {
  if (!piece) return null;

  // Extraire les dimensions (convertir en mm si nécessaire)
  const width = mmToUnits(piece.width || piece.length || 0);
  const length = mmToUnits(piece.length || piece.width || 0);
  const thickness = mmToUnits(piece.thickness || 18); // Épaisseur par défaut: 18mm
  
  // Créer la géométrie (un simple cube)
  const geometry = new THREE.BoxGeometry(width, thickness, length);
  
  // Créer le matériau
  const meshMaterial = createMaterialFromProperties(material);
  
  // Créer le mesh
  const mesh = new THREE.Mesh(geometry, meshMaterial);
  
  // Positionner et orienter le mesh
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  
  // Ajouter des métadonnées pour référence
  mesh.userData = {
    id: piece.id,
    type: 'piece',
    width: piece.width,
    length: piece.length,
    thickness: piece.thickness,
    description: piece.description,
    materialId: piece.materialId
  };
  
  return mesh;
};

// Fonction pour générer un ID unique
export const generateUniqueId = () => {
  return Math.random().toString(36).substring(2, 11);
};

// Convertir des degrés en radians
export const degToRad = (degrees) => degrees * (Math.PI / 180);