import { compile } from '../models/compiler/Compiler';
import { DEFAULT_EVM_VERSION } from '../models/compiler/solidity/SolidityContractsCompiler';
import { ProjectCompilerOptions } from '../models/compiler/solidity/SolidityProjectCompiler';

const name = 'compile';
const signature = `${name}`;
const description = `compiles all contracts in the current project`;

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .description(description)
    .option(
      '--solc-version [version]',
      'version of the solc compiler to use (value is written to configuration file for future runs, defaults to most recent release that satisfies contract pragmas)',
    )
    .option(
      '--optimizer [on|off]',
      'enables compiler optimizer (value is written to configuration file for future runs, defaults to off)',
    )
    .option(
      '--optimizer-runs [runs]',
      'specify number of runs if optimizer enabled (value is written to configuration file for future runs, defaults to 200)',
    )
    .option(
      '--evm-version [evm]',
      `choose target evm version (value is written to configuration file for future runs, defaults to ${DEFAULT_EVM_VERSION})`,
    )
    .action(action);

async function action(options: {
  evmVersion: string;
  solcVersion: string;
  optimizer: string | boolean;
  optimizerRuns: string;
}): Promise<void> {
  const { evmVersion, solcVersion: version, optimizer, optimizerRuns } = options;

  // Handle optimizer option:
  //- on --optimizer or --optimizer=on, enable it
  //- on --optimizer=off disable it
  //- if no --optimizer is set, use default from project.json, or false
  //- on any other --optimizer value, throw
  let optimizerEnabled = undefined;
  if (typeof optimizer === 'string') {
    if (optimizer.toLowerCase() === 'on') optimizerEnabled = true;
    else if (optimizer.toLowerCase() === 'off') optimizerEnabled = false;
    else throw new Error(`Invalid value ${optimizer} for optimizer flag (valid values are 'on' or 'off')`);
  } else if (typeof optimizer === 'boolean') {
    optimizerEnabled = optimizer;
  }

  const compilerOptions: ProjectCompilerOptions = {
    manager: 'zos',
    evmVersion,
    version,
    optimizer: {
      enabled: optimizerEnabled,
      runs: optimizerRuns && parseInt(optimizerRuns),
    },
  };

  await compile(compilerOptions);
}

export default { name, signature, description, register, action };
