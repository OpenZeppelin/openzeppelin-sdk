import path from 'path';
import isEmpty from 'lodash.isempty';
import isUndefined from 'lodash.isundefined';
import isNull from 'lodash.isnull';

import {
  Contract,
  Transactions,
  Loggy,
  SpinnerAction,
  ZWeb3,
  TxParams,
  ABI,
} from 'zos-lib';
import {
  isValidUnit,
  prettifyTokenAmount,
  toWei,
  fromWei,
} from '../../utils/units';
import { ERC20_PARTIAL_ABI } from '../../utils/constants';
import { allPromisesOrError } from '../../utils/async';
import ContractManager from '../local/ContractManager';
import ZosPackageFile from '../files/ZosPackageFile';
import ZosNetworkFile from '../files/ZosNetworkFile';
import Events from '../status/EventsFilter';

const { buildCallData, callDescription } = ABI;

const fileName = path.basename(__filename);

interface ERC20TokenInfo {
  balance?: string;
  tokenSymbol?: string;
  tokenDecimals?: string;
}

export default class TransactionController {
  public txParams: TxParams;
  public packageFile: ZosPackageFile;
  public networkFile: ZosNetworkFile;

  public constructor(
    txParams?: TxParams,
    network?: string,
    networkFile?: ZosNetworkFile,
  ) {
    if (txParams) this.txParams = txParams;
    if (!networkFile) {
      this.packageFile = new ZosPackageFile();
      this.networkFile = this.packageFile.networkFile(network);
    } else {
      this.networkFile = networkFile;
      this.packageFile = this.networkFile.packageFile;
    }
  }

  public async transfer(
    to: string,
    amount: string,
    unit: string,
  ): Promise<void | never> {
    if (!isValidUnit(unit)) {
      throw Error(
        `Invalid unit ${unit}. Please try with: wei, kwei, gwei, milli, ether or any other valid unit.`,
      );
    }
    const validUnit = unit.toLowerCase();
    const value = toWei(amount, validUnit);
    Loggy.add(
      `${fileName}#transfer`,
      'transfer-funds',
      `Sending ${amount} ${validUnit} to ${to}`,
    );
    const { transactionHash } = await Transactions.sendRawTransaction(
      to,
      { value },
      this.txParams,
    );
    Loggy.succeed(
      'transfer-funds',
      `Funds successfully sent! Transaction hash: ${transactionHash}`,
    );
  }

  public async getBalanceOf(
    accountAddress: string,
    contractAddress?: string,
  ): Promise<void | never> {
    if (contractAddress) {
      const { balance, tokenSymbol, tokenDecimals } = await this.getTokenInfo(
        accountAddress,
        contractAddress,
      );
      Loggy.add(
        `${fileName}#getBalanceOf`,
        'balance-of',
        `Balance: ${prettifyTokenAmount(balance, tokenDecimals, tokenSymbol)}`,
        { spinnerAction: SpinnerAction.NonSpinnable },
      );
    } else {
      const balance = await ZWeb3.getBalance(accountAddress);
      Loggy.add(
        `${fileName}#getBalanceOf`,
        'balance-of',
        `Balance: ${fromWei(balance, 'ether')} ETH`,
        { spinnerAction: SpinnerAction.NonSpinnable },
      );
    }
  }

  public async callContractMethod(
    proxyAddress: string,
    methodName: string,
    methodArgs: string[],
  ): Promise<string[] | object | string | never> {
    const { method, contract } = this.getContractAndMethod(
      proxyAddress,
      methodName,
      methodArgs,
    );
    try {
      Loggy.add(
        `${fileName}#transfer`,
        'call-contract-method',
        `Calling: ${callDescription(method, methodArgs)}`,
      );
      const result = await contract.methods[methodName](...methodArgs).call({
        ...this.txParams,
      });
      const parsedResult = this.parseFunctionCallResult(result);

      isNull(parsedResult) ||
      isUndefined(parsedResult) ||
      parsedResult === '()' ||
      parsedResult.length === 0
        ? Loggy.succeed(
            'call-contract-method',
            `Method ${methodName} successfully called.`,
          )
        : Loggy.succeed(
            'call-contract-method',
            `Call returned: ${parsedResult}`,
          );

      return result;
    } catch (error) {
      throw Error(
        `Error while trying to call ${proxyAddress}#${methodName}. ${error}`,
      );
    }
  }

  public async sendTransaction(
    proxyAddress: string,
    methodName: string,
    methodArgs: string[],
  ): Promise<void | never> {
    const { method, contract } = this.getContractAndMethod(
      proxyAddress,
      methodName,
      methodArgs,
    );
    try {
      Loggy.add(
        `${fileName}#sendTransaction`,
        'send-transaction',
        `Calling: ${callDescription(method, methodArgs)}`,
      );
      const { transactionHash, events } = await Transactions.sendTransaction(
        contract.methods[methodName],
        methodArgs,
        this.txParams,
      );
      Loggy.succeed(
        'send-transaction',
        `Transaction successful. Transaction hash: ${transactionHash}`,
      );
      if (!isEmpty(events)) Events.describe(events);
    } catch (error) {
      throw Error(
        `Error while trying to send transaction to ${proxyAddress}. ${error}`,
      );
    }
  }

  private async getTokenInfo(
    accountAddress: string,
    contractAddress: string,
  ): Promise<ERC20TokenInfo | never> {
    let balance, tokenSymbol, tokenDecimals;
    try {
      const contract = ZWeb3.contract(ERC20_PARTIAL_ABI, contractAddress);
      balance = await contract.methods.balanceOf(accountAddress).call();
      [tokenSymbol, tokenDecimals] = await allPromisesOrError([
        contract.methods.symbol().call(),
        contract.methods.decimals().call(),
      ]);
    } catch (error) {
      if (!balance) {
        error.message = `Could not get balance of ${accountAddress} in ${contractAddress}. Error: ${
          error.message
        }`;
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
    if (!this.networkFile.hasProxies({ address }))
      throw Error(`Proxy at address ${address} not found.`);
    const {
      package: packageName,
      contract: contractName,
    } = this.networkFile.getProxy(address);
    const contractManager = new ContractManager(this.packageFile);
    const contract = contractManager
      .getContractClass(packageName, contractName)
      .at(address);
    const { method } = buildCallData(contract, methodName, methodArgs);

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
