import stdout from '../utils/stdout';
import NetworkController from '../models/network/NetworkController';
import ScriptError from '../models/errors/ScriptError';
import { CreateParams } from './interfaces';
import { Contract } from 'zos-lib';
import { validateSalt } from '../utils/input';

export default async function createProxy({ packageName, contractAlias, methodName, methodArgs, network, txParams = {}, force = false, salt = null, signature = null, admin = null, networkFile }: CreateParams): Promise<Contract | never> {
  if (!contractAlias) throw Error('A contract alias must be provided to create a new proxy.');
  validateSalt(salt, false);

  const controller = new NetworkController(network, txParams, networkFile);
  try {
    await controller.checkContractDeployed(packageName, contractAlias, !force);
    const proxy = await controller.createProxy(packageName, contractAlias, methodName, methodArgs, admin, salt, signature);
    stdout(proxy.address);
    controller.writeNetworkPackageIfNeeded();

    return proxy;
  } catch(error) {
    const cb = () => controller.writeNetworkPackageIfNeeded();
    throw new ScriptError(error, cb);
  }
}
