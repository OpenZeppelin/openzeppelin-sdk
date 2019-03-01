import stdout from '../utils/stdout';
import NetworkController from '../models/network/NetworkController';
import ScriptError from '../models/errors/ScriptError';
import { CreateParams } from './interfaces';
import { Contract, encodeParams } from 'zos-lib';

export default async function createProxy({ packageName, contractAlias, initMethod, initArgs, network, txParams = {}, force = false, salt = null, networkFile }: CreateParams): Promise<Contract | never> {
  if (!contractAlias) throw Error('A contract alias must be provided to create a new proxy.');
  validateSalt(salt);

  const controller = new NetworkController(network, txParams, networkFile);
  try {
    await controller.checkContractDeployed(packageName, contractAlias, !force);
    const proxy = await controller.createProxy(packageName, contractAlias, initMethod, initArgs, salt);
    stdout(proxy.address);
    controller.writeNetworkPackageIfNeeded();

    return proxy;
  } catch(error) {
    const cb = () => controller.writeNetworkPackageIfNeeded();
    throw new ScriptError(error, cb);
  }
}

function validateSalt(salt) {
  if (!salt) return;
  try {
    encodeParams(['uint256'], [salt]);
  } catch(err) {
    throw new Error(`Invalid salt ${salt}, must be an uint256 value.`);
  }
}
