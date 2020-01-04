import { Command } from 'commander';
import Telemetry from '../../telemetry';

export const name = 'deploy';
export const description = 'deploy a contract instance';

// TODO: Validate that only last argument is variadic.
export const args: Arg[] = [
  {
    name: 'contract',
    async prompt(): Promise<Question> {
      return undefined;
    },
  },
  {
    name: 'arguments',
    variadic: true,
    async prompt(): Promise<Question[]> {
      return [];
    },
  },
];

export const options: Option[] = [
  {
    format: '--verbose',
    description: 'verbose mode',
    default: false,
  },
  {
    format: '--skip-compile',
    description: 'skip compilation',
    default: false,
  },
  {
    format: '--upgradeable',
    description: 'deploy an upgradeable instance',
    default: false,
  },
  {
    format: '--network <network>',
    description: 'network to use',
    async prompt(): Promise<Question> {
      const { default: ConfigManager } = await import('../../models/config/ConfigManager');
      const networks = ConfigManager.getNetworkNamesFromConfig();
      return {
        message: 'Pick a network',
        choices: networks,
        validate: value => networks.includes(value) || 'etc',
      };
    },
  },
];

export const signature = generateSignature(name, args);

// The coode below is temporarily in this file but will belong in a different
// layer once all of the commands are migrated to this format.

function generateSignature(name: string, args: Arg[]): string {
  return [name, ...args.map(a => `[${a.name}${a.variadic ? '...' : ''}]`)].join(' ');
}

interface Question {
  message: string;
  choices: string[];
  validate: (value: string) => true | string;
}

type Arg = ArgSimple | ArgVariadic;

interface ArgSimple {
  name: string;
  variadic?: false;
  prompt?: (cmd: Command, ...args: unknown[]) => Promise<Question>;
}

interface ArgVariadic {
  name: string;
  variadic?: true;
  prompt?: (cmd: Command, ...args: unknown[]) => Promise<Question[]>;
}

interface Option {
  format: string;
  description: string;
  default?: string | boolean;
  prompt?: (cmd: Command, ...args: unknown[]) => Promise<Question>;
}

export function register(program: Command): void {
  const signature = generateSignature(name, args);

  const command = program
    .command(signature)
    .description(description)
    .action(async (...args: unknown[]) => {
      const { preAction, action }: Action = await import('./action');
      await preAction?.(...args);
      const fullArgs = await promptForMissing(options, args);
      reportTelemetry(...fullArgs);
      await action(...fullArgs);
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

async function promptForMissing(...args: unknown[]): unknown[] {
  const cmd = args.pop() as Command;

  for (const opt of options) {
    const name = cmd.options.find(o => o.flags === opt.format)?.attributeName();
    if (name === undefined) {
      throw new Error('could not find argument: ' + opt.format);
    }

    const question

    if (cmd[name] !== undefined) {
      const value = cmd[name];
      if (opt.prompt) {
        const validate = await opt.validation(...args, cmd);
        if (!validate(value)) {
          throw new Error(`Invalid value ${value} for flag: ${opt.format}`);
        }
      }
    } else {
      if (opt.prompt) {
        const prompt = await opt.prompt(...args, cmd);
      } else if (opt.default !== undefined) {
      }
    }
  }

  return args;
}

function reportTelemetry(...args: unknown[]): void {
  // args always contains the cmd in the last position
  const cmd: Command = args.pop() as Command;
  const name = cmd.name();
  const argsAndOpts = commandArgsAndOpts(cmd, args);
  // TODO: normalize network name (done by ConfigManager) and include txParams
  Telemetry.report(name, argsAndOpts, !!argsAndOpts.interactive);
}

function commandArgsAndOpts(cmd: Command, args: unknown[]): Record<string, unknown> {
  const argsAndOpts = {};

  for (let i = 0; i < cmd._args.length; i++) {
    argsAndOpts[cmd._args[i].name] = args[i];
  }

  for (const opt of cmd.options) {
    const name = opt.attributeName();
    argsAndOpts[name] = cmd[name];
  }

  return argsAndOpts;
}
