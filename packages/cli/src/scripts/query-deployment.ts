import stdout from '../utils/stdout';
import NetworkController from '../models/network/NetworkController';
import ScriptError from '../models/errors/ScriptError';
import { QueryDeploymentParams } from './interfaces';
import { Contract, encodeParams, Logger } from 'zos-lib';

const log: Logger = new Logger('QueryDeployment');

export default async function queryDeployment({ salt, network, txParams = {}, networkFile }: QueryDeploymentParams): Promise<string | never> {
  validateSalt(salt);
  const controller = new NetworkController(network, txParams, networkFile);

  try {
    const address = await controller.getProxyDeploymentAddress(salt);
    log.info(`Any contract created with salt ${salt} will be deployed to the following address`);
    stdout(address);
    controller.writeNetworkPackageIfNeeded();

    return address;
  } catch(error) {
    const cb = () => controller.writeNetworkPackageIfNeeded();
    throw new ScriptError(error, cb);
  }
}

function validateSalt(salt) {
  if (!salt) {
    throw new Error('A non-empty salt is required to calculate the deployment address.');
  }
  try {
    encodeParams(['uint256'], [salt]);
  } catch(err) {
    throw new Error(`Invalid salt ${salt}, must be an uint256 value.`);
  }
}
