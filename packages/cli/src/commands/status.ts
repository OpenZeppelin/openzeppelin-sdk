const name = 'status';
const signature: string = name;
const description = 'print information about the local status of your app in a specific network';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .description(description)
    .usage('--network <network>')
    .option('--fetch', 'retrieve app information directly from the network instead of from the local network file')
    .option('--fix', 'update local network file with information retrieved from the network')
    .withNetworkOptions()
    .action(action);

async function action(options: any): Promise<void> {
  throw Error('Status command has been removed.');
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

export default { name, signature, description, register, action };
