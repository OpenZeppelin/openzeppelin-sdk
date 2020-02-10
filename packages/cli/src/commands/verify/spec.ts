import { ParamDetails, Arg, Option } from '../../register-command';

import { commonOptions } from '../utils';

import { TxParams } from '@openzeppelin/upgrades';
import NetworkFile from '../../models/files/NetworkFile';

export const name = 'verify';
export const description = "verify a contract's source with Etherscan or Etherchain";

export interface Args {
  contract: string;
}

type OptimizerOptions = { optimizer: false } | { optimizer: true; optimizerRuns: number };

type RemoteOptions = { remote: 'etherscan'; apiKey: string } | { remote: 'etherchain' };
const endpoints = ['etherscan', 'etherchain'];

interface OtherOptions {
  network: string;

  // The following are not available as CLI flags, and they are only used in tests.
  networkFile?: NetworkFile;
  txParams?: TxParams;
}

export type Options = OptimizerOptions & RemoteOptions & OtherOptions;

export const args: Arg[] = [
  {
    name: 'contract',
    async details(): Promise<ParamDetails> {
      const choices = await import('../../prompts/choices');

      const contracts = choices.contracts('all');

      return {
        prompt: 'Pick a contract to verify',
        choices: contracts,
      };
    },
  },
];

export const options: Option[] = [
  {
    format: '-n, --network <network>',
    description: 'network to verify contracts in',
    async details() {
      const { default: ConfigManager } = await import('../../models/config/ConfigManager');
      const { default: Session } = await import('../../models/network/Session');

      const networks = ConfigManager.getNetworkNamesFromConfig();
      const { network: lastNetwork, expired } = Session.getNetwork();

      if (expired) {
        return {
          prompt: 'Pick a network',
          choices: networks,
          preselect: lastNetwork,
        };
      }
    },
    async after(params) {
      if (process.env.NODE_ENV !== 'test') {
        const { default: ConfigManager } = await import('../../models/config/ConfigManager');
        const config = await ConfigManager.initNetworkConfiguration(params);
        Object.assign(params, config);
      }
    },
  },
  {
    format: '-o, --optimizer <enabled>',
    description: `whether compilation optimizations were enabled`,
    async details() {
      const { default: ProjectFile } = await import('../../models/files/ProjectFile');
      const compilerConfig = new ProjectFile().compilerOptions;
      const optimizerDefault = compilerConfig.optimizer?.enabled ?? false;

      return {
        prompt: 'Was your contract compiled with optimizations enabled?',
        promptType: 'confirm',
        preselect: optimizerDefault,
      };
    },
  },
  {
    format: '--optimizer-runs <runs>',
    description: `the number of runs for the optimizer`,
    async details(params: Partial<Options>) {
      if (params.optimizer) {
        const { default: ProjectFile } = await import('../../models/files/ProjectFile');
        const compilerConfig = new ProjectFile().compilerOptions;
        const optimizerRunsDefault = compilerConfig.optimizer?.runs ?? 200;

        return {
          prompt: "Specify the optimizer 'runs' parameter",
          preselect: optimizerRunsDefault,
        };
      }
    },
  },
  {
    format: '--remote <remote>',
    description: `the remote endpoint to use for verification (${endpoints.join(', ')})`,
    async details() {
      return {
        prompt: 'Choose a remote endpoint',
        choices: endpoints,
        preselect: 'etherscan',
      };
    },
  },
  {
    format: '--api-key <key>',
    description: `Etherscan API key (get one at https://etherscan.io/myapikey)`,
    async details(params: Options) {
      if (params.remote == 'etherscan') {
        return {
          prompt: 'Enter your Etherscan API key (get one at https://etherscan.io/myapikey)',
        };
      }
    },
  },
  commonOptions.noInteractive,
];
