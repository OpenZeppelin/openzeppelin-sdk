import { TxParams } from '@openzeppelin/upgrades';

import ProjectFile from '../models/files/ProjectFile';
import NetworkFile from '../models/files/NetworkFile';

export interface ContractData {
  name: string;
  alias: string;
}

interface Dependencies {
  dependencies?: string[];
  installDependencies?: boolean;
}

interface PackageArgs {
  packageName?: string;
  contractAlias?: string;
}

interface Network {
  network: string;
  txParams?: TxParams;
  networkFile?: NetworkFile;
}

interface MethodParams {
  methodName: string;
  methodArgs: string[];
}

interface Proxy extends Network, MethodParams, PackageArgs {
  proxyAddress?: string;
  force?: boolean;
}

export enum ProxyType {
  Upgradeable = 'Upgradeable',
  Minimal = 'Minimal',
  NonProxy = 'NonProxy',
}

export type Params =
  | CreateParams
  | CompareParams
  | PullParams
  | StatusParams
  | FreezeParams
  | PublishParams
  | UpdateParams
  | LinkParams
  | InitParams
  | UnpackParams
  | PushParams
  | VerifyParams
  | SetAdminParams
  | AddParams
  | SessionParams
  | BumpParams
  | RemoveParams
  | CheckParams
  | UnlinkParams
  | QueryDeploymentParams
  | TransferParams
  | BalanceParams
  | CallParams
  | SendTxParams
  | CompileParams;

export interface CreateParams extends Proxy {
  salt: string;
  signature: string;
  admin: string;
  kind: ProxyType;
}

export interface CompareParams extends Network {}

export interface PullParams extends Network {}

export interface StatusParams extends Network {}

export interface FreezeParams extends Network {}

export interface PublishParams extends Network {}

export interface UpdateParams extends Proxy {
  all: boolean;
}

export interface LinkParams extends Dependencies {
  projectFile?: ProjectFile;
}

export interface InitParams extends Dependencies {
  name: string;
  version?: string;
  force?: boolean;
  publish?: boolean;
  projectFile?: ProjectFile;
  typechainEnabled?: boolean;
  typechainTarget?: string;
  typechainOutdir?: string;
}

export interface UnpackParams {
  repoOrName: string;
}

export interface PushParams extends Network {
  force?: boolean;
  reupload?: boolean;
  deployDependencies?: boolean;
  deployProxyAdmin?: boolean;
  deployProxyFactory?: boolean;
}

export interface VerifyParams extends Network {
  apiKey: string;
  remote: string;
  optimizer?: boolean;
  optimizerRuns?: string | number;
}

export interface SetAdminParams extends Network, PackageArgs {
  proxyAddress?: string;
  newAdmin?: string;
}

export interface AddParams {
  contractsData: ContractData[];
  projectFile?: ProjectFile;
}

export interface SessionParams {
  from?: string;
  close?: boolean;
  network?: string;
  timeout?: number;
  blockTimeout?: number;
  expires?: number;
}

export interface BumpParams {
  version: string;
  projectFile?: ProjectFile;
}

export interface RemoveParams {
  contracts: string[];
  projectFile?: ProjectFile;
}

export interface CheckParams {
  contractAlias: string;
  projectFile?: ProjectFile;
}

export interface UnlinkParams {
  dependencies: string[];
  projectFile?: ProjectFile;
}

export interface QueryDeploymentParams extends Network {
  salt: string;
  sender?: string;
}

export interface TransferParams {
  to: string;
  value: string;
  txParams: TxParams;
  unit?: string;
  from?: string;
}

export interface BalanceParams {
  accountAddress: string;
  contractAddress?: string;
}

export interface CallParams extends MethodParams, Network {
  proxyAddress: string;
}

export interface SendTxParams extends MethodParams, Network {
  proxyAddress: string;
  value?: string;
  gas?: string;
}

export interface CompileParams {
  evmVersion: string;
  solcVersion: string;
  optimizer: string | boolean;
  optimizerRuns: string;
}
