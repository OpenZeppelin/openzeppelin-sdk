import util from 'util';
import { StorageLayoutInfo } from './Storage';
import { StorageInfo, TypeInfo, TypeInfoMapping } from '../utils/ContractAST';

const SUBSTITUTION_COST = 3;
const INSERTION_COST = 2;
const DELETION_COST = 2;

type ComparisonFn = (var1: StorageInfo, var2: StorageInfo) => StorageEntryComparison;
type EqualFn = (var1: StorageInfo, var2: StorageInfo) => boolean;

export type StorageEntryComparison = 'equal' | 'rename' | 'typechange' | 'replace';

export interface Operation {
  contract: string;
  action: string;
  updated: StorageInfo;
  original: StorageInfo;
}

export function compareStorageLayouts(original: StorageLayoutInfo, updated: StorageLayoutInfo): Operation[] {
  const areMatch: ComparisonFn = (var1: StorageInfo, var2: StorageInfo) =>
    storageEntryMatches(var1, var2, original.types, updated.types);
  const areEqual: EqualFn = (var1: StorageInfo, var2: StorageInfo) => areMatch(var1, var2) === 'equal';

  const distanceMatrix: number[][] = levenshtein(original.storage, updated.storage, areEqual);
  const operations: Operation[] = walk(distanceMatrix, original.storage, updated.storage, areMatch);

  return operations.filter((op: Operation) => op.action !== 'equal');
}

function storageEntryMatches(
  originalVar: StorageInfo,
  updatedVar: StorageInfo,
  originalTypes: TypeInfoMapping,
  updatedTypes: TypeInfoMapping,
): StorageEntryComparison {
  const originalType = originalTypes[originalVar.type];
  const updatedType = updatedTypes[updatedVar.type];

  const typeMatches = originalType.id === updatedType.id;
  const nameMatches = originalVar.label === updatedVar.label;

  if (typeMatches && nameMatches) return 'equal';
  else if (typeMatches) return 'rename';
  else if (nameMatches) return 'typechange';
  else return 'replace';
}

// Adapted from https://gist.github.com/andrei-m/982927 by Andrei Mackenzie
function levenshtein(originalStorage: StorageInfo[], updatedStorage: StorageInfo[], areEqualFn: EqualFn): number[][] {
  const a = originalStorage;
  const b = updatedStorage;

  const matrix: any[] = Array(a.length + 1);

  type CostFunction = (i: number, j: number) => number;
  const insertionCost: CostFunction = (_i, j) => (j > a.length ? 0 : INSERTION_COST);
  const diagonalCost: CostFunction = (i, j) => (areEqualFn(a[i - 1], b[j - 1]) ? 0 : SUBSTITUTION_COST);
  const deletionCost: CostFunction = (_i, _j) => DELETION_COST;

  // increment along the first column of each row
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = Array(b.length + 1);
    matrix[i][0] = i * deletionCost(i, 0);
  }

  // increment each column in the first row
  for (let j = 1; j <= b.length; j++) {
    matrix[0][j] = matrix[0][j - 1] + insertionCost(0, j);
  }

  // fill in the rest of the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j - 1] + diagonalCost(i, j),
        matrix[i][j - 1] + insertionCost(i, j),
        matrix[i - 1][j] + deletionCost(i, j),
      );
    }
  }

  return matrix;
}

// Walks an edit distance matrix, returning the sequence of operations performed
function walk(
  matrix: number[][],
  originalStorage: StorageInfo[],
  updatedStorage: StorageInfo[],
  areMatchFn: ComparisonFn,
): Operation[] | never {
  const a = originalStorage;
  const b = updatedStorage;

  let i = matrix.length - 1;
  let j = matrix[0].length - 1;

  const operations = [];

  while (i > 0 || j > 0) {
    const cost = matrix[i][j];
    const isAppend = j >= matrix.length;
    const isPop = i >= matrix[0].length;
    const insertionCost = isAppend ? 0 : INSERTION_COST;
    const matchResult = i > 0 && j > 0 && areMatchFn(a[i - 1], b[j - 1]);
    const updated = j > 0 && { index: j - 1, ...b[j - 1] };
    const original = i > 0 && { index: i - 1, ...a[i - 1] };

    if (i > 0 && j > 0 && cost === matrix[i - 1][j - 1] && matchResult === 'equal') {
      operations.unshift({ action: 'equal', updated, original });
      i--;
      j--;
    } else if (j > 0 && cost === matrix[i][j - 1] + insertionCost) {
      operations.unshift({ action: isAppend ? 'append' : 'insert', updated });
      j--;
    } else if (i > 0 && cost === matrix[i - 1][j] + DELETION_COST) {
      operations.unshift({ action: isPop ? 'pop' : 'delete', original });
      i--;
    } else if (i > 0 && j > 0 && cost === matrix[i - 1][j - 1] + SUBSTITUTION_COST) {
      operations.unshift({ action: matchResult, updated, original });
      i--;
      j--;
    } else
      throw Error(`Could not walk matrix at position ${i},${j}:\n${(matrix as any).map(util.inspect).join('\n')}\n`);
  }

  return operations;
}
