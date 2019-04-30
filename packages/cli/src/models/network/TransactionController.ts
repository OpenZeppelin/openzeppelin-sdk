import { Transactions, Logger, ZWeb3, encodeCall } from 'zos-lib';
import { isValidUnit } from '../../utils/units';
import { ERC20_PARTIAL_ABI } from '../../utils/constants';

const log = new Logger('TransactionController');

export default class TransactionController {
  public txParams: any;

  constructor(txParams?: any) {
    if (txParams) this.txParams = txParams;
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

  public async getBalanceOf(accountAddress: string, contractAddress?: string): Promise<void> {
    if (contractAddress) {
      try {
        const contract = ZWeb3.contract(ERC20_PARTIAL_ABI, contractAddress);
        const balance = await contract.methods.balanceOf(accountAddress).call();
        const tokenSymbol = await contract.methods.symbol().call();
        log.info(`Balance: ${ZWeb3.fromWei(balance, 'ether')} ${tokenSymbol}`);
      } catch(error) {
        error.message = `Could not get balance of ${accountAddress} in ${contractAddress}. Error: ${error.message}`;
        throw error;
      }
    } else {
      const balance = await ZWeb3.getBalance(accountAddress);
      log.info(`Balance: ${ZWeb3.fromWei(balance, 'ether')} ether`);
    }
  }
}
