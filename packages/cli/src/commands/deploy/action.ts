import { getConstructorInputs } from '@openzeppelin/upgrades';

import Session from '../../models/network/Session';
import { compile } from '../../models/compiler/Compiler';
import { fromContractFullName } from '../../utils/naming';
import NetworkController from '../../models/network/NetworkController';
import { ProxyType } from '../../scripts/interfaces';
import ContractManager from '../../models/local/ContractManager';
import stdout from '../../utils/stdout';
import { parseMultipleArgs } from '../../utils/input';
import { Loggy } from '@openzeppelin/upgrades';

import link from '../link';
import add from '../add';
import push from '../push';

import { Options, Args } from './spec';

function isProxyKind(kind: Options['kind']): boolean {
  switch (kind) {
    case 'regular':
      return false;

    case 'upgradeable':
    case 'minimal':
      return true;
    default:
      throw new Error(`Unknown proxy kind: ${kind}`);
  }
}

export async function preAction(params: Options): Promise<void> {
  if (!params.skipCompile) {
    await compile();
  }
}

export async function action(params: Options & Args): Promise<void> {
  if (params.network === undefined) {
    const { network: lastNetwork, expired } = Session.getNetwork();
    if (!expired) {
      params.network = lastNetwork;
    }
  }

  const address = isProxyKind(params.kind) ? await deployProxy(params) : await deployRegular(params);

  stdout(address);
}

export async function deployRegular(params: Options & Args): Promise<string> {
  const { contract: fullContractName, arguments: deployArgs } = params;
  const { network, txParams } = params;

  const { package: packageName, contractName } = fromContractFullName(fullContractName);

  const controller = new NetworkController(network, txParams, params.networkFile);

  const args = getConstructorArgs(packageName, contractName, deployArgs, controller.contractManager);

  try {
    const instance = await controller.createInstance(packageName, contractName, args);
    return instance.address;
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}

async function deployProxy(params: Options & Args): Promise<string> {
  const { contract: fullContractName, arguments: deployArgs, kind } = params;
  const { network, txParams } = params;

  const { package: packageName, contractName } = fromContractFullName(fullContractName);

  await link.runActionIfNeeded(fullContractName, params);
  await add.runActionIfNeeded(fullContractName, params);
  await push.runActionIfNeeded([fullContractName], { ...params, network: params.userNetwork });

  const controller = new NetworkController(network, txParams, params.networkFile);

  const args = getConstructorArgs(packageName, contractName, deployArgs, controller.contractManager);

  try {
    await controller.logErrorIfContractPackageIsInvalid(packageName, contractName, false);
    const instance = await controller.createProxy(
      packageName,
      contractName,
      'initialize',
      args,
      literalToProxyType(kind),
    );

    if (params.kind === 'upgradeable') {
      Loggy.noSpin(__filename, 'deploy', 'deploy-hint', `To upgrade this instance run 'oz upgrade'`);
    }

    return instance.address;
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}

function getConstructorArgs(
  packageName: string,
  contractName: string,
  deployArgs: string[],
  contractManager: ContractManager,
): unknown[] {
  const contract = contractManager.getContractClass(packageName, contractName);
  const constructorInputs = getConstructorInputs(contract);

  return parseMultipleArgs(deployArgs, constructorInputs);
}

function literalToProxyType(kind: Options['kind']): ProxyType {
  switch (kind) {
    case 'upgradeable':
      return ProxyType.Upgradeable;
    case 'minimal':
      return ProxyType.Minimal;
    case 'regular':
      return ProxyType.NonProxy;
  }
}
