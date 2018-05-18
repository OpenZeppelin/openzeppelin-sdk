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
    return this.version
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

  getPackage() {
    if (this._packageJson) return this._packageJson
    const filename = `node_modules/${this.name}/zos.json`
    this._packageJson = fs.parseJson(filename)
    return this._packageJson
  }

  _parseNameVersion(nameAndVersion) {
    const [name, version] = nameAndVersion.split('@')
    this.name = name
    const packageVersion = this.getPackage().version;
    this.version = version || packageVersion
    this.nameAndVersion = nameAndVersion
    if (this.version !== packageVersion) throw Error(`Requested stdlib version ${version} does not match stdlib package version ${packageVersion}`)
  }
}
