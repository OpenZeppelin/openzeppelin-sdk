import { ZWeb3, Contracts, TxParams } from 'zos-lib';
import Truffle from './truffle/Truffle';
import Session from '../network/Session';
import ZosConfig from './ZosConfig';

export interface NetworkConfig {
  network: string;
  txParams: TxParams;
}

export default class ConfigVariablesInitializer {
  public static initStaticConfiguration(): void {
    const buildDir = Truffle.getBuildDir();
    Contracts.setLocalBuildDir(buildDir);
  }

  public static async initNetworkConfiguration(
    options: any,
    silent?: boolean,
  ): Promise<NetworkConfig> {
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

    // these lines could be expanded to support different libraries like embark, ethjs, buidler, etc
    if (Truffle.existsTruffleConfig() && !ZosConfig.existsZosConfig()) {
      Truffle.validateAndLoadNetworkConfig(network);
      ({ provider, artifactDefaults } = await Truffle.getProviderAndDefaults());
    } else {
      ZosConfig.load(network);
      ({ provider, artifactDefaults }  = ZosConfig.load(network));
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
}
