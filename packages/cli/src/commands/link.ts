import push from './push';
import link from '../scripts/link';
import { promptIfNeeded } from '../utils/prompt';

const name: string = 'link';
const signature: string = `${name} [dependencies...]`;
const description: string = 'links project with a list of dependencies each located in its npm package';

const props = {
  dependencies: {
    type: 'input',
    message: 'Provide an EVM-package name and version',
    default: ['openzeppelin-eth']
  },
  installDependencies: {
    type: 'confirm',
    message: 'Do you want to install the dependency?',
    default: true
  }
};

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[dependencyName1 ... dependencyNameN] [options]')
  .description(description)
  .option('--no-install', 'skip installing packages dependencies locally')
  .withPushOptions()
  .action(action);

async function action(dependencies: string[], options: any): Promise<void> {
  const { install: installDependencies, interactive } = options;
  const promptedArgs = await promptIfNeeded({ args: { dependencies, installDependencies }, props }, interactive);
  if (promptedArgs.dependencies && typeof promptedArgs.dependencies === 'string') {
    promptedArgs.dependencies = [promptedArgs.dependencies];
  }

  await link(promptedArgs);
  await push.tryAction(options);
}

export default { name, signature, description, register, action };
