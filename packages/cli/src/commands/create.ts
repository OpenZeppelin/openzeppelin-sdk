import pickBy from 'lodash.pickby';

import create from '../scripts/create';
import { parseInit } from '../utils/input';
import { fromContractFullName } from '../utils/naming';
import { hasToMigrateProject } from '../utils/prompt-migration';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import ZosNetworkFile from '../models/files/ZosNetworkFile';

const name: string = 'create';
const signature: string = `${name} <alias>`;
const description: string = 'deploys a new upgradeable contract instance. Provide the <alias> you added your contract with, or <package>/<alias> to create a contract from a linked package.';

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('<alias> --network <network> [options]')
  .description(description)
  .option('--init [function]', `call function after creating contract. If none is given, 'initialize' will be used`)
  .option('--args <arg1, arg2, ...>', 'provide initialization arguments for your contract if required')
  .option('--force', 'force creation even if contracts have local modifications')
  .withNetworkOptions()
  .action(action);

async function action(contractFullName: string, options: any): Promise<void> {
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration(options);
  const zosversion = await ZosNetworkFile.getZosversion(network);
  if (!await hasToMigrateProject(zosversion)) process.exit(0);

  const { force } = options;
  const { initMethod, initArgs } = parseInit(options, 'initialize');
  const { contract: contractAlias, package: packageName } = fromContractFullName(contractFullName);
  const args = pickBy({ packageName, contractAlias, initMethod, initArgs, force });

  await create({ ...args, network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

export default { name, signature, description, register, action };
