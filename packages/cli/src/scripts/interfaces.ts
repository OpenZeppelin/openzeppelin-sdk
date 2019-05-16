import { TxParams } from 'zos-lib';

import ZosPackageFile from '../models/files/ZosPackageFile';
import ZosNetworkFile from '../models/files/ZosNetworkFile';

interface ContractData {
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
  networkFile?: ZosNetworkFile;
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
  Minimal = 'Minimal'
}

export interface CreateParams extends Proxy {
  salt?: string;
  signature?: string;
  admin?: string;
  kind?: ProxyType;
}

export interface CompareParams extends Network {}

export interface PullParams extends Network {}

export interface StatusParams extends Network {}

export interface FreezeParams extends Network {}

export interface PublishParams extends Network {}

export interface UpdateParams extends Proxy {
  all?: boolean;
}

export interface LinkParams extends Dependencies {
  packageFile?: ZosPackageFile;
}

export interface InitParams extends Dependencies {
  name: string;
  version?: string;
  force?: boolean;
  publish?: boolean;
  packageFile?: ZosPackageFile;
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
  packageFile?: ZosPackageFile;
}

export interface SessionParams {
  from?: string;
  close?: boolean;
  network?: string;
  timeout?: number;
  expires?: number;
}

export interface BumpParams {
  version: string;
  packageFile?: ZosPackageFile;
}

export interface RemoveParams {
  contracts: string[];
  packageFile?: ZosPackageFile;
}

export interface CheckParams {
  contractAlias: string;
  packageFile?: ZosPackageFile;
}

export interface UnlinkParams {
  dependencies: string[];
  packageFile?: ZosPackageFile;
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
