import { promisify } from 'util';

import ZWeb3 from '../artifacts/ZWeb3';
import Contracts from '../artifacts/Contracts';
import ContractFactory, { ContractWrapper } from '../artifacts/ContractFactory';
import { estimateGas } from '../utils/Transactions';

async function sendTransaction(params: any): Promise<any> {
  if (!params.gas) params.gas = await estimateGas(params);
  return ZWeb3.sendTransaction(params);
}

export default async function copyContract(contractClass: ContractFactory, address: string, txParams: any = {}): Promise<ContractWrapper> {
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

  const params: any = Object.assign({}, contractClass.txParams, txParams, { to: null, data: ASM_CODE_COPY });
  const txHash: string = await sendTransaction(params);
  const receipt: any = await ZWeb3.getTransactionReceiptWithTimeout(txHash, Contracts.getSyncTimeout());
  return contractClass.at(receipt.contractAddress);
}
