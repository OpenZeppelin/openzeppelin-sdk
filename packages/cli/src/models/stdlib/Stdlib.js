import _ from 'lodash';
import { FileSystem as fs } from 'zos-lib'

import StdlibProvider from './StdlibProvider';
import StdlibDeployer from './StdlibDeployer';
import StdlibInstaller from './StdlibInstaller';

export default class Stdlib {
  static fetch() {
    return StdlibProvider.from(...arguments);
  }

  static async deploy() {
    return await StdlibDeployer.deploy(...arguments);
  }

  constructor(nameAndVersion) {
    this._parseNameVersion(nameAndVersion)
  }

  getName() {
    return this.name
  }

  getVersion() {
    // TODO: Provided version and package.json version may not match, raise an error if so
    if (this.version) return this.version
    return this.getPackage().version
  }

  getPackage() {
    if (this._packageJson) return this._packageJson
    const filename = `node_modules/${this.name}/package.zos.json`
    this._packageJson = fs.parseJson(filename)
    return this._packageJson
  }

  contracts() {
    return this.getPackage().contracts
  }

  contract(alias) {
    return this.contracts()[alias]
  }

  hasContract(alias) {
    if (!this.contracts()) return false;
    return !_.isEmpty(this.contract(alias));
  }
  
  async install() {
    await StdlibInstaller.call(this.nameAndVersion)
  }

  _parseNameVersion(nameAndVersion) {
    const [name, version] = nameAndVersion.split('@')
    this.name = name
    this.version = version
    this.nameAndVersion = nameAndVersion;
  }
}
