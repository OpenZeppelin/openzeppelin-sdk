'use strict';

import fs from 'fs';
import { Logger } from 'zos-lib';

const ZOS_SESSION_PATH = '.zos.session';

export function getNetwork() {
  var networkName = undefined;
  try {
    networkName = fs.readFileSync(ZOS_SESSION_PATH).toString();
  } catch(e) {
  }

  return networkName;
}

export function setNetwork({ network = undefined, close = false }) {
  if ((!network && !close) || (network && close)) {
    throw Error('Please provide either --network <network> or --close.')
  }

  let log = new Logger('scripts/session');

  if (close) {
    if (fs.existsSync(ZOS_SESSION_PATH)) {
      fs.unlinkSync(ZOS_SESSION_PATH);
    }
    log.info(`Removed ${ZOS_SESSION_PATH}.`);
    return;
  }

  fs.writeFileSync(ZOS_SESSION_PATH, network);
  log.info(`Using "${network}" as default network unless overriden.`);
}

