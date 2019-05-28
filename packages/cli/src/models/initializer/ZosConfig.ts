import pick from 'lodash.pick';
import omit from 'lodash.omit';
import isUndefined from 'lodash.isundefined';
import { FileSystem, ZWeb3 } from 'zos-lib';
import Web3 from 'web3';

const ZosConfig = {
  existsZosConfig(path: string = process.cwd()): boolean {
    return FileSystem.exists(`${path}/zos-config.js`);
  },

  // TODO: set types.
  load(networkName: string, force: boolean = false, path: string = process.cwd()): any {
    return this._buildZosConfig(networkName);
  },

  // TODO: set types.
  _buildZosConfig(networkName: string, path: string = process.cwd()) {
    const zosConfigFile = require(`${path}/zos-config.js`);
    const { networks } = zosConfigFile;

    if (!networks[networkName]) throw Error(`Given network '${networkName}' is not defined in your zos-config.js file`);

    const network = networks[networkName];
    const compilers = zosConfigFile.compilers || this._setDefaultCompilersProperties();
    const provider = this._setProvider(networks[networkName]);
    const artifactDefaults = this._setArtifactDefaults(zosConfigFile, networks[networkName]);

    this.zosConfig = {
      networks,
      network,
      provider,
      artifactDefaults,
      compilers,
    };

    return this.zosConfig;
  },

  // TODO: set types
  _setProvider(network: any): any {
    let { provider } = network;
    if (!provider) {
      const { host, port } = network;
      if (!host) throw Error('A host name must be specified');
      if (!port) throw Error('A port must be specified');
      // TODO: set provider for IPC and WS
      provider = new Web3.providers.HttpProvider(`http://${host}:${port}`);
    } else if (typeof provider === 'function' && provider.constructor.name !== 'Function') {
      provider = provider();
    }

    return provider;
  },

  _setArtifactDefaults(zosConfigFile: any, network: any) {
    const defaults = ['gas', 'gasPrice', 'from'];
    const configDefaults = omit(pick(this.zosConfig, defaults), isUndefined);
    const networkDefaults = omit(pick(network, defaults), isUndefined);

    console.log({ ...configDefaults, ...networkDefaults });
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
  }
};

export default ZosConfig;
