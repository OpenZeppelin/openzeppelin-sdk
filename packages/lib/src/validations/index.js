import _ from 'lodash';

import Logger from '../utils/Logger'
import { hasConstructor } from "./Constructors";
import { hasSelfDestruct, hasDelegateCall } from "./Instructions";
import { getUninitializedBaseContracts } from "./Initializers";
import { getStorageLayout, getStructsOrEnums } from './Storage';
import { compareStorageLayouts } from './Layout';
import { hasInitialValuesInDeclarations } from './InitialValues';

const log = new Logger('validate')

// TODO: Add unit tests for this module. It is tested only from the CLI.

export function validate(contractClass, existingContractInfo = {}, buildArtifacts = null) {
  const storageValidation = validateStorage(contractClass, existingContractInfo, buildArtifacts);
  const uninitializedBaseContracts = tryGetUninitializedBaseContracts(contractClass);

  return {
    hasConstructor: hasConstructor(contractClass),
    hasSelfDestruct: hasSelfDestruct(contractClass),
    hasDelegateCall: hasDelegateCall(contractClass),
    hasInitialValuesInDeclarations: hasInitialValuesInDeclarations(contractClass),
    uninitializedBaseContracts,
    ... storageValidation
  }
}

export function newValidationErrors(validations, existingValidations = {}) {
  const { 
    hasConstructor,
    hasSelfDestruct,
    hasDelegateCall,
    hasInitialValuesInDeclarations,
    uninitializedBaseContracts,
    storageDiff,
    storageUncheckedVars
  } = validations;

  return {
    hasConstructor: hasConstructor && !existingValidations.hasConstructor,
    hasSelfDestruct: hasSelfDestruct && !existingValidations.hasSelfDestruct,
    hasDelegateCall: hasDelegateCall && !existingValidations.hasDelegateCall,
    hasInitialValuesInDeclarations: hasInitialValuesInDeclarations && !existingValidations.hasInitialValuesInDeclarations,
    uninitializedBaseContracts: _.difference(uninitializedBaseContracts, existingValidations.uninitializedBaseContracts),
    storageUncheckedVars: _.difference(storageUncheckedVars, existingValidations.storageUncheckedVars),
    storageDiff
  }
}

export function validationPasses(validations) {
  const { 
    hasConstructor,
    hasSelfDestruct,
    hasDelegateCall,
    hasInitialValuesInDeclarations,
    uninitializedBaseContracts,
    storageDiff
  } = validations;

  return _.every(storageDiff, diff => diff.action === 'append')
    && !hasConstructor
    && !hasSelfDestruct
    && !hasDelegateCall
    && !hasInitialValuesInDeclarations
    && _.isEmpty(uninitializedBaseContracts);
}

function validateStorage(contractClass, existingContractInfo = {}, buildArtifacts = null) {
  const originalStorageInfo = _.pick(existingContractInfo, 'storage', 'types')
  if (_.isEmpty(originalStorageInfo.storage)) return { };
  
  const updatedStorageInfo = getStorageLayout(contractClass, buildArtifacts)
  const storageUncheckedVars = getStructsOrEnums(updatedStorageInfo)
  const storageDiff = compareStorageLayouts(originalStorageInfo, updatedStorageInfo)

  return {
    storageUncheckedVars,
    storageDiff
  }
}

function tryGetUninitializedBaseContracts(contractClass) {
  try {
    return _(getUninitializedBaseContracts(contractClass)).values().flatten().uniq().value()
  } catch (error) {
    log.error(`Skipping uninitialized base contracts validation due to error: ${error.message}`)
    return []
  }
}
