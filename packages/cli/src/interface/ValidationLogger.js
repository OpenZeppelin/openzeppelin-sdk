import _ from 'lodash';
import { FileSystem as fs, Logger, getStorageLayout } from 'zos-lib';

const log = new Logger('Validations');
const DOCS_HOME = 'https://docs.zeppelinos.org/docs';
const DANGEROUS_OPERATIONS_LINK = `${DOCS_HOME}/writing_contracts.html#potentially-unsafe-operations`;
const AVOID_INITIAL_VALUES_LINK = `${DOCS_HOME}/writing_contracts.html#avoid-initial-values-in-fields-declarations`;
const INITIALIZERS_LINK = `${DOCS_HOME}/writing_contracts.html#initializers`;
const STORAGE_CHECKS_LINK = `${DOCS_HOME}/writing_contracts.html#modifying-your-contracts`;

export default class ValidationLogger {
  constructor(contract, existingContractInfo = {}) {
    this.contract = contract;
    this.existingContractInfo = existingContractInfo;
  }

  get contractName() {
    return this.contract.contractName;
  }

  log(validations, buildArtifacts = undefined) {
    const { 
      hasConstructor,
      hasSelfDestruct,
      hasDelegateCall,
      hasInitialValuesInDeclarations,
      uninitializedBaseContracts,
      storageDiff,
      storageUncheckedVars
    } = validations;

    this.logHasConstructor(hasConstructor);
    this.logHasSelfDestruct(hasSelfDestruct);
    this.logHasDelegateCall(hasDelegateCall);
    this.logHasInitialValuesInDeclarations(hasInitialValuesInDeclarations);
    this.logUncheckedVars(storageUncheckedVars);
    this.logUninitializedBaseContracts(uninitializedBaseContracts);
    this.logStorageLayoutDiffs(storageDiff, getStorageLayout(this.contract, buildArtifacts));
  }

  logHasSelfDestruct(hasSelfDestruct) {
    if (hasSelfDestruct) {
      log.warn(`- Contract ${this.contractName} or one of its ancestors has a potentially unsafe selfdestruct operation. See ${DANGEROUS_OPERATIONS_LINK}.`);
    }
  }

  logHasDelegateCall(hasDelegateCall) {
    if (hasDelegateCall) {
      log.warn(`- Contract ${this.contractName} or one of its ancestors has a potentially unsafe delegatecall operation. See ${DANGEROUS_OPERATIONS_LINK}.`);
    }
  }

  logHasInitialValuesInDeclarations(hasInitialValuesInDeclarations) {
    if (hasInitialValuesInDeclarations) {
      log.warn(`- Contract ${this.contractName} or one of its ancestors sets an initial value in a field declaration. Consider moving all field initializations to an initializer function. See ${AVOID_INITIAL_VALUES_LINK}.`)
    }
  }

  logHasConstructor(hasConstructor) {
    if (hasConstructor) {
      log.error(`- Contract ${this.contractName} has an explicit constructor. Change it to an initializer function. See ${INITIALIZERS_LINK}.`);
    }
  }

  logUninitializedBaseContracts(uninitializedBaseContracts) {
    if (!_.isEmpty(uninitializedBaseContracts)) {
      log.warn(`- Contract ${this.contractName} has base contracts ${uninitializedBaseContracts.join(', ')} which are initializable, but their initialize methods are not called from ${this.contractName}.initialize. See ${INITIALIZERS_LINK}.`);
    }
  }

  logUncheckedVars(vars) {
    if (_.isEmpty(vars)) return;

    const varList = vars.map(({ label, contract }) => `${label} (${contract})`).join(', ');
    const variablesString = `Variable${vars.length === 1 ? '' : 's'}`;
    const containsString = `contain${vars.length === 1 ? 's' : ''}`;
    log.warn(`- ${variablesString} ${varList} ${containsString} a struct or enum. These are not automatically checked for storage compatibility in the current version. ` +
             `See ${STORAGE_CHECKS_LINK} for more info.`);
  }

  logStorageLayoutDiffs(storageDiff, updatedStorageInfo) {
    if (_.isEmpty(storageDiff)) return;
    const originalTypesInfo = this.existingContractInfo.types || {};
  
    storageDiff.forEach(({ updated, original, action }) => {
      const updatedSourceCode = updated && fs.exists(updated.path) && fs.read(updated.path)
      const updatedVarType = updated && updatedStorageInfo.types[updated.type];
      const updatedVarSource = updated && [updated.path, _srcToLineNumber(updated.path, updated.src)].join(':');
      const updatedVarDescription = updated && 
        (_tryGetSourceFragment(updatedSourceCode, updatedVarType.src) 
         || [updatedVarType.label, updated.label].join(' '));
      
      const originalVarType = original && originalTypesInfo[original.type];
      const originalVarDescription = original && [originalVarType.label, original.label].join(' ');
  
      switch (action) {
        case 'insert':
          log.error(`- New variable '${updatedVarDescription}' was inserted in contract ${updated.contract} in ${updatedVarSource}. ` +
                    `You should only add new variables at the end of your contract.`);
                    
          break;
        case 'delete':
          log.error(`- Variable '${originalVarDescription}' was removed from contract ${original.contract}. `+
                    `You should avoid deleting variables from your contracts.`);
          break;
        case 'append':
          log.info(`- New variable '${updatedVarDescription}' was added in contract ${updated.contract} in ${updatedVarSource} `+
                   `at the end of the contract.`);
          break;
        case 'pop':
          log.warn(`- Variable '${originalVarDescription}' was removed from the end of contract ${original.contract}. `+
                   `You should avoid deleting variables from your contracts.`);
          break;
        case 'rename':
          log.warn(`- Variable '${originalVarDescription}' in contract ${original.contract} was renamed to ${updated.label} in ${updatedVarSource}.` +
                   `${updated.label} will have the value of ${original.label} after upgrading.`);
          break;
        case 'typechange':
          log.warn(`- Variable '${original.label}' in contract ${original.contract} was changed from ${originalVarType.label} ` +
                   `to ${updatedVarType.label} in ${updatedVarSource}. Avoid changing types of existing variables.`)
          break;
        case 'replace':
          log.warn(`- Variable '${originalVarDescription}' in contract ${original.contract} was replaced with '${updatedVarDescription}' ` +
                   `in ${updatedVarSource}. Avoid changing existing variables.`)
          break;
        default:
          log.error(`- Unexpected layout change: ${action}`)
      }
    });
  
    log.info(`See ${STORAGE_CHECKS_LINK} for more info.`)
  }
}

function _srcToLineNumber(sourceCode, srcFragment) {
  if (!sourceCode || !srcFragment) return null;
  const [begin] = srcFragment.split(':', 1);
  return sourceCode.substr(0, begin).split('\n').length
}

function _tryGetSourceFragment(sourceCode, src) {
  if (!src || !sourceCode) return null;
  const [begin, count] = src.split(':');
  return sourceCode.substr(begin, count);
}
