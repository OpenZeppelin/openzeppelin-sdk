import stdout from '../utils/stdout';
import TransactionController from '../models/network/TransactionController';
import { BalanceParams } from './interfaces';

export default async function balance({ accountAddress, contractAddress }: BalanceParams): Promise<void | never> {
  if (!accountAddress) throw Error('An account address must be specified.');
  const controller = new TransactionController();
  const balance = await controller.getBalanceOf(accountAddress, contractAddress);
  if (balance) stdout(balance);
}
