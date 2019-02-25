import NetworkController from '../models/network/NetworkController';
import { CompareParams } from './interfaces';

export default async function compare({ network, txParams = {}, networkFile }: CompareParams): Promise<void> {
  const controller = new NetworkController(network, txParams, networkFile);
  await controller.compareCurrentStatus();
}
