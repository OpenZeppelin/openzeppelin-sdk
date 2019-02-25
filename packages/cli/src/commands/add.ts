import push from './push';
import add from '../scripts/add';
import addAll from '../scripts/add-all';
import Truffle from '../models/initializer/truffle/Truffle';
import Compiler from '../models/compiler/Compiler';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import { promptForArgumentsIfNeeded, getContractsList } from '../utils/prompt';

const name: string = 'add';
const signature: string = `${name} [contractNames...]`;
const description: string = 'add contract to your project. Provide a list of whitespace-separated contract names';

const argsProps = () => {
  return getContractsList('Choose one or more contracts', 'checkbox');
};

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[contractName1[:contractAlias1] ... contractNameN[:contractAliasN]] [options]')
  .description(description)
  .option('--all', 'add all contracts in your build directory')
  .withPushOptions()
  .action(action);

async function action(contractNames: string[], options: any): Promise<void> {
  ConfigVariablesInitializer.initStaticConfiguration();
  if(!options.skipCompile) await Compiler.call();
  if(options.all) addAll({});
  else {
    const promptedArgs = await promptForArgumentsIfNeeded({ args: { contractNames }, props: argsProps() });
    const contractsData = contractNames.length !== 0
      ? contractNames.map(splitContractName)
      : promptedArgs.contractNames.map((contractName) => ({ name: contractName }));

    add({ contractsData });
  }
  await push.tryAction(options);
}

const splitContractName = (rawData) => {
  const [contractName, alias] = rawData.split(':');
  return { name: contractName, alias };
};

export default { name, signature, description, register, action };
