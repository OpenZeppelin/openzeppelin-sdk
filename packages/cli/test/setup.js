process.env.NODE_ENV = 'test'

import ZosPackageFile from '../src/models/files/ZosPackageFile'
import ZosNetworkFile from '../src/models/files/ZosNetworkFile'
import Dependency from '../src/models/dependency/Dependency'

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
  Dependency.installFn = Dependency.install
  Dependency.install = Dependency.fromNameWithVersion
}
