import { Logger } from 'zos-lib'
import Stdlib from '../src/models/stdlib/Stdlib'
import StdlibInstaller from '../src/models/stdlib/StdlibInstaller'

muteLogging()
doNotInstallStdlib()

require('chai')
  .use(require('chai-as-promised'))
  .use(require('./helpers/assertions'))
  .should()

function muteLogging() {
  Logger.prototype.info = msg => {}
  Logger.prototype.error = msg => {}
}

function doNotInstallStdlib() {
  StdlibInstaller.call = stdlibNameAndVersion => new Stdlib(stdlibNameAndVersion)
}
