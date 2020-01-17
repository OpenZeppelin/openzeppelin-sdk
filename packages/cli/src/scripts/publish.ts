import NetworkController from '../models/network/NetworkController';
import { PublishParams } from './interfaces';

export default async function publish({ network, txParams = {}, networkFile }: PublishParams): Promise<void | never> {
  const controller = new NetworkController(network, txParams, networkFile);

  try {
    await controller.publish();
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}
