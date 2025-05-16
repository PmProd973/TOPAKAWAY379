// src/utils/typeGuards.ts
import { 
  Operation, 
  DrillOperation, 
  ContourOperation, 
  ClosedPocketOperation, 
  OpenPocketOperation 
} from '../types/models';

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