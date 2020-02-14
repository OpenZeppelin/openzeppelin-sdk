import { isEmpty, isUndefined, isNull } from 'lodash';

import { Contract, Transactions, Loggy, ZWeb3, TxParams, ABI } from '@openzeppelin/upgrades';
import { isValidUnit, prettifyTokenAmount, toWei, fromWei } from '../../utils/units';
import { ERC20_PARTIAL_ABI } from '../../utils/constants';
import { allPromisesOrError } from '../../utils/async';
import ContractManager from '../local/ContractManager';
import ProjectFile from '../files/ProjectFile';
import NetworkFile from '../files/NetworkFile';
import { describeEvents } from '../../utils/events';

const { getABIFunction, callDescription } = ABI;

interface ERC20TokenInfo {
  balance?: string;
  tokenSymbol?: string;
  tokenDecimals?: string;
}

export default class TransactionController {
  public txParams: TxParams;
  public projectFile: ProjectFile;
  public networkFile: NetworkFile;

  public constructor(txParams?: TxParams, network?: string, networkFile?: NetworkFile) {
    if (txParams) this.txParams = txParams;
    if (!networkFile) {
      this.projectFile = new ProjectFile();
      this.networkFile = new NetworkFile(this.projectFile, network);
    } else {
      this.networkFile = networkFile;
      this.projectFile = this.networkFile.projectFile;
    }
  }

  public async transfer(to: string, amount: string, unit: string): Promise<void | never> {
    if (!isValidUnit(unit)) {
      throw Error(`Invalid unit ${unit}. Please try with: wei, kwei, gwei, milli, ether or any other valid unit.`);
    }
    const validUnit = unit.toLowerCase();
    const value = toWei(amount, validUnit);
    Loggy.spin(__filename, 'transfer', 'transfer-funds', `Sending ${amount} ${validUnit} to ${to}`);
    const { transactionHash } = await Transactions.sendRawTransaction(to, { value }, this.txParams);
    Loggy.succeed('transfer-funds', `Funds sent. Transaction hash: ${transactionHash}`);
  }

  public async getBalanceOf(accountAddress: string, contractAddress?: string): Promise<string | never> {
    if (contractAddress) {
      const { balance, tokenSymbol, tokenDecimals } = await this.getTokenInfo(accountAddress, contractAddress);
      Loggy.noSpin(
        __filename,
        'getBalanceOf',
        'balance-of',
        `Balance: ${prettifyTokenAmount(balance, tokenDecimals, tokenSymbol)}`,
      );

      return balance;
    } else {
      const balance = await ZWeb3.eth.getBalance(accountAddress);
      Loggy.noSpin(__filename, 'getBalanceOf', 'balance-of', `Balance: ${fromWei(balance, 'ether')} ETH`);

      return balance;
    }
  }

  public async callContractMethod(
    proxyAddress: string,
    methodName: string,
    methodArgs: string[],
  ): Promise<string[] | object | string | never> {
    const { method, contract } = this.getContractAndMethod(proxyAddress, methodName, methodArgs);
    try {
      Loggy.spin(
        __filename,
        'callContractMethod',
        'call-contract-method',
        `Calling: ${callDescription(method, methodArgs)}`,
      );
      const result = await contract.methods[methodName](...methodArgs).call({
        ...this.txParams,
      });
      const parsedResult = this.parseFunctionCallResult(result);

      isNull(parsedResult) || isUndefined(parsedResult) || parsedResult === '()' || parsedResult.length === 0
        ? Loggy.succeed('call-contract-method', `Method '${methodName}' returned empty.`)
        : Loggy.succeed('call-contract-method', `Method '${methodName}' returned: ${parsedResult}`);

      return result;
    } catch (error) {
      throw Error(`Error while trying to call ${proxyAddress}#${methodName}. ${error}`);
    }
  }

  public async sendTransaction(proxyAddress: string, methodName: string, methodArgs: string[]): Promise<void | never> {
    const { method, contract } = this.getContractAndMethod(proxyAddress, methodName, methodArgs);
    try {
      Loggy.spin(__filename, 'sendTransaction', 'send-transaction', `Calling: ${callDescription(method, methodArgs)}`);
      const { transactionHash, events } = await Transactions.sendTransaction(
        contract.methods[methodName],
        methodArgs,
        this.txParams,
      );
      Loggy.succeed('send-transaction', `Transaction successful. Transaction hash: ${transactionHash}`);
      if (!isEmpty(events)) describeEvents(events);
    } catch (error) {
      throw Error(`Error while trying to send transaction to ${proxyAddress}. ${error}`);
    }
  }

  private async getTokenInfo(accountAddress: string, contractAddress: string): Promise<ERC20TokenInfo | never> {
    let balance, tokenSymbol, tokenDecimals;
    try {
      const contract = new ZWeb3.eth.Contract(ERC20_PARTIAL_ABI, contractAddress);
      balance = await contract.methods.balanceOf(accountAddress).call();
      [tokenSymbol, tokenDecimals] = await allPromisesOrError([
        contract.methods.symbol().call(),
        contract.methods.decimals().call(),
      ]);
    } catch (error) {
      if (!balance) {
        error.message = `Could not get balance of ${accountAddress} in ${contractAddress}. Error: ${error.message}`;
        throw error;
      }
    }

    return { balance, tokenSymbol, tokenDecimals };
  }

  private getContractAndMethod(
    address: string,
    methodName: string,
    methodArgs: string[],
  ): { contract: Contract; method: any } | never {
    if (!this.networkFile.hasProxies({ address })) throw Error(`Proxy at address ${address} not found.`);
    const { package: packageName, contract: contractName } = this.networkFile.getProxy(address);
    const contractManager = new ContractManager(this.projectFile);
    const contract = contractManager.getContractClass(packageName, contractName).at(address);
    const method = getABIFunction(contract, methodName, methodArgs);

    return { contract, method };
  }

  private parseFunctionCallResult(result: any): string | null {
    if (Array.isArray(result)) {
      return `[${result}]`;
    } else if (result !== null && typeof result === 'object') {
      return `(${Object.values(result).join(', ')})`;
    }

    return result;
  }
}
