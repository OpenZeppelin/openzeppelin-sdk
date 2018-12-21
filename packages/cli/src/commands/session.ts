import { Command } from 'commander';
import session from '../scripts/session';

const name: string = 'session';
const signature: string = name;
const description: string = 'by providing network options, commands like create, freeze, push, status and update will use them unless overridden. Use --close to undo.';

const register: (program: Command) => Command = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[options]')
  .description(description)
  .option('--expires <expires>', 'expiration of the session in seconds (defaults to 900, 15 minutes)')
  .option('--close', 'closes the current session, removing all network options set')
  .withNetworkOptions()
  .action(action);

function action(options: Command): void {
  const { network, from, timeout, close, expires } = options;
  session({ network, from, timeout: <number> timeout, close, expires: <number> expires });
}

export default { name, signature, description, register, action };
