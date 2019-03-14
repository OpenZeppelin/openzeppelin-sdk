import flatten from 'lodash.flatten';
import isEmpty from 'lodash.isempty';
import inquirer from 'inquirer';

import Truffle from '../models/initializer/truffle/Truffle';
import ZosPackageFile from '../models/files/ZosPackageFile';
import LocalController from '../models/local/LocalController';
import Dependency from '../models/dependency/Dependency';
import { fromContractFullName } from '../utils/naming';

interface Args {
  args?: {};
  opts?: {};
  props?: {};
  defaults?: {};
}

interface GenericObject {
  [key: string]: any;
}

type Choices = Array<{ name: string, value: string } | string>;

// TS-TODO: Define a more accurate return type as soon as we know the final structure of it
export async function promptIfNeeded({ args = {}, opts = {}, defaults, props }: Args, interactive: boolean = true): Promise<any> {
  const argsQuestions = Object.keys(args)
    .filter(argName => args[argName] === undefined || isEmpty(args[argName]))
    .filter(argName => !hasEmptyChoices(props[argName]))
    .map(argName => promptFor(argName, defaults, props));

  const optsQuestions = Object.keys(opts)
    .filter(optName => opts[optName] === undefined)
    .filter(argName => !hasEmptyChoices(props[argName]))
    .map(optName => promptFor(optName, defaults, props));

  return interactive
    ? { ...args, ...opts, ...await answersFor(argsQuestions), ...await answersFor(optsQuestions) }
    : { ...args, ...opts };
}

export function networksList(type: string): GenericObject {
  const networks = Truffle.getNetworkNamesFromConfig();
  return genericInquirerQuestion('network', 'Select a network from the network list', type, networks);
}

// Generates an inquirer question with a list of contracts names
export function contractsList(name: string, message: string, type: string, source?: string): GenericObject {
  const localPackageFile = new ZosPackageFile();
  const contractsFromBuild = Truffle.getContractNames();

  // get contracts from `build/contracts`
  if (!source || source === 'fromBuildDir') {
    return genericInquirerQuestion(name, message, type, contractsFromBuild);
  // get contracts from zos.json file
  } else if(source === 'fromLocal') {
    const contractsFromLocal = localPackageFile
      .contractNamesAndAliases
      .map(({ name: contractName, alias }) => {
        const label = contractName === alias ? alias : `${alias}[${contractName}]`;
        return { name: label, value: alias };
      });

    return genericInquirerQuestion(name, message, type, contractsFromLocal);
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

    return genericInquirerQuestion(name, message, type, [...contractsFromBuild, ...flatten(packageContracts)]);
  } else return [];
}

// Returns an inquirer question with a list of methods names for a particular contract
export function methodsList(contractFullName: string): GenericObject {
  const methods = contractMethods(contractFullName)
    .map(({ name, hasInitializer, inputs, selector }) => {
      const initializable = hasInitializer ? `[Initializable] ` : '';
      const args = inputs.map(({ name: inputName, type }) => `${inputName}: ${type}`);
      const label = `${initializable}${name}(${args.join(', ')})`;

      return { name: label, value: { name, selector }};
    });

  return genericInquirerQuestion('initMethod', 'Select a method', 'list', methods);
}

// Returns an inquirer question with a list of arguments for a particular method
export function argsList(contractFullName: string, methodIdentifier: string): GenericObject {
  const method = contractMethods(contractFullName)
    .find(({ name, selector }) => selector === methodIdentifier || name === methodIdentifier);
  if (method) {
    return method
      .inputs
      .map(({ name: inputName, type }) => genericInquirerQuestion(inputName, `${inputName}:`, 'input'))
      .reduce((accum, current) => ({ ...accum, ...current }), {});
  } else return {};
}

// Returns an object with each key as an argument name and each value as undefined
// (e.g., { foo: undefined, bar: undefined }) as required by the promptIfNeeded function
export function initArgsForPrompt(contractFullName: string, methodIdentifier: string): GenericObject {
  const method = contractMethods(contractFullName)
    .find(({ name, selector }) => selector === methodIdentifier || name === methodIdentifier);
  if (method) {
    return method
      .inputs
      .map(({ name: inputName }) => ({ [inputName]: undefined }))
      .reduce((accum, current) => ({ ...accum, ...current }), {});
  } else return {};
}

function contractMethods(contractFullName: string): any {
  const { contract: contractAlias, package: packageName } = fromContractFullName(contractFullName);
  const localController = new LocalController();
  const contract = localController.getContractClass(packageName, contractAlias);

  return contract.methodsFromAst();
}

function genericInquirerQuestion(name: string, message: string, type: string, choices?: Choices) {
  return { [name]: { type, message, choices } };
}

function promptFor(name: string, defaults: {}, props: {}): GenericObject {
  const defaultValue = defaults ? defaults[name] : undefined;
  return {
    name,
    ...props[name],
    default: defaultValue || props[name].default
  };
}

function hasEmptyChoices({ choices }): boolean {
  return choices && isEmpty(choices);
}

async function answersFor(questions: GenericObject): Promise<GenericObject> {
  return inquirer.prompt(questions);
}
