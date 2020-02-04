import { compile } from '../models/compiler/Compiler';
import { CompileParams } from '../scripts/interfaces';
import { ProjectCompilerOptions } from '../models/compiler/ProjectCompilerOptions';
import Telemetry from '../telemetry';
import ProjectFile from '../models/files/ProjectFile';
import { isUndefined } from 'lodash';
import { promptIfNeeded } from '../prompts/prompt';
import { TypechainQuestions } from '../prompts/typechain';

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
      `choose target evm version (value is written to configuration file for future runs, defaults depends on compiler: byzantium prior to 0.5.5, petersburg from 0.5.5)`,
    )
    .withNonInteractiveOption()
    .action(action);

async function action(options: CompileParams & { interactive: boolean }): Promise<void> {
  const { evmVersion, solcVersion: version, optimizer, optimizerRuns, interactive } = options;

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
    manager: 'openzeppelin',
    evmVersion,
    version,
    optimizer: {
      enabled: optimizerEnabled,
      runs: optimizerRuns && parseInt(optimizerRuns),
    },
  };

  // If typechain settings are undefined, we are running from an old project, so we ask the user if they want to enable it if we find a ts-config (this last bit handled by the typechain questions)
  const projectFile = new ProjectFile();
  if (
    !projectFile.compilerOptions ||
    !projectFile.compilerOptions.typechain ||
    isUndefined(projectFile.compilerOptions.typechain.enabled)
  ) {
    const { typechainEnabled, typechainTarget, typechainOutdir } = await promptIfNeeded(
      {
        args: { typechainEnabled: undefined, typechainTarget: undefined, typechainOutdir: undefined },
        defaults: {},
        props: TypechainQuestions,
      },
      interactive,
    );
    compilerOptions.typechain = { enabled: typechainEnabled };
    if (typechainEnabled) {
      Object.assign(compilerOptions.typechain, { outDir: typechainOutdir, target: typechainTarget });
      compilerOptions.force = true;
    }
  }

  await Telemetry.report(
    'compile',
    { evmVersion, solcVersion: version, optimizer, optimizerRuns },
    options.interactive,
  );
  await compile(compilerOptions);
}

export default { name, signature, description, register, action };
