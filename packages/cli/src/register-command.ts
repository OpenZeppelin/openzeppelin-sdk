import inquirer from 'inquirer';
import { Command } from 'commander';

import { DISABLE_INTERACTIVITY } from './prompts/prompt';
import { Choice } from './prompts/choices';
import Telemetry from './telemetry';

export function generateSignature(name: string, args: Arg[]): string {
  return [name, ...args.map(a => `[${a.name}${a.variadic ? '...' : ''}]`)].join(' ');
}

interface CommonParams {
  interactive?: boolean;
}

export interface ParamDetails {
  prompt?: string;
  promptType?: 'confirm' | 'list' | 'input';
  choices?: readonly Choice[];
  preselect?: string;
  validationError?: (value: string | boolean) => string | undefined;
}

// Param is the things common to both positional arguments (Arg) and options (Option).
type Param = ParamSimple | ParamVariadic;

interface ParamSimple {
  variadic?: false;
  details?: (params: object) => Promise<ParamDetails | undefined>;
  after?: (params: object) => Promise<void>;
}

interface ParamVariadic {
  variadic: true;
  details?: (params: object) => Promise<ParamDetails[]>;
  after?: (params: object) => Promise<void>;
}

export type Arg = Param & { name: string };

export interface Option extends ParamSimple {
  format: string;
  description: string;
  default?: string | boolean;
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

export function register(program: Command, spec: CommandSpec, getAction: () => Promise<Action>): void {
  validateSpec(spec);

  const signature = generateSignature(spec.name, spec.args);

  const command = program
    .command(signature)
    .description(spec.description)
    .action(async (...actionArgs: unknown[]) => {
      const { preAction, action }: Action = await getAction();
      const [cmd, params] = getCommandParams(...actionArgs);
      const abort = await preAction?.(params);
      if (abort) {
        return abort();
      }
      await promptOrValidateAll(cmd, spec, params);
      Telemetry.report(cmd.name(), params as { [key: string]: unknown }, !!params.interactive);
      await action(params);
    });

  for (const opt of spec.options) {
    command.option(opt.format, opt.description, opt.default);
  }
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

async function promptOrValidateAll(cmd: Command, spec: CommandSpec, params: CommonParams) {
  for (const [name, param] of allParams(cmd, spec)) {
    if (param.variadic === true) {
      await promptOrValidateVariadic(name, param, params);
    } else {
      await promptOrValidateSimple(name, param, params);
    }
    await param.after?.(params);
  }
}

async function promptOrValidateVariadic(name: string, param: ParamVariadic, params: CommonParams): Promise<void> {
  const values = params[name];

  if (!Array.isArray(values)) {
    throw new Error(`Expected multiple values for ${name}`);
  }

  const details = await param.details?.(params);

  if (details) {
    if (values.length === 0 && details?.[0]?.prompt !== undefined) {
      const values = [];
      for (const d of details) {
        if (!params.interactive || DISABLE_INTERACTIVITY) {
          throw new Error(`Missing required parameters ${name}`);
        }
        values.push(await askQuestion(name, d));
      }
      params[name] = values;
    } else {
      if (details.length !== values.length) {
        throw new Error(`Expected ${details.length} values for ${name} but got ${values.length}`);
      }

      for (const [i, d] of details.entries()) {
        throwIfInvalid(values[i], name, d);
      }
    }
  }
}

async function promptOrValidateSimple(name: string, param: ParamSimple, params: CommonParams): Promise<void> {
  const value = params[name];
  const details = await param.details?.(params);

  if (details) {
    if (value === undefined && details?.prompt !== undefined) {
      if (!params.interactive || DISABLE_INTERACTIVITY) {
        throw new Error(`Missing required parameter ${name}`);
      }
      params[name] = await askQuestion(name, details);
    } else {
      throwIfInvalid(value, name, details);
    }
  }
}

async function askQuestion(name: string, details: ParamDetails): Promise<string> {
  const { prompt, choices, validationError } = details;

  const type = details.promptType ?? (choices === undefined ? 'input' : 'list');

  const validate = value => validationError(value) ?? true;

  const answers = await inquirer.prompt({
    name: 'question',
    type,
    message: prompt,
    choices,
    validate,
    default: details.preselect,
  });

  const value = answers.question;

  // Inquirer doesn't run validations for confirm (yes/no) prompts, but we do
  // want to validate because in some cases only one answer is acceptable.
  // (e.g. --migrate-manifest)
  if (type === 'confirm' && validationError) {
    const error = validationError(value);
    if (error) {
      throw new Error(error);
    }
  }

  return value;
}

function throwIfInvalid(value: string, name: string, details?: ParamDetails): void {
  const { validationError, choices } = details ?? {};

  let error: string | undefined;

  if (validationError) {
    error = validationError(value);
  } else if (choices) {
    if (!choices.includes(value)) {
      error = `Invalid ${name} '${value}'`;
    }
  }

  if (error) {
    throw new Error(error);
  }
}

// Converts the arguments that Commander passes to an action into an object
// where the key-value pairs correspond to positional arguments and options,
// and extracts the Command object.
function getCommandParams(...args: unknown[]): [Command, CommonParams] {
  const cmd = args.pop() as Command;

  const params = { ...cmd.opts() };

  for (let i = 0; i < cmd._args.length; i++) {
    params[cmd._args[i].name] = args[i];
  }

  return [cmd, params];
}

function validateSpec(spec: CommandSpec) {
  const firstVariadic = spec.args.findIndex(arg => arg.variadic);

  if (firstVariadic !== -1 && firstVariadic < spec.args.length - 1) {
    throw new Error('Only the last positional argument can be variadic');
  }
}
