import { Command } from 'commander';

import push from './push';
import bump from '../scripts/bump';

const name: string = 'bump';
const signature: string = `${name} <version>`;
const description: string = 'bump your project to a new <version>';

const register: (program: Command) => Command  = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('<version> [options]')
  .description(description)
  .withPushOptions()
  .action(action);

async function action(version: string, options: Command): Promise<void> {
  await bump({ version });
  await push.tryAction(options);
}

export default { name, signature, description, register, action };
