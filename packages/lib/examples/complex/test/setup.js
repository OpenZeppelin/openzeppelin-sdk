import { Logger } from 'zos-lib'

function muteLogging() {
  Logger.prototype.info = msg => {}
  Logger.prototype.error = msg => {}
}

muteLogging()
