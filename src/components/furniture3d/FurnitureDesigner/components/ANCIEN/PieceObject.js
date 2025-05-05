// src/components/furniture3d/FurnitureDesigner/components/PieceObject.jsx
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFurnitureStore } from '../store';
import * as THREE from 'three';

const PieceObject = ({ piece, material, position = [0, 0, 0], rotation = [0, 0, 0] }) => {
  const mesh = useRef();
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  const { selectedObjectId, selectObject, editMode } = useFurnitureStore();
  
  // Vérifier si cette pièce est sélectionnée
  const isSelected = selectedObjectId === piece.id;
  
  // Convertir mm en unités Three.js 
  const width = piece.width / 10;
  const length = piece.length / 10;
  const thickness = piece.thickness / 10;
  
  // Animation subtle lors du survol
  useFrame(() => {
    if (mesh.current) {
      if (hovered && !active) {
        mesh.current.scale.x = THREE.MathUtils.lerp(mesh.current.scale.x, 1.05, 0.1);
        mesh.current.scale.y = THREE.MathUtils.lerp(mesh.current.scale.y, 1.05, 0.1);
        mesh.current.scale.z = THREE.MathUtils.lerp(mesh.current.scale.z, 1.05, 0.1);
      } else {
        mesh.current.scale.x = THREE.MathUtils.lerp(mesh.current.scale.x, 1, 0.1);
        mesh.current.scale.y = THREE.MathUtils.lerp(mesh.current.scale.y, 1, 0.1);
        mesh.current.scale.z = THREE.MathUtils.lerp(mesh.current.scale.z, 1, 0.1);
      }
    }
  });

  // Déterminer la couleur du matériau
  let color = '#b0bec5';
  if (material && material.color) {
    color = material.color;
  }
  
  return (
    <mesh
      ref={mesh}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        setActive(!active);
        selectObject(piece.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      <boxGeometry args={[width, thickness, length]} />
      <meshStandardMaterial 
        color={color} 
        metalness={0.1}
        roughness={0.7}
        {...(isSelected && { emissive: '#404040' })}
        {...(hovered && { emissive: '#202020' })}
      />
      
      {/* Contour de sélection */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(width * 1.01, thickness * 1.01, length * 1.01)]} />
          <lineBasicMaterial attach="material" color="#ff9800" linewidth={2} />
        </lineSegments>
      )}
    </mesh>
  );
};

export default PieceObject;