// This util has public sendTransaction and deploy methods that estimate the gas
// of a transaction or contract deployment, and then inject that esimation into
// the original call. This should actually be handled by the contract abstraction,
// but is only part of the next branch in truffle, so we are handling it manually.
// (see https://github.com/trufflesuite/truffle-contract/pull/95/files#diff-26bcc3534c5a2e62e22643287a7d3295R145)

import { promisify } from 'util'
import sleep from '../helpers/sleep';
import Contracts from './Contracts'
import BN from 'bignumber.js'

// Store last block for gasLimit information
const state = { };

// Gas estimates are multiplied by this value to allow for an extra buffer (for reference, truffle-next uses 1.25)
const GAS_MULTIPLIER = 1.25;

// Max number of retries for transactions or queries
const RETRY_COUNT = 3;

// Time to sleep between retries for query operations
const RETRY_SLEEP_TIME = process.env.NODE_ENV === 'test' ? 1 : 3000;

// Truffle defaults gas price to 100gwei
const TRUFFLE_DEFAULT_GAS_PRICE = BN(100000000000);

/**
 * Wraps the _sendTransaction function and manages transaction retries
 * @param contractFn contract function to be executed as the transaction
 * @param args arguments of the call (if any)
 * @param txParams other transaction parameters (from, gasPrice, etc)
 * @param retries number of transaction retries
 */
export async function sendTransaction(contractFn, args = [], txParams = {}, retries = RETRY_COUNT) {
  checkGasPrice(txParams)

  try {
    return await _sendTransaction(contractFn, args, txParams)
  } catch (error) {
    if (!error.message.match(/nonce too low/) || retries <= 0) throw Error(error)
    return sendTransaction(contractFn, args, txParams, retries - 1)
  }
}

/**
 * Wraps the _deploy and manages deploy retries
 * @param contract truffle contract to be deployed
 * @param args arguments of the constructor (if any)
 * @param txParams other transaction parameters (from, gasPrice, etc)
 * @param retries number of deploy retries
 */
export async function deploy(contract, args = [], txParams = {}, retries = RETRY_COUNT) {
  checkGasPrice(txParams)

  try {
    return await _deploy(contract, args, txParams)
  } catch (error) {
    if (!error.message.match(/nonce too low/) || retries <= 0) throw Error(error)
    return deploy(contract, args, txParams, retries - 1)
  }
}

/**
 * Sends a transaction to the blockchain with data precalculated
 * Uses the node's estimateGas RPC call, and adds a 20% buffer on top of it, capped by the block gas limit.
 * @param contract contract instance to send the tx to
 * @param txParams all transaction parameters (data, from, gasPrice, etc)
 */
export async function sendDataTransaction(contract, txParams) {
  // TODO: Add retries similar to sendTransaction
  checkGasPrice(txParams)

  // If gas is set explicitly, use it
  if (txParams.gas) {
    return contract.sendTransaction(txParams)
  }
  // Estimate gas for the call and run the tx
  const gas = await estimateActualGas({ to: contract.address, ... txParams });
  return contract.sendTransaction({ gas, ... txParams });
}

/**
 * Sends a transaction to the blockchain, estimating the gas to be used.
 * Uses the node's estimateGas RPC call, and adds a 20% buffer on top of it, capped by the block gas limit.
 * @param contractFn contract function to be executed as the transaction
 * @param args arguments of the call (if any)
 * @param txParams other transaction parameters (from, gasPrice, etc)
 */
async function _sendTransaction(contractFn, args = [], txParams = {}) {
  // If gas is set explicitly, use it
  if (txParams.gas) {
    return contractFn(...args, txParams);
  }

  // Estimate gas for the call
  const estimateGasTxParams = { ... txParams, ... contractFn.request(...args).params[0] };
  const gas = await estimateActualGas(estimateGasTxParams);
  return contractFn(...args, { gas, ... txParams });
}

/**
 * Deploys a contract to the blockchain, estimating the gas to be used.
 * Uses the node's estimateGas RPC call, and adds a 20% buffer on top of it, capped by the block gas limit.
 * @param contract truffle contract to be deployed
 * @param args arguments of the constructor (if any)
 * @param txParams other transaction parameters (from, gasPrice, etc)
 */
async function _deploy(contract, args = [], txParams = {}) {
  // If gas is set explicitly, use it
  if (txParams.gas) {
    return contract.new(... args, txParams);
  }

  // Required by truffle
  await contract.detectNetwork();

  // Get raw binary transaction for creating the contract
  const txOpts = { data: contract.binary, ... txParams };
  const txData = web3.eth.contract(contract.abi).new.getData(...args, txOpts);

  // Deploy the contract using estimated gas
  const gas = await estimateActualGas({ data: txData, ... txParams})
  return contract.new(...args, { gas, ... txParams });
}

export async function estimateGas(txParams, retries = RETRY_COUNT) {
  // Use json-rpc method estimateGas to retrieve estimated value
  const estimateFn = promisify(web3.eth.estimateGas.bind(web3.eth));
  
  // Retry if estimate fails. This could happen because we are depending
  // on a previous transaction being mined that still hasn't reach the node
  // we are working with, if the txs are routed to different nodes.
  // See https://github.com/zeppelinos/zos/issues/192 for more info.
  try {
    return await estimateFn(txParams);
  } catch (error) {
    if (retries <= 0) throw Error(error);
    await sleep(RETRY_SLEEP_TIME);
    return await estimateGas(txParams, retries - 1);
  }
}

export async function estimateActualGas(txParams) {
  const estimatedGas = await estimateGas(txParams);
  return await calculateActualGas(estimatedGas);
}

async function getNodeVersion () {
  if (!state.nodeInfo) {
    state.nodeInfo = await promisify(web3.version.getNode.bind(web3.version))();
  }
  return state.nodeInfo;
}

function checkGasPrice(txParams) {
  if (process.env.NODE_ENV === 'test') return;
  const gasPrice = txParams.gasPrice || Contracts.artifactsDefaults().gasPrice;
  if (TRUFFLE_DEFAULT_GAS_PRICE.eq(gasPrice) || !gasPrice) {
    throw new Error(`Cowardly refusing to execute transaction with gas price set to Truffle's default of 100 gwei. Consider explicitly setting a different value in your truffle.js file.`);
  }
}

async function isGanacheNode () {
  const nodeVersion = await getNodeVersion();
  return nodeVersion.match(/TestRPC/);
}

async function getBlockGasLimit () {
  if (state.block) return state.block.gasLimit;
  state.block = await promisify(web3.eth.getBlock.bind(web3.eth))('latest');
  return state.block.gasLimit;
}

async function calculateActualGas(estimatedGas) {
  const blockLimit = await getBlockGasLimit();
  let gasToUse = parseInt(estimatedGas * GAS_MULTIPLIER);
  // Ganache has a bug (https://github.com/trufflesuite/ganache-core/issues/26) that causes gas 
  // refunds to be included in the gas estimation; but the transaction needs to send the total
  // amount of gas to work. Geth and Parity return the correct value, so here we are adding the
  // value of the refund of setting a storage position to zero (which we do on unsetImplementation).
  // This is a viable workaround as long as we don't have other methods that have higher refunds,
  // such as cleaning more storage positions or selfdestructing a contract. We should be able to fix
  // this once the issue is resolved.
  if (await isGanacheNode()) gasToUse += 15000;
  return gasToUse >= blockLimit ? (blockLimit-1) : gasToUse;
}
