import pickBy from 'lodash.pickby';
import inquirer from 'inquirer';

import setAdmin from '../scripts/set-admin';
import { fromContractFullName } from '../utils/naming';
import { hasToMigrateProject } from '../utils/prompt-migration';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';

const name: string = 'set-admin';
const signature: string = `${name} [alias-or-address] [new-admin-address]`;
const description: string = `change upgradeability admin of a contract instance, all instances or proxy admin.
Provide the [alias] or [package]/[alias] of the contract to change the ownership of all its instances,
or its [address] to change a single one, or none to change all contract instances to a new admin. 
Note that if you transfer to an incorrect address, you may irreversibly lose control over upgrading your contract.`;

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[alias-or-address] [new-admin-address] --network <network> [options]')
  .description(description)
  .option('-f, --force', 'bypass a manual check')
  .withNetworkOptions()
  .action(action);

async function action(contractFullNameOrAddress: string, newAdmin: string, options: any): Promise<void | never> {
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration(options);
  if (!await hasToMigrateProject(network)) process.exit(0);

  let proxyAddress;
  let contractAlias;
  let packageName;

  if (!contractFullNameOrAddress) throw Error('You have to specify at least a new admin address.');

  // we assume if newAdmin is empty it was specified as first argument
  if (!newAdmin) {
    newAdmin = contractFullNameOrAddress;
    contractFullNameOrAddress = '';
  }

  if (!options.force) {
    const answers = await inquirer.prompt([
      {
        name: 'address',
        type: 'string',
        message: 'Please double check your address and type the last 4 characters of the new admin address. If you provide a wrong address, you will lose control over your contracts.',
      }
    ]);
    if (answers.address !== newAdmin.slice(-4)) {
      throw Error('Last 4 characters of the admin address do not match');
    }
  }

  if (contractFullNameOrAddress && contractFullNameOrAddress.startsWith('0x')) {
    proxyAddress = contractFullNameOrAddress;
  } else if (contractFullNameOrAddress) {
    ({ contract: contractAlias, package: packageName } = fromContractFullName(contractFullNameOrAddress));
  }

  const args = pickBy({ contractAlias, packageName, proxyAddress, newAdmin });
  await setAdmin({ ...args, network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

export default { name, signature, description, register, action };
