import { ZWeb3 } from 'zos-lib';
import transfer from '../scripts/transfer';
import { promptIfNeeded, networksList, InquirerQuestions } from '../prompts/prompt';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';

const name: string = 'transfer';
const signature: string = name;
const description: string = 'send funds in ether to the specified address';

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[options]')
  .description(description)
  .option('--units [units]', 'specify units.')
  .option('--to <to>', 'to')
  .option('--value <value>', 'value')
  .withNetworkOptions()
  .withNonInteractiveOption()
  .action(action);

async function action(options: any): Promise<void> {
  const { network: networkInOpts, units, to, value, from, interactive } = options;
  const promptedNetwork = await promptIfNeeded({ opts: { network: networkInOpts }, props: getCommandProps() }, interactive);
  const { txParams } = await ConfigVariablesInitializer.initNetworkConfiguration(promptedNetwork, true);
  const accounts = await ZWeb3.accounts();
  const opts = { units, to, from, value };
  console.log(opts);
  const prompted = await promptIfNeeded({ opts, props: getCommandProps(accounts) }, interactive);

  await transfer({ ...txParams, ...prompted });

  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

function getCommandProps(accounts: string[] = []): InquirerQuestions {
  return {
    ...networksList('network', 'list'),
    from: {
      type: 'list',
      message: 'Choose the account to send transactions from',
      choices: accounts.map((account, index) => ({
        name: `(${index}) ${account}`,
        value: account
      }))
    },
    units: {
      type: 'list',
      message: 'Select a unit',
      choices: () => ['Gwei', 'Wei', 'Ether']
    },
    to: {
      type: 'input',
      message: 'Enter a receiver account'
    },
    value: {
      type: 'input',
      message: 'Enter a value in wei'
    }
  };
}
export default { name, signature, description, register, action };
