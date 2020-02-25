import { getConstructorInputs } from '@openzeppelin/upgrades';

import Session from '../../models/network/Session';
import { compile } from '../../models/compiler/Compiler';
import { fromContractFullName } from '../../utils/naming';
import NetworkController from '../../models/network/NetworkController';
import stdout from '../../utils/stdout';
import { parseMultipleArgs } from '../../utils/input';
import { createAction } from '../create';

import { Options, Args } from './spec';

export async function preAction(params: Options & Args): Promise<void | (() => Promise<void>)> {
  if (!params.skipCompile) {
    await compile();
  }

  // If the user requests upgradeability via flag, we short circuit to the
  // create action. This avoid issues parsing deploy arguments due to the
  // deploy action being unaware of initializer functions.
  if (params.kind && params.kind !== 'regular') {
    return () => runCreate(params);
  }
}

export async function action(params: Options & Args): Promise<void> {
  if (params.kind && params.kind !== 'regular') {
    return runCreate(params);
  }

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

async function runCreate(params: Options & Args): Promise<void> {
  // The syntax params['key'] is used to circumvent the type checker.
  // This hack is temporary and should be removed once we remove the create command.

  if (params.arguments.length > 0) {
    // Translate arguments to syntax expected by create.
    params['args'] = params.arguments.join(',');
  }

  if (params.kind === 'minimal') {
    params['minimal'] = true;
  }

  params.skipCompile = true;
  params['noDeprecationWarning'] = true;

  await createAction(params.contract, params);
}
