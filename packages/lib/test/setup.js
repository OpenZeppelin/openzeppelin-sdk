'use strict';

import Logger from '../src/utils/Logger'

function muteLogging() {
  Logger.prototype.info = msg => {}
  Logger.prototype.error = msg => {}
}

muteLogging()
