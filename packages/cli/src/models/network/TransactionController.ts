import { Transactions, Logger, ZWeb3 } from 'zos-lib';
import { isValidUnit } from '../../utils/units';

const log = new Logger('TransactionController');

export default class TransactionController {
  public txParams: any;

  constructor(txParams) {
    this.txParams = txParams;
  }

  public async transfer(to: string, amount: string, unit: string): Promise<void> {
    if (!isValidUnit(unit)) {
      throw Error(`Invalid unit ${unit}. Please try with: wei, kwei, gwei, milli, ether or any other valid unit.`);
    }
    const validUnit = unit.toLowerCase();
    const value = ZWeb3.toWei(amount, validUnit);
    log.info(`Sending ${amount} ${validUnit} to ${to}...`);
    const { transactionHash } = await Transactions.sendRawTransaction(to, { value }, this.txParams);
    log.info(`Funds successfully sent!. Transaction hash: ${transactionHash}`);
  }
}
