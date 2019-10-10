import push from './push';
import bump from '../scripts/bump';
import Telemetry from '../telemetry';

const name = 'bump';
const signature = `${name} <version>`;
const description = 'bump your project to a new <version>';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .usage('<version> [options]')
    .description(description)
    .withPushOptions()
    .action(action);

async function action(version: string, options: any): Promise<void> {
  await Telemetry.report('bump', { version }, options.interactive);
  await bump({ version });
  await push.runActionIfRequested(options);
}

export default { name, signature, description, register, action };
