import TransactionController from '../models/network/TransactionController';
import { CallParams } from './interfaces';
import stdout from '../utils/stdout';

export default async function call({
  proxyAddress,
  methodName,
  methodArgs,
  network,
  txParams,
  networkFile,
}: Partial<CallParams>): Promise<void | never> {
  if (!proxyAddress) throw Error('A contract address must be specified.');
  if (!methodName) throw Error('A method name must be specified.');

  const controller = new TransactionController(txParams, network, networkFile);
  const returnedValue = await controller.callContractMethod(proxyAddress, methodName, methodArgs);
  if (returnedValue !== undefined) stdout(returnedValue);
}
