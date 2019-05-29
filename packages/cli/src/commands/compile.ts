import Compiler from '../models/compiler/Compiler';
import { CompilerOptions, DEFAULT_EVM_VERSION } from '../models/compiler/solidity/SolidityContractsCompiler';

const name: string = 'compile';
const signature: string = `${name}`;
const description: string = `compiles all contracts in the current project`;

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .description(description)
  .option('--using [manager]', 'compiler manager to use (options are "zos" or "truffle", defaults to truffle only if truffle.js config file is present)')
  .option('--solc-version [version]', 'version of the solc compiler to use (value is written to configuration file for future runs, defaults to most recent release that satisfies contract pragmas)')
  .option('--optimizer', 'enables compiler optimizer (value is written to configuration file for future runs, defaults to false)')
  .option('--optimizer-runs [runs]', 'specify number of runs if optimizer enabled (value is written to configuration file for future runs, defaults to 200)')
  .option('--evm-version [evm]', `choose target evm version (value is written to configuration file for future runs, defaults to ${DEFAULT_EVM_VERSION})`)
  .action(action);

async function action(options: { evmVersion: string, using: string, solcVersion: string, optimizer: boolean, optimizerRuns: string}): Promise<void> {
  const { evmVersion, using: manager, solcVersion: version, optimizer, optimizerRuns } = options;
  const compilerOptions: CompilerOptions = {
    evmVersion,
    version,
    optimizer: { enabled: !!optimizer, runs: optimizerRuns },
  };

  switch (manager) {
    case 'truffle': return Compiler.compileWithTruffle();
    case 'zos': return Compiler.compileWithSolc(compilerOptions);
    case undefined: case null: return Compiler.call(false);
    default: throw new Error(`Unknown compiler manager ${manager} (valid values are zos or truffle)`);
  }
}

export default { name, signature, description, register, action };
