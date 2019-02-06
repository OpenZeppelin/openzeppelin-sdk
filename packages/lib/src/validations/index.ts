import difference from 'lodash.difference';
import every from 'lodash.every';
import isEmpty from 'lodash.isempty';
import pick from 'lodash.pick';
import values from 'lodash.values';
import flatten from 'lodash.flatten';
import uniq from 'lodash.uniq';

import Logger from '../utils/Logger';
import { hasConstructor } from './Constructors';
import { hasSelfDestruct, hasDelegateCall } from './Instructions';
import { getUninitializedBaseContracts } from './Initializers';
import { getStorageLayout, getStructsOrEnums } from './Storage';
import { compareStorageLayouts, Operation } from './Layout';
import { hasInitialValuesInDeclarations } from './InitialValues';
import Contract from '../artifacts/Contract.js';
import { StorageInfo } from '../utils/ContractAST';

const log = new Logger('validate');

export interface ValidationInfo {
  hasConstructor: boolean;
  hasSelfDestruct: boolean;
  hasDelegateCall: boolean;
  hasInitialValuesInDeclarations: boolean;
  uninitializedBaseContracts: any[];
  storageUncheckedVars?: StorageInfo[];
  storageDiff?: Operation[];
}

export function validate(contract: Contract, existingContractInfo: any = {}, buildArtifacts?: any): any {
  const storageValidation = validateStorage(contract, existingContractInfo, buildArtifacts);
  const uninitializedBaseContracts = [];

  return {
    hasConstructor: hasConstructor(contract),
    hasSelfDestruct: hasSelfDestruct(contract),
    hasDelegateCall: hasDelegateCall(contract),
    hasInitialValuesInDeclarations: hasInitialValuesInDeclarations(contract),
    uninitializedBaseContracts,
    ... storageValidation
  };
}

export function newValidationErrors(validations: any, existingValidations: any = {}): any {
  return {
    hasConstructor: validations.hasConstructor && !existingValidations.hasConstructor,
    hasSelfDestruct: validations.hasSelfDestruct && !existingValidations.hasSelfDestruct,
    hasDelegateCall: validations.hasDelegateCall && !existingValidations.hasDelegateCall,
    hasInitialValuesInDeclarations: validations.hasInitialValuesInDeclarations && !existingValidations.hasInitialValuesInDeclarations,
    uninitializedBaseContracts: difference(validations.uninitializedBaseContracts, existingValidations.uninitializedBaseContracts),
    storageUncheckedVars: difference(validations.storageUncheckedVars, existingValidations.storageUncheckedVars),
    storageDiff: validations.storageDiff
  };
}

export function validationPasses(validations: any): boolean {
  return every(validations.storageDiff, (diff) => diff.action === 'append')
    && !validations.hasConstructor
    && !validations.hasSelfDestruct
    && !validations.hasDelegateCall
    && !validations.hasInitialValuesInDeclarations
    && isEmpty(validations.uninitializedBaseContracts);
}

function validateStorage(contract: Contract, existingContractInfo: any = {}, buildArtifacts: any = null): { storageUncheckedVars?: StorageInfo[], storageDiff?: Operation[] } {
  const originalStorageInfo = pick(existingContractInfo, 'storage', 'types');
  if (isEmpty(originalStorageInfo.storage)) return {};

  const updatedStorageInfo = getStorageLayout(contract, buildArtifacts);
  const storageUncheckedVars = getStructsOrEnums(updatedStorageInfo);
  const storageDiff = compareStorageLayouts(originalStorageInfo, updatedStorageInfo);

  return {
    storageUncheckedVars,
    storageDiff
  };
}

function tryGetUninitializedBaseContracts(contract: Contract): string[] {
  try {
    const pipeline = [
      (contracts) => values(contracts),
      (contracts) => flatten(contracts),
      (contracts) => uniq(contracts),
    ];

    return pipeline.reduce((xs, f) => f(xs), getUninitializedBaseContracts(contract));
  } catch (error) {
    log.error(`- Skipping uninitialized base contracts validation due to error: ${error.message}`);
    return [];
  }
}
