// src/store/typeSafeOperations.ts
import { 
  Operation, 
  DrillOperation, 
  ContourOperation, 
  ClosedPocketOperation, 
  OpenPocketOperation 
} from '../types/models';

// Type guards pour identifier le type d'opération
export function isDrillOperation(operation: Operation): operation is DrillOperation {
  return operation.type === 'perçage';
}

export function isContourOperation(operation: Operation): operation is ContourOperation {
  return operation.type === 'contournage';
}

export function isClosedPocketOperation(operation: Operation): operation is ClosedPocketOperation {
  return operation.type === 'poche_fermee';
}

export function isOpenPocketOperation(operation: Operation): operation is OpenPocketOperation {
  return operation.type === 'poche_ouverte';
}

// Fonctions de mise à jour typesafe pour chaque type d'opération
export function updateDrillOperation(
  operation: DrillOperation, 
  updates: Partial<Omit<DrillOperation, 'type'>>
): DrillOperation {
  return {
    ...operation,
    ...updates,
    type: 'perçage' // S'assurer que le type reste correct
  };
}

export function updateContourOperation(
  operation: ContourOperation, 
  updates: Partial<Omit<ContourOperation, 'type'>>
): ContourOperation {
  return {
    ...operation,
    ...updates,
    type: 'contournage' // S'assurer que le type reste correct
  };
}

export function updateClosedPocketOperation(
  operation: ClosedPocketOperation, 
  updates: Partial<Omit<ClosedPocketOperation, 'type'>>
): ClosedPocketOperation {
  return {
    ...operation,
    ...updates,
    type: 'poche_fermee' // S'assurer que le type reste correct
  };
}

export function updateOpenPocketOperation(
  operation: OpenPocketOperation, 
  updates: Partial<Omit<OpenPocketOperation, 'type'>>
): OpenPocketOperation {
  return {
    ...operation,
    ...updates,
    type: 'poche_ouverte' // S'assurer que le type reste correct
  };
}

// Fonction générique de mise à jour qui préserve le type
export function typeSafeUpdateOperation(
  operation: Operation, 
  updates: Partial<Omit<Operation, 'type'>>
): Operation {
  if (isDrillOperation(operation)) {
    return updateDrillOperation(operation, updates);
  } else if (isContourOperation(operation)) {
    return updateContourOperation(operation, updates);
  } else if (isClosedPocketOperation(operation)) {
    return updateClosedPocketOperation(operation, updates);
  } else if (isOpenPocketOperation(operation)) {
    return updateOpenPocketOperation(operation, updates);
  }
  // Cas impossible si tous les types sont couverts
  throw new Error(`Type d'opération non supporté: ${(operation as any).type}`);
}