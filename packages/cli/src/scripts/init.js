import PackageFilesInterface from '../utils/PackageFilesInterface'

const DEFAULT_VERSION = '0.1.0'
const BASE_PACKAGE = {
  version: null,
  contracts: {},
  stdlib: {}
}

async function init(name, version, { from, packageFileName, stdlib, installDeps }) {
  if (name === undefined) throw 'Must provide a project name'
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = BASE_PACKAGE

  zosPackage.name = name
  zosPackage.version = version || DEFAULT_VERSION
  await files.setStdlib(zosPackage, stdlib, installDeps);
  files.write(zosPackage)
}

module.exports = init
