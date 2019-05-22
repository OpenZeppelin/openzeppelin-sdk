import Compiler from '../models/compiler/Compiler';

const name: string = 'compile';
const signature: string = `${name}`;
const description: string = `compiles all contracts in the current project`;

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .description(description)
  .action(action);

async function action(): Promise<void> {
  await Compiler.call(false);
}

export default { name, signature, description, register, action };
