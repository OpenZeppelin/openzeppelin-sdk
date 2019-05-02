import { ZWeb3 } from 'zos-lib';
import transfer from '../scripts/transfer';
import { promptIfNeeded, networksList, InquirerQuestions } from '../prompts/prompt';
import { isValidUnit } from '../utils/units';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';

const name: string = 'transfer';
const signature: string = name;
const description: string = 'send funds to a given address';

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[options]')
  .description(description)
  .option('--to <to>', 'specify recipient address')
  .option('--value <value>', 'the amount of ether units to be transferred')
  .option('--unit <unit>', 'unit name. Wei, kwei, gwei, milli and ether are supported among others. If none is given, \'ether\' will be used.')
  .withNetworkOptions()
  .withNonInteractiveOption()
  .action(action);

async function action(options: any): Promise<void> {
  const { network: networkInOpts, unit, to, value, from, interactive } = options;
  const configOpts = { network: networkInOpts, from };
  const configProps = getCommandProps();
  const promptedConfig = await promptIfNeeded({ opts: configOpts, props: configProps }, interactive);
  const { txParams } = await ConfigVariablesInitializer.initNetworkConfiguration(promptedConfig, true);

  const transferOpts = { from, to, value };
  const transferProps = getCommandProps(await ZWeb3.accounts(), unit);
  const promptedTransfer = await promptIfNeeded({ opts: transferOpts, props: transferProps }, interactive);

  await transfer({ ...promptedTransfer, unit, txParams });

  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

function getCommandProps(accounts: string[] = [], unit: string = 'ether'): InquirerQuestions {
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
    to: {
      type: 'input',
      message: 'Enter a receiver account'
    },
    value: {
      type: 'input',
      message: 'Enter an amount to transfer',
      transformer: (value) => {
        if (value.length === 0 || !isValidUnit(unit)) return value;
        return `${value} ${unit.toLowerCase()}`;
      },
    }
  };
}
export default { name, signature, description, register, action };
