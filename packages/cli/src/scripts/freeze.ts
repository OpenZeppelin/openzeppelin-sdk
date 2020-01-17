import NetworkController from '../models/network/NetworkController';
import { FreezeParams } from './interfaces';

export default async function freeze({ network, txParams = {}, networkFile }: FreezeParams): Promise<void | never> {
  const controller = new NetworkController(network, txParams, networkFile);
  try {
    await controller.freeze();
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}
