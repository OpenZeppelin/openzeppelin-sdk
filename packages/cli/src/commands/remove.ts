import { Command } from 'commander';

import remove from '../scripts/remove';
import push from './push';

const name: string = 'remove';
const signature: string = `${name} [contracts...]`;
const description: string = 'removes one or more contracts from your project. Provide a list of whitespace-separated contract names.';

const register: (program: Command) => Command = (program) => program
  .command(signature, undefined, { noHelp: true })
  .alias('rm')
  .usage('[contract1 ... contractN] [options]')
  .description(description)
  .withPushOptions()
  .action(action);

async function action(contracts: string[], options: Command): Promise<void> {
  remove({ contracts });
  await push.tryAction(options);
}

export default { name, signature, description, register, action };
