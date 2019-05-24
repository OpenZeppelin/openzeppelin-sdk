import pickBy from 'lodash.pickby';
import pick from 'lodash.pick';
import npm from 'npm-programmatic';
import semver from 'semver';
import { FileSystem, Contracts, Logger } from 'zos-lib';

const log = new Logger('Truffle');

const Truffle = {

  existsTruffleConfig(path: string = process.cwd()): boolean {
    const truffleFile = `${path}/truffle.js`;
    const truffleConfigFile = `${path}/truffle-config.js`;
    return FileSystem.exists(truffleFile) || FileSystem.exists(truffleConfigFile);
  },

  isTruffleProject(path: string = process.cwd()): boolean {
    const truffleDir = `${path}/node_modules/truffle`;
    const existsTruffleDependency = FileSystem.exists(truffleDir);
    return Truffle.existsTruffleConfig(path) && existsTruffleDependency;
  },

  validateAndLoadNetworkConfig(network: string, force: boolean = false, path: string = process.cwd()): void {
    const config = this.getConfig(force);
    const { networks: networkList } = config;
    if (!networkList[network]) throw Error(`Given network '${network}' is not defined in your ${this._getTruffleConfigFileName(path)} file`);
    config.network = network;
  },

  getBuildDir(): string {
    const config = this.getConfig();
    return config.contracts_build_directory;
  },

  async getProviderAndDefaults(): Promise<any> {
    const config = this.getConfig();
    const { provider } = config;
    await this._checkHdWalletProviderVersion(provider);
    const artifactDefaults = this._getArtifactDefaults(config);

    return { provider, artifactDefaults };
  },

  getConfig(force: boolean = false): any | never {
    if (!force && this.config) return this.config;
    try {
      const TruffleConfig = require('truffle-config');
      this.config = TruffleConfig.detect({ logger: console });
      return this.config;
    } catch (error) {
      if (error.message === 'Could not find suitable configuration file.') {
        throw Error('Could not find truffle.js or truffle-config.js file, remember to initialize your project.');
      } else {
        throw Error('Could not load truffle.js or truffle-config.js file.\n' + error);
      }
    }
  },

  getCompilerInfo(): { version?: string, optimizer?: boolean, optimizerRuns?: number } {
    const config = this.getConfig();
    const { compilers: { solc: { version, settings } } } = config;
    const { enabled: optimizer, runs: optimizerRuns } = settings.optimizer;
    return { version, optimizer, optimizerRuns };
  },

  getNetworkNamesFromConfig(): string[] | null {
    const config = this.getConfig();
    return config && config.networks ? Object.keys(config.networks) : undefined;
  },

  getContractNames(): string[] {
    const buildDir = this.getBuildDir();
    if (FileSystem.exists(buildDir)) {
      return FileSystem.readDir(buildDir)
        .filter(name => name.match(/\.json$/))
        .map(name => FileSystem.parseJsonIfExists(`${buildDir}/${name}`))
        .filter(contract => {
          return this._isLocalContract(buildDir, contract)
            && !this._isLibrary(contract)
            && !this._isAbstractContract(contract);
        })
        .map(({ contractName }) => contractName);
    } else return [];
  },

  _isLocalContract(buildDir: string, contract: { [key: string]: any }): boolean {
    const projectDir = buildDir.replace('build/contracts', '');
    return contract.sourcePath.indexOf(projectDir) === 0;
  },

  _isAbstractContract(contract: { [key: string]: any }): boolean {
    return contract && contract.bytecode.length <= 2;
  },

  _isLibrary(contract: { [key: string]: any }): boolean {
    return contract && contract.ast && !!contract.ast.nodes
      .find(node => node.contractKind === 'library' && node.name === contract.contractName);
  },

  async _checkHdWalletProviderVersion(provider: any, path: string = process.cwd()): Promise<void> {
    if (provider.constructor.name !== 'HDWalletProvider') return;
    const packagesList = await npm.list(path);
    const hdwalletProviderPackage = packagesList
      .find(packageNameAndVersion => packageNameAndVersion.match(/^truffle-hdwallet-provider@/));
    if (hdwalletProviderPackage) {
      const [name, version] = hdwalletProviderPackage.split('@');
      if (version && semver.lt(version, '1.0.0')) {
        log.warn(`Version ${version} of truffle-hdwallet-provider might fail when deploying multiple contracts. Consider upgrading it to version '1.0.0' or higher.`);
      }
    }
  },

  _getArtifactDefaults(config) {
    const network = config.network;
    const rawConfig = require(require('truffle-config').search()) || {};
    const networks = rawConfig.networks || {};
    const networkConfig = networks[network];

    const configDefaults = pickBy(pick(this.config, 'from', 'gasPrice'));
    const networkDefaults = pickBy(pick(networkConfig, 'from', 'gas', 'gasPrice'));

    return { ...configDefaults, ...networkDefaults };
  },

  _getTruffleConfigFileName(path: string): string {
    const truffleFile = `${path}/truffle.js`;
    return FileSystem.exists(truffleFile) ? 'truffle.js' : 'truffle-config.js';
  },

};

export default Truffle;
