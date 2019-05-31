import pickBy from 'lodash.pickby';
import pick from 'lodash.pick';
import npm from 'npm-programmatic';
import semver from 'semver';
import { FileSystem, Logger } from 'zos-lib';
import TruffleConfig from 'truffle-config';

const log = new Logger('Truffle');

export default class Truffle {
  private config: any;

  public existsTruffleConfig(path: string = process.cwd()): boolean {
    const truffleFile = `${path}/truffle.js`;
    const truffleConfigFile = `${path}/truffle-config.js`;
    return FileSystem.exists(truffleFile) || FileSystem.exists(truffleConfigFile);
  }

  public isTruffleProject(path: string = process.cwd()): boolean {
    const truffleDir = `${path}/node_modules/truffle`;
    const existsTruffleDependency = FileSystem.exists(truffleDir);
    return this.existsTruffleConfig(path) && existsTruffleDependency;
  }

  public async loadNetworkConfig(network: string, force: boolean = false, path: string = process.cwd()): Promise<any> {
    const config = this.getConfig(force);
    const { networks: networkList } = config;
    if (!networkList[network]) throw Error(`Given network '${network}' is not defined in your ${this.getTruffleConfigFileName(path)} file`);
    config.network = network;
    const { provider } = config;
    await this.checkHdWalletProviderVersion(provider);
    const artifactDefaults = this.getArtifactDefaults(config);

    return { ...config, provider, artifactDefaults };
  }

  public getBuildDir(): string {
    const config = this.getConfig();
    return config.contracts_build_directory;
  }

  public getConfig(force: boolean = false): any | never {
    if (!force && this.config) return this.config;
    try {
      this.config = TruffleConfig.detect({ logger: console });
      return this.config;
    } catch (error) {
      return;
    }
  }

  private async checkHdWalletProviderVersion(provider: any, path: string = process.cwd()): Promise<void> {
    if (provider.constructor.name !== 'HDWalletProvider') return;
    const packagesList = await npm.list(path);
    const hdwalletProviderPackage = packagesList.find(packageNameAndVersion =>
      packageNameAndVersion.match(/^truffle-hdwallet-provider@/),
    );
    if (hdwalletProviderPackage) {
      const [, version] = hdwalletProviderPackage.split('@');
      if (version && semver.lt(version, '1.0.0')) {
        log.warn(
          `Version ${version} of truffle-hdwallet-provider might fail when deploying multiple contracts. Consider upgrading it to version '1.0.0' or higher.`,
        );
      }
    }
  }

  private getArtifactDefaults(config) {
    const network = config.network;
    const rawConfig = require(require('truffle-config').search()) || {};
    const networks = rawConfig.networks || {};
    const networkConfig = networks[network];

    const configDefaults = pickBy(pick(this.config, 'from', 'gasPrice'));
    const networkDefaults = pickBy(
      pick(networkConfig, 'from', 'gas', 'gasPrice'),
    );

    return { ...configDefaults, ...networkDefaults };
  }

  private getTruffleConfigFileName(path: string): string {
    const truffleFile = `${path}/truffle.js`;
    return FileSystem.exists(truffleFile) ? 'truffle.js' : 'truffle-config.js';
  }
}