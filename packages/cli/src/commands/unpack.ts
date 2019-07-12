import unpack from '../scripts/unpack';

const name = 'unpack';
const signature = `${name} [kit]`;
const description = `download and install an OpenZeppelin Starter Kit to the current directory`;

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .usage('[kit]')
    .description(description)
    .action(action);

async function action(kit: string): Promise<void> {
  await unpack({ repoOrName: kit });
}

export default { name, signature, description, register, action };
