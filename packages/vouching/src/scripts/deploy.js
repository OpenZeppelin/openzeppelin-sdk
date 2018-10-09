import colors from 'colors';
import fs from 'fs';

// zOS commands.
import push from 'zos/lib/scripts/push';

// Enable zOS logging.
import { Logger } from 'zos-lib';
Logger.silent(false);

export default async function deploy(options) {
  console.log(colors.cyan(`pushing app with options ${ JSON.stringify(options, null, 2) }`).inverse);

  // If network is local, remove existing zos.local.json files.
  let zosLocalPath = `./zos.${options.network}.json`;
  const isLocal = options.network === 'local' || options.network === 'test';
  if(isLocal && fs.existsSync(zosLocalPath)) {
    console.log(colors.yellow(`Deleting old zos.${options.network}.json files (this is only done for local networks).`));
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

  console.log(colors.green(`app pushed`).inverse);
}
