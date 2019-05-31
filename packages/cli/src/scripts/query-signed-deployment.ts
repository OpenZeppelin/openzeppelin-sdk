import stdout from '../utils/stdout';
import NetworkController from '../models/network/NetworkController';
import ScriptError from '../models/errors/ScriptError';
import { CreateParams } from './interfaces';
import { Contract, encodeParams, Logger } from 'zos-lib';
import { validateSalt } from '../utils/input';

const log: Logger = new Logger('QueryDeployment');

export default async function querySignedDeployment({
  packageName,
  contractAlias,
  methodName,
  methodArgs,
  network,
  txParams = {},
  salt = null,
  signature = null,
  admin = null,
  networkFile,
}: CreateParams): Promise<string | never> {
  validateSalt(salt, true);
  const controller = new NetworkController(network, txParams, networkFile);

  try {
    const { signer, address } = await controller.getProxySignedDeployment(
      salt,
      signature,
      packageName,
      contractAlias,
      methodName,
      methodArgs,
      admin,
    );
    log.info(
      `Contract created with salt ${salt} signed by ${signer} will be deployed to the following address`,
    );
    stdout(address);
    controller.writeNetworkPackageIfNeeded();

    return address;
  } catch (error) {
    const cb = () => controller.writeNetworkPackageIfNeeded();
    throw new ScriptError(error, cb);
  }
}
