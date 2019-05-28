import { ZWeb3, Contracts, TxParams } from 'zos-lib';
import Truffle from './truffle/Truffle';
import Session from '../network/Session';
import ZosConfig from './ZosConfig';

export interface NetworkConfig {
  network: string;
  txParams: TxParams;
}

<<<<<<< HEAD
export default class ConfigVariablesInitializer {
  public static initStaticConfiguration(): void {
=======
const ConfigVariablesInitializer  = {
  initStaticConfiguration(): void {
>>>>>>> Add ZosConfig#load call in config initializer obj
    const buildDir = Truffle.getBuildDir();
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

    let provider, artifactDefaults;

    if (ZosConfig.exists()) {
      ZosConfig.load(network);
      ({ provider, artifactDefaults } = ZosConfig.load(network));
    } else if (Truffle.existsTruffleConfig()) {
      Truffle.validateAndLoadNetworkConfig(network);
      ({ provider, artifactDefaults } = await Truffle.getProviderAndDefaults());
    } else {
      throw Error('Could not find networks.js file, please remember to initialize your project.');
    }
>>>>>>> First approach of zos-config file

    ZWeb3.initialize(provider);
    Contracts.setSyncTimeout(timeout * 1000);
    Contracts.setArtifactsDefaults(artifactDefaults);

    const txParams = {
      from: ZWeb3.toChecksumAddress(
        from || artifactDefaults.from || (await ZWeb3.defaultAccount()),
      ),
    };
    return { network: await ZWeb3.getNetworkName(), txParams };
  }
};

export default ConfigVariablesInitializer;
