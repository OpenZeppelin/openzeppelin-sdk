export enum Mutability {
  Constant = 'Constant',
  NotConstant = 'NotConstant',
}

export interface SetAdminPropsParams extends SharedPropsParams {}

export interface SendTxSelectionParams extends SharedSelectionParams {}

export interface UpdateSelectionParams extends SharedSelectionParams {
  all: boolean;
}

export interface SendTxPropsParams extends SharedPropsParams, MethodParams {
  contractFullName?: string;
  proxyAddress?: string;
}

export interface UpdatePropsParams extends SharedPropsParams, MethodParams {
  proxyReference?: string;
  contractFullName?: string;
}

export interface SetAdminSelectionParams extends SharedSelectionParams {
  all: boolean;
  newAdmin?: string;
}

interface SharedPropsParams {
  network?: string;
  all?: boolean;
}

interface SharedSelectionParams {
  contractFullName?: string;
  proxyReference?: string;
  address?: string;
}

interface MethodParams {
  methodName?: string;
  methodArgs?: string[];
}
