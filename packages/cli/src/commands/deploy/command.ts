import { Command } from 'commander';

import { Choice } from '../../prompts/choices';
import { MethodArg } from '../../prompts/prompt';

export const name = 'deploy';
export const description = 'deploy a contract instance';

// TODO: Validate that only last argument is variadic.
export const args: Arg[] = [
  {
    name: 'contract',
    async prompt(): Promise<Question> {
      const choices = await import('../../prompts/choices');
      const contracts = choices.contracts('all');

      return {
        message: 'Pick a contract to deploy',
        choices: contracts,
        validate: value => contracts.includes(value),
      };
    },
  },
  {
    name: 'arguments',
    variadic: true,
    async prompt(argsAndOpts: ArgsAndOpts): Promise<Question[]> {
      const { fromContractFullName } = await import('../../utils/naming');
      const { default: ContractManager } = await import('../../models/local/ContractManager');
      const { argLabel } = await import('../../prompts/prompt');
      const { parseArg, getSampleInput } = await import('../../utils/input');

      const contractName = argsAndOpts.contract as string;

      const { package: packageName, contract: contractAlias } = fromContractFullName(contractName);
      const contract = new ContractManager().getContractClass(packageName, contractAlias);
      const constructorInputs: MethodArg[] = contract.schema.abi.find(f => f.type === 'constructor')?.inputs ?? [];

      return constructorInputs.map((arg, index) => {
        const placeholder = getSampleInput(arg);
        const validationError = placeholder
          ? `Enter a valid ${arg.type} such as: ${placeholder}`
          : `Enter a valid ${arg.type}`;

        return {
          message: `${argLabel(arg, index)}:`,
          validate: (value: string) => {
            try {
              parseArg(value, arg);
              return true;
            } catch (err) {
              return false;
            }
          },
          validationError,
        };
      });
    },
  },
];

export const options: Option[] = [
  {
    format: '--skip-compile',
    description: 'use existing compilation artifacts',
    default: false,
  },
  {
    format: '--upgradeable',
    description: 'deploy an upgradeable instance',
    default: false,
  },
  {
    format: '-n, --network <network>',
    description: 'network to use',
    async prompt(): Promise<Question> {
      const { default: ConfigManager } = await import('../../models/config/ConfigManager');
      const networks = ConfigManager.getNetworkNamesFromConfig();
      return {
        message: 'Pick a network',
        choices: networks,
        validate: value => networks.includes(value),
      };
    },
  },
];

export const signature = generateSignature(name, args);

// The coode below is temporarily in this file but will belong in a different
// layer once all of the commands are migrated to this format.

import inquirer from 'inquirer';
import Telemetry from '../../telemetry';

function generateSignature(name: string, args: Arg[]): string {
  return [name, ...args.map(a => `[${a.name}${a.variadic ? '...' : ''}]`)].join(' ');
}

interface Question {
  message: string;
  choices?: Choice[];
  validate: (value: string) => boolean;
  validationError?: string;
}

type Param = ParamSimple | ParamVariadic;

interface ParamSimple {
  variadic?: false;
  prompt?: (argsAndOpts: ArgsAndOpts) => Promise<Question>;
}

interface ParamVariadic {
  variadic: true;
  prompt?: (argsAndOpts: ArgsAndOpts) => Promise<Question[]>;
}

type Arg = Param & { name: string };

interface Option extends ParamSimple {
  format: string;
  description: string;
  default?: string | boolean;
}

export function register(program: Command): void {
  const signature = generateSignature(name, args);

  const command = program
    .command(signature)
    .description(description)
    .action(async (...actionArgs: unknown[]) => {
      const { preAction, action }: Action = await import('./action');
      await preAction?.(...actionArgs);
      const [cmd, argsAndOpts] = getCommandArgsAndOpts(...actionArgs);
      await promptForMissing(cmd, options, args, argsAndOpts);
      // TODO: normalize network name and include txParams (ConfigManager)
      Telemetry.report(cmd.name(), argsAndOpts, !!argsAndOpts.interactive);
      await action(...generateActionArgs(cmd, argsAndOpts));
    });

  for (const opt of options) {
    command.option(opt.format, opt.description, opt.default);
  }
}

