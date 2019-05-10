import TransactionController from '../models/network/TransactionController';
import { CallParams } from './interfaces';

export default async function call({ proxyAddress, methodName, methodArgs, network, txParams, networkFile }: CallParams): Promise<void | never> {
  if (!proxyAddress) throw Error('A contract address must be specified.');
  if (!methodName) throw Error('A method name must be specified.');

  const controller = new TransactionController(txParams, network, networkFile);
  await controller.callContractMethod(proxyAddress, methodName, methodArgs);
}
