import push from './push';
import init from '../scripts/init';
import { promptForArgumentsIfNeeded } from '../utils/prompt';
import { FileSystem } from 'zos-lib';

const name: string = 'init';
const signature: string = `${name} [project-name] [version]`;
const description: string = `initialize your ZeppelinOS project. Provide a <project-name> and optionally an initial [version] name`;
const argsProps = {
  name: {
    message: 'Welcome to ZeppelinOS! Choose a name for your project:',
    type: 'input'
  },
  version: {
    message: 'Choose a version:',
    type: 'input',
  }
};

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('<project-name> [version]')
  .description(description)
  .option('--publish', 'automatically publishes your project upon pushing it to a network')
  .option('--force', 'overwrite existing project if there is one')
  .option('--link <dependency>', 'link to a dependency')
  .option('--no-install', 'skip installing packages dependencies locally')
  .withPushOptions()
  .action(action);

async function action(projectName: string, version: string, options: any): Promise<void> {
  const { publish, force, link, install: installDependencies } = options;

  const defaultArgs = FileSystem.parseJsonIfExists('package.json') || {};
  const passedArgs = { name: projectName, version };
  const args = await promptForArgumentsIfNeeded({ args: passedArgs, defaults: defaultArgs, props: argsProps });

  const dependencies = link ? link.split(',') : [];
  const flags = { dependencies, installDependencies, force, publish };

  await init({ ...args, ...flags });
  await push.tryAction(options);
}

export default { name, signature, description, register, action };
