import fs from 'fs';
import { isEmpty } from 'lodash';
import {
  Loggy,
  getStorageLayout,
  ValidationInfo,
  BuildArtifacts,
  StorageLayoutInfo,
  Operation,
  Contract,
} from '@openzeppelin/upgrades';
import { ContractInterface } from '../models/files/NetworkFile';

const DOCS_HOME = 'https://docs.openzeppelin.com/sdk/2.6';
const DANGEROUS_OPERATIONS_LINK = `${DOCS_HOME}/writing-contracts#potentially-unsafe-operations`;
const AVOID_INITIAL_VALUES_LINK = `${DOCS_HOME}/writing-contracts#avoid-initial-values-in-field-declarations`;
const INITIALIZERS_LINK = `${DOCS_HOME}/writing-contracts#initializers`;
const STORAGE_CHECKS_LINK = `${DOCS_HOME}/writing-contracts#modifying-your-contracts`;
const VANILLA_CONTRACTS_LINK = `${DOCS_HOME}/linking#linking-the-contracts-ethereum-package`;

export default class ValidationLogger {
  public contract: Contract;
  public existingContractInfo: ContractInterface;

  public constructor(contract: Contract, existingContractInfo?: ContractInterface) {
    this.contract = contract;
    this.existingContractInfo = existingContractInfo || {};
  }

  public get contractName(): string {
    return this.contract.schema.contractName;
  }

  public log(validations: ValidationInfo, buildArtifacts?: BuildArtifacts): void {
    const {
      hasConstructor,
      hasSelfDestruct,
      hasDelegateCall,
      hasInitialValuesInDeclarations,
      uninitializedBaseContracts,
      storageDiff,
      storageUncheckedVars,
      importsVanillaContracts,
    } = validations;

    this.logHasConstructor(hasConstructor);
    this.logHasSelfDestruct(hasSelfDestruct);
    this.logHasDelegateCall(hasDelegateCall);
    this.logHasInitialValuesInDeclarations(hasInitialValuesInDeclarations);
    this.logUncheckedVars(storageUncheckedVars);
    this.logUninitializedBaseContracts(uninitializedBaseContracts);
    this.logStorageLayoutDiffs(storageDiff, getStorageLayout(this.contract, buildArtifacts));
    this.logImportsVanillaContracts(importsVanillaContracts);
  }

  public logImportsVanillaContracts(vanillaContracts: string[] | null): void {
    if (!isEmpty(vanillaContracts)) {
      Loggy.noSpin.warn(
        __filename,
        'logImportsVanillaContracts',
        `validation-imports-vanilla-contracts`,
        `- Contract ${this.contractName} imports ${vanillaContracts.join(
          ', ',
        )} from @openzeppelin/contracts. Use @openzeppelin/contracts-ethereum-package instead. See ${VANILLA_CONTRACTS_LINK}.`,
      );
    }
  }

  public logHasSelfDestruct(hasSelfDestruct: boolean): void {
    if (hasSelfDestruct) {
      Loggy.noSpin.warn(
        __filename,
        'logHasSelfDestruct',
        `validation-has-selfdestruct`,
        `- Contract ${this.contractName} or one of its ancestors has a potentially unsafe selfdestruct operation. See ${DANGEROUS_OPERATIONS_LINK}.`,
      );
    }
  }

  public logHasDelegateCall(hasDelegateCall: boolean): void {
    if (hasDelegateCall) {
      Loggy.noSpin.warn(
        __filename,
        'logHasDelegateCall',
        `validation-has-delegatecall`,
        `- Contract ${this.contractName} or one of its ancestors has a potentially unsafe delegatecall operation. See ${DANGEROUS_OPERATIONS_LINK}.`,
      );
    }
  }

  public logHasInitialValuesInDeclarations(hasInitialValuesInDeclarations: boolean): void {
    if (hasInitialValuesInDeclarations) {
      Loggy.noSpin.warn(
        __filename,
        'logHasInitialValuesInDeclarations',
        `validation-has-initial-values`,
        `- Contract ${this.contractName} or one of its ancestors sets an initial value in a field declaration. Consider moving all field initializations to an initializer function. See ${AVOID_INITIAL_VALUES_LINK}.`,
      );
    }
  }

  public logHasConstructor(hasConstructor: boolean): void {
    if (hasConstructor) {
      Loggy.noSpin.error(
        __filename,
        'logHasConstructor',
        `validation-has-constructor`,
        `- Contract ${this.contractName} or an ancestor has a constructor. Change it to an initializer function. See ${INITIALIZERS_LINK}.`,
      );
    }
  }

  public logUninitializedBaseContracts(uninitializedBaseContracts: any): void {
    if (!isEmpty(uninitializedBaseContracts)) {
      Loggy.noSpin.warn(
        __filename,
        'logUninitializedBaseContracts',
        `validation-uinitialized-base-contracts`,
        `- Contract ${this.contractName} has base contracts ${uninitializedBaseContracts.join(
          ', ',
        )} which are initializable, but their initialize methods are not called from ${
          this.contractName
        }.initialize. See ${INITIALIZERS_LINK}.`,
      );
    }
  }

