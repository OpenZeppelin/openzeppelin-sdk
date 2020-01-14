import { compile } from '../../models/compiler/Compiler';
import { fromContractFullName } from '../../utils/naming';
import ConfigManager from '../../models/config/ConfigManager';
import NetworkController from '../../models/network/NetworkController';
import stdout from '../../utils/stdout';
import { MethodArgType } from '../../prompts/prompt';
import { parseMultipleArgs } from '../../utils/input';
import { createAction } from '../create';

import { Options } from './spec';

import { AbortAction } from '../../register-command';

export async function preAction(
  contractName: string | undefined,
  deployArgs: string[],
  options: Options,
): Promise<void> {
  if (!options.skipCompile) {
    await compile();
  }

  if (options.upgradeable === true) {
    throw new AbortAction(async () => {
      // Translate arguments to syntax expected by create.
      options['args'] = deployArgs.join(',');
      await createAction(contractName, options);
    });
  }
}

export async function action(contractName: string, deployArgs: string[], options: Options): Promise<void> {
  const { network, txParams } =
    process.env.NODE_ENV === 'test' ? options : await ConfigManager.initNetworkConfiguration(options);

  const { package: packageName, contract: contractAlias } = fromContractFullName(contractName);

  const controller = new NetworkController(network, txParams, options.networkFile);

  const contract = controller.contractManager.getContractClass(packageName, contractAlias);
  const constructorInputs: MethodArgType[] = contract.schema.abi.find(f => f.type === 'constructor')?.inputs ?? [];

  const args = parseMultipleArgs(deployArgs, constructorInputs);

  try {
    const instance = await controller.createInstance(packageName, contractAlias, args);
    stdout(instance.address);
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}
