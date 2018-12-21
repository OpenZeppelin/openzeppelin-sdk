import ZosPackageFile from '../models/files/ZosPackageFile';
import ZosNetworkFile from '../models/files/ZosNetworkFile';

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
  txParams?: any;
  networkFile?: ZosNetworkFile;
}

interface Proxy extends Network, PackageArgs {
  proxyAddress?: string;
  initMethod?: string;
  initArgs?: string[];
  force?: boolean;
}

export interface CreateParams extends Proxy {}

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
  name?: string;
  version?: string;
  force?: boolean;
  publish?: boolean;
  packageFile?: ZosPackageFile;
}

export interface PushParams extends Network {
  deployDependencies?: boolean;
  reupload?: boolean;
  force?: boolean;
}

export interface VerifyParams extends Network {
  optimizer?: boolean;
  optimizerRuns: string | number;
  remote?: string;
  apiKey?: string;
}

export interface SetAdminParams extends Network, PackageArgs {
  proxyAddress?: string;
  newAdmin?: string;
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

export interface UnlinkParams {
  dependencies?: string[];
  packageFile?: ZosPackageFile;
}

interface ContractData {
  name: string;
  alias: string;
}