  public logUncheckedVars(vars: any): void {
    if (isEmpty(vars)) return;

    const varList = vars.map(({ label, contract }) => `${label} (${contract})`).join(', ');
    const variablesString = `Variable${vars.length === 1 ? '' : 's'}`;
    const containsString = `contain${vars.length === 1 ? 's' : ''}`;
    Loggy.noSpin.warn(
      __filename,
      'logUninitializedBaseContracts',
      `validation-unchecked-vars`,
      `- ${variablesString} ${varList} ${containsString} a struct or enum. These are not automatically checked for storage compatibility in the current version. See ${STORAGE_CHECKS_LINK} for more info.`,
    );
  }

  public logStorageLayoutDiffs(storageDiff: Operation[], updatedStorageInfo: StorageLayoutInfo): void {
    if (isEmpty(storageDiff)) return;
    const originalTypesInfo = this.existingContractInfo.types || {};

    storageDiff.forEach(({ updated, original, action }) => {
      const updatedSourceCode = updated && fs.existsSync(updated.path) && fs.readFileSync(updated.path, 'utf8');
      const updatedVarType = updated && updatedStorageInfo.types[updated.type];
      const updatedVarSource = updated && [updated.path, _srcToLineNumber(updated.path, updated.src)].join(':');
      const updatedVarDescription =
        updated &&
        (_tryGetSourceFragment(updatedSourceCode, updatedVarType.src) ||
          [updatedVarType.label, updated.label].join(' '));

      const originalVarType = original && originalTypesInfo[original.type];
      const originalVarDescription = original && [originalVarType.label, original.label].join(' ');

      switch (action) {
        case 'insert':
          Loggy.noSpin.error(
            __filename,
            'logStorageLayoutDiffs',
            `storage-layout-diffs`,
            `- New variable '${updatedVarDescription}' was inserted in contract ${updated.contract} in ${updatedVarSource}. You should only add new variables at the end of your contract.`,
          );
          break;
        case 'delete':
          Loggy.noSpin.error(
            __filename,
            'logStorageLayoutDiffs',
            `storage-layout-diffs`,
            `- Variable '${originalVarDescription}' was removed from contract ${original.contract}. You should avoid deleting variables from your contracts.`,
          );
          break;
        case 'append':
          Loggy.noSpin(
            __filename,
            'logStorageLayoutDiffs',
            `storage-layout-diffs`,
            `- New variable '${updatedVarDescription}' was added in contract ${updated.contract} in ${updatedVarSource} at the end of the contract.`,
          );
          break;
        case 'pop':
          Loggy.noSpin.warn(
            __filename,
            'logStorageLayoutDiffs',
            `storage-layout-diffs`,
            `- Variable '${originalVarDescription}' was removed from the end of contract ${original.contract}. You should avoid deleting variables from your contracts.`,
          );
          break;
        case 'rename':
          Loggy.noSpin.warn(
            __filename,
            'logStorageLayoutDiffs',
            `storage-layout-diffs`,
            `- Variable '${originalVarDescription}' in contract ${original.contract} was renamed to ${updated.label} in ${updatedVarSource}.
              ${updated.label} will have the value of ${original.label} after upgrading.`,
          );
          break;
        case 'typechange':
          Loggy.noSpin.warn(
            __filename,
            'logStorageLayoutDiffs',
            `storage-layout-diffs`,
            `- Variable '${original.label}' in contract ${original.contract} was changed from ${originalVarType.label} to ${updatedVarType.label} in ${updatedVarSource}. Avoid changing types of existing variables.`,
          );
          break;
        case 'replace':
          Loggy.noSpin.warn(
            __filename,
            'logStorageLayoutDiffs',
            `storage-layout-diffs`,
            `- Variable '${originalVarDescription}' in contract ${original.contract} was replaced with '${updatedVarDescription}' in
            ${updatedVarSource}. Avoid changing existing variables.`,
          );
          break;
        default:
          Loggy.noSpin.error(
            __filename,
            'logStorageLayoutDiffs',
            `storage-layout-diffs`,
            `- Unexpected layout change: ${action}`,
          );
      }
    });

    Loggy.noSpin(
      __filename,
      'logStorageLayoutDiffs',
      `storage-layout-diffs-reference`,
      `See ${STORAGE_CHECKS_LINK} for more info.`,
    );
  }
}

// TS-TODO: This code looks weird and was provisionally ported like this.
function _srcToLineNumber(sourceCode: string, srcFragment: string): number {
  if (!sourceCode || !srcFragment) return null;
  const [begin] = srcFragment.split(':', 1);
  return sourceCode.substr(0, begin as any).split('\n').length;
}

// TS-TODO: This code looks weird and was provisionally ported like this.
function _tryGetSourceFragment(sourceCode: string, src: string): string {
  if (!src || !sourceCode) return null;
  const [begin, count] = src.split(':');
  return sourceCode.substr(begin as any, count as any);
}
