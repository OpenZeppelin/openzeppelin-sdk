import stdout from '../utils/stdout';
import NetworkController from '../models/network/NetworkController';
import ScriptError from '../models/errors/ScriptError';
import { QueryDeploymentParams } from './interfaces';
import { Logger } from 'zos-lib';
import { validateSalt } from '../utils/input';

const log: Logger = new Logger('QueryDeployment');

export default async function queryDeployment({
  salt,
  sender,
  network,
  txParams = {},
  networkFile,
}: QueryDeploymentParams): Promise<string | never> {
  validateSalt(salt, true);
  const controller = new NetworkController(network, txParams, networkFile);

  try {
    const address = await controller.getProxyDeploymentAddress(salt, sender);
    const senderLog = sender ? ` from ${sender} ` : ' ';
    log.info(
      `Any contract created with salt ${salt}${senderLog}will be deployed to the following address`,
    );
    stdout(address);
    controller.writeNetworkPackageIfNeeded();

    return address;
  } catch (error) {
    const cb = () => controller.writeNetworkPackageIfNeeded();
    throw new ScriptError(error, cb);
  }
}
