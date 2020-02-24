import { getConstructorInputs } from '@openzeppelin/upgrades';

import link from '../link';
import add from '../add';
import push from '../../scripts/push';

import ConfigManager from '../../models/config/ConfigManager';

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

  const contract = controller.contractManager.getContractClass(packageName, contractName);
  const constructorInputs = getConstructorInputs(contract);

  const args = parseMultipleArgs(deployArgs, constructorInputs);

  try {
    const instance = await controller.createInstance(packageName, contractName, args);
    stdout(instance.address);
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}

async function deployProxy(params: Options & Args): Promise<void> {
  const { network, txParams, contract: fullContractName } = params;
  const { contractName, package: packageName } = fromContractFullName(fullContractName);

  // transpile contract to upgradable version and save it contracs folder
  await transpileAndSave([contractName], ConfigManager.getBuildDir());
  // compile produced result
  await compile();

  const fullContractNameUpgradable = `${fullContractName}Upgradable`;
  const contractNameUpgradable = `${contractName}Upgradable`;

  await link.runActionIfNeeded(fullContractNameUpgradable, params);
  await add.runActionIfNeeded(fullContractNameUpgradable, params);
  await push({ contracts: [fullContractNameUpgradable], network, txParams, networkFile: params.networkFile });

  const controller = new NetworkController(network, txParams, params.networkFile);
  try {
    await controller.throwOrLogErrorForPackageContract(packageName, contractNameUpgradable, false);
    const proxy = await controller.createProxy(
      packageName,
      contractNameUpgradable,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      params.kind === 'minimal' ? ProxyType.Minimal : ProxyType.Upgradeable,
    );
    stdout(proxy.address);
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }

  Session.setDefaultNetworkIfNeeded(network);
}
