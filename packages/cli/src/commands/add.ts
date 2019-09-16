import push from './push';
import add from '../scripts/add';
import addAll from '../scripts/add-all';
import ConfigManager from '../models/config/ConfigManager';
import { compile } from '../models/compiler/Compiler';
import { promptIfNeeded, contractsList, InquirerQuestions } from '../prompts/prompt';
import { fromContractFullName } from '../utils/naming';
import ProjectFile from '../models/files/ProjectFile';
import Telemetry from '../telemetry';

const name = 'add';
const signature = `${name} [contractNames...]`;
const description = 'add contract to your project. Provide a list of whitespace-separated contract names';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .usage('[contractName1[:contractAlias1] ... contractNameN[:contractAliasN]] [options]')
    .description(description)
    .option('--all', 'add all contracts in your build directory')
    .withPushOptions()
    .withNonInteractiveOption()
    .action(action);

async function action(contractNames: string[], options: any): Promise<void> {
  const { skipCompile, all, interactive } = options;
  ConfigManager.initStaticConfiguration();

  if (!skipCompile) await compile();

  if (all) addAll({});
  else {
    const args = { contractNames };
    const props = getCommandProps();
    const prompted = await promptIfNeeded({ args, props }, interactive);
    const contractsData =
      contractNames.length !== 0
        ? contractNames.map(splitContractName)
        : prompted.contractNames.map(contractName => ({ name: contractName }));

    if (!options.skipTelemetry) await Telemetry.report('add', { contractsData }, interactive);
    add({ contractsData });
  }
  await push.runActionIfRequested(options);
}

async function runActionIfNeeded(contractName?: string, options?: any): Promise<void> {
  const { interactive } = options;
  const { contract: contractAlias, package: packageName } = fromContractFullName(contractName);
  const projectFile = new ProjectFile();
  options = { ...options, skipTelemetry: true };

  if (interactive) {
    if (!packageName && contractAlias && !projectFile.hasContract(contractAlias)) {
      await action([contractAlias], options);
    } else if (!packageName && !projectFile.hasContracts()) {
      await action([], options);
    }
  }
}

function getCommandProps(): InquirerQuestions {
  return contractsList('contractNames', 'Pick which contracts you want to add', 'checkbox', 'notAdded');
}

function splitContractName(rawData: string): { name: string; alias: string } {
  const [contractName, alias] = rawData.split(':');
  return { name: contractName, alias };
}

export default {
  name,
  signature,
  description,
  register,
  action,
  runActionIfNeeded,
};
