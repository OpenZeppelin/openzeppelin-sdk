import { Command } from 'commander';
import Telemetry from '../../telemetry';

export const name = 'deploy';
export const signature = `${name} [contract] [arguments...]`;
export const description = 'deploy a contract instance';
export const options: Option[] = [
  ['--verbose', 'verbose mode'],
  ['--network <network>', 'network to perform action on'],
  ['--skip-compile', 'skip compilation'],
  ['--upgradeable', 'deploy an upgradeable instance'],
];

export function register(program: Command): void {
  const command = program
    .command(signature)
    .description(description)
    .action(async (...args) => {
      const { preAction, action }: Action = await import('./action');
      await preAction(...args);
      await withTelemetry(action)(...args);
    });

  for (const opt of options) {
    command.option(...opt);
  }
}

type ActionFunction = (...args: unknown[]) => void;

interface Action {
  action: ActionFunction;
  preAction: ActionFunction;
}

type Option = [string, string];

function withTelemetry(action: ActionFunction): ActionFunction {
  return function(...args): void {
    // args always contains the cmd in the last position
    const cmd: Command = args.pop() as Command;
    const name = cmd.name();
    const argsAndOpts = commandArgsAndOpts(cmd, args);
    // TODO: normalize network name (done by ConfigManager)
    Telemetry.report(name, argsAndOpts, !!argsAndOpts.interactive);
    return action(...args, cmd);
  };
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
