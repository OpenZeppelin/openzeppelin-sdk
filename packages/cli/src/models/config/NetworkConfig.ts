import fs from 'fs';
import path from 'path';
import { pick, omitBy, isUndefined } from 'lodash';

interface NetworkConfigInterface extends ConfigInterface {
  artifactDefaults: ArtifactDefaults;
  network: Network;
}

interface ConfigInterface {
  networks: { [network: string]: Network };
  provider: Provider;
  buildDir: string;
}

interface NetworkCamelCase<T> {
  networkId: T;
}

interface NetworkSnakeCase<T> {
  network_id: T;
}

type NetworkId<T> = NetworkCamelCase<T> | NetworkSnakeCase<T> | (NetworkCamelCase<T> & NetworkSnakeCase<T>);

type NetworkURL = {
  url: string;
};

type NetworkURLParts = {
  host: string;
  port?: number | string;
  protocol?: string;
  path?: string;
};

type NetworkConnection = NetworkURL | NetworkURLParts;

type Network = NetworkConnection &
  NetworkId<string | number> & {
    from?: number | string;
    gas?: number | string;
    gasPrice?: number | string;
    provider?: string | (() => any);
  };

interface ArtifactDefaults {
  from?: number | string;
  gas?: number | string;
  gasPrice?: number | string;
}

type Provider = string | ((any) => any);

const NetworkConfig = {
  name: 'NetworkConfig',

  initialize(root: string = process.cwd()): void {
    this.createContractsDir(root);
    this.createNetworkConfigFile(root);
  },

  exists(root: string = process.cwd()): boolean {
    const filename = this.getConfigFileName(root);
    return fs.existsSync(filename);
  },

  getConfig(root: string = process.cwd()): ConfigInterface {
    const filename = this.getConfigFileName(root);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const networksConfigFile = require(filename);
    const buildDir = `${root}/build/contracts`;

    return { ...networksConfigFile, buildDir };
  },

  getBuildDir(): string {
    return `${process.cwd()}/build/contracts`;
  },

  loadNetworkConfig(networkName: string, root: string = process.cwd()): NetworkConfigInterface {
    const config = this.getConfig(root);
    const { networks } = config;
    if (!networks[networkName]) throw Error(`Given network '${networkName}' is not defined in your networks.js file`);

    const network = networks[networkName];
    if (isUndefined(network.networkId)) {
      network.networkId = network.network_id;
    }

    const provider = this.getProvider(networks[networkName]);
    const artifactDefaults = this.getArtifactDefaults(config, networks[networkName]);

    return {
      ...config,
      network,
      provider,
      artifactDefaults,
    };
  },

  getProvider(network: Network): Provider {
    if (!network.provider) {
      return this.getURL(network);
    } else if (typeof network.provider === 'function') {
      return network.provider();
    } else {
      return network.provider;
    }
  },

  getURL(network: Network): string {
    const networkUrl = (network as NetworkURL).url;
    if (networkUrl) return networkUrl;

    const { host, port, protocol, path } = network as NetworkURLParts;
    if (!host) throw Error('A host name is required for the network connection');
    let url = `${protocol ?? 'http'}://${host}`;
    if (port) url += `:${port}`;
    if (path) url += `/${path}`;
    return url;
  },

  getArtifactDefaults(zosConfigFile: ConfigInterface, network: Network): ArtifactDefaults {
    const defaults = ['gas', 'gasPrice', 'from'];
    const configDefaults = omitBy(pick(zosConfigFile, defaults), isUndefined);
    const networkDefaults = omitBy(pick(network, defaults), isUndefined);

    return { ...configDefaults, ...networkDefaults };
  },

  createContractsDir(root: string): void {
    const contractsDir = `${root}/contracts`;
    this.createDir(contractsDir);
  },

  createNetworkConfigFile(root: string): void {
    if (!this.exists(root)) {
      const blueprint = path.resolve(__dirname, './blueprint.networks.js');
      const target = this.getConfigFileName(root);
      fs.copyFileSync(blueprint, target);
    }
  },

  createDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
      fs.writeFileSync(`${dir}/.gitkeep`, '');
    }
  },

  getConfigFileName(root: string): string {
    return `${root}/networks.js`;
  },
};

export default NetworkConfig;
