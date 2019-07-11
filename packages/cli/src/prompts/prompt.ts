import uniqBy from 'lodash.uniqby';
import flatten from 'lodash.flatten';
import isEmpty from 'lodash.isempty';
import groupBy from 'lodash.groupby';
import difference from 'lodash.difference';
import inquirer from 'inquirer';
import { contractMethodsFromAbi, ContractMethodMutability as Mutability } from '@openzeppelin/upgrades';

import Session from '../models/network/Session';
import ConfigManager from '../models/config/ConfigManager';
import ProjectFile from '../models/files/ProjectFile';
import ContractManager from '../models/local/ContractManager';
import Dependency from '../models/dependency/Dependency';
import { fromContractFullName, toContractFullName } from '../utils/naming';
import { ProxyType } from '../scripts/interfaces';
import NetworkFile, { ProxyInterface } from '../models/files/NetworkFile';

type ChoicesT = string[] | ({ [key: string]: any });

export interface InquirerQuestions {
  [key: string]: InquirerQuestion;
}

interface InquirerQuestion {
  type: string;
  message: string;
  isInquirerQuestion?: boolean;
  default?: any;
  choices?: ChoicesT;
  when?: (answers: { [key: string]: any }) => boolean;
  transformer?: (value: string, answers: { [key: string]: any }) => string;
  normalize?: (input?: any) => any;
}

interface InquirerAnswer {
  [key: string]: string | { [key: string]: any } | undefined;
}

interface PromptParam {
  [key: string]: any;
}

interface PromptParams {
  args?: PromptParam;
  opts?: PromptParam;
  defaults?: PromptParam;
  props?: InquirerQuestions;
}

interface MethodOptions {
  constant?: boolean;
}

export let DISABLE_INTERACTIVITY: boolean =
  !!process.env.ZOS_NON_INTERACTIVE || process.env.DEBIAN_FRONTEND === 'noninteractive';

/*
 * This function will parse and wrap both arguments and options into inquirer questions, where
 * the 'arguments' are the parameters sent right after the command name, e.g., * zos create Foo
 * (Foo is the argument) and the options are the parameters sent right after a flag * e.g.,
 * zos push --network local (local is the option). In addition to this, `props` is an object with some
 * inquirer questions attributes (such as question type, message and name) and `defaults` is an object with
 * default values for each args/props attributes.
 * */
export async function promptIfNeeded(
  { args = {}, opts = {}, defaults, props }: PromptParams,
  interactive,
): Promise<any> {
  const argsAndOpts = { ...args, ...opts };

  if (DISABLE_INTERACTIVITY) interactive = false;

  const argsAndOptsQuestions = Object.keys(argsAndOpts)
    .filter(
      name => argsAndOpts[name] === undefined || (typeof argsAndOpts[name] !== 'boolean' && isEmpty(argsAndOpts[name])),
    )
    .filter(name => props[name] && !hasEmptyChoices(props[name]))
    .map(name => promptFor(name, defaults, props));

  return await answersFor(argsAndOpts, argsAndOptsQuestions, props, interactive);
}

export function networksList(name: string, type: string, message?: string): { [key: string]: any } {
  message = message || 'Pick a network';
  const networks = ConfigManager.getNetworkNamesFromConfig();

  return inquirerQuestion(name, message, type, networks);
}

// Returns a list of all proxies, grouped by package
export function proxiesList(
  pickProxyBy: string,
  network: string,
  filter?: ProxyInterface,
  projectFile?: ProjectFile,
): { [key: string]: any } {
  projectFile = projectFile || new ProjectFile();
  const networkFile = new NetworkFile(projectFile, network);
  const proxies = networkFile.getProxies(filter || {});
  const groupedByPackage = groupBy(proxies, 'package');
  const list = Object.keys(groupedByPackage).map(packageName => {
    const separator = packageName === projectFile.name ? 'Your contracts' : packageName;
    const packageList = groupedByPackage[packageName].map(({ contract, address }) => {
      const name = pickProxyBy === 'byAddress' ? `${contract} at ${address}` : contract;
      const contractFullName = packageName === projectFile.name ? `${contract}` : `${packageName}/${contract}`;
      const proxyReference = pickProxyBy === 'byAddress' ? address : contractFullName;

      return {
        name,
        value: {
          address,
          contractFullName,
          proxyReference,
        },
      };
    });

    return [new inquirer.Separator(` = ${separator} =`), ...uniqBy(packageList, 'name')];
  });

  return flatten(list);
}

