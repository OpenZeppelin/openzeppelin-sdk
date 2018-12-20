import { Command } from 'commander';

import push from './push';
import add from '../scripts/add';
import addAll from '../scripts/add-all';
import Compiler from '../models/compiler/Compiler';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';

const name: string = 'add';
const signature: string = `${name} [contractNames...]`;
const description: string = 'add contract to your project. Provide a list of whitespace-separated contract names';

const register: (program: Command) => Command = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[contractName1[:contractAlias1] ... contractNameN[:contractAliasN]] [options]')
  .description(description)
  .option('--all', 'add all contracts in your build directory')
  .withPushOptions()
  .action(action);

async function action(contractNames: string[], options: Command): Promise<void> {
  ConfigVariablesInitializer.initStaticConfiguration();
  if(!options.skipCompile) await Compiler.call();
  if(options.all) addAll({});
  else {
    const contractsData = contractNames.map((rawData) => {
      const [ name, alias ] = rawData.split(':');
      return { name, alias: (alias || name) };
    });
    add({ contractsData });
  }
  await push.tryAction(options);
}

export default { name, signature, description, register, action };
