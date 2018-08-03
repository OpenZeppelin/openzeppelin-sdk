process.env.NODE_ENV = 'test'

import Stdlib from '../src/models/stdlib/Stdlib'
import ZosPackageFile from '../src/models/files/ZosPackageFile'
import ZosNetworkFile from '../src/models/files/ZosNetworkFile'
import StdlibInstaller from '../src/models/stdlib/StdlibInstaller'

useTestZosPackageFile()
doNotInstallStdlib()

require('chai')
  .use(require('chai-as-promised'))
  .use(require('zos-lib').assertions)
  .use(require('sinon-chai'))
  .should()

function useTestZosPackageFile() {
  ZosPackageFile.prototype.write = () => {}
  ZosNetworkFile.prototype.write = () => {}
}

function doNotInstallStdlib() {
  StdlibInstaller.call = stdlibNameAndVersion => new Stdlib(stdlibNameAndVersion)
}
