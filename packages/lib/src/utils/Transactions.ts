// This util has public sendTransaction and deploy methods that estimate the gas
// of a transaction or contract deployment, and then inject that esimation into
// the original call. This should actually be handled by the contract abstraction,
// but is only part of the next branch in truffle, so we are handling it manually.
// (see https://github.com/trufflesuite/truffle-contract/pull/95/files#diff-26bcc3534c5a2e62e22643287a7d3295R145)

import axios from 'axios';
import BN from 'bignumber.js';
import sleep from '../helpers/sleep';
import ZWeb3 from '../artifacts/ZWeb3';
import Contracts from '../artifacts/Contracts';
import ContractFactory, { ContractWrapper, TransactionReceiptWrapper } from '../artifacts/ContractFactory';

// Cache, exported for testing
export const state: any = {};

// API for gas price guesses
const GAS_API_URL: string = 'https://ethgasstation.info/json/ethgasAPI.json';

// Gas estimates are multiplied by this value to allow for an extra buffer (for reference, truffle-next uses 1.25)
const GAS_MULTIPLIER: number = 1.25;

// Max number of retries for transactions or queries
const RETRY_COUNT: number = 3;

// Time to sleep between retries for query operations
const RETRY_SLEEP_TIME: number = process.env.NODE_ENV === 'test' ? 1 : 3000;

// Truffle defaults gas price to 100gwei
const TRUFFLE_DEFAULT_GAS_PRICE: BN = new BN(100000000000);

// type GenericFunction = (...a) => any;
interface GenericFunction {
  [id: string]: any;
  (...a): any;
}

/**
 * Wraps the _sendTransaction function and manages transaction retries
 * @param contractFn contract function to be executed as the transaction
 * @param args arguments of the call (if any)
 * @param txParams other transaction parameters (from, gasPrice, etc)
 * @param retries number of transaction retries
 */
export async function sendTransaction(contractFn: GenericFunction, args: string[] = [], txParams: any = {}, retries: number = RETRY_COUNT): Promise<any> {
  await fixGasPrice(txParams);

  try {
    return await _sendTransaction(contractFn, args, txParams);
  } catch (error) {
    if (!error.message.match(/nonce too low/) || retries <= 0) { throw error; }
    return sendTransaction(contractFn, args, txParams, retries - 1);
  }
}

/**
 * Wraps the _deploy and manages deploy retries
 * @param contract truffle contract to be deployed
 * @param args arguments of the constructor (if any)
 * @param txParams other transaction parameters (from, gasPrice, etc)
 * @param retries number of deploy retries
 */
export async function deploy(contract: ContractFactory, args: any[] = [], txParams: any = {}, retries: number = RETRY_COUNT): Promise<any> {
  await fixGasPrice(txParams);

  try {
    return await _deploy(contract, args, txParams);
  } catch (error) {
    if (!error.message.match(/nonce too low/) || retries <= 0) { throw error; }
    return deploy(contract, args, txParams, retries - 1);
  }
}

/**
 * Sends a transaction to the blockchain with data precalculated
 * Uses the node's estimateGas RPC call, and adds a 20% buffer on top of it, capped by the block gas limit.
 * @param contract contract instance to send the tx to
 * @param txParams all transaction parameters (data, from, gasPrice, etc)
 */
export async function sendDataTransaction(contract: ContractWrapper, txParams: any): Promise<TransactionReceiptWrapper> {
  // TODO: Add retries similar to sendTransaction
  await fixGasPrice(txParams);

  // If gas is set explicitly, use it
  if (txParams.gas) {
    return contract.sendTransaction(txParams);
  }
  // Estimate gas for the call and run the tx
  const gas = await estimateActualGas({ to: contract.address, ...txParams });
  return contract.sendTransaction({ gas, ...txParams });
}

/**
 * Sends a transaction to the blockchain, estimating the gas to be used.
 * Uses the node's estimateGas RPC call, and adds a 20% buffer on top of it, capped by the block gas limit.
 * @param contractFn contract function to be executed as the transaction
 * @param args arguments of the call (if any)
 * @param txParams other transaction parameters (from, gasPrice, etc)
 */
async function _sendTransaction(contractFn: GenericFunction, args: any[] = [], txParams: any = {}) {
  // If gas is set explicitly, use it
  if (txParams.gas) {
    return contractFn(...args, txParams);
  }

  // Estimate gas for the call
  const gas = await estimateActualGasFnCall(contractFn, args, txParams);

  return contractFn(...args, { gas, ...txParams });
}

/**
 * Deploys a contract to the blockchain, estimating the gas to be used.
 * Uses the node's estimateGas RPC call, and adds a 20% buffer on top of it, capped by the block gas limit.
 * @param contract truffle contract to be deployed
 * @param args arguments of the constructor (if any)
 * @param txParams other transaction parameters (from, gasPrice, etc)
 */
