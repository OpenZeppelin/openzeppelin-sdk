import _ from 'lodash';

import Logger from '../utils/Logger';
import { hasConstructor } from './Constructors';
import { hasSelfDestruct, hasDelegateCall } from './Instructions';
import { getUninitializedBaseContracts } from './Initializers';
import { getStorageLayout, getStructsOrEnums } from './Storage';
import { compareStorageLayouts } from './Layout';
import { hasInitialValuesInDeclarations } from './InitialValues';
import ContractFactory from '../artifacts/ContractFactory.js';

const log = new Logger('validate');

export function validate(contractClass: ContractFactory, existingContractInfo: any = {}, buildArtifacts: any = null): any {
  const storageValidation = validateStorage(contractClass, existingContractInfo, buildArtifacts);
  const uninitializedBaseContracts = [];

  return {
    hasConstructor: hasConstructor(contractClass),
    hasSelfDestruct: hasSelfDestruct(contractClass),
    hasDelegateCall: hasDelegateCall(contractClass),
    hasInitialValuesInDeclarations: hasInitialValuesInDeclarations(contractClass),
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
    uninitializedBaseContracts: _.difference(validations.uninitializedBaseContracts, existingValidations.uninitializedBaseContracts),
    storageUncheckedVars: _.difference(validations.storageUncheckedVars, existingValidations.storageUncheckedVars),
    storageDiff: validations.storageDiff
  };
}

export function validationPasses(validations: any): boolean {
  return _.every(validations.storageDiff, (diff) => diff.action === 'append')
    && !validations.hasConstructor
    && !validations.hasSelfDestruct
    && !validations.hasDelegateCall
    && !validations.hasInitialValuesInDeclarations
    && _.isEmpty(validations.uninitializedBaseContracts);
}

function validateStorage(contractClass: ContractFactory, existingContractInfo: any = {}, buildArtifacts: any = null): any {
  const originalStorageInfo = _.pick(existingContractInfo, 'storage', 'types');
  if (_.isEmpty(originalStorageInfo.storage)) { return { }; }

  const updatedStorageInfo = getStorageLayout(contractClass, buildArtifacts);
  const storageUncheckedVars = getStructsOrEnums(updatedStorageInfo);
  const storageDiff = compareStorageLayouts(originalStorageInfo, updatedStorageInfo);

  return {
    storageUncheckedVars,
    storageDiff
  };
}

function tryGetUninitializedBaseContracts(contractClass: ContractFactory): string[] {
  try {
    return _(getUninitializedBaseContracts(contractClass)).values().flatten().uniq().value();
  } catch (error) {
    log.error(`- Skipping uninitialized base contracts validation due to error: ${error.message}`);
    return [];
  }
}
