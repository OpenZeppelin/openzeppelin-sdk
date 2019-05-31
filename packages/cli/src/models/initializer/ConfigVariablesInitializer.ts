import { ZWeb3, Contracts, TxParams } from 'zos-lib';
import Truffle from './truffle/Truffle';
import Session from '../network/Session';

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
