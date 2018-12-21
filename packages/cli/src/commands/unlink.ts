import unlink from '../scripts/unlink';
import push from './push';

const name: string = 'unlink';
const signature: string = `${name} [dependencies...]`;
const description: string = 'unlinks dependencies from the project. Provide a list of whitespace-separated dependency names';

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[dependencyName1... dependencyNameN]')
  .description(description)
  .withPushOptions()
  .action(action);

async function action(dependencies: string[], options: any): Promise<void> {
  await unlink({ dependencies });
  await push.tryAction(options);
}

export default { name, signature, description, register, action };
