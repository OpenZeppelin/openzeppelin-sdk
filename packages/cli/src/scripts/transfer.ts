import TransactionController from '../models/network/TransactionController';
import ScriptError from '../models/errors/ScriptError';
import { CreateParams } from './interfaces';

export default async function createProxy({ units, to, value, txParams = {} }: any): Promise<any> {
  const controller = new TransactionController(txParams);
  await controller.transfer(units, to, value);
}
