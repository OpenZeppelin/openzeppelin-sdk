import { ZWeb3, Contracts, TxParams } from 'zos-lib';
import TruffleConfig from './TruffleConfig';
import Session from '../network/Session';
import ZosConfig from './ZosConfig';

 export interface NetworkConfig {
  network: string;
  txParams: TxParams;
}

const ConfigManager = {
  initStaticConfiguration(root: string = process.cwd()): void {
    this.setBaseConfig(root);
    const buildDir = this.config.getBuildDir();
    Contracts.setLocalBuildDir(buildDir);
  },

  async initNetworkConfiguration(options: any = {}, silent?: boolean, root: string = process.cwd()): Promise<NetworkConfig | never> {
    this.initStaticConfiguration(root);
    const { network: networkName, from, timeout } = Session.getOptions(options, silent);
    Session.setDefaultNetworkIfNeeded(options.network);
    if (!networkName) throw Error('A network name must be provided to execute the requested action.');

    const { provider, artifactDefaults, network } = await this.config.loadNetworkConfig(networkName, root);
    const networkId = network.networkId || network.network_id;

    Contracts.setSyncTimeout(timeout * 1000);
    Contracts.setArtifactsDefaults(artifactDefaults);

    try {
      ZWeb3.initialize(provider);
      await ZWeb3.checkNetworkId(networkId);
      const txParams = { from: ZWeb3.toChecksumAddress(from || artifactDefaults.from || await ZWeb3.defaultAccount()) };

      return { network: await ZWeb3.getNetworkName(), txParams };
    } catch(error) {
      if (this.config && this.config.constructor.name === 'ZosConfig') {
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

  getCompilerInfo(root: string = process.cwd()): { version?: string, optimizer?: boolean, optimizerRuns?: number } {
    this.setBaseConfig(root);
    const { compilers: { solc: { version, settings } } } = this.config.getConfig();
    const { enabled: optimizer, runs: optimizerRuns } = settings.optimizer;
    return { version, optimizer, optimizerRuns };
  },

  getNetworkNamesFromConfig(root: string = process.cwd()): string[] | null {
    this.setBaseConfig(root);
    const config = this.config.getConfig();
    return config && config.networks ? Object.keys(config.networks) : undefined;
  },

  setBaseConfig(root: string = process.cwd()): void | null | never {
    if (this.config) return;

    // these lines could be expanded to support different libraries like embark, ethjs, buidler, etc
    const zosConfig = new ZosConfig();
    const truffleConfig = new TruffleConfig();
    if (zosConfig.exists(root)) {
      this.config = zosConfig;
    } else if (truffleConfig.existsTruffleConfig(root)) {
      this.config = truffleConfig;
    } else {
      throw Error('Could not find networks.js file, please remember to initialize your project.');
    }
  },
};

 export default ConfigManager;
