// This util has public sendTransaction and deploy methods that estimate the gas
// of a transaction or contract deployment, and then inject that esimation into
// the original call. This should actually be handled by the contract abstraction,
// but is only part of the next branch in truffle, so we are handling it manually.
// (see https://github.com/trufflesuite/truffle-contract/pull/95/files#diff-26bcc3534c5a2e62e22643287a7d3295R145)

import axios from 'axios';
import { omit } from 'lodash';
import BN from 'bignumber.js';
import sleep from '../helpers/sleep';
import ZWeb3 from '../artifacts/ZWeb3';
import Contracts from '../artifacts/Contracts';
import Contract from '../artifacts/Contract';
import { buildDeploymentCallData } from './ABIs';
import { TxParams } from '../artifacts/ZWeb3';

// Cache, exported for testing
export const state: any = {};

// API for gas price guesses
const GAS_API_URL = 'https://ethgasstation.info/json/ethgasAPI.json';

// Gas estimates are multiplied by this value to allow for an extra buffer (for reference, truffle-next uses 1.25)
const GAS_MULTIPLIER = 1.25;

// Max number of retries for transactions or queries
const RETRY_COUNT = 3;

// Time to sleep between retries for query operations
const RETRY_SLEEP_TIME: number = process.env.NODE_ENV === 'test' ? 1 : 3000;

// Truffle defaults gas price to 100gwei
const TRUFFLE_DEFAULT_GAS_PRICE: BN = new BN(100000000000);

// type GenericFunction = (...a) => any;
interface GenericFunction {
  [id: string]: any;
  (...a): any;
}

interface TransactionParams {
  data?: string;
  value?: any;
}

