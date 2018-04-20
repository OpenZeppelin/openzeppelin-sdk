import PackageFilesInterface from '../utils/PackageFilesInterface'

async function setStdlib(stdlibName, { network, from, packageFileName, stdlib, installDeps }) {
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()
  await files.setStdlib(zosPackage, stdlibName || stdlib, installDeps)
    
  files.write(zosPackage)
}

module.exports = setStdlib
