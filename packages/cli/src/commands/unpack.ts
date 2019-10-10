import unpack from '../scripts/unpack';
import Telemetry from '../telemetry';

const name = 'unpack';
const signature = `${name} [kit]`;
const description = `download and install an OpenZeppelin Starter Kit to the current directory`;

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .usage('[kit]')
    .description(description)
    .withNonInteractiveOption()
    .action(action);

async function action(kit: string, options: any): Promise<void> {
  await Telemetry.report('unpack', { repoOrName: kit }, options.interactive);
  await unpack({ repoOrName: kit });
}

export default { name, signature, description, register, action };
