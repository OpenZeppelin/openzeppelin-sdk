import inquirer from 'inquirer';
import { Command } from 'commander';

import { Choice } from './prompts/choices';
import Telemetry from './telemetry';

export function generateSignature(name: string, args: Arg[]): string {
  return [name, ...args.map(a => `[${a.name}${a.variadic ? '...' : ''}]`)].join(' ');
}

interface CommonParams {
  interactive?: boolean;
}

export interface Question {
  type?: 'confirm' | 'list' | 'input';
  message: string;
  choices?: Choice[];
  preselect?: string;
  validate: (value: string | boolean) => boolean;
  validationError?: string;
}

// Param is the things common to both positional arguments (Arg) and options (Option).
// TODO: Validate that only the last positional argument is variadic.
type Param = ParamSimple | ParamVariadic;

interface ParamSimple {
  variadic?: false;
  prompt?: (params: object) => Promise<Question | undefined>;
}

interface ParamVariadic {
  variadic: true;
  prompt?: (params: object) => Promise<Question[]>;
}

export type Arg = Param & { name: string };

export interface Option extends ParamSimple {
  format: string;
  description: string;
  default?: string | boolean;
}

export function register(program: Command, spec: CommandSpec, getAction: () => Promise<Action>): void {
  const signature = generateSignature(spec.name, spec.args);

  const command = program
    .command(signature)
    .description(spec.description)
    .action(async (...actionArgs: unknown[]) => {
      const { preAction, action }: Action = await getAction();
      const [, preParams] = getCommandParams(...actionArgs);
      const abort = await preAction?.(preParams);
      if (abort) {
        return abort();
      }
      const [cmd, params] = getCommandParams(...actionArgs);
      await promptForMissing(cmd, spec, params);
      Telemetry.report(cmd.name(), params, !!params.interactive);
      await action(params);
    });

  for (const opt of spec.options) {
    command.option(opt.format, opt.description, opt.default);
  }
}

type AbortFunction = () => Promise<void>;

interface Action {
  action: (params: object) => Promise<void>;
  preAction?: (params: object) => Promise<void | AbortFunction>;
}

interface CommandSpec {
  name: string;
  description: string;
  args: Arg[];
  options: Option[];
}

// Unifies both options and positional arguments under the same interface of name + Param.
function* allParams(cmd: Command, spec: CommandSpec): Generator<[string, Param]> {
  for (const opt of spec.options) {
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

  for (const arg of spec.args) {
    yield [arg.name, arg];
  }
}

async function promptForMissing(cmd: Command, spec: CommandSpec, params: object) {
  for (const [name, param] of allParams(cmd, spec)) {
    const value = params[name];
    if (value === undefined || (Array.isArray(value) && value.length === 0)) {
      // Seems redundant but it helps the type system.
      if (param.variadic === true) {
        const prompt = await param.prompt?.(params);
        const values = [];
        for (const p of prompt) {
          values.push(await askQuestion(name, p));
        }
        params[name] = values;
      } else {
        const prompt = await param.prompt?.(params);
        if (prompt) {
          params[name] = await askQuestion(name, prompt);
        }
      }
    } else {
      if (typeof value === 'boolean') {
        continue;
      }
      if (param.variadic === true) {
        if (!Array.isArray(value)) {
          throw new Error(`Expected multiple values for ${name}`);
        }
        const prompt = await param.prompt?.(params);
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
        const prompt = await param.prompt?.(params);
        if (prompt && !prompt.validate(value)) {
          throw new Error(`Invalid ${name} '${value}'`);
        }
      }
    }
  }
}

async function askQuestion(name: string, question: Question): Promise<string> {
  const { message, choices, validate: rawValidate, validationError } = question;

  const type = question.type ?? (choices === undefined ? 'input' : 'list');

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
    default: question.preselect,
  });

  return answers.question;
}

// Converts the arguments that Commander passes to an action into an object
// where the key-value pairs correspond to positional arguments and options,
// and extracts the Command object.
function getCommandParams(...args: unknown[]): [Command, CommonParams] {
  const cmd = args.pop() as Command;

  const params = {};

  for (let i = 0; i < cmd._args.length; i++) {
    params[cmd._args[i].name] = args[i];
  }

  for (const opt of cmd.options) {
    const name = opt.attributeName();
    params[name] = cmd[name];
  }

  return [cmd, params];
}
