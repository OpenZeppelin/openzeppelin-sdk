import { getConstructorInputs } from '@openzeppelin/upgrades';

import { compile } from '../../models/compiler/Compiler';
import { fromContractFullName } from '../../utils/naming';
import ConfigManager from '../../models/config/ConfigManager';
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
  if (params.kind === 'upgradeable') {
    return async () => {
      if (params.arguments.length > 0) {
        // Translate arguments to syntax expected by create.
        params['args'] = params.arguments.join(',');
      }
      await createAction(params.contract, params);
    };
  }
}

export async function action(params: Options & Args): Promise<void> {
  if (params.kind === 'upgradeable') {
    return createAction(params.contract, params);
  }

  const { contract: contractName, arguments: deployArgs } = params;

  const { network, txParams } =
    process.env.NODE_ENV === 'test' ? params : await ConfigManager.initNetworkConfiguration(params);

  const { package: packageName, contract: contractAlias } = fromContractFullName(contractName);

  const controller = new NetworkController(network, txParams, params.networkFile);

  const contract = controller.contractManager.getContractClass(packageName, contractAlias);
  const constructorInputs = getConstructorInputs(contract);

  const args = parseMultipleArgs(deployArgs, constructorInputs);

  try {
    const instance = await controller.createInstance(packageName, contractAlias, args);
    stdout(instance.address);
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}