async function _deploy(contract: ContractFactory, args: any[] = [], txParams: any = {}): Promise<ContractWrapper> {
  // If gas is set explicitly, use it
  if (txParams.gas) {
    return contract.new(...args, txParams);
  }

  const data: string = contract.getData(args, txParams);
  const gas: number = await estimateActualGas({ data, ...txParams });
  return contract.new(...args, { gas, ...txParams });
}

export async function estimateGas(txParams: any, retries: number = RETRY_COUNT): Promise<any> {
  // Retry if estimate fails. This could happen because we are depending
  // on a previous transaction being mined that still hasn't reach the node
  // we are working with, if the txs are routed to different nodes.
  // See https://github.com/zeppelinos/zos/issues/192 for more info.
  try {
    // Use json-rpc method estimateGas to retrieve estimated value
    return await ZWeb3.estimateGas(txParams);
  } catch (error) {
    if (retries <= 0) { throw Error(error); }
    await sleep(RETRY_SLEEP_TIME);
    return await estimateGas(txParams, retries - 1);
  }
}

export async function estimateActualGasFnCall(contractFn: GenericFunction, args: any[], txParams: any, retries: number = RETRY_COUNT): Promise<any> {
  // Retry if estimate fails. This could happen because we are depending
  // on a previous transaction being mined that still hasn't reach the node
  // we are working with, if the txs are routed to different nodes.
  // See https://github.com/zeppelinos/zos/issues/192 for more info.
  try {
    return await calculateActualGas(await contractFn.estimateGas(...args, txParams));
  } catch(error) {
    if (retries <= 0) { throw Error(error); }
    await sleep(RETRY_SLEEP_TIME);
    return estimateActualGasFnCall(contractFn, args, txParams, retries - 1);
  }
}

export async function estimateActualGas(txParams: any): Promise<any> {
  const estimatedGas = await estimateGas(txParams);
  return calculateActualGas(estimatedGas);
}

async function getETHGasStationPrice(): Promise<any> | never {
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
}

async function fixGasPrice(txParams: any): Promise<any> {
  const gasPrice = txParams.gasPrice || Contracts.getArtifactsDefaults().gasPrice;

  if ((TRUFFLE_DEFAULT_GAS_PRICE.eq(gasPrice) || !gasPrice) && await ZWeb3.isMainnet()) {
    txParams.gasPrice = await getETHGasStationPrice();
    if (TRUFFLE_DEFAULT_GAS_PRICE.lte(txParams.gasPrice)) {
      throw new Error('The current gas price estimate from ethgasstation.info is over 100 gwei. If you do want to send a transaction with a gas price this high, please set it manually in your truffle.js configuration file.');
    }
  }
}

async function getBlockGasLimit(): Promise<any> {
  if (state.block) { return state.block.gasLimit; }
  state.block = await ZWeb3.getLatestBlock();
  return state.block.gasLimit;
}

async function calculateActualGas(estimatedGas): Promise<any> {
  const blockLimit: number = await getBlockGasLimit();
  let gasToUse = parseInt(`${estimatedGas * GAS_MULTIPLIER}`, 10);
  // Ganache has a bug (https://github.com/trufflesuite/ganache-core/issues/26) that causes gas
  // refunds to be included in the gas estimation; but the transaction needs to send the total
  // amount of gas to work. Geth and Parity return the correct value, so here we are adding the
  // value of the refund of setting a storage position to zero (which we do on unsetImplementation).
  // This is a viable workaround as long as we don't have other methods that have higher refunds,
  // such as cleaning more storage positions or selfdestructing a contract. We should be able to fix
  // this once the issue is resolved.
  if (await ZWeb3.isGanacheNode()) { gasToUse += 15000; }
  return gasToUse >= blockLimit ? (blockLimit - 1) : gasToUse;
}

export async function awaitConfirmations(transactionHash: string, confirmations: number = 12, interval: number = 1000, timeout: number = (10 * 60 * 1000)): Promise<any> | never {
  if (await ZWeb3.isGanacheNode()) { return; }
  const getTxBlock = () => (ZWeb3.getTransactionReceipt(transactionHash).then((r) => r.blockNumber));
  const now = +(new Date());

  while (true) {
    if ((+(new Date()) - now) > timeout) {
      throw new Error(`Exceeded timeout of ${timeout / 1000} seconds awaiting confirmations for transaction ${transactionHash}`);
    }
    const currentBlock: number = await ZWeb3.getLatestBlockNumber();
    const txBlock: number = await getTxBlock();
    if (currentBlock - txBlock >= confirmations) { return true; }
    await sleep(interval);
  }
}
