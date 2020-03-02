import stdout from '../utils/stdout';
import NetworkController from '../models/network/NetworkController';
import { CreateParams, ProxyType } from './interfaces';
import { Contract, Loggy } from '@openzeppelin/upgrades';
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
}: Partial<CreateParams>): Promise<Contract | never> {
  if (!contractAlias) throw Error('A contract alias must be provided to create a new proxy.');
  validateSalt(salt, false);

  const controller = new NetworkController(network, txParams, networkFile);
  try {
    await controller.checkContractDeployed(packageName, contractAlias, !force);
    const proxy = await controller.createProxy(
      packageName,
      contractAlias,
      methodName,
      methodArgs,
      admin,
      salt,
      signature,
      kind,
    );

    Loggy.noSpin.info(__filename, 'deploy', 'deploy-hint', `Upgrade this instance using 'oz upgrade'`);

    stdout(proxy.address);

    return proxy;
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}
