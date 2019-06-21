import unlink from '../scripts/unlink';
import push from './push';
import { promptIfNeeded, InquirerQuestions } from '../prompts/prompt';
import ProjectFile from '../models/files/ProjectFile';

const name = 'unlink';
const signature = `${name} [dependencies...]`;
const description =
  'unlinks dependencies from the project. Provide a list of whitespace-separated dependency names';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .usage('[dependencyName1... dependencyNameN]')
    .description(description)
    .withPushOptions()
    .withNonInteractiveOption()
    .action(action);

async function action(dependencies: string[], options: any): Promise<void> {
  const { interactive } = options;
  const installedDependencies = ProjectFile.getLinkedDependencies();
  const args = { dependencies };
  const props = getCommandProps(installedDependencies);
  const prompted = await promptIfNeeded({ args, props }, interactive);

  await unlink(prompted);
  await push.runActionIfRequested(options);
}

function getCommandProps(depNames: string[]): InquirerQuestions {
  return {
    dependencies: {
      message: 'Select the dependencies you want to unlink',
      type: 'checkbox',
      choices: depNames,
    },
  };
}

export default { name, signature, description, register, action };
