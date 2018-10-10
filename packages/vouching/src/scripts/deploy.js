import fs from 'fs';
import log from '../helpers/log'

// zOS commands.
import push from 'zos/lib/scripts/push';

export default async function deploy(options) {
  log.info(`pushing app with options ${ JSON.stringify(options, null, 2) }`)

  // If network is local, remove existing zos.local.json files.
  let zosLocalPath = `./zos.${options.network}.json`;
  const isLocal = options.network === 'local' || options.network === 'test';
  if(isLocal && fs.existsSync(zosLocalPath)) {
    log.warn(`Deleting old zos.${options.network}.json files (this is only done for local networks).`)
    fs.unlinkSync(zosLocalPath);

    // Delete dependency files also.
    zosLocalPath = `./node_modules/tpl-contracts-zos/zos.${options.network}.json`;
    if(fs.existsSync(zosLocalPath)) fs.unlinkSync(zosLocalPath);
  }

  // Run script.
  await push({
    deployLibs: isLocal,
    ...options
  });

  log.info(`app pushed`)
}
