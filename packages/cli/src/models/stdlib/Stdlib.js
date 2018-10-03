import _ from 'lodash';
import { FileSystem as fs } from 'zos-lib'
import semver from 'semver';

import StdlibProvider from './StdlibProvider';
import StdlibDeployer from './StdlibDeployer';
import StdlibInstaller from './StdlibInstaller';
import { checkVersion } from '../files/ZosVersion';

export default class Stdlib {
  static fetch() {
    return StdlibProvider.from(...arguments);
  }

  static async deploy() {
    return await StdlibDeployer.deploy(...arguments);
  }

  static satisfiesVersion(version, requirement) {
    return !requirement || version === requirement || semver.satisfies(version, requirement);
  }

  static validateSatisfiesVersion(version, requirement) {
    if (!Stdlib.satisfiesVersion(version, requirement)) {
      throw Error(`Required stdlib version ${requirement} does not match stdlib package version ${version}`);
    }
  }

  constructor(nameAndVersion) {
    this._parseNameVersion(nameAndVersion)
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
    checkVersion(this._packageJson.zosversion, filename)
    return this._packageJson
  }

  _parseNameVersion(nameAndVersion) {
    const [name, version] = nameAndVersion.split('@')
    this.name = name
    this.nameAndVersion = nameAndVersion

    const packageVersion = this.getPackage().version
    Stdlib.validateSatisfiesVersion(packageVersion, version)

    this.version = version || tryWithCaret(packageVersion)
  }
}

function tryWithCaret(version) {
  const cleaned = semver.clean(version);
  return cleaned ? `^${cleaned}` : version;
}
