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

  exists(root: string = process.cwd()): boolean {
    return FileSystem.exists(`${root}/networks.js`);
  },

  getBuildDir() {
    const buildDir = this.config ? this.config.buildDir : `${process.cwd()}/build/contracts`;
    if (!FileSystem.exists(buildDir)) FileSystem.createDirPath(buildDir);
    return buildDir;
  },

  // TODO: set types.
  load(networkName: string): any {
    return this._buildConfig(networkName);
  },

  // TODO: set types.
  _buildConfig(networkName: string, root: string = process.cwd()) {
    if (this.config) return this.config;

    const zosConfigFile = require(`${root}/networks.js`);
    const { networks } = zosConfigFile;

    if (!networks[networkName]) throw Error(`Given network '${networkName}' is not defined in your networks.js file`);

    const network = networks[networkName];
    const compilers = zosConfigFile.compilers || this._setDefaultCompilersProperties();
    const provider = this._setProvider(networks[networkName]);
    const artifactDefaults = this._setArtifactDefaults(zosConfigFile, networks[networkName]);
    const buildDir = `${root}/build/contracts`;

    this.config = {
      networks,
      network,
      provider,
      artifactDefaults,
      compilers,
      buildDir,
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
      const blueprint = path.resolve(__dirname, './blueprint.networks.js');
      FileSystem.copy(blueprint, `${root}/networks.js`);
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
