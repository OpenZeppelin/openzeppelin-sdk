/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import { BigNumber } from "bignumber.js";
import * as TC from "./typechain-runtime";

export class Package extends TC.TypeChainContract {
  public readonly rawWeb3Contract: any;

  public constructor(web3: any, address: string | BigNumber) {
    const abi = [
      {
        constant: false,
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        constant: true,
        inputs: [],
        name: "owner",
        outputs: [{ name: "", type: "address" }],
        payable: false,
        stateMutability: "view",
        type: "function"
      },
      {
        constant: false,
        inputs: [{ name: "_newOwner", type: "address" }],
        name: "transferOwnership",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        anonymous: false,
        inputs: [
          { indexed: false, name: "semanticVersion", type: "uint64[3]" },
          { indexed: false, name: "contractAddress", type: "address" },
          { indexed: false, name: "contentURI", type: "bytes" }
        ],
        name: "VersionAdded",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [{ indexed: true, name: "previousOwner", type: "address" }],
        name: "OwnershipRenounced",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          { indexed: true, name: "previousOwner", type: "address" },
          { indexed: true, name: "newOwner", type: "address" }
        ],
        name: "OwnershipTransferred",
        type: "event"
      },
      {
        constant: true,
        inputs: [{ name: "semanticVersion", type: "uint64[3]" }],
        name: "getVersion",
        outputs: [
          { name: "contractAddress", type: "address" },
          { name: "contentURI", type: "bytes" }
        ],
        payable: false,
        stateMutability: "view",
        type: "function"
      },
      {
        constant: true,
        inputs: [{ name: "semanticVersion", type: "uint64[3]" }],
        name: "getContract",
        outputs: [{ name: "contractAddress", type: "address" }],
        payable: false,
        stateMutability: "view",
        type: "function"
      },
      {
        constant: false,
        inputs: [
          { name: "semanticVersion", type: "uint64[3]" },
          { name: "contractAddress", type: "address" },
          { name: "contentURI", type: "bytes" }
        ],
        name: "addVersion",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        constant: true,
        inputs: [{ name: "semanticVersion", type: "uint64[3]" }],
        name: "hasVersion",
        outputs: [{ name: "", type: "bool" }],
        payable: false,
        stateMutability: "view",
        type: "function"
      },
      {
        constant: true,
        inputs: [],
        name: "getLatest",
        outputs: [
          { name: "semanticVersion", type: "uint64[3]" },
          { name: "contractAddress", type: "address" },
          { name: "contentURI", type: "bytes" }
        ],
        payable: false,
        stateMutability: "view",
        type: "function"
      },
      {
        constant: true,
        inputs: [{ name: "major", type: "uint64" }],
        name: "getLatestByMajor",
        outputs: [
          { name: "semanticVersion", type: "uint64[3]" },
          { name: "contractAddress", type: "address" },
          { name: "contentURI", type: "bytes" }
        ],
        payable: false,
        stateMutability: "view",
        type: "function"
      }
    ];
    super(web3, address, abi);
  }

  static async createAndValidate(
    web3: any,
    address: string | BigNumber
  ): Promise<Package> {
    const contract = new Package(web3, address);
    const code = await TC.promisify(web3.eth.getCode, [address]);

    // in case of missing smartcontract, code can be equal to "0x0" or "0x" depending on exact web3 implementation
    // to cover all these cases we just check against the source code length — there won't be any meaningful EVM program in less then 3 chars
    if (code.length < 4) {
      throw new Error(`Contract at ${address} doesn't exist!`);
    }
    return contract;
  }

  public get owner(): Promise<string> {
    return TC.promisify(this.rawWeb3Contract.owner, []);
  }

  public getVersion(semanticVersion: BigNumber[]): Promise<[string, string[]]> {
    return TC.promisify(this.rawWeb3Contract.getVersion, [
      semanticVersion.map(val => val.toString())
    ]);
  }

  public getContract(semanticVersion: BigNumber[]): Promise<string> {
    return TC.promisify(this.rawWeb3Contract.getContract, [
      semanticVersion.map(val => val.toString())
    ]);
  }

  public hasVersion(semanticVersion: BigNumber[]): Promise<boolean> {
    return TC.promisify(this.rawWeb3Contract.hasVersion, [
      semanticVersion.map(val => val.toString())
    ]);
  }

  public getLatest(): Promise<[BigNumber[], string, string[]]> {
    return TC.promisify(this.rawWeb3Contract.getLatest, []);
  }

  public getLatestByMajor(
    major: BigNumber | number
  ): Promise<[BigNumber[], string, string[]]> {
    return TC.promisify(this.rawWeb3Contract.getLatestByMajor, [
      major.toString()
    ]);
  }

  public renounceOwnershipTx(): TC.DeferredTransactionWrapper<TC.ITxParams> {
    return new TC.DeferredTransactionWrapper<TC.ITxParams>(
      this,
      "renounceOwnership",
      []
    );
  }
  public transferOwnershipTx(
    _newOwner: BigNumber | string
  ): TC.DeferredTransactionWrapper<TC.ITxParams> {
    return new TC.DeferredTransactionWrapper<TC.ITxParams>(
      this,
      "transferOwnership",
      [_newOwner.toString()]
    );
  }
  public addVersionTx(
    semanticVersion: BigNumber[],
    contractAddress: BigNumber | string,
    contentURI: string[]
  ): TC.DeferredTransactionWrapper<TC.ITxParams> {
    return new TC.DeferredTransactionWrapper<TC.ITxParams>(this, "addVersion", [
      semanticVersion.map(val => val.toString()),
      contractAddress.toString(),
      contentURI.map(val => val.toString())
    ]);
  }

  public VersionAddedEvent(eventFilter: {}): TC.DeferredEventWrapper<
    {
      semanticVersion: BigNumber[];
      contractAddress: BigNumber | string;
      contentURI: string[];
    },
    {}
  > {
    return new TC.DeferredEventWrapper<
      {
        semanticVersion: BigNumber[];
        contractAddress: BigNumber | string;
        contentURI: string[];
      },
      {}
    >(this, "VersionAdded", eventFilter);
  }
  public OwnershipRenouncedEvent(eventFilter: {
    previousOwner?: BigNumber | string | Array<BigNumber | string>;
  }): TC.DeferredEventWrapper<
    { previousOwner: BigNumber | string },
    { previousOwner?: BigNumber | string | Array<BigNumber | string> }
  > {
    return new TC.DeferredEventWrapper<
      { previousOwner: BigNumber | string },
      { previousOwner?: BigNumber | string | Array<BigNumber | string> }
    >(this, "OwnershipRenounced", eventFilter);
  }
  public OwnershipTransferredEvent(eventFilter: {
    previousOwner?: BigNumber | string | Array<BigNumber | string>;
    newOwner?: BigNumber | string | Array<BigNumber | string>;
  }): TC.DeferredEventWrapper<
    { previousOwner: BigNumber | string; newOwner: BigNumber | string },
    {
      previousOwner?: BigNumber | string | Array<BigNumber | string>;
      newOwner?: BigNumber | string | Array<BigNumber | string>;
    }
  > {
    return new TC.DeferredEventWrapper<
      { previousOwner: BigNumber | string; newOwner: BigNumber | string },
      {
        previousOwner?: BigNumber | string | Array<BigNumber | string>;
        newOwner?: BigNumber | string | Array<BigNumber | string>;
      }
    >(this, "OwnershipTransferred", eventFilter);
  }
}
