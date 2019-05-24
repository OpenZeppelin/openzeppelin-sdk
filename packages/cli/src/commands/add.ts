import push from './push';
import add from '../scripts/add';
import addAll from '../scripts/add-all';
import Truffle from '../models/initializer/truffle/Truffle';
import Compiler from '../models/compiler/Compiler';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import { promptIfNeeded, contractsList, InquirerQuestions } from '../prompts/prompt';
import { fromContractFullName } from '../utils/naming';
import ZosPackageFile from '../models/files/ZosPackageFile';

const name: string = 'add';
const signature: string = `${name} [contractNames...]`;
const description: string = 'add contract to your project. Provide a list of whitespace-separated contract names';

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[contractName1[:contractAlias1] ... contractNameN[:contractAliasN]] [options]')
  .description(description)
  .option('--all', 'add all contracts in your build directory')
  .withPushOptions()
  .withNonInteractiveOption()
  .action(action);

async function action(contractNames: string[], options: any): Promise<void> {
  const { skipCompile, all, interactive } = options;
  ConfigVariablesInitializer.initStaticConfiguration();

  if(!skipCompile) await Compiler.call();

  if(all) addAll({});
  else {
    const args = { contractNames };
    const props = getCommandProps();
    const prompted = await promptIfNeeded({ args, props }, interactive);
    const contractsData = contractNames.length !== 0
      ? contractNames.map(splitContractName)
      : prompted.contractNames.map((contractName) => ({ name: contractName }));

    add({ contractsData });
  }
  await push.runActionIfRequested(options);
}

async function runActionIfNeeded(contractName?: string, options?: any): Promise<void> {
  const { interactive } = options;
  const { contract: contractAlias, package: packageName } = fromContractFullName(contractName);
  const packageFile = new ZosPackageFile();

  if (interactive) {
    if (!packageName && contractAlias && !packageFile.hasContract(contractAlias)) {
      await action([contractAlias], options);
    } else if (!packageName && !packageFile.hasContracts()) {
      await action([], options);
    }
  }
}

function getCommandProps(): InquirerQuestions {
  return contractsList('contractNames', 'Choose one or more contracts', 'checkbox', 'notAdded');
}

function splitContractName(rawData: string): { name: string, alias: string } {
  const [contractName, alias] = rawData.split(':');
  return { name: contractName, alias };
}

export default { name, signature, description, register, action, runActionIfNeeded };
