import ZosPackageFile from '../models/files/ZosPackageFile';
import ZosNetworkFile from '../models/files/ZosNetworkFile';

export interface InitParams {
  name?: string;
  version?: string;
  dependencies?: string[];
  force?: boolean;
  publish?: boolean;
  installDependencies?: boolean;
  packageFile?: ZosPackageFile;
}

export interface AddParams {
  contractsData?: ContractData[];
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
  version?: string;
  packageFile?: ZosPackageFile;
}

export interface RemoveParams {
  contracts?: string[];
  packageFile?: ZosPackageFile;
}

export interface CheckParams {
  contractAlias: string;
  packageFile?: ZosPackageFile;
}

export interface FreezeParams {
  network: string;
  networkFile?: ZosNetworkFile;
  txParams?: any;
}

export interface LinkParams {
  dependencies?: string[];
  installDependencies?: boolean;
  packageFile?: ZosPackageFile;
}

export interface PushParams {
  network?: string;
  deployDependencies?: boolean;
  reupload?: boolean;
  force?: boolean;
  txParams?: any;
  networkFile?: ZosNetworkFile;
}

export interface UpdateParams {
  packageName?: string;
  contractAlias?: string;
  proxyAddress?: string;
  initMethod?: string;
  initArgs?: string[];
  all?: boolean;
  force?: boolean;
  txParams?: any;
  network?: string;
  networkFile?: ZosNetworkFile;
}

export interface UnlinkParams {
  dependencies?: string[];
  packageFile?: ZosPackageFile;
}

export interface VerifyParams {
  network?: string;
  txParams: any;
  networkFile?: ZosNetworkFile;
  optimizer?: boolean;
  optimizerRuns: string | number;
  remote?: string;
  apiKey?: string;
}

export interface StatusParams {
  network?: string;
  txParams?: any;
  networkFile?: ZosNetworkFile;
}

export interface SetAdminParams {
  newAdmin?: string;
  packageName?: string;
  contractAlias?: string;
  proxyAddress?: string;
  network?: string;
  txParams?: any;
  networkFile?: ZosNetworkFile;
}

interface ContractData {
  name: string;
  alias: string;
}