type ActionFunction = (...args: unknown[]) => void;

interface Action {
  action: ActionFunction;
  preAction?: ActionFunction;
}

// Unifies both options and positional arguments under the same interface of name + Param.
function* allParams(cmd: Command, options: Option[], args: Arg[]): Generator<[string, Param]> {
  for (const opt of options) {
    // An option's name is determined by Commander by removing the leading
    // dashes and camel-casing the flag. In order to avoid accidental
    // differences in the algorithm we look it up in the command and use
    // whatever Commander says.
    const name: string | undefined = cmd.options.find(o => o.flags === opt.format)?.attributeName();

    if (name === undefined) {
      // Just a sanity check. Should never happen.
      throw new Error('Could not find option: ' + opt.format);
    }

    yield [name, opt];
  }

  for (const arg of args) {
    yield [arg.name, arg];
  }
}

async function promptForMissing(cmd: Command, options: Option[], args: Arg[], argsAndOpts: ArgsAndOpts) {
  for (const [name, param] of allParams(cmd, options, args)) {
    const value = argsAndOpts[name];
    if (value === undefined || (Array.isArray(value) && value.length === 0)) {
      // Seems redundant but it helps the type system.
      if (param.variadic === true) {
        const prompt = await param.prompt?.(argsAndOpts);
        const values = [];
        for (const p of prompt) {
          values.push(await askQuestion(name, p));
        }
        argsAndOpts[name] = values;
      } else {
        const prompt = await param.prompt?.(argsAndOpts);
        argsAndOpts[name] = prompt && (await askQuestion(name, prompt));
      }
    } else {
      if (typeof value === 'boolean') {
        continue;
      }
      if (param.variadic === true) {
        if (!Array.isArray(value)) {
          throw new Error(`Expected multiple values for ${name}`);
        }
        const prompt = await param.prompt?.(argsAndOpts);
        if (prompt) {
          if (prompt.length !== value.length) {
            throw new Error(`Expected ${prompt.length} values for ${name} but got ${value.length}`);
          }

          for (const [i, p] of prompt.entries()) {
            if (!p.validate(value[i])) {
              throw new Error(`Invalid ${name} '${value[i]}'`);
            }
          }
        }
      } else {
        if (Array.isArray(value)) {
          throw new Error(`Expected a single value for ${name}`);
        }
        const prompt = await param.prompt?.(argsAndOpts);
        if (prompt && !prompt.validate(value)) {
          throw new Error(`Invalid ${name} '${value}'`);
        }
      }
    }
  }
}

async function askQuestion(name: string, question: Question): Promise<string> {
  const { message, choices, validate: rawValidate, validationError } = question;
  const type = choices === undefined ? 'input' : 'list';

  const validate = (value: string) => {
    const valid = rawValidate(value);
    return valid || (validationError ?? `Invalid ${name}`);
  };

  const answers = await inquirer.prompt({
    name: 'question',
    type,
    message,
    choices,
    validate,
  });

  return answers.question;
}

type ArgsAndOpts = Record<string, boolean | string | string[]>;

function getCommandArgsAndOpts(...args: unknown[]): [Command, ArgsAndOpts] {
  const cmd = args.pop() as Command;

  const argsAndOpts = {};

  for (let i = 0; i < cmd._args.length; i++) {
    argsAndOpts[cmd._args[i].name] = args[i];
  }

  for (const opt of cmd.options) {
    const name = opt.attributeName();
    argsAndOpts[name] = cmd[name];
  }

  return [cmd, argsAndOpts];
}

function generateActionArgs(cmd: Command, argsAndOpts: ArgsAndOpts): unknown[] {
  const args = [];

  for (let i = 0; i < cmd._args.length; i++) {
    args.push(argsAndOpts[cmd._args[i].name]);
  }

  for (const opt of cmd.options) {
    const name = opt.attributeName();
    cmd[name] = argsAndOpts[name];
  }

  args.push(cmd);

  return args;
}
