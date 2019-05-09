import TransactionController from '../models/network/TransactionController';
import { SendTxParams } from './interfaces';

export default async function sendTx({ proxyAddress, methodName, methodArgs, network, txParams, networkFile }: SendTxParams): Promise<void | never> {
  if (!methodName) throw Error('A method name must be specified.');

  const controller = new TransactionController(txParams, network, networkFile);
  await controller.sendTransaction(proxyAddress, methodName, methodArgs);
}
