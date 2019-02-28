import unlink from '../scripts/unlink';
import push from './push';
import { promptIfNeeded } from '../utils/prompt';
import ZosPackageFile from '../models/files/ZosPackageFile';

const name: string = 'unlink';
const signature: string = `${name} [dependencies...]`;
const description: string = 'unlinks dependencies from the project. Provide a list of whitespace-separated dependency names';
const props = (depNames) => {
  return {
    dependencies: {
      message: 'Select the dependencies you want to unlink',
      type: 'checkbox',
      choices: depNames
    }
  };
};

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[dependencyName1... dependencyNameN]')
  .description(description)
  .withPushOptions()
  .action(action);

async function action(dependencies: string[], options: any): Promise<void> {
  const installedDependencies = ZosPackageFile.getLinkedDependencies();
  const promptedArgs = await promptIfNeeded({ args: { dependencies }, props: props(installedDependencies) });

  await unlink(promptedArgs);
  await push.tryAction(options);
}

export default { name, signature, description, register, action };
