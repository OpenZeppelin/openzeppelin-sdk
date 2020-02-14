import stdout from '../utils/stdout';
import NetworkController from '../models/network/NetworkController';
import { CreateParams } from './interfaces';
import { Loggy } from '@openzeppelin/upgrades';
import { validateSalt } from '../utils/input';

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
}: Partial<CreateParams>): Promise<string | never> {
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
    Loggy.noSpin(
      __filename,
      'querySignedDeployment',
      `query-signed-deployment`,
      `Contract created with salt ${salt} signed by ${signer} will be deployed to the following address`,
    );
    stdout(address);

    return address;
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}
