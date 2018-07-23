import Contracts from '../utils/Contracts'
import { estimateGas } from '../utils/Transactions'

const RECEIPT_CHECK_TIMEBOX = 1000
const DEPLOYMENT_TIMEOUT_ERROR = 'Contract deployment timed out'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function callback(resolve, reject) {
  return (error, result) => error ? reject(error) : resolve(result)
}

async function sendTransaction(params) {
  if (!params.gas) params.gas = await estimateGas(params.data, params)
  return new Promise(function (resolve, reject) {
    web3.eth.sendTransaction(params, callback(resolve, reject))
  })
}

async function getTransactionReceipt(txHash) {
  let timeout = false
  const timer = setTimeout(() => timeout = true, Contracts.getSyncTimeout())

  while(!timeout) {
    const receipt = await new Promise((resolve, reject) =>
      web3.eth.getTransactionReceipt(txHash, callback(resolve, reject))
    )
    if (receipt) {
      clearTimeout(timer)
      return receipt
    }
    await sleep(RECEIPT_CHECK_TIMEBOX)
  }

  throw Error(DEPLOYMENT_TIMEOUT_ERROR)
}

export default async function copyContract(contractClass, address, txParams = {}) {
  address = address.replace('0x', '')

  // This is EVM assembly will return of the code of a foreign address.
  //
  // operation    | bytecode   | stack representation
  // =================================================
  // push20 ADDR  | 0x73 ADDR  | ADDR
  // dup1         | 0x80       | ADDR ADDR
  // extcodesize  | 0x3B       | ADDR 0xCS
  // dup1         | 0x80       | ADDR 0xCS 0xCS
  // swap2        | 0x91       | 0xCS 0xCS ADDR
  // push1 00     | 0x60 0x00  | 0xCS 0xCS ADDR 0x00
  // dup1         | 0x80       | 0xCS 0xCS ADDR 0x00 0x00
  // swap2        | 0x91       | 0xCS 0xCS 0x00 0x00 ADDR
  // extcodecopy  | 0x3C       | 0xCS
  // push1 00     | 0x60 0x00  | 0xCS 0x00
  // return       | 0xF3       |

  const ASM_CODE_COPY = `0x73${address}803b8091600080913c6000f3`

  const params = Object.assign({}, contractClass.defaults(), txParams, { to: null, data: ASM_CODE_COPY })
  const txHash = await sendTransaction(params)
  const receipt = await getTransactionReceipt(txHash)
  return contractClass.at(receipt.contractAddress)
}
