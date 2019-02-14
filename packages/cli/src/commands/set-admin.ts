import pickBy from 'lodash.pickby';

import setAdmin from '../scripts/set-admin';
import { fromContractFullName } from '../utils/naming';
import { hasToMigrateProject } from '../utils/prompt-migration';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import ZosNetworkFile from '../models/files/ZosNetworkFile';

const name: string = 'set-admin';
const signature: string = `${name} [alias-or-address] [new-admin-address]`;
const description: string = 'change upgradeability admin of a contract instance. Provide the [alias] or [package]/[alias] of the contract to change the ownership of all its instances, or its [address] to change a single one. Note that if you transfer to an incorrect address, you may irreversibly lose control over upgrading your contract.';

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[alias-or-address] [new-admin-address] --network <network> [options]')
  .description(description)
  .option('-y, --yes', 'accept transferring admin rights (required)')
  .withNetworkOptions()
  .action(action);

async function action(contractFullNameOrAddress: string, newAdmin: string, options: any): Promise<void | never> {
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration(options);
  const zosversion = await ZosNetworkFile.getZosversion(network);
  if (!await hasToMigrateProject(zosversion)) process.exit(0);

  const { yes } = options;
  if (!yes) {
    throw Error('This is a potentially irreversible operation: if you specify an incorrect admin address, you may lose the ability to upgrade your contract forever.\nPlease double check all parameters, and run the same command with --yes.');
  }

  let proxyAddress;
  let contractAlias;
  let packageName;

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
