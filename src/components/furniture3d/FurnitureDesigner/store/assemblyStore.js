// src/components/furniture3d/FurnitureDesigner/store/assemblyStore.js
import { create } from 'zustand';

// Types de connexions possibles entre pièces
export const CONNECTION_TYPES = {
  EDGE_TO_EDGE: 'edge-to-edge',         // Bord à bord (ex: panneau latéral contre panneau supérieur)
  FACE_TO_FACE: 'face-to-face',         // Face à face (ex: collage de panneaux)
  EDGE_TO_FACE: 'edge-to-face',         // Bord contre face (ex: tablette insérée dans rainure)
  HARDWARE: 'hardware'                  // Via quincaillerie (vis, chevilles, etc.)
};

// Types de quincaillerie
export const HARDWARE_TYPES = {
  SCREW: 'screw',               // Vis
  DOWEL: 'dowel',               // Cheville
  CAM_LOCK: 'cam-lock',         // Excentrique
  HINGE: 'hinge',               // Charnière
  BRACKET: 'bracket',           // Équerre
  RAIL: 'rail'                  // Rail (tiroir)
};

export const useAssemblyStore = create((set, get) => ({
  // Connexions entre pièces
  connections: [],
  
  // Ajouter une connexion entre deux pièces
  addConnection: (pieceId1, pieceId2, connectionType, options = {}) => set(state => ({
    connections: [...state.connections, {
      id: `conn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      piece1: pieceId1,
      piece2: pieceId2,
      type: connectionType,
      hardwareType: options.hardwareType || null,
      hardwareCount: options.hardwareCount || 1,
      position: options.position || null,
      strength: options.strength || 100,  // Pourcentage de force de connexion
      createdAt: new Date().toISOString()
    }]
  })),
  
  // Supprimer une connexion
  removeConnection: (connectionId) => set(state => ({
    connections: state.connections.filter(conn => conn.id !== connectionId)
  })),
  
  // Modifier une connexion existante
  updateConnection: (connectionId, updates) => set(state => ({
    connections: state.connections.map(conn => 
      conn.id === connectionId ? { ...conn, ...updates } : conn
    )
  })),
  
  // Obtenir toutes les connexions pour une pièce spécifique
  getConnectionsForPiece: (pieceId) => {
    const { connections } = get();
    return connections.filter(conn => 
      conn.piece1 === pieceId || conn.piece2 === pieceId
    );
  },
  
  // Vérifier si deux pièces peuvent être connectées
  canConnect: (pieceId1, pieceId2, connectionType) => {
    // Logique pour déterminer si les pièces peuvent être connectées
    // Ici vous pourriez implémenter des vérifications comme:
    // - Les pièces ne sont pas déjà connectées
    // - Les matériaux sont compatibles
    // - Les dimensions permettent la connexion
    
    const { connections } = get();
    
    // Vérifier si les pièces sont déjà connectées
    const alreadyConnected = connections.some(conn => 
      (conn.piece1 === pieceId1 && conn.piece2 === pieceId2) ||
      (conn.piece1 === pieceId2 && conn.piece2 === pieceId1)
    );
    
    if (alreadyConnected) {
      return false;
    }
    
    // Par défaut, autoriser la connexion
    return true;
  },
  
  // Vérifier la validité globale de l'assemblage
  validateAssembly: () => {
    // Logique pour vérifier si l'assemblage est valide
    // - Toutes les pièces sont connectées
    // - Pas de connexions impossibles ou contradictoires
    // - La structure est stable
    
    // Cette fonction pourrait retourner un objet avec:
    // - valid: true/false
    // - issues: liste des problèmes détectés
    
    return {
      valid: true,
      issues: []
    };
  },
  
  // Réinitialiser toutes les connexions
  resetConnections: () => set({ connections: [] })
}));

// Exporter aussi des fonctions utilitaires liées à l'assemblage
export const assemblyUtils = {
  // Calculer la distance entre deux pièces pour déterminer si elles peuvent être connectées
  calculateDistance: (piece1Position, piece2Position) => {
    // Calcul de distance euclidienne 3D
    return Math.sqrt(
      Math.pow(piece1Position[0] - piece2Position[0], 2) +
      Math.pow(piece1Position[1] - piece2Position[1], 2) +
      Math.pow(piece1Position[2] - piece2Position[2], 2)
    );
  },
  
  // Déterminer le type de connexion le plus probable entre deux pièces selon leur position relative
  suggestConnectionType: (piece1, piece1Position, piece2, piece2Position) => {
    // Logique pour suggérer un type de connexion approprié
    // Basé sur l'orientation relative, les dimensions, etc.
    
    // Exemple simplifié:
    const distance = assemblyUtils.calculateDistance(piece1Position, piece2Position);
    
    if (distance < 5) {
      return CONNECTION_TYPES.FACE_TO_FACE;
    } else if (distance < 20) {
      return CONNECTION_TYPES.EDGE_TO_EDGE;
    } else {
      return CONNECTION_TYPES.HARDWARE;
    }
  },
  
  // Estimer la force globale d'un assemblage
  estimateAssemblyStrength: (connections) => {
    if (connections.length === 0) return 0;
    
    // Moyenne des forces de connexion
    const totalStrength = connections.reduce((sum, conn) => sum + conn.strength, 0);
    return totalStrength / connections.length;
  }
};