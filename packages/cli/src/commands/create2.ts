import pickBy from 'lodash.pickby';

import create from '../scripts/create';
import queryDeployment from '../scripts/query-deployment';
import { parseInit } from '../utils/input';
import { fromContractFullName } from '../utils/naming';
import { hasToMigrateProject } from '../utils/prompt-migration';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';

const name: string = 'create2';
const signature: string = `${name} [alias]`;
const description: string = 'deploys a new upgradeable contract instance using CREATE2 at a predetermined address given a numeric <salt> and a <from> address. Provide the <alias> you added your contract with, or <package>/<alias> to create a contract from a linked package. Warning: support for this feature is experimental.';

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[alias] --network <network> --salt <salt> [options]')
  .description(description)
  .option('--salt <salt>', `salt used to determine the deployment address`)
  .option('--query', `do not create the contract and just return the deployment address`)
  .option('--init [function]', `call function after creating contract. If none is given, 'initialize' will be used`)
  .option('--args <arg1, arg2, ...>', 'provide initialization arguments for your contract if required')
  .option('--force', 'force creation even if contracts have local modifications')
  .withNetworkOptions()
  .action(action);

async function action(contractFullName: string, options: any): Promise<void> {
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration(options);
  if (!await hasToMigrateProject(network)) process.exit(0);

  if (options.query) await runQuery(options, network, txParams);
  else await runCreate(options, contractFullName, network, txParams);

  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

export default { name, signature, description, register, action };

async function runQuery(options: any, network: string, txParams: any) {
  await queryDeployment({ salt: options.salt, network, txParams });
}

async function runCreate(options: any, contractFullName: string, network: string, txParams: any) {
  const { force, salt } = options;
  const { initMethod, initArgs } = parseInit(options, 'initialize');
  const { contract: contractAlias, package: packageName } = fromContractFullName(contractFullName);
  if (!contractAlias) throw new Error('missing required argument: alias');
  const args = pickBy({ packageName, contractAlias, initMethod, initArgs, force, salt });
  await create({ ...args, network, txParams });
}
