import push from './push';
import link from '../scripts/link';

const name: string = 'link';
const signature: string = `${name} [dependencies...]`;
const description: string = 'links project with a list of dependencies each located in its npm package';

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[dependencyName1 ... dependencyNameN] [options]')
  .description(description)
  .option('--no-install', 'skip installing packages dependencies locally')
  .withPushOptions()
  .action(action);

async function action(dependencies: string[], options: any): Promise<void> {
  const installDependencies = options.install;
  await link({ dependencies, installDependencies });
  await push.tryAction(options);
}

export default { name, signature, description, register, action };
