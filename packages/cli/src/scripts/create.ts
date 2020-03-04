import stdout from '../utils/stdout';
import NetworkController from '../models/network/NetworkController';
import { CreateParams, ProxyType } from './interfaces';
import { Contract, Loggy } from '@openzeppelin/upgrades';
import { validateSalt } from '../utils/input';

export default async function createProxy({
  packageName,
  contractName,
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
}: Partial<CreateParams>): Promise<Contract | never> {
  if (!contractName) throw Error('A contract name must be provided to create a new proxy.');
  validateSalt(salt, false);

  const controller = new NetworkController(network, txParams, networkFile);
  try {
    await controller.logErrorIfContractPackageIsInvalid(packageName, contractName, !force);
    const proxy = await controller.createProxy(
      packageName,
      contractName,
      methodName,
      methodArgs,
      kind,
      admin,
      salt,
      signature,
    );

    Loggy.noSpin(__filename, 'deploy', 'deploy-hint', `To upgrade this instance run 'oz upgrade'`);

    stdout(proxy.address);

    return proxy;
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}
