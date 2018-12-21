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
  installDependencies?: boolean
  packageFile?: ZosPackageFile;
}

interface ContractData {
  name: string;
  alias: string;
}

