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
      throw Error(`Invalid specified unit #{unit}. To see supported units, visit: https://web3js.readthedocs.io/en/1.0/web3-utils.html#id74`);
    }
    const validUnit = unit.toLowerCase();
    const value = ZWeb3.toWei(amount, validUnit);
    log.info(`Sending ${amount} ${validUnit} to ${to}...`);
    const { transactionHash } = await Transactions.sendRawTransaction(to, { value }, this.txParams);
    log.info(`Funds successfully sent!. Transaction hash: ${transactionHash}`);
  }
}
