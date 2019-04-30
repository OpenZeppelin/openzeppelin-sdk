import TransactionController from '../models/network/TransactionController';
import { BalanceParams } from './interfaces';

export default async function transfer({ accountAddress, contractAddress }: BalanceParams): Promise<any> {
  if (!accountAddress) throw Error('An account address must be specified.');
  const controller = new TransactionController();
  await controller.getBalanceOf(accountAddress, contractAddress);
}
