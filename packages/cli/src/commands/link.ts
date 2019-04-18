import init from './init';
import push from './push';
import link from '../scripts/link';
import { promptIfNeeded } from '../utils/prompt';
import Dependency from '../models/dependency/Dependency';

const name: string = 'link';
const signature: string = `${name} [dependencies...]`;
const description: string = 'links project with a list of dependencies each located in its npm package';

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[dependencyName1 ... dependencyNameN] [options]')
  .description(description)
  .option('--no-install', 'skip installing packages dependencies locally')
  .withPushOptions()
  .withNonInteractiveOption()
  .action(action);

async function action(dependencies: string[], options: any): Promise<void> {
  const { install, interactive } = options;
  const installDependencies = install && interactive ? undefined : install;

  await init.runActionIfNeeded(options);

  const defaults = { dependencies: [await Dependency.fetchVersionFromNpm('openzeppelin-eth')] };
  const args = { dependencies };
  const opts = { installDependencies };
  const props = setCommandProps();
  const promptedArgs = await promptIfNeeded({ args, opts, props, defaults }, interactive);

  if (promptedArgs.dependencies && typeof promptedArgs.dependencies === 'string') {
    promptedArgs.dependencies = [promptedArgs.dependencies];
  }

  await link(promptedArgs);
  await push.tryAction(options);
}

function setCommandProps() {
  return {
    dependencies: {
      type: 'input',
      message: 'Provide an EVM-package name and version',
    },
    installDependencies: {
      type: 'confirm',
      message: 'Do you want to install the dependency?',
      default: true
    }
  };
}


export default { name, signature, description, register, action };
