import unpack from '../scripts/unpack';

const name: string = 'unpack';
const signature: string = `${name} [kit]`;
const description: string = `download and install a ZeppelinOS kit to the current directory`;

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[kit]')
  .description(description)
  .action(action);

async function action(kit: string): Promise<void> {
  await unpack({ repoOrName: kit });
}

export default { name, signature, description, register, action };
