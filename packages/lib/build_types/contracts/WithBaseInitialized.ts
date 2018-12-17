/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import { BigNumber } from "bignumber.js";
import * as TC from "./typechain-runtime";

export class WithBaseInitialized extends TC.TypeChainContract {
  public readonly rawWeb3Contract: any;

  public constructor(web3: any, address: string | BigNumber) {
    const abi = [
      {
        constant: true,
        inputs: [],
        name: "value",
        outputs: [{ name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function"
      },
      {
        constant: true,
        inputs: [],
        name: "someValue",
        outputs: [{ name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function"
      },
      {
        constant: true,
        inputs: [],
        name: "anotherValue",
        outputs: [{ name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function"
      },
      {
        constant: false,
        inputs: [],
        name: "init",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        constant: false,
        inputs: [],
        name: "initialize",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
      }
    ];
    super(web3, address, abi);
  }

  static async createAndValidate(
    web3: any,
    address: string | BigNumber
  ): Promise<WithBaseInitialized> {
    const contract = new WithBaseInitialized(web3, address);
    const code = await TC.promisify(web3.eth.getCode, [address]);

    // in case of missing smartcontract, code can be equal to "0x0" or "0x" depending on exact web3 implementation
    // to cover all these cases we just check against the source code length — there won't be any meaningful EVM program in less then 3 chars
    if (code.length < 4) {
      throw new Error(`Contract at ${address} doesn't exist!`);
    }
    return contract;
  }

  public get value(): Promise<BigNumber> {
    return TC.promisify(this.rawWeb3Contract.value, []);
  }

  public get someValue(): Promise<BigNumber> {
    return TC.promisify(this.rawWeb3Contract.someValue, []);
  }

  public get anotherValue(): Promise<BigNumber> {
    return TC.promisify(this.rawWeb3Contract.anotherValue, []);
  }

  public initTx(): TC.DeferredTransactionWrapper<TC.ITxParams> {
    return new TC.DeferredTransactionWrapper<TC.ITxParams>(this, "init", []);
  }
  public initializeTx(): TC.DeferredTransactionWrapper<TC.ITxParams> {
    return new TC.DeferredTransactionWrapper<TC.ITxParams>(
      this,
      "initialize",
      []
    );
  }
}
