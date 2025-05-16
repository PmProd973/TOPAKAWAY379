// Types pour les opérations d'usinage
export type Point2D = [number, number];
export type Path2D = Point2D[];

// Types d'opérations
export type OperationType = 'perçage' | 'contournage' | 'poche_fermee' | 'poche_ouverte';

// Type d'entrée/sortie d'outil
export type EntryType = 'verticale' | 'rampe' | 'spirale';
export type ExitType = 'verticale' | 'rampe' | 'droite';

// Interface de base pour une opération
export interface BaseOperation {
  type: OperationType;
  outil: string;
  profondeur: number;
  commentaire?: string;
}

// Interface pour le perçage
export interface DrillOperation extends BaseOperation {
  type: 'perçage';
  x: number;
  y: number;
  diametre: number;
  traversant?: boolean;
}

// Interface pour le contournage
export interface ContourOperation extends BaseOperation {
  type: 'contournage';
  chemin: Path2D;
  ferme: boolean;
  multiPass: boolean;
  profondeurPasse?: number;
  entree?: {
    type: EntryType;
    angle?: number; // Pour rampe
    rayon?: number; // Pour spirale
  };
  sortie?: {
    type: ExitType;
  };
  compensation?: 'gauche' | 'droite' | 'aucune';
}

// Interface pour la poche fermée
export interface ClosedPocketOperation extends BaseOperation {
  type: 'poche_fermee';
  chemin: Path2D;
  strategie: 'spirale' | 'zigzag' | 'contour';
  multiPass: boolean;
  profondeurPasse?: number;
  entreeFerme?: {
    type: EntryType;
    angle?: number;
    rayon?: number;
  };
}

// Interface pour la poche ouverte
export interface OpenPocketOperation extends BaseOperation {
  type: 'poche_ouverte';
  chemin: Path2D;
  largeur: number;
  strategie: 'zigzag' | 'parallele';
  multiPass: boolean;
  profondeurPasse?: number;
}

// Union type pour toutes les opérations
export type Operation = 
  | DrillOperation 
  | ContourOperation 
  | ClosedPocketOperation 
  | OpenPocketOperation;

// Interface pour un outil
export interface Tool {
  id: string;
  nom: string;
  type: 'fraise' | 'foret';
  diametre: number;
  vitesseRotation: number;
  vitesseAvance: number;
  vitessePlongee?: number;
  profondeurMax?: number;
}

// Interface pour la pièce
export interface PanelData {
  nom: string;
  dimensions: {
    longueur: number;
    largeur: number;
    epaisseur: number;
  };
  materiau: string;
  origine: {
    position: 'coin_bas_gauche' | 'coin_bas_droite' | 'coin_haut_gauche' | 'coin_haut_droite' | 'centre';
    face: 'superieure' | 'inferieure';
    z_offset: number;
  };
  operations: Operation[];
}

// Interface pour le modèle de données complet
export interface AppData {
  piece: PanelData;
  bibliotheque_outils: Tool[];
}

// Structure par défaut pour une nouvelle pièce
export const DEFAULT_PANEL_DATA: PanelData = {
  nom: 'Nouvelle pièce',
  dimensions: {
    longueur: 800,
    largeur: 400,
    epaisseur: 18
  },
  materiau: 'Contreplaqué',
  origine: {
    position: 'coin_bas_gauche',
    face: 'superieure',
    z_offset: 0
  },
  operations: []
};

// Outils par défaut
export const DEFAULT_TOOLS: Tool[] = [
  {
    id: 'foret_5mm',
    nom: 'Foret 5mm',
    type: 'foret',
    diametre: 5,
    vitesseRotation: 18000,
    vitesseAvance: 900
  },
  {
    id: 'foret_8mm',
    nom: 'Foret 8mm',
    type: 'foret',
    diametre: 8,
    vitesseRotation: 16000,
    vitesseAvance: 800
  },
  {
    id: 'fraise_6mm',
    nom: 'Fraise droite 6mm',
    type: 'fraise',
    diametre: 6,
    vitesseRotation: 16000,
    vitesseAvance: 800,
    vitessePlongee: 300,
    profondeurMax: 20
  },
  {
    id: 'fraise_12mm',
    nom: 'Fraise droite 12mm',
    type: 'fraise',
    diametre: 12,
    vitesseRotation: 14000,
    vitesseAvance: 700,
    vitessePlongee: 250,
    profondeurMax: 30
  }
];

// Structure par défaut pour une nouvelle application
export const DEFAULT_APP_DATA: AppData = {
  piece: DEFAULT_PANEL_DATA,
  bibliotheque_outils: DEFAULT_TOOLS
};