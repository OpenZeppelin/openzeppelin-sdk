import _ from 'lodash';
import util from 'util';

const SUBSTITUTION_COST = 3,
      INSERTION_COST = 2,
      DELETION_COST = 2;

export function compareStorageLayouts(original, updated) {
  const areMatch = (var1, var2) => storageEntryMatches(var1, var2, original.types, updated.types)
  const areEqual = (var1, var2) => (areMatch(var1, var2) === 'equal')
  const distanceMatrix = levenshtein(original.storage, updated.storage, areEqual)
  const operations = walk(distanceMatrix, original.storage, updated.storage, areMatch)
  return operations.filter(op => op.action !== 'equal')
}

function storageEntryMatches(originalVar, updatedVar, originalTypes, updatedTypes) {
  const originalType = originalTypes[originalVar.type],
        updatedType = updatedTypes[updatedVar.type];

  const typeMatches = (originalType.id === updatedType.id);
  const nameMatches = (originalVar.label === updatedVar.label);

  if (typeMatches && nameMatches) {
    return 'equal'
  } else if (typeMatches) {
    return 'rename'
  } else if (nameMatches) {
    return 'typechange'
  } else {
    return 'replace'
  }
}

// Adapted from https://gist.github.com/andrei-m/982927 by Andrei Mackenzie
function levenshtein(originalStorage, updatedStorage, areEqualFn) {
  const a = originalStorage,
        b = updatedStorage;

  if (a.length === 0) return b.length * INSERTION_COST;
  if (b.length === 0) return a.length * DELETION_COST;

  const matrix = Array(a.length + 1);

  // increment along the first column of each row  
  for (let i = 0; i <= a.length; i++) { 
    matrix[i] = Array(b.length + 1); 
    matrix[i][0] = i * DELETION_COST; 
  }

  // increment each column in the first row
  for (let j = 0; j <= b.length; j++) { 
    matrix[0][j] = j * INSERTION_COST;
  }

  // fill in the rest of the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (areEqualFn(a[i-1], b[j-1])) {
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        const insertionCost = j > a.length ? 0 : INSERTION_COST; // appending is free
        matrix[i][j] = Math.min(matrix[i-1][j-1] + SUBSTITUTION_COST,
                                matrix[i][j-1] + insertionCost, 
                                matrix[i-1][j] + DELETION_COST);
      }
    }
  }

  return matrix;
}

// Walks an edit distance matrix, returning the sequence of operations performed
function walk(matrix, originalStorage, updatedStorage, areMatchFn) {
  const a = originalStorage,
        b = updatedStorage;
  let i = matrix.length - 1,
      j = matrix[0].length - 1;
  const operations = [];

  while (i > 0 || j > 0) {
    const cost = matrix[i][j];
    const isAppend = j >= matrix.length;
    const isPop = i >= matrix[0].length;
    const insertionCost = isAppend ? 0 : INSERTION_COST;
    const matchResult = i > 0 && j > 0 && areMatchFn(a[i-1], b[j-1]);
    const updated = j > 0 && { index: j-1, ...b[j-1] }
    const original = i > 0 && { index: i-1, ...a[i-1] }
    
    if (i > 0 && j > 0 && cost === matrix[i-1][j-1] && matchResult === 'equal') {
      operations.unshift({ action: 'equal', updated, original });
      i--;
      j--;
    } else if (j > 0 && cost === matrix[i][j-1] + insertionCost) {
      operations.unshift({ action: (isAppend ? 'append' : 'insert'), updated });
      j--;
    } else if (i > 0 && cost === matrix[i-1][j] + DELETION_COST) {
      operations.unshift({ action: (isPop ? 'pop' : 'delete'), original });
      i--;
    } else if (i > 0 && j > 0 && cost === matrix[i-1][j-1] + SUBSTITUTION_COST) {
      operations.unshift({ action: matchResult, updated, original });
      i--; 
      j--;
    } else {
      throw Error(`Could not walk matrix at position ${i},${j}:\n${matrix.map(util.inspect).join('\n')}\n`)
    }
  }

  return operations;
}