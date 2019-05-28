import path from 'path';
import pick from 'lodash.pick';
import omit from 'lodash.omit';
import isUndefined from 'lodash.isundefined';
import Web3 from 'web3';
import { FileSystem, ZWeb3 } from 'zos-lib';

const ZosConfig = {
  initialize(root: string = process.cwd()): void {
    this._createContractsDir(root);
    this._createZosConfigFile(root);
  },

  exists(directory: string = process.cwd()): boolean {
    return FileSystem.exists(`${directory}/networks.js`);
  },

  // TODO: set types.
  load(networkName: string): any {
    return this._buildConfig(networkName);
  },

  // TODO: set types.
  _buildConfig(networkName: string, directory: string = process.cwd()) {
    const zosConfigFile = require(`${directory}/networks.js`);
    const { networks } = zosConfigFile;

    if (!networks[networkName]) throw Error(`Given network '${networkName}' is not defined in your networks.js file`);

    const network = networks[networkName];
    const compilers = zosConfigFile.compilers || this._setDefaultCompilersProperties();
    const provider = this._setProvider(networks[networkName]);
    const artifactDefaults = this._setArtifactDefaults(zosConfigFile, networks[networkName]);

    this.config = {
      networks,
      network,
      provider,
      artifactDefaults,
      compilers,
    };

    return this.config;
  },

  // TODO: set types
  _setProvider(network: any): any {
    let { provider } = network;
    if (!provider) {
      const { host, port, protocol } = network;
      if (!host) throw Error('A host name must be specified');
      if (!port) throw Error('A port must be specified');
      provider = `${protocol ? protocol : 'http'}://${host}:${port}`;
    } else if (typeof provider === 'function' && provider.constructor.name !== 'Function') {
      provider = provider();
    }

    return provider;
  },

  _setArtifactDefaults(zosConfigFile: any, network: any) {
    const defaults = ['gas', 'gasPrice', 'from'];
    const configDefaults = omit(pick(zosConfigFile, defaults), isUndefined);
    const networkDefaults = omit(pick(network, defaults), isUndefined);

    return { ...configDefaults, ...networkDefaults };
  },

  _setDefaultCompilersProperties() {
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
  },

  _createContractsDir(root: string): void {
    const contractsDir = `${root}/contracts`;
    this._createDir(contractsDir);
  },

  _createZosConfigFile(root: string): void {
    if (!this.exists(root)) {
      const blueprint = path.resolve(__dirname, './blueprint.truffle.js');
      FileSystem.copy(blueprint, `${root}/truffle-config.js`);
    }
  },

  _createDir(dir: string): void {
    if (!FileSystem.exists(dir)) {
      FileSystem.createDir(dir);
      FileSystem.write(`${dir}/.gitkeep`, '');
    }
  },

};

export default ZosConfig;
