import stdout from '../utils/stdout';
import ControllerFor from '../models/network/ControllerFor';
import ScriptError from '../models/errors/ScriptError';
import { CreateParams } from './interfaces';
import { Contract } from 'zos-lib';

export default async function createProxy({ packageName, contractAlias, initMethod, initArgs, network, txParams = {}, force = false, networkFile }: CreateParams): Promise<Contract | never> {
  if (!contractAlias) throw Error('A contract alias must be provided to create a new proxy.');

  const controller = ControllerFor(network, txParams, networkFile);
  try {
    await controller.checkContractDeployed(packageName, contractAlias, !force);
    const proxy = await controller.createProxy(packageName, contractAlias, initMethod, initArgs);
    stdout(proxy.address);
    controller.writeNetworkPackageIfNeeded();

    return proxy;
  } catch(error) {
    const cb = () => controller.writeNetworkPackageIfNeeded();
    throw new ScriptError(error, cb);
  }
}
