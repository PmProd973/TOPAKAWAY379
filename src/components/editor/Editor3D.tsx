import React, { useRef, createContext, useContext, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { usePanelData } from '../../store/appStore';
import { Operation } from '../../types/models';
import './editor3d.css'; // Importation du fichier CSS

// Constantes pour les couleurs
const COLORS = {
  PANEL: '#b0905f',
  DRILLING: '#ff4d4d',
  CONTOUR: '#4dabf7',
  CLOSED_POCKET: '#40c057',
  OPEN_POCKET: '#ff922b',
  SELECTED: '#ffef40',
  ORIGIN: {
    X: '#ff0000',
    Y: '#00ff00',
    Z: '#0000ff'
  },
  TOOL_PATH: '#ff00ff'
};

// Contexte pour partager les dimensions avec tous les composants enfants
const DimensionsContext = createContext({ longueur: 500, largeur: 300, epaisseur: 18 });

interface Editor3DProps {
  onSelectOperation: (index: number) => void;
  selectedOperationIndex: number;
}

// Composant pour configurer la caméra isométrique avec contrôles optimisés
const CameraControls = () => {
  const { camera, gl, scene } = useThree();
  const controlsRef = useRef<any>(null);
  
  // Calculer la taille de la scène pour ajuster les limites de caméra
  useEffect(() => {
    // Calcul de la boîte englobante de la scène
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    
    // Ajuster la caméra pour voir toute la scène
    camera.near = 0.1;
    camera.far = maxDimension * 100; // Vue très lointaine
    camera.updateProjectionMatrix();
    
    // Rendre la fonction resetView disponible sur l'élément DOM de rendu
    (gl.domElement as any).resetCameraView = () => {
      camera.position.set(500, 500, 500);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    };
    
    return () => {
      delete (gl.domElement as any).resetCameraView;
    };
  }, [camera, gl, scene]);
  
  return (
    <OrbitControls 
      ref={controlsRef}
      enableDamping 
      dampingFactor={0.1} 
      minDistance={5}
      maxDistance={50000}  // Valeur extrêmement élevée pour permettre un zoom arrière très important
      minPolarAngle={Math.PI / 8}
      maxPolarAngle={Math.PI * 3/4}
      screenSpacePanning={true}
      zoomSpeed={0.7}  // Réduit la sensibilité de la molette pour un zoom plus progressif
      target={[0, 0, 0]}
    />
  );
};

// Composant pour créer une grille étendue
const ExtendedGrid = () => {
  return (
    <>
      {/* Grille principale */}
      <Grid 
        cellSize={50}
        sectionSize={200}
        infiniteGrid
        fadeDistance={20000} // Très grande distance de fondu
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        cellThickness={0.5}
        sectionThickness={1}
        sectionColor="#2080ff"
        fadeStrength={0.5}
      />
      
      {/* Grille secondaire plus grande pour référence lors des zooms extrêmes */}
      <Grid 
        cellSize={1000}
        sectionSize={5000}
        infiniteGrid
        fadeDistance={100000} // Distance de fondu extrême
        position={[0, 0, -1]} // Juste en-dessous de la grille principale
        rotation={[Math.PI / 2, 0, 0]}
        cellThickness={1}
        sectionThickness={2}
        sectionColor="#ff4080"
        fadeStrength={0.3}
      />
    </>
  );
};

// Composant pour configurer l'éclairage
const Lighting = ({ showShadows }: { showShadows: boolean }) => {
  return (
    <>
      {/* Lumière ambiante plus intense pour un éclairage global */}
      <ambientLight intensity={0.9} />
      
      {/* Lumières directionnelles depuis différents angles */}
      <directionalLight 
        position={[500, 500, 500]} 
        intensity={0.6} 
        castShadow={showShadows}
      />
      <directionalLight 
        position={[-500, 500, 500]} 
        intensity={0.5} 
        castShadow={showShadows}
      />
      <directionalLight 
        position={[0, -500, 500]} 
        intensity={0.4} 
        castShadow={showShadows}
      />
      
      {/* Lumière hémisphérique pour simuler la réflexion du ciel/sol */}
      <hemisphereLight 
        args={['#ffffff', '#ffffbb', 0.6]} 
        position={[0, 0, 500]} 
      />
    </>
  );
};

// Composant pour gérer le fond
const SceneBackground = ({ color }: { color: string }) => {
  const { scene } = useThree();
  
  useEffect(() => {
    scene.background = new THREE.Color(color);
    scene.fog = null; // Désactiver le brouillard pour voir à l'infini
  }, [scene, color]);
  
  return null;
};

// Composant pour la barre de menu en haut
const TopMenuBar = ({ 
  bgColor, 
  setBgColor, 
  showShadows, 
  setShowShadows, 
  showGrid, 
  setShowGrid, 
  resetView
}: { 
  bgColor: string;
  setBgColor: (color: string) => void;
  showShadows: boolean;
  setShowShadows: (show: boolean) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  resetView: () => void;
}) => {
  // Options de couleurs de fond
  const backgroundOptions = [
    { label: 'Blanc', value: '#ffffff' },
    { label: 'Gris clair', value: '#f0f0f0' },
    { label: 'Bleu ciel', value: '#e6f7ff' },
    { label: 'Noir', value: '#000000' },
    { label: 'Gris foncé', value: '#333333' },
  ];
  
  return (
    <div className="editor3d-menu">
      <div className="editor3d-menu-title">
        Vue 3D:
      </div>
      
      <div className="editor3d-menu-group">
        <span className="editor3d-menu-label">Fond:</span>
        <select 
          className="editor3d-menu-select"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
        >
          {backgroundOptions.map(option => (
            <option key={option.value} value={option.value} className="editor3d-menu-option">
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="editor3d-menu-checkboxes">
        <label className="editor3d-menu-checkbox-label">
          <input 
            type="checkbox" 
            className="editor3d-menu-checkbox"
            checked={showGrid}
            onChange={() => setShowGrid(!showGrid)}
          />
          Grille
        </label>
        
        <label className="editor3d-menu-checkbox-label">
          <input 
            type="checkbox" 
            className="editor3d-menu-checkbox"
            checked={showShadows}
            onChange={() => setShowShadows(!showShadows)}
          />
          Ombres
        </label>
      </div>
      
      <div className="editor3d-menu-reset-container">
        <button 
          className="editor3d-menu-reset-btn"
          onClick={resetView}
        >
          Réinitialiser vue
        </button>
      </div>
    </div>
  );
};

const Editor3D: React.FC<Editor3DProps> = ({ 
  onSelectOperation, 
  selectedOperationIndex 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bgColor, setBgColor] = useState('#ffffff'); // Fond blanc par défaut
  const [showShadows, setShowShadows] = useState(false); // Ombres désactivées par défaut
  const [showGrid, setShowGrid] = useState(true); // Grille visible par défaut
  
  // Fonction de reset qui peut être appelée depuis l'extérieur du Canvas
  const resetView = () => {
    if (containerRef.current) {
      // Trouver l'élément canvas à l'intérieur du conteneur
      const canvasElement = containerRef.current.querySelector('canvas');
      if (canvasElement && (canvasElement as any).resetCameraView) {
        (canvasElement as any).resetCameraView();
      }
    }
  };
  
  return (
    <div className="editor3d-container" ref={containerRef}>
      <Canvas
        camera={{ position: [500, 500, 500], fov: 50, near: 0.1, far: 100000 }}
        shadows={showShadows}
        gl={{ antialias: true }}
        dpr={[1, 2]} // Optimise pour les écrans haute résolution
        performance={{ min: 0.5 }} // Améliore les performances
      >
        <SceneBackground color={bgColor} />
        <Lighting showShadows={showShadows} />
        <SceneContent 
          onSelectOperation={onSelectOperation}
          selectedOperationIndex={selectedOperationIndex}
          showShadows={showShadows}
        />
        
        {/* Grille conditionnelle */}
        {showGrid && <ExtendedGrid />}
        
        <CameraControls />
      </Canvas>
      
      {/* Barre de menu en haut */}
      <TopMenuBar 
        bgColor={bgColor}
        setBgColor={setBgColor}
        showShadows={showShadows}
        setShowShadows={setShowShadows}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        resetView={resetView}
      />
      
      {/* Indicateur de zoom en bas à gauche */}
      <div className="editor3d-zoom-indicator">
        Utilisez la molette pour zoomer/dézoomer
      </div>
    </div>
  );
};

interface SceneContentProps {
  onSelectOperation: (index: number) => void;
  selectedOperationIndex: number;
  showShadows: boolean;
}

const SceneContent: React.FC<SceneContentProps> = ({
  onSelectOperation,
  selectedOperationIndex,
  showShadows
}) => {
  const panelData = usePanelData();
  const { dimensions, operations } = panelData;
  
  // Centre la pièce sur l'origine
  const centerX = 0;
  const centerY = 0;
  
  return (
    <DimensionsContext.Provider value={dimensions}>
      <group position={[centerX, centerY, 0]}>
        {/* Panel - placé à plat sur la grille */}
        <mesh 
          position={[0, 0, dimensions.epaisseur/2]}
          receiveShadow={showShadows}
        >
          <boxGeometry args={[dimensions.longueur, dimensions.largeur, dimensions.epaisseur]} />
          <meshStandardMaterial 
            color={COLORS.PANEL} 
            roughness={0.7}
            metalness={0.2}
          />
        </mesh>
        
        {/* Operations */}
        {operations.map((operation, index) => (
          <OperationVisualizer
            key={index}
            operation={operation}
            isSelected={index === selectedOperationIndex}
            onClick={() => onSelectOperation(index)}
            showShadows={showShadows}
          />
        ))}
        
        {/* Origin */}
        <OriginVisualizer />
      </group>
    </DimensionsContext.Provider>
  );
};

// Hook pour utiliser les dimensions
const useDimensions = () => useContext(DimensionsContext);

interface OperationVisualizerProps {
  operation: Operation;
  isSelected: boolean;
  onClick: () => void;
  showShadows: boolean;
}

const OperationVisualizer: React.FC<OperationVisualizerProps> = ({
  operation,
  isSelected,
  onClick,
  showShadows
}) => {
  switch (operation.type) {
    case 'perçage':
      return (
        <DrillVisualizer 
          operation={operation} 
          isSelected={isSelected} 
          onClick={onClick} 
          showShadows={showShadows}
        />
      );
    case 'contournage':
      return (
        <ContourVisualizer 
          operation={operation} 
          isSelected={isSelected} 
          onClick={onClick} 
          showShadows={showShadows}
        />
      );
    case 'poche_fermee':
      return (
        <ClosedPocketVisualizer 
          operation={operation} 
          isSelected={isSelected} 
          onClick={onClick} 
          showShadows={showShadows}
        />
      );
    case 'poche_ouverte':
      return (
        <OpenPocketVisualizer 
          operation={operation} 
          isSelected={isSelected} 
          onClick={onClick} 
          showShadows={showShadows}
        />
      );
    default:
      return null;
  }
};

// Interfaces pour les visualiseurs d'opérations
interface DrillVisualizerProps {
  operation: Operation & { type: 'perçage' };
  isSelected: boolean;
  onClick: () => void;
  showShadows: boolean;
}

interface ContourVisualizerProps {
  operation: Operation & { type: 'contournage' };
  isSelected: boolean;
  onClick: () => void;
  showShadows: boolean;
}

interface ClosedPocketVisualizerProps {
  operation: Operation & { type: 'poche_fermee' };
  isSelected: boolean;
  onClick: () => void;
  showShadows: boolean;
}

interface OpenPocketVisualizerProps {
  operation: Operation & { type: 'poche_ouverte' };
  isSelected: boolean;
  onClick: () => void;
  showShadows: boolean;
}

// Visualiseur de perçage
const DrillVisualizer: React.FC<DrillVisualizerProps> = ({ 
  operation, 
  isSelected, 
  onClick, 
  showShadows 
}) => {
  const { x, y, diametre, profondeur } = operation;
  const dimensions = useDimensions();
  
  return (
    <mesh 
      position={[x, y, dimensions.epaisseur - profondeur/2]} 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      castShadow={showShadows}
    >
      <cylinderGeometry args={[diametre/2, diametre/2, profondeur, 32]} />
      <meshStandardMaterial 
        color={isSelected ? COLORS.SELECTED : COLORS.DRILLING} 
        transparent 
        opacity={0.7} 
        roughness={0.3}
        metalness={0.0}
      />
    </mesh>
  );
};

// Visualiseur de contour
const ContourVisualizer: React.FC<ContourVisualizerProps> = ({ 
  operation, 
  isSelected, 
  onClick, 
  showShadows 
}) => {
  const { chemin, profondeur } = operation;
  const dimensions = useDimensions();
  
  // Convertir le chemin en forme Three.js
  const shape = new THREE.Shape();
  chemin.forEach((point, i) => {
    if (i === 0) {
      shape.moveTo(point[0], point[1]);
    } else {
      shape.lineTo(point[0], point[1]);
    }
  });
  
  if (operation.ferme) {
    shape.closePath();
  }
  
  // Configuration d'extrusion pour le contour
  const extrudeSettings = {
    depth: 2,
    bevelEnabled: false
  };
  
  return (
    <group>
      <mesh
        position={[0, 0, dimensions.epaisseur]} // Placé sur la surface supérieure
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        castShadow={showShadows}
      >
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial 
          color={isSelected ? COLORS.SELECTED : COLORS.CONTOUR}
          transparent
          opacity={0.7}
          roughness={0.3}
          metalness={0.0}
        />
      </mesh>
      
      {/* Affichage du parcours d'outil si sélectionné */}
      {isSelected && <ToolpathVisualizer operation={operation} />}
    </group>
  );
};

// Visualiseur de poche fermée
const ClosedPocketVisualizer: React.FC<ClosedPocketVisualizerProps> = ({ 
  operation, 
  isSelected, 
  onClick, 
  showShadows 
}) => {
  const { chemin, profondeur } = operation;
  const dimensions = useDimensions();
  
  // Convertir le chemin en forme Three.js
  const shape = new THREE.Shape();
  chemin.forEach((point, i) => {
    if (i === 0) {
      shape.moveTo(point[0], point[1]);
    } else {
      shape.lineTo(point[0], point[1]);
    }
  });
  
  shape.closePath();
  
  // Configuration d'extrusion pour la poche
  const extrudeSettings = {
    depth: profondeur,
    bevelEnabled: false
  };
  
  return (
    <mesh
      position={[0, 0, dimensions.epaisseur - profondeur/2]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      castShadow={showShadows}
    >
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial 
        color={isSelected ? COLORS.SELECTED : COLORS.CLOSED_POCKET}
        transparent
        opacity={0.7}
        roughness={0.3}
        metalness={0.0}
      />
    </mesh>
  );
};

// Visualiseur de poche ouverte 
const OpenPocketVisualizer: React.FC<OpenPocketVisualizerProps> = ({ 
  operation, 
  isSelected, 
  onClick, 
  showShadows 
}) => {
  const dimensions = useDimensions();
  
  // Implémentation simplifiée, à améliorer plus tard
  return (
    <group
      position={[0, 0, dimensions.epaisseur]} // Placé sur la surface supérieure
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Implémentation basique pour l'instant */}
      {operation.chemin.map((point, i) => (
        <mesh 
          key={i} 
          position={[point[0], point[1], 0]}
          castShadow={showShadows}
        >
          <sphereGeometry args={[3, 16, 16]} />
          <meshStandardMaterial 
            color={isSelected ? COLORS.SELECTED : COLORS.OPEN_POCKET}
            roughness={0.3}
            metalness={0.0}
          />
        </mesh>
      ))}
    </group>
  );
};

// Visualiseur de parcours d'outil
const ToolpathVisualizer: React.FC<{
  operation: Operation & { type: 'contournage' };
}> = ({ operation }) => {
  const { chemin, multiPass, profondeur, profondeurPasse } = operation;
  const dimensions = useDimensions();
  
  // Créer les points du parcours
  const points = chemin.map(point => new THREE.Vector3(point[0], point[1], dimensions.epaisseur));
  
  // Si le contour est fermé, ajouter le premier point à la fin
  if (operation.ferme) {
    points.push(new THREE.Vector3(chemin[0][0], chemin[0][1], dimensions.epaisseur));
  }
  
  // Si multi-passes, calculer les niveaux
  const multiPassLines = [];
  if (multiPass && profondeurPasse) {
    const niveaux = Math.ceil(profondeur / profondeurPasse);
    
    for (let i = 0; i < niveaux; i++) {
      const z = dimensions.epaisseur - Math.min((i + 1) * profondeurPasse, profondeur);
      const levelPoints = points.map(point => 
        new THREE.Vector3(point.x, point.y, z)
      );
      
      multiPassLines.push(
        <line key={`pass-${i}`}>
          <bufferGeometry>
            <float32BufferAttribute attach="attributes-position" args={[new Float32Array(levelPoints.flatMap(p => [p.x, p.y, p.z])), 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={COLORS.TOOL_PATH} opacity={0.5} transparent />
        </line>
      );
    }
  }
  
  return (
    <group>
      <line>
        <bufferGeometry>
          <float32BufferAttribute attach="attributes-position" args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={COLORS.TOOL_PATH} />
      </line>
      
      {multiPassLines}
    </group>
  );
};

// Visualiseur de l'origine
const OriginVisualizer: React.FC = () => {
  const axisLength = 100;
  const dimensions = useDimensions();
  
  return (
    <group position={[0, 0, dimensions.epaisseur]}>
      {/* Axe X (rouge) */}
      <line>
        <bufferGeometry>
          <float32BufferAttribute 
            attach="attributes-position" 
            args={[new Float32Array([0, 0, 0, axisLength, 0, 0]), 3]} 
          />
        </bufferGeometry>
        <lineBasicMaterial color={COLORS.ORIGIN.X} linewidth={2} />
      </line>
      
      {/* Axe Y (vert) */}
      <line>
        <bufferGeometry>
          <float32BufferAttribute 
            attach="attributes-position" 
            args={[new Float32Array([0, 0, 0, 0, axisLength, 0]), 3]} 
          />
        </bufferGeometry>
        <lineBasicMaterial color={COLORS.ORIGIN.Y} linewidth={2} />
      </line>
      
      {/* Axe Z (bleu) */}
      <line>
        <bufferGeometry>
          <float32BufferAttribute 
            attach="attributes-position" 
            args={[new Float32Array([0, 0, 0, 0, 0, axisLength]), 3]} 
          />
        </bufferGeometry>
        <lineBasicMaterial color={COLORS.ORIGIN.Z} linewidth={2} />
      </line>
    </group>
  );
};

export default Editor3D;