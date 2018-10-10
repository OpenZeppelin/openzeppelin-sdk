import stdout from '../utils/stdout';
import ControllerFor from '../models/network/ControllerFor';
import { Logger } from 'zos-lib'

const log = new Logger('scripts/create')

export default async function createProxy({ packageName, contractAlias, initMethod, initArgs, network, txParams = {}, force = false, networkFile = undefined }) {
  if (!contractAlias) throw Error('A contract alias must be provided to create a new proxy.')
  
  const controller = ControllerFor(network, txParams, networkFile)
  if (controller.isLib) throw Error('Cannot create a proxy for a library project')
  
  try {
    await controller.checkContractDeployed(packageName, contractAlias, !force);
    const proxy = await controller.createProxy(packageName, contractAlias, initMethod, initArgs);
    stdout(proxy.address);

    return proxy;
  } catch(error) {
    log.error(error.message)
  } finally {
    controller.writeNetworkPackageIfNeeded()
  }

}
