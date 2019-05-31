'use strict';

import chalk from 'chalk';
import program from 'commander';
import { Logger } from 'zos-lib';
import commands from '../commands';
import registerErrorHandler from './errors';

// Do not use import here or Typescript will create wrong build folder
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../../package.json');

require('./options');

// TS-TODO: Decide whether this should be an interface or a type
interface CommandInterface {
  name: string;
  signature: string;
  description: string;
  register: any;
  action: any;
  tryAction?: any;
}

const commandsList: CommandInterface[] = Object.values(commands);
commandsList.forEach(
  (command: CommandInterface): void => command.register(program),
);
const maxLength: number = Math.max(
  ...commandsList.map(command => command.signature.length),
);

program
  .name('zos')
  .usage('<command> [options]')
  .description(
    `where <command> is one of: ${commandsList.map(c => c.name).join(', ')}`,
  )
  .version(version, '--version')
  .option(
    '-v, --verbose',
    'verbose mode on: output errors stacktrace and detailed log.',
  )
  .option('-s, --silent', 'silent mode: no output sent to stderr.')
  .on('option:verbose', () => Logger.verbose(true))
  .on('option:silent', () => Logger.silent(true))
  .on('--help', () =>
    commandsList.forEach(c =>
      console.log(
        `   ${chalk.bold(c.signature.padEnd(maxLength))}\t${c.description}\n`,
      ),
    ),
  );

registerErrorHandler(program);

export default program;
