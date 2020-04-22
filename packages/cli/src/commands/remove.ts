import remove from '../scripts/remove';
import push from './push';
import { promptIfNeeded, contractsList, InquirerQuestions } from '../prompts/prompt';
import Telemetry from '../telemetry';
import ProjectFile from '../models/files/ProjectFile';

const name = 'remove';
const signature = `${name} [contracts...]`;
const description =
  'removes one or more contracts from your project. Provide a list of whitespace-separated contract names.';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .alias('rm')
    .usage('[contract1 ... contractN] [options]')
    .description(description)
    .withPushOptions()
    .withNonInteractiveOption()
    .action(action);

async function action(contracts: string[], options: any): Promise<void> {
  const { interactive } = options;
  const args = { contracts };
  const props = getCommandProps();
  const prompted = await promptIfNeeded({ args, props }, interactive);

  await Telemetry.report('remove', prompted, interactive);
  remove(prompted);
  await push.runActionIfRequested({ ...options });
}

function getCommandProps(): InquirerQuestions {
  return contractsList('contracts', 'Choose one or more contracts', 'checkbox', 'added');
}

export default { name, signature, description, register, action };
