import { ZWeb3, Contracts, TxParams } from 'zos-lib';
import TruffleConfig from './truffle/Truffle';
import Session from '../network/Session';
import ZosConfig from './ZosConfig';

export interface NetworkConfig {
  network: string;
  txParams: TxParams;
}

<<<<<<< HEAD
<<<<<<< HEAD
export default class ConfigVariablesInitializer {
  public static initStaticConfiguration(): void {
=======
const ConfigVariablesInitializer  = {
  initStaticConfiguration(): void {
<<<<<<< HEAD
>>>>>>> Add ZosConfig#load call in config initializer obj
    const buildDir = Truffle.getBuildDir();
=======
    const buildDir = ZosConfig.exists() ? ZosConfig.getBuildDir() : Truffle.getBuildDir();
>>>>>>> Set static configuration
=======
const ConfigVariablesInitializer = {
  setBaseConfig(): void | never {
    if (this.config) return;

    const zosConfig = new ZosConfig();
    const truffleConfig = new TruffleConfig();
    if (zosConfig.exists()) {
      this.config = zosConfig;
    } else if (truffleConfig.existsTruffleConfig()) {
      this.config = truffleConfig;
    } else {
      throw Error('Could not find networks.js file, please remember to initialize your project.');
    }
  },

  initStaticConfiguration(): void {
    this.setBaseConfig();
    const buildDir = this.config.getBuildDir();
>>>>>>> Make config initializer work with both configs
    Contracts.setLocalBuildDir(buildDir);
  },

<<<<<<< HEAD
  public static async initNetworkConfiguration(
    options: any,
    silent?: boolean,
  ): Promise<NetworkConfig> {
=======
  async initNetworkConfiguration(options: any, silent?: boolean): Promise<NetworkConfig> {
>>>>>>> Add ZosConfig#load call in config initializer obj
    this.initStaticConfiguration();
    const { network, from, timeout } = Session.getOptions(options, silent);
    Session.setDefaultNetworkIfNeeded(options.network);
<<<<<<< HEAD
    if (!network)
      throw Error(
        'A network name must be provided to execute the requested action.',
      );

    // these lines could be expanded to support different libraries like embark, ethjs, buidler, etc
    Truffle.validateAndLoadNetworkConfig(network);
    const {
      provider,
      artifactDefaults,
    } = await Truffle.getProviderAndDefaults();
=======
    if (!network) throw Error('A network name must be provided to execute the requested action.');

<<<<<<< HEAD
    if (ZosConfig.exists()) {
      config  = ZosConfig.load(network);
    } else if (Truffle.existsTruffleConfig()) {
      Truffle.validateAndLoadNetworkConfig(network);
      config = await Truffle.getProviderAndDefaults();
    } else {
      throw Error('Could not find networks.js file, please remember to initialize your project.');
    }
>>>>>>> First approach of zos-config file

    const { provider, artifactDefaults } = config;
=======
    const { provider, artifactDefaults } = await this.config.loadNetworkConfig(network);
>>>>>>> Make config initializer work with both configs

    ZWeb3.initialize(provider);
    Contracts.setSyncTimeout(timeout * 1000);
    Contracts.setArtifactsDefaults(artifactDefaults);

    const txParams = {
      from: ZWeb3.toChecksumAddress(
        from || artifactDefaults.from || (await ZWeb3.defaultAccount()),
      ),
    };
    return { network: await ZWeb3.getNetworkName(), txParams };
  },

  getBuildDir() {
    this.setBaseConfig();
    return this.config.getBuildDir();
  },

  getCompilerInfo(): { version?: string, optimizer?: boolean, optimizerRuns?: number } {
    this.setBaseConfig();
    const { compilers: { solc: { version, settings } } } = this.config.getConfig();
    const { enabled: optimizer, runs: optimizerRuns } = settings.optimizer;
    return { version, optimizer, optimizerRuns };
  },

  getNetworkNamesFromConfig(): string[] | null {
    this.setBaseConfig();
    const config = this.config.getConfig();
    return config && config.networks ? Object.keys(config.networks) : undefined;
  },
};

export default ConfigVariablesInitializer;
