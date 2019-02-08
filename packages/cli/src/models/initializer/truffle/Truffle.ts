import pickBy from 'lodash.pickby';
import pick from 'lodash.pick';
import { promisify } from 'util';
import { FileSystem } from 'zos-lib';

const Truffle = {

  existsTruffleConfig(root: string = process.cwd()): boolean {
    const truffleFile = `${root}/truffle.js`;
    const truffleConfigFile = `${root}/truffle-config.js`;
    return FileSystem.exists(truffleFile) || FileSystem.exists(truffleConfigFile);
  },

  isTruffleProject(root: string = process.cwd()): boolean {
    const truffleDir = `${root}/node_modules/truffle`;
    const existsTruffleDependency = FileSystem.exists(truffleDir);
    return Truffle.existsTruffleConfig(root) && existsTruffleDependency;
  },

  validateAndLoadNetworkConfig(network: string): void {
    const config = this.getConfig();
    const { networks: networkList } = config;
    if (!networkList[network]) throw Error(`Given network '${network}' is not defined in your truffle-config file`);
    config.network = network;
  },

  getBuildDir(): string {
    const config = this.getConfig();
    return config.contracts_build_directory;
  },

  getProviderAndDefaults(): any {
    const config = this.getConfig();
    const provider = this._setNonceTrackerIfNeeded(config);

    const artifactDefaults = pickBy(pick(config, 'from', 'gas', 'gasPrice'));
    return { provider, artifactDefaults };
  },

  getConfig(): any | never {
    if (this.config) return this.config;
    try {
      const TruffleConfig = require('truffle-config');
      this.config = TruffleConfig.detect({ logger: console });
      return this.config;
    } catch (error) {
      if (error.message === 'Could not find suitable configuration file.') {
        throw Error('Could not find truffle.js config file, remember to initialize your project.');
      } else {
        throw Error('Could not load truffle.js config file.\n' + error);
      }
    }
  },

  // This function fixes a truffle issue related to HDWalletProvider that occurs when assigning
  // the network provider as a function (that returns an HDWalletProvider instance) instead of
  // assigning the HDWalletProvider instance directly.
  // (see https://github.com/trufflesuite/truffle-hdwallet-provider/issues/65)
  _setNonceTrackerIfNeeded({ provider }: any): any {
    const { engine } = provider;
    if (engine && engine.constructor.name === 'Web3ProviderEngine') {
      const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker');
      const nonceTracker = new NonceSubprovider();
      engine._providers.forEach((aProvider, index) => {
        if (aProvider.constructor.name === 'ProviderSubprovider') {
          nonceTracker.setEngine(engine);
          engine._providers.splice(index, 0, nonceTracker);
        }
      });
    }
    return provider;
  },
};

export default Truffle;
