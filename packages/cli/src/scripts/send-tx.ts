import TransactionController from '../models/network/TransactionController';
import { SendTxParams } from './interfaces';

export default async function sendTx({
  proxyAddress,
  methodName,
  methodArgs,
  value,
  gas,
  network,
  txParams,
  networkFile,
  asyncTx,
}: Partial<SendTxParams>): Promise<void | never> {
  if (!proxyAddress) throw Error('A contract address must be specified.');
  if (!methodName) throw Error('A method name must be specified.');
  if (value) txParams = { value, ...txParams };
  if (gas) txParams = { gas, ...txParams };

  const controller = new TransactionController(txParams, network, networkFile);
  const result = controller.sendTransaction(proxyAddress, methodName, methodArgs);
  return asyncTx ? result : await result;
}
