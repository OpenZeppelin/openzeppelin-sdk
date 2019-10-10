import { ZWeb3 } from '@openzeppelin/upgrades';
import session from '../scripts/session';
import { promptIfNeeded, networksList, InquirerQuestions } from '../prompts/prompt';
import ConfigManager from '../models/config/ConfigManager';
import Telemetry from '../telemetry';

const name = 'session';
const signature: string = name;
const description =
  'by providing network options, commands like create, freeze, push, and update will use them unless overridden. Use --close to undo.';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .usage('[options]')
    .description(description)
    .option('--expires <expires>', 'expiration of the session in seconds (defaults to 900, 15 minutes)')
    .option('--close', 'closes the current session, removing all network options set')
    .withNetworkOptions()
    .withNonInteractiveOption()
    .action(action);

async function action(options: any): Promise<void> {
  const { network: networkInOpts, expires, timeout, from, close, interactive } = options;

  if (close) {
    await Telemetry.report('session', { close }, options.interactive);
    session({ close });
  } else {
    const promptedNetwork = await promptIfNeeded(
      { opts: { network: networkInOpts }, props: getCommandProps() },
      interactive,
    );
    const { network } = await ConfigManager.initNetworkConfiguration(promptedNetwork, true);
    const accounts = await ZWeb3.accounts();
    const promptedSession = await promptIfNeeded(
      { opts: { timeout, from, expires }, props: getCommandProps(accounts) },
      interactive,
    );

    await Telemetry.report('session', { close, ...promptedNetwork, ...promptedSession, network }, options.interactive);
    session({ close, ...promptedNetwork, ...promptedSession });
  }

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
        value: account,
      })),
    },
    timeout: {
      type: 'input',
      message: 'Enter a timeout to use for all web3 transactions (in seconds)',
      default: 3600,
    },
    expires: {
      type: 'input',
      message: 'Enter an expiration time for this session (in seconds)',
      default: 3600,
    },
  };
}
export default { name, signature, description, register, action };