export default {
  /**
   * Makes a raw transaction to the blockchain using web3 sendTransaction method
   * @param address of the contract or account with which you are going to interact
   * @param data encoded function call
   * @param txParams other transaction parameters (from, gasPrice, etc)
   * @param retries number of transaction retries
   */
  async sendRawTransaction(
    address: string,
    { data, value }: TransactionParams,
    txParams: TxParams = {},
    retries: number = RETRY_COUNT,
  ): Promise<any> {
    await this._fixGasPrice(txParams);
    try {
      const from = await ZWeb3.defaultAccount();
      const gas =
        txParams.gas ||
        Contracts.getArtifactsDefaults().gas ||
        (await this.estimateActualGas({ to: address, data, value }));

      return ZWeb3.eth.sendTransaction({
        to: address,
        data,
        value,
        from,
        ...txParams,
        gas,
      });
    } catch (error) {
      if (!error.message.match(/nonce too low/) || retries <= 0) throw error;
      return this.sendRawTransaction(address, data, txParams, retries - 1);
    }
  },

  /**
   * Sends a transaction to the blockchain, estimating the gas to be used.
   * Uses the node's estimateGas RPC call, and adds a 20% buffer on top of it, capped by the block gas limit.
   * @param contractFn contract function to be executed as the transaction
   * @param args arguments of the call (if any)
   * @param txParams other transaction parameters (from, gasPrice, etc)
   * @param retries number of transaction retries
   */
  async sendTransaction(
    contractFn: GenericFunction,
    args: any[] = [],
    txParams: TxParams = {},
    retries: number = RETRY_COUNT,
  ): Promise<any> {
    await this._fixGasPrice(txParams);

    try {
      const gas =
        txParams.gas ||
        Contracts.getArtifactsDefaults().gas ||
        (await this.estimateActualGasFnCall(contractFn, args, txParams));
      return contractFn(...args).send({ ...txParams, gas });
    } catch (error) {
      if (!error.message.match(/nonce too low/) || retries <= 0) throw error;
      return this.sendTransaction(contractFn, args, txParams, retries - 1);
    }
  },

  /**
   * Deploys a contract to the blockchain, estimating the gas to be used.
   * Uses the node's estimateGas RPC call, and adds a 20% buffer on top of it, capped by the block gas limit.
   * @param contract truffle contract to be deployed
   * @param args arguments of the constructor (if any)
   * @param txParams other transaction parameters (from, gasPrice, etc)
   * @param retries number of deploy retries
   */
  async deployContract(
    contract: Contract,
    args: any[] = [],
    txParams: TxParams = {},
    retries: number = RETRY_COUNT,
  ): Promise<any> {
    await this._fixGasPrice(txParams);

    try {
      const gas =
        txParams.gas ||
        Contracts.getArtifactsDefaults().gas ||
        (await this.estimateActualGas({
          data: buildDeploymentCallData(contract, args),
          ...txParams,
        }));
      return contract.new(...args, { ...txParams, gas });
    } catch (error) {
      if (!error.message.match(/nonce too low/) || retries <= 0) throw error;
      return this.deployContract(contract, args, txParams, retries - 1);
    }
  },

  async estimateGas(txParams: TxParams, retries: number = RETRY_COUNT): Promise<any> {
    // Retry if estimate fails. This could happen because we are depending
    // on a previous transaction being mined that still hasn't reach the node
    // we are working with, if the txs are routed to different nodes.
    // See https://github.com/zeppelinos/zos/issues/192 for more info.
    try {
      // Remove gas from estimateGas call, which may cause Geth to fail
      // See https://github.com/ethereum/go-ethereum/issues/18973 for more info
      const txParamsWithoutGas = omit(txParams, 'gas');
      // Use json-rpc method estimateGas to retrieve estimated value
      return await ZWeb3.eth.estimateGas(txParamsWithoutGas);
    } catch (error) {
      if (retries <= 0) throw Error(error);
      await sleep(RETRY_SLEEP_TIME);
      return await this.estimateGas(txParams, retries - 1);
    }
  },

  async estimateActualGasFnCall(
    contractFn: GenericFunction,
    args: any[],
    txParams: TxParams,
    retries: number = RETRY_COUNT,
  ): Promise<any> {
    // Retry if estimate fails. This could happen because we are depending
    // on a previous transaction being mined that still hasn't reach the node
    // we are working with, if the txs are routed to different nodes.
    // See https://github.com/zeppelinos/zos/issues/192 for more info.
    try {
      return await this._calculateActualGas(await contractFn(...args).estimateGas({ ...txParams }));
    } catch (error) {
      if (retries <= 0) throw Error(error);
      await sleep(RETRY_SLEEP_TIME);
      return this.estimateActualGasFnCall(contractFn, args, txParams, retries - 1);
    }
  },

  async estimateActualGas(txParams: TxParams): Promise<any> {
    const estimatedGas = await this.estimateGas(txParams);
    return this._calculateActualGas(estimatedGas);
  },

  async awaitConfirmations(
    transactionHash: string,
    confirmations = 12,
    interval = 1000,
    timeout: number = 10 * 60 * 1000,
  ): Promise<any | never> {
    if (await ZWeb3.isGanacheNode()) return;
    const getTxBlock = () => ZWeb3.eth.getTransactionReceipt(transactionHash).then(r => r.blockNumber);
    const now = +new Date();

    while (true) {
      if (+new Date() - now > timeout)
        throw new Error(
          `Exceeded timeout of ${timeout / 1000} seconds awaiting confirmations for transaction ${transactionHash}`,
        );
      const currentBlock: number = await ZWeb3.getLatestBlockNumber();
      const txBlock: number = await getTxBlock();
      if (currentBlock - txBlock >= confirmations) return true;
      await sleep(interval);
    }
  },

  async _getETHGasStationPrice(): Promise<any | never> {
    if (state.gasPrice) return state.gasPrice;

    try {
      const { data: responseData } = await axios.get(GAS_API_URL);
      const gasPriceGwei = responseData.average / 10;
      const gasPrice = gasPriceGwei * 1e9;

      state.gasPrice = gasPrice;
      return state.gasPrice;
    } catch (err) {
      throw new Error(`Could not query gas price API to determine reasonable gas price, please provide one.`);
    }
  },

  async _fixGasPrice(txParams: TxParams): Promise<any> {
    const gasPrice = txParams.gasPrice || Contracts.getArtifactsDefaults().gasPrice;

    if ((TRUFFLE_DEFAULT_GAS_PRICE.eq(gasPrice) || !gasPrice) && (await ZWeb3.isMainnet())) {
      txParams.gasPrice = await this._getETHGasStationPrice();
      if (TRUFFLE_DEFAULT_GAS_PRICE.lte(txParams.gasPrice))
        throw new Error(
          'The current gas price estimate from ethgasstation.info is over 100 gwei. If you do want to send a transaction with a gas price this high, please set it manually in your truffle.js configuration file.',
        );
    }
  },

  async _getBlockGasLimit(): Promise<number> {
    if (state.block) return state.block.gasLimit;
    state.block = await ZWeb3.getLatestBlock();
    return state.block.gasLimit;
  },

  async _calculateActualGas(estimatedGas: number): Promise<number> {
    const blockLimit: number = await this._getBlockGasLimit();
    const gasToUse = parseInt(`${estimatedGas * GAS_MULTIPLIER}`, 10);
    // Recent versions of ganache (>= 6.4.0) return too low values for gas estimation,
    // causing some transactions to fail. To fix this, always use the block limit
    // when working on a ganache node.
    if (await ZWeb3.isGanacheNode()) return blockLimit - 1;
    return gasToUse >= blockLimit ? blockLimit - 1 : gasToUse;
  },
};
