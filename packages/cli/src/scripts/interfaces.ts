import ZosPackageFile from '../models/files/ZosPackageFile';

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

interface ContractData {
  name: string;
  alias: string;
}

