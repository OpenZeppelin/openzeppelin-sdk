export interface SetAdminPropsParams {
  network?: string;
  all?: boolean;
}

export interface SetAdminSelectionParams {
  address?: string;
  contractFullName?: string;
  proxyReference?: string;
  all: boolean;
  newAdmin?: string;
}

export interface UpdatePropsParams {
  contractReference?: string;
  network?: string;
  all?: boolean;
  contractFullName?: string;
  methodName?: string;
  methodArgs?: string[];
}

export interface UpdateSelectionParams {
  address: string | undefined;
  contractFullName: string | undefined;
  proxyReference: string | undefined;
  all: boolean;
}
