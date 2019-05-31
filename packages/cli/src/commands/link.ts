import push from './push';
import link from '../scripts/link';
import Dependency from '../models/dependency/Dependency';
import ZosPackageFile from '../models/files/ZosPackageFile';
import { promptIfNeeded, InquirerQuestions } from '../prompts/prompt';
import { fromContractFullName } from '../utils/naming';

const name = 'link';
const signature = `${name} [dependencies...]`;
const description =
  'links project with a list of dependencies each located in its npm package';

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
    dependencies: [await Dependency.fetchVersionFromNpm('openzeppelin-eth')],
  };
  const prompted = await promptIfNeeded({ args, props, defaults }, interactive);

  await link({ ...prompted, installDependencies });
  await push.runActionIfRequested(options);
}

async function runActionIfNeeded(
  contractFullName: string,
  options: any,
): Promise<void> {
  const { interactive } = options;
  const packageFile = new ZosPackageFile();
  const {
    contract: contractAlias,
    package: packageName,
  } = fromContractFullName(contractFullName);
  if (interactive && packageName && !packageFile.hasDependency(packageName)) {
    await action([packageName], { ...options, forceInstall: true });
  }
}

function getCommandProps(): InquirerQuestions {
  return {
    dependencies: {
      type: 'input',
      message: 'Provide an EVM-package name and version',
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
