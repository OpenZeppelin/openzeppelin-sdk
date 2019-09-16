import push from './push';
import link from '../scripts/link';
import Dependency from '../models/dependency/Dependency';
import ProjectFile from '../models/files/ProjectFile';
import { promptIfNeeded, InquirerQuestions } from '../prompts/prompt';
import { fromContractFullName } from '../utils/naming';
import { report } from '../telemetry';

const name = 'link';
const signature = `${name} [dependencies...]`;
const description = 'links project with a list of dependencies each located in its npm package';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .usage('[dependencyName1 ... dependencyNameN] [options]')
    .description(description)
    .option('--no-install', 'skip installing packages dependencies locally')
    .withPushOptions()
    .withNonInteractiveOption()
    .action(action);

async function action(dependencies: string[], options: any): Promise<void> {
  const { install, forceInstall, interactive } = options;
  const installDependencies = install || forceInstall;
  const args = { dependencies };
  const props = getCommandProps();
  const defaults = {
    dependencies: [await Dependency.fetchVersionFromNpm('@openzeppelin/contracts-ethereum-package')],
  };
  const prompted = await promptIfNeeded({ args, props, defaults }, interactive);
  const linkArguments = { ...prompted, installDependencies };

  if (!options.skipTelemetry) await report('push', linkArguments, interactive);
  await link(linkArguments);
  await push.runActionIfRequested(options);
}

async function runActionIfNeeded(contractFullName: string, options: any): Promise<void> {
  const { interactive } = options;
  const projectFile = new ProjectFile();
  const { contract: contractAlias, package: packageName } = fromContractFullName(contractFullName);
  if (interactive && packageName && !projectFile.hasDependency(packageName)) {
    await action([packageName], { ...options, forceInstall: true, skipTelemetry: true });
  }
}

function getCommandProps(): InquirerQuestions {
  return {
    dependencies: {
      type: 'input',
      message: 'Provide an Ethereum Package name and version',
      normalize: input => (typeof input === 'string' ? [input] : input),
    },
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
