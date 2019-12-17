import stdout from '../utils/stdout';
import NetworkController from '../models/network/NetworkController';
import { QueryDeploymentParams } from './interfaces';
import { Loggy } from '@openzeppelin/upgrades';
import { validateSalt } from '../utils/input';

export default async function queryDeployment({
  salt,
  sender,
  network,
  txParams = {},
  networkFile,
}: QueryDeploymentParams): Promise<string | never> {
  validateSalt(salt, true);
  const controller = new NetworkController(network, txParams, networkFile);

  try {
    const address = await controller.getProxyDeploymentAddress(salt, sender);
    const senderLog = sender ? ` from ${sender} ` : ' ';
    Loggy.noSpin(
      __filename,
      'queryDeployment',
      'query-deployment',
      `Any contract created with salt ${salt}${senderLog}will be deployed to the following address`,
    );
    stdout(address);

    return address;
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}
