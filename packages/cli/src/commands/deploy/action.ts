import { getConstructorInputs } from '@openzeppelin/upgrades';

import link from '../link';
import add from '../add';
import push from '../../scripts/push';

import ConfigManager from '../../models/config/ConfigManager';
import ContractManager from '../../models/local/ContractManager';

import { transpileAndSave } from '../../transpiler';
import { ProxyType } from '../../scripts/interfaces';
import { hasToMigrateProject } from '../../prompts/migrations';
import Session from '../../models/network/Session';
import { compile } from '../../models/compiler/Compiler';
import { fromContractFullName } from '../../utils/naming';
import NetworkController from '../../models/network/NetworkController';
import stdout from '../../utils/stdout';
import { parseMultipleArgs } from '../../utils/input';

import { Options, Args } from './spec';

export async function action(params: Options & Args): Promise<void> {
  if (!(await hasToMigrateProject(params.network))) process.exit(0);

  if (params.kind && ['upgradeable', 'minimal'].includes(params.kind)) {
    return deployProxy(params);
  }

  if (params.kind && params.kind === 'regular') {
    return deployRegular(params);
  }
}

function getConstructorArgs(
  packageName: string,
  contractName: string,
  args: string[],
  contractManager: ContractManager,
): unknown[] {
  const contract = contractManager.getContractClass(packageName, contractName);
  const constructorInputs = getConstructorInputs(contract);

  return parseMultipleArgs(args, constructorInputs);
}

async function deployRegular(params: Options & Args): Promise<void> {
  const { contract: fullContractName, arguments: deployArgs } = params;

  if (params.network === undefined) {
    const { network: lastNetwork, expired } = Session.getNetwork();
    if (!expired) {
      params.network = lastNetwork;
    }
  }

  const { network, txParams } = params;

  // Used for network preselection in subsequent runs.
  Session.setDefaultNetworkIfNeeded(network);

  const { package: packageName, contractName } = fromContractFullName(fullContractName);

  const controller = new NetworkController(network, txParams, params.networkFile);

  const args = getConstructorArgs(packageName, contractName, deployArgs, controller.contractManager);

  try {
    const instance = await controller.createInstance(packageName, contractName, args);
    stdout(instance.address);
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}

async function deployProxy(params: Options & Args): Promise<void> {
  const { network, txParams, contract: fullContractName, arguments: deployArgs } = params;

  const { contractName, package: packageName } = fromContractFullName(fullContractName);

  const isMinimal = params.kind === 'minimal';

  const transpiledContractName = `${contractName}Upgradable`;

  // transpile contract to upgradable version and save it contracs folder
  await transpileAndSave([contractName], ConfigManager.getBuildDir());
  // compile produced result
  await compile();

  await link.runActionIfNeeded(fullContractName, params);
  await add.runActionIfNeeded(fullContractName, params);
  await push({
    contracts: [fullContractName],
    transpiledContracts: { [fullContractName]: transpiledContractName },
    network,
    txParams,
    networkFile: params.networkFile,
  });

  const controller = new NetworkController(network, txParams, params.networkFile);

  const args = getConstructorArgs(packageName, contractName, deployArgs, controller.contractManager);

  try {
    await controller.logErrorIfContractPackageIsInvalid(packageName, contractName, false);
    const proxy = await controller.createProxy(
      packageName,
      contractName,
      'initialize',
      args as string[],
      undefined,
      undefined,
      undefined,
      isMinimal ? ProxyType.Minimal : ProxyType.Upgradeable,
      transpiledContractName,
      '0.1.0',
    );
    stdout(proxy.address);
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }

  Session.setDefaultNetworkIfNeeded(network);
}
