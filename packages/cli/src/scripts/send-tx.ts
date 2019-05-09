import TransactionController from '../models/network/TransactionController';
import { SendTxParams } from './interfaces';

export default async function sendTx({ address: contractAddress, methodName, methodArgs, network, txParams }: SendTxParams): Promise<void | never> {
  if (!methodName) throw Error('A method name must be specified.');

  const controller = new TransactionController(txParams, network);
  await controller.sendTransaction(contractAddress, methodName, methodArgs);
}
