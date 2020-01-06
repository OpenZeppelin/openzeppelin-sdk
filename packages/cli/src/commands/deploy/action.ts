import { TxParams } from '@openzeppelin/upgrades';
import { compile } from '../../models/compiler/Compiler';
import { fromContractFullName } from '../../utils/naming';
import ConfigManager from '../../models/config/ConfigManager';
import NetworkController from '../../models/network/NetworkController';
import stdout from '../../utils/stdout';
import { MethodArgType } from '../../prompts/prompt';
import { parseMultipleArgs } from '../../utils/input';
import NetworkFile from '../../models/files/NetworkFile';

interface Options {
  network: string;
  skipCompile?: boolean;
  upgradeable?: boolean;

  // The following are not available as CLI flags, and they are only used in tests.
  networkFile?: NetworkFile;
  txParams?: TxParams;
}

export async function preAction(contractName: string, deployArgs: string[], options: Options): Promise<void> {
  if (!options.skipCompile) {
    await compile();
  }
}

export async function action(contractName: string, deployArgs: string[], options: Options): Promise<void> {
  if (options.upgradeable === true) {
    throw new Error('unimplemented');
  }

  // this is an interactive prompt, so should be handled by the prompts
  // if (!(await hasToMigrateProject(network))) process.exit(0);

  const { network, txParams } = options.txParams ? options : await ConfigManager.initNetworkConfiguration(options);

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
