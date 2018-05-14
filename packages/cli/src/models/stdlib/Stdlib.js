import StdlibInstaller from './StdlibInstaller';
import { FileSystem as fs } from 'zos-lib'
import _ from 'lodash';

export default class Stdlib {
  constructor(nameAndVersion) {
    this._parseNameVersion(nameAndVersion)
  }

  getName() {
    return this.name
  }

  // TODO: Provided version and package.json version may not match, raise an error if so
  getVersion() {
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
