import { ZWeb3, Contracts, TxParams } from '@openzeppelin/upgrades';
import TruffleConfig from './TruffleConfig';
import { default as Session, SessionOptions } from '../network/Session';
import NetworkConfig from './NetworkConfig';

import { pick, pickBy, isNil } from 'lodash';

const ConfigManager = {
  config: undefined,

  initialize(root: string = process.cwd()): void {
    if (!TruffleConfig.exists() && !NetworkConfig.exists()) {
      NetworkConfig.initialize(root);
    }
  },

  initStaticConfiguration(root: string = process.cwd()): void {
    this.setBaseConfig(root);
    const buildDir = this.config.getBuildDir();
    Contracts.setLocalBuildDir(buildDir);
  },

  async initNetworkConfiguration(
    options: SessionOptions,
    silent?: boolean,
    root: string = process.cwd(),
  ): Promise<{ network: string; txParams: TxParams } | never> {
    this.initStaticConfiguration(root);
    const { network: networkName, from, timeout, blockTimeout } = Session.getOptions(options, silent);
    Session.setDefaultNetworkIfNeeded(options.network);
    if (!networkName) throw Error('A network name must be provided to execute the requested action.');

    const { provider, artifactDefaults, network } = await this.config.loadNetworkConfig(networkName, root);

    Contracts.setArtifactsDefaults(artifactDefaults);

    try {
      ZWeb3.initialize(provider, { pollingTimeout: timeout, blockTimeout });
      await ZWeb3.checkNetworkId(network.networkId);
      const txParams = {
        from: ZWeb3.toChecksumAddress(from || artifactDefaults.from || (await ZWeb3.defaultAccount())),
        ...pickBy(pick(artifactDefaults, ['gas', 'gasPrice']), x => !isNil(x)),
      };

      return { network: await ZWeb3.getNetworkName(), txParams };
    } catch (error) {
      if (this.config && this.config.name === 'NetworkConfig') {
        const providerInfo = typeof provider === 'string' ? ` on ${provider}` : '';
        const message = `Could not connect to the ${networkName} Ethereum network${providerInfo}. Please check your networks.js configuration file.`;
        error.message = `${message} Error: ${error.message}.`;
        throw error;
      } else throw error;
    }
  },

  getBuildDir(root: string = process.cwd()): string {
    this.setBaseConfig(root);
    return this.config.getBuildDir();
  },

  getCompilerInfo(root: string = process.cwd()): { version?: string; optimizer?: boolean; optimizerRuns?: number } {
    this.setBaseConfig(root);
    const {
      compilers: {
        solc: { version, settings },
      },
    } = this.config.getConfig();
    const { enabled: optimizer, runs: optimizerRuns } = settings.optimizer;
    return { version, optimizer, optimizerRuns };
  },

  getNetworkNamesFromConfig(root: string = process.cwd()): string[] | null {
    this.setBaseConfig(root);
    const config = this.config.getConfig();
    return config && config.networks ? Object.keys(config.networks) : undefined;
  },

  getConfigFileName(root: string = process.cwd()): string {
    this.setBaseConfig(root);
    return this.config.getConfigFileName(root);
  },

  setBaseConfig(root: string = process.cwd()): void | null | never {
    if (this.config) return;

    // these lines could be expanded to support different libraries like embark, ethjs, buidler, etc
    if (NetworkConfig.exists(root)) {
      this.config = NetworkConfig;
    } else if (TruffleConfig.exists(root)) {
      this.config = TruffleConfig;
    } else {
      throw Error('Could not find networks.js file, please remember to initialize your project.');
    }
  },
};

export default ConfigManager;
