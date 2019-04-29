import TransactionController from '../models/network/TransactionController';
import ScriptError from '../models/errors/ScriptError';
import { CreateParams } from './interfaces';

export default async function transfer({ to, value, unit = 'ether', from, txParams = {} }: any): Promise<any> {
  if (!to) throw Error('A recipient address must be specified');
  if (!value) throw Error('An amount to be transferred must be specified');

  if (from) txParams = { ...txParams, from };
  const controller = new TransactionController(txParams);
  await controller.transfer(to, value, unit);
}
