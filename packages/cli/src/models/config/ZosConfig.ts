import path from 'path';
import pick from 'lodash.pick';
import omit from 'lodash.omit';
import isUndefined from 'lodash.isundefined';
import { FileSystem } from 'zos-lib';

export default class ZosConfig {
  public initialize(root: string = process.cwd()) {
    this.createContractsDir(root);
    this.createZosConfigFile(root);
  }

  public exists(root: string = process.cwd()): boolean {
    return FileSystem.exists(`${root}/networks.js`);
  }

  public getConfig(root: string = process.cwd()) {
    const zosConfigFile = require(`${root}/networks.js`);
    const compilers = zosConfigFile.compilers || this.getDefaultCompilersProperties();
    const buildDir = `${root}/build/contracts`;

    return { ...zosConfigFile, compilers, buildDir };
  }

  public getBuildDir() {
    return `${process.cwd()}/build/contracts`;
  }

  // TODO: set types.
  public loadNetworkConfig(networkName: string, root: string = process.cwd()): any {
    const config = this.getConfig(root);
    const { networks } = config;
    if (!networks[networkName]) throw Error(`Given network '${networkName}' is not defined in your networks.js file`);

    const network = networks[networkName];
    const provider = this.getProvider(networks[networkName]);
    const artifactDefaults = this.getArtifactDefaults(config, networks[networkName]);

    return {
      ...config,
      network,
      provider,
      artifactDefaults,
    };
  }

  // TODO: set types
  private getProvider(network: any): any {
    let { provider } = network;

    if (!provider) {
      const { host, port, protocol } = network;
      if (!host) throw Error('A host name must be specified');
      if (!port) throw Error('A port must be specified');
      provider = `${protocol ? protocol : 'http'}://${host}:${port}`;
    } else if (typeof provider === 'function') {
      provider = provider();
    }

    return provider;
  }

  private getArtifactDefaults(zosConfigFile: any, network: any) {
    const defaults = ['gas', 'gasPrice', 'from'];
    const configDefaults = omit(pick(zosConfigFile, defaults), isUndefined);
    const networkDefaults = omit(pick(network, defaults), isUndefined);

    return { ...configDefaults, ...networkDefaults };
  }

  private getDefaultCompilersProperties() {
    return {
      vyper: {},
      solc: {
        settings: {
          optimizer: {
            enabled: false,
            runs: 200
          }
        }
      }
    };
  }

  private createContractsDir(root: string): void {
    const contractsDir = `${root}/contracts`;
    this.createDir(contractsDir);
  }

  private createZosConfigFile(root: string): void {
    if (!this.exists(root)) {
      const blueprint = path.resolve(__dirname, './blueprint.networks.js');
      FileSystem.copy(blueprint, `${root}/networks.js`);
    }
  }

  private createDir(dir: string): void {
    if (!FileSystem.exists(dir)) {
      FileSystem.createDir(dir);
      FileSystem.write(`${dir}/.gitkeep`, '');
    }
  }
}
