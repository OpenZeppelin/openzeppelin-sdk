import { Transactions, Logger } from 'zos-lib';
import stdout from '../../utils/stdout';

const log = new Logger('TransactionController');

export default class TransactionController {
  public txParams: any;
  constructor(txParams) {
    this.txParams = txParams;
  }

  public async transfer(units: string, to: string, value: string): Promise<void> {
    log.info(`Sending ${value} wei to ${to}...`);
    const receipt = await Transactions.sendRawTransaction(to, { value }, this.txParams);
    log.info(`Funds successfully sent!. Receipt:`);
    stdout(receipt);
  }
}
