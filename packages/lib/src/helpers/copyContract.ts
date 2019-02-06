import { promisify } from 'util';

import ZWeb3 from '../artifacts/ZWeb3';
import Contracts from '../artifacts/Contracts';
import Contract from '../artifacts/Contract';
import Transactions from '../utils/Transactions';

async function sendTransaction(params: any): Promise<any> {
  if (!params.gas) params.gas = await Transactions.estimateGas(params);
  return ZWeb3.sendTransactionWithoutReceipt(params);
}

export default async function copyContract(contract: Contract, address: string, txParams: any = {}): Promise<Contract> {
  const trimmedAddress: string = address.replace('0x', '');

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

  const ASM_CODE_COPY: string = `0x73${trimmedAddress}803b8091600080913c6000f3`;

  const params = Object.assign({}, txParams, { to: null, data: ASM_CODE_COPY });
  const txHash = await sendTransaction(params);
  const receipt = await ZWeb3.getTransactionReceiptWithTimeout(txHash, Contracts.getSyncTimeout());
  return contract.at(receipt.contractAddress);
}
