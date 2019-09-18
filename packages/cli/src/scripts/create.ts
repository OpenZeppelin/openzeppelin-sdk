import stdout from '../utils/stdout';
import NetworkController from '../models/network/NetworkController';
import ScriptError from '../models/errors/ScriptError';
import { CreateParams, ProxyType } from './interfaces';
import { Contract } from '@openzeppelin/upgrades';
import { validateSalt } from '../utils/input';

export default async function createProxy({
  packageName,
  contractAlias,
  methodName,
  methodArgs,
  network,
  txParams = {},
  force = false,
  salt = null,
  signature = null,
  admin = null,
  kind = ProxyType.Upgradeable,
  networkFile,
}: CreateParams): Promise<Contract | never> {
  if (!contractAlias) throw Error('A contract alias must be provided to create a new proxy.');
  validateSalt(salt, false);

  const controller = new NetworkController(network, txParams, networkFile);
  try {
    const instance = await controller.deployInstance(
      packageName,
      contractAlias,
      methodName,
      methodArgs,
      admin,
      salt,
      signature,
      kind,
    );
    stdout(instance.address);
    controller.writeNetworkPackageIfNeeded();

    return instance;
  } catch (error) {
    const cb = () => controller.writeNetworkPackageIfNeeded();
    throw new ScriptError(error, cb);
  }
}
