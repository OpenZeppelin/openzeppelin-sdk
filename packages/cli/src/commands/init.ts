import fs from 'fs-extra';
import push from './push';
import init from '../scripts/init';
import semver from 'semver';
import { promptIfNeeded, InquirerQuestions } from '../prompts/prompt';
import ProjectFile from '../models/files/ProjectFile';
import { notEmpty } from '../prompts/validators';
import Telemetry from '../telemetry';
import { TypechainQuestions } from '../prompts/typechain';

const name = 'init';
const signature = `${name} [project-name] [version]`;
const description = `initialize your OpenZeppelin project. Provide a <project-name> and optionally an initial [version] name`;

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .usage('<project-name> [version]')
    .description(description)
    .option('--publish', 'automatically publish your project upon pushing it to a network')
    .option('--force', 'overwrite existing project if there is one')
    .option('--typechain <target>', 'enable typechain support with specified target (web3-v1, ethers, or truffle)')
    .option('--typechain-outdir <path>', 'set output directory for typechain compilation (defaults to types/contracts)')
    .option('--link <dependency>', 'link to a dependency')
    .option('--no-install', 'skip installing packages dependencies locally')
    .withPushOptions()
    .withNonInteractiveOption()
    .action(action);

async function action(projectName: string, version: string, options: any): Promise<void> {
  const { publish, force, link, install: installDependencies, interactive, typechainOutdir, typechain } = options;

  const args = {
    name: projectName,
    version,
    typechainEnabled: typechain ? true : typechain, // keep undefined and false values separate, since undefined means that the user hasn't chosen, and false means they don't want to use it
    typechainTarget: typechain,
    typechainOutdir,
  };
  const props = getCommandProps();
  const defaults = fs.readJsonSync('package.json', { throws: false }) || { version: '1.0.0' };
  const prompted = await promptIfNeeded({ args, defaults, props }, interactive);

  const dependencies = link ? link.split(',') : [];
  const flags = { dependencies, installDependencies, force, publish };
  const initArguments = { ...prompted, ...flags };

  await Telemetry.report('init', initArguments, interactive);
  await init(initArguments);
  await push.runActionIfRequested({ ...options });
}

async function runActionIfNeeded(options: any): Promise<void> {
  const { interactive } = options;
  const projectFile = new ProjectFile();

  if (interactive && !projectFile.exists()) {
    await action(undefined, undefined, { dontExitProcess: true });
  }
}

function getCommandProps(): InquirerQuestions {
  return {
    name: {
      message: 'Welcome to the OpenZeppelin SDK! Choose a name for your project',
      type: 'input',
      validate: notEmpty,
    },
    version: {
      message: 'Initial project version',
      type: 'input',
      validate: input => {
        if (semver.parse(input)) return true;
        return `Invalid semantic version: ${input}`;
      },
    },
    ...TypechainQuestions,
  };
}

export default {
  name,
  signature,
  description,
  register,
  action,
  runActionIfNeeded,
};
