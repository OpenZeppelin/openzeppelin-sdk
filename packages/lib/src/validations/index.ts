import { difference, every, isEmpty, pick, values, flatten, uniq } from 'lodash';

import { hasConstructor } from './Constructors';
import { hasSelfDestruct, hasDelegateCall } from './Instructions';
import { getStorageLayout, getStructsOrEnums } from './Storage';
import { compareStorageLayouts, Operation } from './Layout';
import { hasInitialValuesInDeclarations } from './InitialValues';
import { importsVanillaContracts } from './VanillaContracts';
import Contract from '../artifacts/Contract.js';
import ContractAST, { StorageInfo, ContractDefinitionFilter } from '../utils/ContractAST';
import { BuildArtifacts } from '..';
import { getBuildArtifacts } from '../artifacts/BuildArtifacts';

export interface ValidationInfo {
  hasConstructor: boolean;
  hasSelfDestruct: boolean;
  hasDelegateCall: boolean;
  hasInitialValuesInDeclarations: boolean;
  uninitializedBaseContracts: any[];
  storageUncheckedVars?: StorageInfo[];
  storageDiff?: Operation[];
  importsVanillaContracts?: string[];
}

export function validate(
  contract: Contract,
  existingContractInfo: any = {},
  buildArtifacts: BuildArtifacts = getBuildArtifacts(),
): any {
  checkArtifactsForImportedSources(contract, buildArtifacts);
  const storageValidation = validateStorage(contract, existingContractInfo, buildArtifacts);
  const uninitializedBaseContracts = [];

  return {
    hasConstructor: hasConstructor(contract, buildArtifacts),
    hasSelfDestruct: hasSelfDestruct(contract),
    hasDelegateCall: hasDelegateCall(contract),
    hasInitialValuesInDeclarations: hasInitialValuesInDeclarations(contract),
    importsVanillaContracts: importsVanillaContracts(contract, buildArtifacts),
    uninitializedBaseContracts,
    ...storageValidation,
  };
}

export function newValidationErrors(validations: any, existingValidations: any = {}): any {
  return {
    hasConstructor: validations.hasConstructor && !existingValidations.hasConstructor,
    hasSelfDestruct: validations.hasSelfDestruct && !existingValidations.hasSelfDestruct,
    hasDelegateCall: validations.hasDelegateCall && !existingValidations.hasDelegateCall,
    hasInitialValuesInDeclarations:
      validations.hasInitialValuesInDeclarations && !existingValidations.hasInitialValuesInDeclarations,
    uninitializedBaseContracts: difference(
      validations.uninitializedBaseContracts,
      existingValidations.uninitializedBaseContracts,
    ),
    storageUncheckedVars: difference(validations.storageUncheckedVars, existingValidations.storageUncheckedVars),
    storageDiff: validations.storageDiff,
    importsVanillaContracts: difference(
      validations.importsVanillaContracts,
      existingValidations.importsVanillaContracts,
    ),
  };
}

export function validationPasses(validations: any): boolean {
  return (
    every(validations.storageDiff, diff => diff.action === 'append') &&
    !validations.hasConstructor &&
    !validations.hasSelfDestruct &&
    !validations.hasDelegateCall &&
    !validations.hasInitialValuesInDeclarations &&
    isEmpty(validations.uninitializedBaseContracts) &&
    isEmpty(validations.importsVanillaContracts)
  );
}

function validateStorage(
  contract: Contract,
  existingContractInfo: any = {},
  buildArtifacts: any = null,
): { storageUncheckedVars?: StorageInfo[]; storageDiff?: Operation[] } {
  const originalStorageInfo = pick(existingContractInfo, 'storage', 'types');
  if (isEmpty(originalStorageInfo.storage)) return {};

  const updatedStorageInfo = getStorageLayout(contract, buildArtifacts);
  const storageUncheckedVars = getStructsOrEnums(updatedStorageInfo);
  const storageDiff = compareStorageLayouts(originalStorageInfo, updatedStorageInfo);

  return {
    storageUncheckedVars,
    storageDiff,
  };
}

function checkArtifactsForImportedSources(contract: Contract, buildArtifacts: BuildArtifacts): void | never {
  new ContractAST(contract, buildArtifacts, ContractDefinitionFilter).getBaseContractsRecursively();
}
