import { compile } from '../../models/compiler/Compiler';
import { fromContractFullName } from '../../utils/naming';
import ConfigManager from '../../models/config/ConfigManager';
import NetworkController from '../../models/network/NetworkController';
import stdout from '../../utils/stdout';
import zipWith from 'lodash.zipwith';
import { MethodArgType } from '../../prompts/prompt';
import { parseArg } from '../../utils/input';

interface Options {
  network: string;
  skipCompile?: boolean;
  upgradeable?: boolean;
}

export async function preAction(options: Options): Promise<void> {
  if (!options.skipCompile) {
    await compile();
  }
}

export async function action(contractName: string, deployArgs: string[], options: Options): Promise<void> {
  if (options.upgradeable === true) {
    throw new Error('unimplemented');
  }

  // if (!(await hasToMigrateProject(network))) process.exit(0);

  const { network, txParams } = await ConfigManager.initNetworkConfiguration(options);

  const { package: packageName, contract: contractAlias } = fromContractFullName(contractName);

  const controller = new NetworkController(network, txParams);

  const contract = controller.contractManager.getContractClass(packageName, contractAlias);
  const constructorInputs: MethodArgType[] = contract.schema.abi.find(f => f.type === 'constructor')?.inputs ?? [];

  const args = zipWith(deployArgs, constructorInputs, parseArg);

  const instance = await controller.createInstance(packageName, contractAlias, args);

  stdout(instance.address);
}
