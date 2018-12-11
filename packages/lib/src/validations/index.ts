import _ from 'lodash';

import Logger from '../utils/Logger';
import { hasConstructor } from './Constructors';
import { hasSelfDestruct, hasDelegateCall } from './Instructions';
import { getUninitializedBaseContracts } from './Initializers';
import { getStorageLayout, getStructsOrEnums } from './Storage';
import { compareStorageLayouts } from './Layout';
import { hasInitialValuesInDeclarations } from './InitialValues';
import ContractFactory from '../artifacts/ContractFactory.js';
import { Operation } from './Layout';
import { StorageLayoutInfo } from './Storage';
import { StorageInfo } from '../utils/ContractAST';

const log = new Logger('validate');

interface StorageValidation {
  storageUncheckedVars?: StorageInfo[];
  storageDiff?: Operation[];
}

interface ContractValidation extends StorageValidation {
  hasConstructor: boolean;
  hasSelfDestruct: boolean;
  hasDelegateCall: boolean;
  hasInitialValuesInDeclarations: boolean;
  uninitializedBaseContracts: string[];
}

export function validate(contractClass:ContractFactory, existingContractInfo:any = {}, buildArtifacts:any = null):ContractValidation {
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

export function newValidationErrors(validations:any, existingValidations:any = {}):ContractValidation {
  const {
    _hasConstructor,
    _hasSelfDestruct,
    _hasDelegateCall,
    _hasInitialValuesInDeclarations,
    _uninitializedBaseContracts,
    _storageDiff,
    _storageUncheckedVars
  } = validations;

  return {
    hasConstructor: _hasConstructor && !existingValidations.hasConstructor,
    hasSelfDestruct: _hasSelfDestruct && !existingValidations.hasSelfDestruct,
    hasDelegateCall: _hasDelegateCall && !existingValidations.hasDelegateCall,
    hasInitialValuesInDeclarations: _hasInitialValuesInDeclarations && !existingValidations.hasInitialValuesInDeclarations,
    uninitializedBaseContracts: _.difference(_uninitializedBaseContracts, existingValidations.uninitializedBaseContracts),
    storageUncheckedVars: _.difference(_storageUncheckedVars, existingValidations.storageUncheckedVars),
    storageDiff: _storageDiff
  };
}

export function validationPasses(validations:any):boolean {
  const {
    _hasConstructor,
    _hasSelfDestruct,
    _hasDelegateCall,
    _hasInitialValuesInDeclarations,
    _uninitializedBaseContracts,
    _storageDiff
  } = validations;

  return _.every(_storageDiff, (diff) => diff.action === 'append')
    && !_hasConstructor
    && !_hasSelfDestruct
    && !_hasDelegateCall
    && !_hasInitialValuesInDeclarations
    && _.isEmpty(_uninitializedBaseContracts);
}

function validateStorage(contractClass:ContractFactory, existingContractInfo:any = {}, buildArtifacts:any = null):StorageValidation {
  const originalStorageInfo = _.pick(existingContractInfo, 'storage', 'types');
  if (_.isEmpty(originalStorageInfo.storage)) { return { }; }

  const updatedStorageInfo:StorageLayoutInfo = getStorageLayout(contractClass, buildArtifacts);
  const storageUncheckedVars:StorageInfo[] = getStructsOrEnums(updatedStorageInfo);
  const storageDiff:Operation[] = compareStorageLayouts(originalStorageInfo, updatedStorageInfo);

  return {
    storageUncheckedVars,
    storageDiff
  };
}

function tryGetUninitializedBaseContracts(contractClass:ContractFactory):string[] {
  try {
    return _(getUninitializedBaseContracts(contractClass)).values().flatten().uniq().value();
  } catch (error) {
    log.error(`- Skipping uninitialized base contracts validation due to error: ${error.message}`);
    return [];
  }
}
