import colors from 'colors';
import fs from 'fs';

// zOS commands.
import push from 'zos/lib/scripts/push';

// Enable zOS logging.
import { Logger } from 'zos-lib';
Logger.silent(false);

export default async function deploy(options) {
  console.log(colors.cyan(`pushing app with options ${ JSON.stringify(options, null, 2) }`).inverse);

  // If network is local, remove existing file.
  const zosLocalPath = './zos.local.json';
  if(options.network === 'local' && fs.existsSync(zosLocalPath)) {
    console.log(colors.yellow(`Deleting old zos.local.json (this is only done for the local network).`));
    fs.unlinkSync(zosLocalPath);
  }

  // Warn about the need for tpl-contracts-zos to already be deployed in the network.
  console.log(colors.yellow(`Note: this assumes that tpl-contracts-zos is already deployed in ${options.network}.`));

  // Run script.
  await push({
    ...options
  });

  console.log(colors.cyan(`app pushed.`).inverse);

}
