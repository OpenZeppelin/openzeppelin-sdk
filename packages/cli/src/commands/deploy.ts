import { Command, Option } from 'commander';
import Telemetry from '../telemetry';

export const name = 'deploy';
export const signature = `${name} [contract] [arguments...]`;

export function register(program: Command): void {
  _register(program).action(withTelemetry(withPrompts(action, props)));
}

function _register(program: Command): Command {
  return program
  .command(signature)
  .description('deploy a contract instance');
}

interface Options {
  upgradeable: boolean;
  init: string;
}

async function action(contractName: string, deployArgs: string[], options: Options): Promise<Void> {
  if (options.upgradeable) {
    return create(...);
  }

  compile(contractName);
  const contract = await getContract(contractName);
  const args = contract.parseConstructorArgs(deployArgs);
  await contract.new(...args);
}

type Action = (...args: unknown[]) => void;

function withTelemetry(action: Action): Action {
  return function (...args): void {
    // args always contains the cmd in the last position
    const cmd: Command = args.pop() as Command;
    const name = cmd.name();
    const argsAndOpts = commandArgsAndOpts(cmd, args);
    Telemetry.report(name, argsAndOpts, !!argsAndOpts.interactive);
    return action(...args, cmd);
  }
}

function commandArgsAndOpts(cmd: Command, args: unknown[]): Record<string, unknown> {
  const argsAndOpts = {};

  for (let i = 0; i < args.length; i++) {
    argsAndOpts[cmd._args[i].name] = args[i];
  }

  for (const opt: Option of cmd.options) {
    const name = opt.attributeName();
    argsAndOpts[name] = cmd[name];
  }

  return argsAndOpts;
}
