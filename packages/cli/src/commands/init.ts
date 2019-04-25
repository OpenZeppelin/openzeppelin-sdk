import push from './push';
import init from '../scripts/init';
import { promptIfNeeded, InquirerQuestions } from '../prompts/prompt';
import { FileSystem } from 'zos-lib';
import ZosPackageFile from '../models/files/ZosPackageFile';

const name: string = 'init';
const signature: string = `${name} [project-name] [version]`;
const description: string = `initialize your ZeppelinOS project. Provide a <project-name> and optionally an initial [version] name`;

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('<project-name> [version]')
  .description(description)
  .option('--publish', 'automatically publishes your project upon pushing it to a network')
  .option('--force', 'overwrite existing project if there is one')
  .option('--link <dependency>', 'link to a dependency')
  .option('--no-install', 'skip installing packages dependencies locally')
  .withPushOptions()
  .withNonInteractiveOption()
  .action(action);

async function action(projectName: string, version: string, options: any): Promise<void> {
  const { publish, force, link, install: installDependencies, interactive } = options;

  const args = { name: projectName, version };
  const props = getCommandProps();
  const defaults = FileSystem.parseJsonIfExists('package.json') || {};
  const prompted = await promptIfNeeded({ args, defaults, props }, interactive);

  const dependencies = link ? link.split(',') : [];
  const flags = { dependencies, installDependencies, force, publish };

  await init({ ...prompted, ...flags });
  await push.runActionIfRequested(options);
}

async function runActionIfNeeded(options: any): Promise<void> {
  const { interactive } = options;
  const packageFile = new ZosPackageFile();

  if (interactive && !packageFile.exists()) {
    await action(undefined, undefined, { dontExitProcess: true });
  }
}

function getCommandProps(): InquirerQuestions {
  return {
    name: {
      message: 'Welcome to ZeppelinOS! Choose a name for your project:',
      type: 'input'
    },
    version: {
      message: 'Choose a version:',
      type: 'input',
    }
  };
}

export default { name, signature, description, register, action, runActionIfNeeded };
