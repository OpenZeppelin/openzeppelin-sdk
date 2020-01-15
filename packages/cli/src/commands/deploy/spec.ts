import { ParamDetails, Arg, Option } from '../../register-command';
import { MethodArg } from '../../prompts/prompt';

import { TxParams } from '@openzeppelin/upgrades';
import NetworkFile from '../../models/files/NetworkFile';
import { DEFAULT_TX_TIMEOUT } from '../../models/network/defaults';

export interface Args {
  contract: string;
  arguments: string[];
}

export interface Options {
  from?: string;
  network?: string;
  skipCompile?: boolean;
  upgradeable?: boolean;
  // The following are not available as CLI flags, and they are only used in tests.
  networkFile?: NetworkFile;
  txParams?: TxParams;
}

export const name = 'deploy';
export const description = 'deploy a contract instance';

export const args: Arg[] = [
  {
    name: 'contract',
    async details(): Promise<ParamDetails> {
      const choices = await import('../../prompts/choices');

      // TODO: Make this include contracts from _unlinked_ dependencies.
      const contracts = choices.contracts('all');

      return {
        prompt: 'Pick a contract to deploy',
        choices: contracts,
      };
    },
  },
  {
    name: 'arguments',
    variadic: true,
    async details(params: Options & Args): Promise<ParamDetails[]> {
      const { fromContractFullName } = await import('../../utils/naming');
      const { default: ContractManager } = await import('../../models/local/ContractManager');
      const { argLabelWithIndex } = await import('../../prompts/prompt');
      const { parseArg, getSampleInput } = await import('../../utils/input');

      const contractName = params.contract;

      const { package: packageName, contract: contractAlias } = fromContractFullName(contractName);
      const contract = new ContractManager().getContractClass(packageName, contractAlias);
      const constructorInputs: MethodArg[] = contract.schema.abi.find(f => f.type === 'constructor')?.inputs ?? [];

      return constructorInputs.map((arg, index) => {
        const placeholder = getSampleInput(arg);
        const validationError = placeholder
          ? `Enter a valid ${arg.type} such as: ${placeholder}`
          : `Enter a valid ${arg.type}`;

        return {
          message: `${argLabelWithIndex(arg, index)}:`,
          validate: (value: string) => {
            try {
              parseArg(value, arg);
              return true;
            } catch (err) {
              return false;
            }
          },
          validationError,
        };
      });
    },
  },
];

export const options: Option[] = [
  {
    format: '--no-interactive',
    description: 'disable interactive prompts',
  },
  {
    format: '--skip-compile',
    description: 'use existing compilation artifacts',
    default: false,
  },
  {
    format: '-n, --network <network>',
    description: 'network to use',
    async details() {
      const { default: ConfigManager } = await import('../../models/config/ConfigManager');
      const { default: Session } = await import('../../models/network/Session');

      const networks = ConfigManager.getNetworkNamesFromConfig();
      const { network: lastNetwork } = Session.getNetwork();

      return {
        prompt: 'Pick a network',
        choices: networks,
        preselect: lastNetwork,
      };
    },
  },
  {
    // TODO: discuss option name
    format: '--no-manifest-migration',
    description: 'disable automatic migration of manifest format',
    async details(options: Options) {
      const { isMigratableManifestVersion } = await import('../../models/files/ManifestVersion');
      const { default: NetworkFile } = await import('../../models/files/NetworkFile');

      const version = NetworkFile.getManifestVersion(options.network);

      if (isMigratableManifestVersion(version)) {
        return {
          validate: (migrate: boolean) => migrate,
          validationError: 'Cannot proceed without migrating the manifest file.',
          prompt: 'An old manifest version was detected and needs to be migrated to the latest one. Proceed?',
          promptType: 'confirm',
        };
      }
    },
  },
  {
    format: '--timeout <timeout>',
    description: `timeout in seconds for each transaction (default: ${DEFAULT_TX_TIMEOUT})`,
  },
  {
    format: '-f, --from <address>',
    description: 'sender for the contract creation transaction',
  },
  {
    format: '--upgradeable',
    description: 'deploy an upgradeable instance',
    default: false,
  },
];
