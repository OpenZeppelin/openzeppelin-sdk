import remove from '../scripts/remove';
import push from './push';
import { promptIfNeeded, contractsList } from '../utils/prompt';

const name: string = 'remove';
const signature: string = `${name} [contracts...]`;
const description: string = 'removes one or more contracts from your project. Provide a list of whitespace-separated contract names.';

const argsProps = () => {
  return contractsList('contractNames', 'Choose one or more contracts', 'checkbox', 'fromLocal');
};

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .alias('rm')
  .usage('[contract1 ... contractN] [options]')
  .description(description)
  .withPushOptions()
  .action(action);

async function action(contractNames: string[], options: any): Promise<void> {
  const promptedArgs = await promptIfNeeded({ args: { contractNames }, props: argsProps() });
  remove(promptedArgs);
  await push.tryAction(options);
}

export default { name, signature, description, register, action };
