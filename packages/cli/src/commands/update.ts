import pickBy from 'lodash.pickby';

import update from '../scripts/update';
import { parseInit } from '../utils/input';
import { fromContractFullName } from '../utils/naming';
import { hasToMigrateProject } from '../utils/prompt-migration';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import ZosNetworkFile from '../models/files/ZosNetworkFile';

const name: string = 'update';
const signature: string = `${name} [alias-or-address]`;
const description: string = 'update contract to a new logic. Provide the [alias] or [package]/[alias] you added your contract with, its [address], or use --all flag to update all contracts in your project.';

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[alias-or-address] --network <network> [options]')
  .description(description)
  .option('--init [function]', `call function after upgrading contract. If no name is given, 'initialize' will be used`)
  .option('--args <arg1, arg2, ...>', 'provide initialization arguments for your contract if required')
  .option('--all', 'update all contracts in the application')
  .option('--force', 'force creation even if contracts have local modifications')
  .withNetworkOptions()
  .action(action);

async function action(contractFullNameOrAddress: string, options: any): Promise<void> {
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration(options);
  const zosversion = await ZosNetworkFile.getZosversion(network);
  if (!await hasToMigrateProject(zosversion)) process.exit(0);

  const { initMethod, initArgs } = parseInit(options, 'initialize');
  const { all, force } = options;

  let proxyAddress;
  let contractAlias;
  let packageName;

  if (contractFullNameOrAddress && contractFullNameOrAddress.startsWith('0x')) {
    proxyAddress = contractFullNameOrAddress;
  } else if (contractFullNameOrAddress) {
    ({ contract: contractAlias, package: packageName } = fromContractFullName(contractFullNameOrAddress));
  }

  const args = pickBy({ contractAlias, packageName, proxyAddress, initMethod, initArgs, all, force });
  await update({ ...args, network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

export default { name, signature, description, register, action };
