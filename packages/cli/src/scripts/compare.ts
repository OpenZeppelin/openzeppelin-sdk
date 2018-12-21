import ControllerFor from '../models/network/ControllerFor';
import { CompareParams } from './interfaces';

export default async function compare({ network, txParams = {}, networkFile }: CompareParams): Promise<void> {
  const controller = ControllerFor(network, txParams, networkFile);
  await controller.compareCurrentStatus();
}
