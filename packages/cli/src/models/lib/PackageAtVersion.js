import PackageProvider from "zos-lib/lib/package/PackageProvider";

export default class PackageAtVersion {

  static async fetch(address, version, txParams = {}) {
    const provider = new PackageProvider(txParams)
    const basePackage = await provider.from(address);
    const hasVersion = await basePackage.hasVersion(version);
    if (!hasVersion) throw Error(`Could not find version ${version} in package at ${address}`);
    const directory = await basePackage.getRelease(version);
    return new PackageAtVersion(basePackage, version, directory);
  }

  constructor(_wrapped, _version, _directory) {
    this.wrapped = _wrapped;
    this.version = _version;

    this.directories = { }
    this.directories[_version] = _directory;
  }

  get package() {
    return this.wrapped.package;
  }

  currentDirectory() {
    return this.directories[this.version];
  }

  getImplementation(contractName) {
    return this.wrapped.getImplementation(this.version, contractName);
  }

  setImplementation(contractClass, contractName) {
    return this.wrapped.setImplementation(this.version, contractClass, contractName);
  }

  unsetImplementation(contractName) {
    return this.wrapped.unsetImplementation(this.version, contractName);
  }

  async newVersion(version) {
    const release = await this.wrapped.newVersion(version);
    this.directories[version] = release;
    this.version = version;
    return release;
  }

  isFrozen() {
    return this.wrapped.isFrozen(this.version);
  }

  freeze() {
    return this.wrapped.freeze(this.version);
  }
}