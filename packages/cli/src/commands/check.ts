import check from '../scripts/check';
import { compile } from '../models/compiler/Compiler';
import ConfigManager from '../models/config/ConfigManager';
import Telemetry from '../telemetry';

const name = 'check';
const signature = `${name} [contract]`;
const description = 'checks your contracts for potential issues';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .usage('[contract] [options]')
    .description(description)
    .option('--skip-compile', 'skips contract compilation')
    .action(action);

async function action(contractAlias: string, options: any): Promise<void> {
  ConfigManager.initStaticConfiguration();
  if (!options.skipCompile) await compile();
  await Telemetry.report('check', { contractAlias }, options.interactive);
  check({ contractAlias });
}

export default { name, signature, description, register, action };
