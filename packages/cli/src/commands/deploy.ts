import { Command, Option } from 'commander';
import Telemetry from '../telemetry';
import { compile } from '../models/compiler/Compiler';

export const name = 'deploy';
export const signature = `${name} [contract] [arguments...]`;

export function register(program: Command): void {
  _register(program).action((...args) => {
    (preAction as Action)(...args);
    withTelemetry(action)(...args);
  });
}

function _register(program: Command): Command {
  return program.command(signature).description('deploy a contract instance');
}

interface Options {
  skipCompile?: boolean;
  upgradeable?: boolean;
  init?: string;
}

async function preAction(options: Options): Promise<void> {
  if (!options.skipCompile) {
    await compile();
  }
}

async function action(contractName: string, deployArgs: string[], options: Options): Promise<void> {
  if (options.upgradeable) {
    // return create(...); // TODO: skip compile
    throw new Error('unimplemented');
  }

  const { contract: contractAlias, package: packageName } = fromContractFullName(contractFullName);
  const contract = await getContract(contractName);
  const args = contract.parseConstructorArgs(deployArgs);
  const instance = await contract.new(...args);

  // store to json network file
  // print instance info
}

type Action = (...args: unknown[]) => void;

function withTelemetry(action: Action): Action {
  return function(...args): void {
    // args always contains the cmd in the last position
    const cmd: Command = args.pop() as Command;
    const name = cmd.name();
    const argsAndOpts = commandArgsAndOpts(cmd, args);
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
