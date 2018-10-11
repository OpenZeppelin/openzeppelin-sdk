import _ from 'lodash';

import { hasConstructor } from "./Constructors";
import { hasSelfDestruct, hasDelegateCall } from "./Instructions";
import { getUninitializedBaseContracts } from "./Initializers";
import { getStorageLayout, getStructsOrEnums } from './Storage';
import { compareStorageLayouts } from './Layout';

// TODO: Add unit tests for this module. It is tested only from the CLI.

export function validate(contractClass, existingContractInfo = {}, buildArtifacts = null) {
  const storageValidation = validateStorage(contractClass, existingContractInfo, buildArtifacts);
  const uninitializedBaseContracts = _(getUninitializedBaseContracts(contractClass)).values().flatten().uniq().value();

  return {
    hasConstructor: hasConstructor(contractClass),
    hasSelfDestruct: hasSelfDestruct(contractClass),
    hasDelegateCall: hasDelegateCall(contractClass),
    uninitializedBaseContracts,
    ... storageValidation
  }
}

export function newValidationErrors(validations, existingValidations = {}) {
  const { 
    hasConstructor,
    hasSelfDestruct,
    hasDelegateCall,
    uninitializedBaseContracts,
    storageDiff,
    storageUncheckedVars
  } = validations;

  return {
    hasConstructor: hasConstructor && !existingValidations.hasConstructor,
    hasSelfDestruct: hasSelfDestruct && !existingValidations.hasSelfDestruct,
    hasDelegateCall: hasDelegateCall && !existingValidations.hasDelegateCall,
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
    uninitializedBaseContracts,
    storageDiff
  } = validations;

  return _.every(storageDiff, diff => diff.action === 'append')
    && !hasConstructor
    && !hasSelfDestruct
    && !hasDelegateCall
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
