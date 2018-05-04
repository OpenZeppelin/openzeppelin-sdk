import Logger from '../src/utils/Logger'
import ContractsProvider from '../lib/utils/ContractsProvider'

global.ContractsProvider = ContractsProvider

muteLogging()

function muteLogging() {
  Logger.prototype.info = msg => {}
  Logger.prototype.error = msg => {}
}
