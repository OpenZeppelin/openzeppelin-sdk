import { pickBy } from 'lodash';
import { ZWeb3 } from '@openzeppelin/upgrades';

import { parseContractReference } from '../utils/contract';
import { SetAdminPropsParams, SetAdminSelectionParams } from './interfaces';
import setAdmin from '../scripts/set-admin';
import {
  promptIfNeeded,
  networksList,
  promptForNetwork,
  proxiesList,
  proxyInfo,
  InquirerQuestions,
} from '../prompts/prompt';
import { hasToMigrateProject } from '../prompts/migrations';
import ConfigManager from '../models/config/ConfigManager';
import { ProxyType } from '../scripts/interfaces';
import Telemetry from '../telemetry';

const name = 'set-admin';
const signature = `${name} [alias-or-address] [new-admin-address]`;
const description = `change upgradeability admin of a contract instance, all instances or proxy admin. Provide the [alias] or [package]/[alias] of the contract to change the ownership of all its instances, or its [address] to change a single one, or none to change all contract instances to a new admin. Note that if you transfer to an incorrect address, you may irreversibly lose control over upgrading your contract.`;

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .usage('[alias-or-address] [new-admin-address] --network <network> [options]')
    .description(description)
    .option('--force', 'bypass a manual check')
    .withNetworkOptions()
    .withNonInteractiveOption()
    .action(action);

async function action(proxyReference: string, newAdmin: string, options: any): Promise<void | never> {
  const { force, interactive } = options;

  if (!interactive && !force) throw new Error('Either enable an interactivity mode or set a force flag.');

  const networkOpts = await promptForNetwork(options, () => getCommandProps());

  const { network, txParams } = await ConfigManager.initNetworkConfiguration({
    ...options,
    ...networkOpts,
  });
  if (!(await hasToMigrateProject(network))) process.exit(0);

  const { proxyReference: pickedProxyReference, newAdmin: pickedNewAdmin } = await promptForProxies(
    proxyReference,
    newAdmin,
    network,
    options,
  );
  const parsedContractReference = parseContractReference(pickedProxyReference);

  if (!pickedNewAdmin) throw Error('You have to specify at least a new admin address.');

  // has to be a standalone question from interactivity
  // because it is security related and can't be disabled with interactivity set to false
  if (!force) {
    const { address } = await promptIfNeeded(
      {
        args: { address: '' },
        props: {
          address: {
            type: 'string',
            message:
              'Warning! If you provide a wrong address, you will lose control over your contracts. Please double check your address and type the last 4 characters of the new admin address.',
          },
        },
      },
      interactive,
    );
    if (address.toLowerCase() !== pickedNewAdmin.slice(-4).toLowerCase()) {
      throw new Error('Last 4 characters of the admin address do not match');
    }
  }

  // has to check if a new admin address has balance or wallet
  // if not display yet another warning
  const balance = await ZWeb3.eth.getBalance(pickedNewAdmin);
  const code = await ZWeb3.eth.getCode(pickedNewAdmin);
  if (!force && balance === (0x0).toString() && code === '0x') {
    const { certain } = await promptIfNeeded(
      {
        args: { certain: undefined },
        props: {
          certain: {
            type: 'confirm',
            message: 'The new admin address has no funds nor wallet. Are you sure you want to continue?',
          },
        },
      },
      interactive,
    );
    if (!certain) {
      throw Error('Aborted by user');
    }
  }

  const args = pickBy({ ...parsedContractReference, newAdmin: pickedNewAdmin });
  await Telemetry.report('set-admin', { ...args, network, txParams }, options.interactive);
  await setAdmin({ ...args, network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

async function promptForProxies(
  proxyReference: string,
  newAdmin: string,
  network: string,
  options: any,
): Promise<SetAdminSelectionParams> {
  // we assume if newAdmin is empty it was specified as first argument
  if (!newAdmin) {
    newAdmin = proxyReference;
    proxyReference = '';
  }
  const { interactive } = options;
  const pickProxyBy = newAdmin ? 'all' : undefined;
  const args = { pickProxyBy, proxy: proxyReference, newAdmin };
  const props = getCommandProps({ network, all: !!newAdmin });
  const { pickProxyBy: pickedProxyBy, proxy: pickedProxy, newAdmin: pickedNewAdmin } = await promptIfNeeded(
    { args, props },
    interactive,
  );

  return {
    newAdmin: pickedNewAdmin,
    all: pickedProxyBy === 'all',
    ...pickedProxy,
  };
}

function getCommandProps({ network, all }: SetAdminPropsParams = {}): InquirerQuestions {
  return {
    ...networksList('network', 'list'),
    pickProxyBy: {
      message: 'For which instances would you like to transfer ownership?',
      type: 'list',
      choices: [
        {
          name: 'All instances',
          value: 'all',
        },
        {
          name: 'Choose by name',
          value: 'byName',
        },
        {
          name: 'Choose by address',
          value: 'byAddress',
        },
      ],
    },
    proxy: {
      message: 'Choose an instance',
      type: 'list',
      choices: ({ pickProxyBy }) => proxiesList(pickProxyBy, network, { kind: ProxyType.Upgradeable }),
      when: ({ pickProxyBy }) => !all && pickProxyBy && pickProxyBy !== 'all',
      normalize: input => (typeof input !== 'object' ? proxyInfo(parseContractReference(input), network) : input),
    },
    newAdmin: {
      type: 'input',
      message: 'Enter an address of a new upgradeability admin',
    },
  };
}

export default { name, signature, description, register, action };
