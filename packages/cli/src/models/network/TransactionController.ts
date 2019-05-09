import { Transactions, Logger, ZWeb3, TxParams, ABI } from 'zos-lib';
import { isValidUnit, prettifyTokenAmount, toWei, fromWei } from '../../utils/units';
import { ERC20_PARTIAL_ABI } from '../../utils/constants';
import { allPromisesOrError } from '../../utils/async';
import LocalController from '../local/LocalController';
import ZosPackageFile from '../files/ZosPackageFile';
import ZosNetworkFile from '../files/ZosNetworkFile';

const { buildCallData, callDescription }  = ABI;
const log = new Logger('TransactionController');

interface ERC20TokenInfo {
  balance?: string;
  tokenSymbol?: string;
  tokenDecimals?: string;
}

export default class TransactionController {
  public txParams: TxParams;
  public packageFile: ZosPackageFile;
  public networkFile: ZosNetworkFile;

  constructor(txParams?: any, network?: string) {
    if (txParams) this.txParams = txParams;
    if (network) {
      this.packageFile = new ZosPackageFile();
      this.networkFile = this.packageFile.networkFile(network);
    }
  }

  public async transfer(to: string, amount: string, unit: string): Promise<void | never> {
    if (!isValidUnit(unit)) {
      throw Error(`Invalid unit ${unit}. Please try with: wei, kwei, gwei, milli, ether or any other valid unit.`);
    }
    const validUnit = unit.toLowerCase();
    const value = toWei(amount, validUnit);
    log.info(`Sending ${amount} ${validUnit} to ${to}...`);
    const { transactionHash } = await Transactions.sendRawTransaction(to, { value }, this.txParams);
    log.info(`Funds successfully sent!. Transaction hash: ${transactionHash}`);
  }

  public async getBalanceOf(accountAddress: string, contractAddress?: string): Promise<void | never> {
    if (contractAddress) {
      const { balance, tokenSymbol, tokenDecimals } = await this.getTokenInfo(accountAddress, contractAddress);
      log.info(`Balance: ${prettifyTokenAmount(balance, tokenDecimals, tokenSymbol)}`);
    } else {
      const balance = await ZWeb3.getBalance(accountAddress);
      log.info(`Balance: ${fromWei(balance, 'ether')} ETH`);
    }
  }

  public async sendTransaction(proxyAddress: string, methodName: string, methodArgs: string[]): Promise<any> {
    const localController = new LocalController(this.packageFile);
    const { package: packageName, contract: contractName } = this.networkFile.getProxy(proxyAddress);
    const contract = localController.getContractClass(packageName, contractName).at(proxyAddress);
    const { method } = buildCallData(contract, methodName, methodArgs);

    log.info(`Calling ${methodName} with: ${callDescription(method, methodArgs)}`);
    const { transactionHash } = await Transactions.sendTransaction(contract.methods[methodName], methodArgs, this.txParams);
    log.info(`Function successfully called! Transaction hash: ${transactionHash}`);
  }

  private async getTokenInfo(accountAddress: string, contractAddress: string): Promise<ERC20TokenInfo | never> {
    let balance, tokenSymbol, tokenDecimals;
    try {
      const contract = ZWeb3.contract(ERC20_PARTIAL_ABI, contractAddress);
      balance = await contract.methods.balanceOf(accountAddress).call();
      [tokenSymbol, tokenDecimals] = await allPromisesOrError([
        contract.methods.symbol().call(),
        contract.methods.decimals().call()
      ]);
    } catch(error) {
      if (!balance) {
        error.message = `Could not get balance of ${accountAddress} in ${contractAddress}. Error: ${error.message}`;
        throw error;
      }
    }

    return { balance, tokenSymbol, tokenDecimals };
  }
}
