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
      '--using [manager]',
      'compiler manager to use (options are "zos" or "truffle", defaults to truffle only if truffle.js config file is present)',
    )
    .option(
      '--solc-version [version]',
      'version of the solc compiler to use (value is written to configuration file for future runs, defaults to most recent release that satisfies contract pragmas)',
    )
    .option(
      '--optimizer',
      'enables compiler optimizer (value is written to configuration file for future runs, defaults to false)',
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
  using: string;
  solcVersion: string;
  optimizer: boolean;
  optimizerRuns: string;
}): Promise<void> {
  const {
    evmVersion,
    using: manager,
    solcVersion: version,
    optimizer,
    optimizerRuns,
  } = options;
  if (
    manager === 'truffle' &&
    (evmVersion || version || optimizer || optimizerRuns)
  ) {
    throw new Error(
      'Cannot set any compiler settings when compiling with truffle. Please modify your truffle-config file manually and run this command again.',
    );
  }

  const compilerOptions: ProjectCompilerOptions = {
    manager,
    evmVersion,
    version,
    optimizer: {
      enabled: !!optimizer,
      runs: optimizerRuns,
    },
  };

  await compile(compilerOptions);
}

export default { name, signature, description, register, action };
