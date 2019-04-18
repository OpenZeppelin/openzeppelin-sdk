import { ZWeb3 } from 'zos-lib';
import session from '../scripts/session';
import { promptIfNeeded, networksList } from '../utils/prompt';
import Session from '../models/network/Session';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';

const name: string = 'session';
const signature: string = name;
const description: string = 'by providing network options, commands like create, freeze, push, status and update will use them unless overridden. Use --close to undo.';

const baseProps = {
  ...networksList('list'),
};

const sessionProps = (accounts) => {
  return {
    from: {
      type: 'list',
      message: 'Select an account address',
      choices: accounts.map((account, index) => {
        return {
          name: `(${index}) ${account}`,
          value: account
        };
      })
    },
    timeout: {
      type: 'input',
      message: 'Provide a timeout value (in seconds)',
      default: 3600
    },
    expires: {
      type: 'input',
      message: 'Provide an expiration time (in seconds)',
      default: 600
    }
  };
};

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[options]')
  .description(description)
  .option('--expires <expires>', 'expiration of the session in seconds (defaults to 900, 15 minutes)')
  .option('--close', 'closes the current session, removing all network options set')
  .withNetworkOptions()
  .action(action);

async function action(options: any): Promise<void> {
  const { network: networkInOpts, expires, timeout, from, close } = options;

  if (close) {
    session({ close });
  } else {
    const promptedNetwork = await promptIfNeeded({ opts: { network: networkInOpts }, props: baseProps });
    const { network } = await ConfigVariablesInitializer.initNetworkConfiguration(promptedNetwork, true);
    const accounts = await ZWeb3.accounts();
    const promptedSession = await promptIfNeeded({ opts: { timeout, from, expires }, props: sessionProps(accounts) });

    session({ close, ...promptedNetwork, ...promptedSession });
  }

  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

export default { name, signature, description, register, action };
