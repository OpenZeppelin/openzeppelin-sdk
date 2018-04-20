import PackageFilesInterface from '../utils/PackageFilesInterface'

async function setStdlib(stdlibName, { network, from, packageFileName }) {
  const files = new PackageFilesInterface(packageFileName)
  const zosPackage = files.read()
  await files.setStdlib(zosPackage, stdlibName)
    
  files.write(zosPackage)
}

module.exports = setStdlib
