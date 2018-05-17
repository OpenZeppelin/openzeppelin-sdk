import Stdlib from '../src/models/stdlib/Stdlib'
import StdlibInstaller from '../src/models/stdlib/StdlibInstaller'

doNotInstallStdlib()

require('chai')
  .use(require('chai-as-promised'))
  .use(require('./helpers/assertions'))
  .should()

function doNotInstallStdlib() {
  StdlibInstaller.call = stdlibNameAndVersion => new Stdlib(stdlibNameAndVersion)
}
