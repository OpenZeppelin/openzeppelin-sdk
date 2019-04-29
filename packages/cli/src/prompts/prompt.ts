import uniqBy from 'lodash.uniqby';
import flatten from 'lodash.flatten';
import isEmpty from 'lodash.isempty';
import groupBy from 'lodash.groupby';
import inquirer from 'inquirer';
import { contractMethodsFromAst } from 'zos-lib';

import Truffle from '../models/initializer/truffle/Truffle';
import ZosPackageFile from '../models/files/ZosPackageFile';
import LocalController from '../models/local/LocalController';
import Dependency from '../models/dependency/Dependency';
import { fromContractFullName, toContractFullName } from '../utils/naming';

type ChoicesT = string[] | ({ [key: string]: any });

export interface InquirerQuestions  {
  [key: string]: InquirerQuestion;
}

interface InquirerQuestion {
  type: string;
  message: string;
  isInquirerQuestion?: boolean;
  default?: any;
  choices?: ChoicesT;
  when?: ((answers: { [key: string]: any }) => boolean);
  transformer?: ((value: string, answers: { [key: string]: any }) => string);
  normalize?: ((input?: any) => any);
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

export let DEFAULT_INTERACTIVE_STATUS = true;

/*
 * This function will parse and wrap both arguments and options into inquirer questions, where
 * the 'arguments' are the parameters sent right after the command name, e.g., * zos create Foo
 * (Foo is the argument) and the optionn are the parameters sent right after a flag * e.g.,
 * zos push --network local (local is the option). In addition to this, `props` is an object with some
 * inquirer questions attributes (such as question type, message and name) and `defaults` is an object with
 * default values for each args/props attributes.
 * */
export async function promptIfNeeded({ args = {}, opts = {}, defaults, props }: PromptParams, interactive = DEFAULT_INTERACTIVE_STATUS): Promise<any> {
  const argsAndOpts  = { ...args, ...opts };

  const argsAndOptsQuestions = Object.keys(argsAndOpts)
    .filter(name =>argsAndOpts[name] === undefined || (typeof argsAndOpts[name] !== 'boolean' && isEmpty(argsAndOpts[name])))
    .filter(name => props[name] && !hasEmptyChoices(props[name]))
    .map(name => promptFor(name, defaults, props));

  return await answersFor(argsAndOpts, argsAndOptsQuestions, props, interactive);
}

export function networksList(name: string, type: string, message?: string): { [key: string]: any } {
  message = message || 'Select a network from the network list';
  const networks = Truffle.getNetworkNamesFromConfig();

  return inquirerQuestion(name, message, type, networks);
}

// Returns a list of all proxies, grouped by package
export function proxiesList(pickProxyBy: string, network: string, packageFile?: ZosPackageFile): { [key: string]: any } {
  packageFile = packageFile || new ZosPackageFile();
  const networkFile = packageFile.networkFile(network);
  const proxies = networkFile.getProxies();
  const groupedByPackage = groupBy(proxies, 'package');
  const list = Object.keys(groupedByPackage)
    .map(packageName => {
      const separator = packageName === packageFile.name ? 'Local contracts' : packageName;
      const packageList = groupedByPackage[packageName]
        .map(({ contract, address }) => {
          const name = pickProxyBy === 'byAddress' ? `${contract} at ${address}` : contract;
          const contractFullName = packageName === packageFile.name ? `${contract}` : `${packageName}/${contract}`;
          const proxyReference = pickProxyBy === 'byAddress' ? address : contractFullName;

          return {
            name,
            value: {
              address,
              contractFullName,
              proxyReference
            },
          };
        });

      return [new inquirer.Separator(` = ${separator} =`), ...uniqBy(packageList, 'name')];
    });

  return flatten(list);
}

// Generate a list of contracts names
export function contractsList(name: string, message: string, type: string, source?: string): { [key: string]: any } {
  const localPackageFile = new ZosPackageFile();
  const contractsFromBuild = Truffle.getContractNames();

  // get contracts from `build/contracts`
  if (!source || source === 'fromBuildDir') {
    return inquirerQuestion(name, message, type, contractsFromBuild);
  // get contracts from zos.json file
  } else if(source === 'fromLocal') {
    const contractsFromLocal = Object
      .keys(localPackageFile.contracts)
      .map(alias => ({ name: this.contracts[alias], alias }))
      .map(({ name: contractName, alias }) => {
        const label = contractName === alias ? alias : `${alias}[${contractName}]`;
        return { name: label, value: alias };
      });

    return inquirerQuestion(name, message, type, contractsFromLocal);
  // generate a list of built contracts and package contracts
  } else if (source === 'all') {
    const packageContracts = Object
      .keys(localPackageFile.dependencies)
      .map(dependencyName => {
        const contractNames = new Dependency(dependencyName)
          .getPackageFile()
          .contractAliases
          .map(contractName => `${dependencyName}/${contractName}`);

        if (contractNames.length > 0) {
          contractNames.unshift(new inquirer.Separator(` = ${dependencyName} =`));
        }
        return contractNames;
      });
    if (contractsFromBuild.length > 0) contractsFromBuild.unshift(new inquirer.Separator(` = Local contracts =`));

    return inquirerQuestion(name, message, type, [...contractsFromBuild, ...flatten(packageContracts)]);
  } else return [];
}

// Generate a list of methods names for a particular contract
export function methodsList(contractFullName: string, packageFile?: ZosPackageFile): { [key: string]: any } {
  return contractMethods(contractFullName, packageFile)
    .map(({ name, hasInitializer, inputs, selector }) => {
      const initializable = hasInitializer ? `[Initializable] ` : '';
      const args = inputs.map(({ name: inputName, type }) => `${inputName}: ${type}`);
      const label = `${initializable}${name}(${args.join(', ')})`;

      return { name: label, value: { name, selector } };
    });
}

// Returns an inquirer question with a list of arguments for a particular method
export function argsList(contractFullName: string, methodIdentifier: string, packageFile?: ZosPackageFile): string[] {
  const method = contractMethods(contractFullName, packageFile)
    .find(({ name, selector }) => selector === methodIdentifier || name === methodIdentifier);
  if (method) {
    return method
      .inputs
      .map(({ name: inputName }) => inputName);
  } else return [];
}

function contractMethods(contractFullName: string, packageFile: ZosPackageFile): any[] {
  const { contract: contractAlias, package: packageName } = fromContractFullName(contractFullName);
  const localController = new LocalController(packageFile);
  if (!localController.hasContract(packageName, contractAlias)) return [];
  const contract = localController.getContractClass(packageName, contractAlias);

  return contractMethodsFromAst(contract);
}

export function proxyInfo(contractInfo: any, network: string): any {
  const { contractAlias, proxyAddress, packageName } = contractInfo;
  const packageFile = new ZosPackageFile();
  const networkFile = packageFile.networkFile(network);
  const proxyParams = {
    contract: contractAlias,
    address: proxyAddress,
    package: packageName
  };

  if (!proxyAddress && !contractAlias) {
    return { proxyReference: undefined, contractFullName: undefined };
  } else if  (!networkFile.hasProxies(proxyParams)) {
    const contractFullName = toContractFullName(packageName, contractAlias);
    return { proxyReference: proxyAddress || contractFullName, contractFullName };
  } else {
    const proxies = networkFile.getProxies(proxyParams);
    const proxy = proxies[0] || {};
    const contractFullName = toContractFullName(proxy.package, proxy.contract);

    return {
      contractFullName,
      address: proxy.address,
      proxyReference: proxyAddress || contractFullName
    };
  }
}

async function answersFor(inputs: PromptParam, questions: any, props: InquirerQuestions, interactive: boolean): Promise<InquirerAnswer> {
  const merged = interactive ? { ...inputs, ...await inquirer.prompt(questions) } : inputs;
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
    default: defaultValue || props[name].default
  };
}

function hasEmptyChoices({ choices }: { choices?: ChoicesT }): boolean {
  return choices && isEmpty(choices) && typeof choices !== 'function';
}