// Generate a list of contracts names
export function contractsList(name: string, message: string, type: string, source?: string): { [key: string]: any } {
  const localProjectFile = new ProjectFile();
  const contractManager = new ContractManager(localProjectFile);
  const contractsFromBuild = contractManager.getContractNames();
  const contractsFromLocal = Object.keys(localProjectFile.contracts)
    .map(alias => ({ name: localProjectFile.contracts[alias], alias }))
    .map(({ name: contractName, alias }) => {
      const label = contractName === alias ? alias : `${alias}[${contractName}]`;
      return { name: label, value: alias };
    });

  // get contracts from `build/contracts`
  if (!source || source === 'built') {
    return inquirerQuestion(name, message, type, contractsFromBuild);
    // get contracts from project.json file
  } else if (source === 'notAdded') {
    const contracts = difference(contractsFromBuild, contractsFromLocal.map(({ value }) => value));
    return inquirerQuestion(name, message, type, contracts);
  } else if (source === 'added') {
    return inquirerQuestion(name, message, type, contractsFromLocal);
    // generate a list of built contracts and package contracts
  } else if (source === 'all') {
    const packageContracts = Object.keys(localProjectFile.dependencies).map(dependencyName => {
      const contractNames = new Dependency(dependencyName).projectFile.contractAliases.map(
        contractName => `${dependencyName}/${contractName}`,
      );

      if (contractNames.length > 0) {
        contractNames.unshift(new inquirer.Separator(` = ${dependencyName} =`));
      }
      return contractNames;
    });
    if (contractsFromBuild.length > 0) contractsFromBuild.unshift(new inquirer.Separator(` = Your contracts =`));

    return inquirerQuestion(name, message, type, [...contractsFromBuild, ...flatten(packageContracts)]);
  } else return [];
}

// Generate a list of methods names for a particular contract
export function methodsList(
  contractFullName: string,
  constant?: Mutability,
  projectFile?: ProjectFile,
): { [key: string]: any } {
  return contractMethods(contractFullName, constant, projectFile)
    .map(({ name, hasInitializer, inputs, selector }) => {
      const initializable = hasInitializer ? '* ' : '';
      const args = inputs.map(({ name: inputName, type }) => `${inputName}: ${type}`);
      const label = `${initializable}${name}(${args.join(', ')})`;

      return { name: label, value: { name, selector } };
    })
    .sort((a, b) => {
      if (a.name.startsWith('*') && !b.name.startsWith('*')) return -1;
      else if (
        (a.name.startsWith('*') && b.name.startsWith('*')) ||
        (!a.name.startsWith('*') && !b.name.startsWith('*'))
      )
        return 0;
      else if (!a.name.startsWith('*') && b.name.startsWith('*')) return 1;
    });
}

// Returns an inquirer question with a list of arguments for a particular method
export function argsList(
  contractFullName: string,
  methodIdentifier: string,
  constant?: Mutability,
  projectFile?: ProjectFile,
): { name: string; type: string }[] {
  const method = contractMethods(contractFullName, constant, projectFile).find(
    ({ name, selector }): any => selector === methodIdentifier || name === methodIdentifier,
  );
  return method ? method.inputs : [];
}

function contractMethods(
  contractFullName: string,
  constant: Mutability = Mutability.NotConstant,
  projectFile: ProjectFile,
): any[] {
  const { contract: contractAlias, package: packageName } = fromContractFullName(contractFullName);
  const contractManager = new ContractManager(projectFile);
  if (!contractManager.hasContract(packageName, contractAlias)) return [];
  const contract = contractManager.getContractClass(packageName, contractAlias);

  return contractMethodsFromAbi(contract, constant);
}

export function proxyInfo(contractInfo: any, network: string): any {
  const { contractAlias, proxyAddress, packageName } = contractInfo;
  const projectFile = new ProjectFile();
  const networkFile = new NetworkFile(projectFile, network);
  const proxyParams = {
    contract: contractAlias,
    address: proxyAddress,
    package: packageName,
  };

  if (!proxyAddress && !contractAlias) {
    return { proxyReference: undefined, contractFullName: undefined };
  } else if (!networkFile.hasProxies(proxyParams)) {
    const contractFullName = toContractFullName(packageName, contractAlias);
    return {
      proxyReference: proxyAddress || contractFullName,
      contractFullName,
    };
  } else {
    const proxies = networkFile.getProxies(proxyParams);
    const proxy = proxies[0] || {};
    const contractFullName = toContractFullName(proxy.package, proxy.contract);

    return {
      contractFullName,
      address: proxy.address,
      proxyReference: proxyAddress || contractFullName,
    };
  }
}

export async function promptForNetwork(options: any, getCommandProps: () => any): Promise<{ network: string }> {
  const { network: networkInOpts, interactive } = options;
  const { network: networkInSession, expired } = Session.getNetwork();
  const defaults = { network: networkInSession };
  const opts = {
    network: networkInOpts || (!expired ? networkInSession : undefined),
  };
  const props = getCommandProps();

  return promptIfNeeded({ opts, defaults, props }, interactive);
}

async function answersFor(
  inputs: PromptParam,
  questions: any,
  props: InquirerQuestions,
  interactive: boolean,
): Promise<InquirerAnswer> {
  const merged = interactive ? { ...inputs, ...(await inquirer.prompt(questions)) } : inputs;
  Object.keys(merged).forEach(propName => {
    if (props[propName] && props[propName].normalize) merged[propName] = props[propName].normalize(merged[propName]);
  });

  return merged;
}

function inquirerQuestion(name: string, message: string, type: string, choices?: ChoicesT): InquirerQuestions {
  return { [name]: { type, message, choices } };
}

function promptFor(name: string, defaults: {}, props: {}): InquirerQuestion {
  const defaultValue = defaults ? defaults[name] : undefined;
  return {
    isInquirerQuestion: true,
    name,
    ...props[name],
    default: defaultValue || props[name].default,
  };
}

function hasEmptyChoices({ choices }: { choices?: ChoicesT }): boolean {
  return choices && isEmpty(choices) && typeof choices !== 'function';
}
