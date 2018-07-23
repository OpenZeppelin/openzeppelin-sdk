// This util has public sendTransaction and deploy methods that estimate the gas
// of a transaction or contract deployment, and then inject that esimation into
// the original call. This should actually be handled by the contract abstraction,
// but is only part of the next branch in truffle, so we are handling it manually.
// (see https://github.com/trufflesuite/truffle-contract/pull/95/files#diff-26bcc3534c5a2e62e22643287a7d3295R145)

// Store last block for gasLimit information
const state = { };

// Gas estimates are multiplied by this value to allow for an extra buffer (for reference, truffle-next uses 1.25)
const GAS_MULTIPLIER = 1.2;

/**
 * Sends a transaction to the blockchain, estimating the gas to be used.
 * Uses the node's estimateGas RPC call, and adds a 20% buffer on top of it, capped by the block gas limit.
 * @param contractFn contract function to be executed as the transaction
 * @param args arguments of the call (if any)
 * @param txParams other transaction parameters (from, gasPrice, etc)
 */
export async function sendTransaction(contractFn, args = [], txParams = {}) {
  // If gas is set explicitly, use it
  if (txParams.gas) {
    return contractFn(...args, txParams);
  }

  // Estimate gas for the call
  const estimatedGas = await contractFn.estimateGas(...args, txParams);

  // Run the tx
  const gasToUse = await calculateActualGas(estimatedGas);
  return contractFn(...args, { gas: gasToUse, ... txParams });
}

/**
 * Deploys a contract to the blockchain, estimating the gas to be used.
 * Uses the node's estimateGas RPC call, and adds a 20% buffer on top of it, capped by the block gas limit.
 * @param contract truffle contract to be deployed
 * @param args arguments of the constructor (if any)
 * @param txParams other transaction parameters (from, gasPrice, etc)
 */
export async function deploy(contract, args = [], txParams = {}) {
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
  const estimatedGas = await estimateGas(txData, txParams)
  const gasToUse = await calculateActualGas(estimatedGas);
  return contract.new(...args, { gas: gasToUse, ... txParams });
}

export async function estimateGas(txData, txParams) {
  // Use json-rpc method estimateGas to retrieve estimated value
  return new Promise((resolve, reject) => {
    web3.eth.estimateGas({ data: txData, ... txParams },
      function(err, gas) {
        if (err) reject(err);
        else resolve(gas);
      }
    );
  });
}

function getNodeVersion () {
  if (!state.version) {
    state.version = web3.version;
  }
  return state.version.node;
}

function isGanacheNode () {
  return getNodeVersion().match(/TestRPC/)
}

async function getBlockGasLimit () {
  if (state.block) return state.block.gasLimit;
  return new Promise((resolve, reject) => {
    web3.eth.getBlock('latest', (err, data) => {
      if (err) {
        reject(err);
      } else {
        state.block = data;
        resolve(state.block.gasLimit);
      }
    });
  });
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
  if (isGanacheNode()) gasToUse += 15000;
  return gasToUse >= blockLimit ? (blockLimit-1) : gasToUse;
}
