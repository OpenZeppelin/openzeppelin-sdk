import fs from 'fs';
import { pickBy, pick } from 'lodash';
import npm from 'npm-programmatic';
import semver from 'semver';
import { Loggy } from '@openzeppelin/upgrades';
import TruffleConfigModule from 'truffle-config';

const TruffleConfig = {
  name: 'TruffleConfig',

  exists(path: string = process.cwd()): boolean {
    const truffleFile = `${path}/truffle.js`;
    const truffleConfigFile = `${path}/truffle-config.js`;
    return fs.existsSync(truffleFile) || fs.existsSync(truffleConfigFile);
  },

  isTruffleProject(path: string = process.cwd()): boolean {
    return this.exists(path);
  },

  async loadNetworkConfig(network: string, force = false, path: string = process.cwd()): Promise<any> {
    const config = this.getConfig(force);
    const { networks: networkList } = config;
    if (!networkList[network])
      throw Error(`Given network '${network}' is not defined in your ${this.getConfigFileName(path)} file`);
    config.network = network;
    config.networkId = config.network_id;

    const { provider } = config;
    await this.checkHdWalletProviderVersion(provider);
    const artifactDefaults = this.getArtifactDefaults(config);

    return { ...config, provider, artifactDefaults };
  },

  getBuildDir(): string {
    const config = this.getConfig();
    return config.contracts_build_directory;
  },

  getConfig(force = false): any | never {
    if (!force && this.config) return this.config;
    try {
      this.config = TruffleConfigModule.detect({ logger: console });
      return this.config;
    } catch (error) {
      error.message = `Could not load truffle configuration file. Error: ${error.message}`;
      throw error;
    }
  },

  async checkHdWalletProviderVersion(provider: any, path: string = process.cwd()): Promise<void> {
    if (provider.constructor.name !== 'HDWalletProvider') return;
    const packagesList = await npm.list(path);
    const hdwalletProviderPackage = packagesList.find(packageNameAndVersion =>
      packageNameAndVersion.match(/^truffle-hdwallet-provider@/),
    );
    if (hdwalletProviderPackage) {
      const [, version] = hdwalletProviderPackage.split('@');
      if (version && semver.lt(version, '1.0.0')) {
        Loggy.noSpin.warn(
          __filename,
          'checkHdWalletProviderVersion',
          'check-hdwallet-provider-version',
          `Version ${version} of truffle-hdwallet-provider might fail when deploying multiple contracts. Consider upgrading it to version '1.0.0' or higher.`,
        );
      }
    }
  },

  getArtifactDefaults(config) {
    const network = config.network;
    const rawConfig = require(require('truffle-config').search()) || {};
    const networks = rawConfig.networks || {};
    const networkConfig = networks[network];

    const configDefaults = pickBy(pick(this.config, 'from', 'gasPrice'));
    const networkDefaults = pickBy(pick(networkConfig, 'from', 'gas', 'gasPrice'));

    return { ...configDefaults, ...networkDefaults };
  },

  getConfigFileName(path: string): string {
    const truffleFile = `${path}/truffle.js`;
    return fs.existsSync(truffleFile) ? 'truffle.js' : 'truffle-config.js';
  },
};

export default TruffleConfig;
