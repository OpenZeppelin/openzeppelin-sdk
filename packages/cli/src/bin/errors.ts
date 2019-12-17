import { Command } from 'commander';
import { Loggy } from '@openzeppelin/upgrades';

const GENERIC_ERROR_MESSAGE =
  'There was an undefined error. Please execute the same command again in verbose mode if necessary.';

function handle(error: Error, verbose = false): void {
  if (!verbose) {
    Loggy.stopAll();
    const errorMessage = error.message || GENERIC_ERROR_MESSAGE;
    Loggy.noSpin.error(__filename, 'call', 'error-message', errorMessage);
  } else {
    Loggy.noSpin.error(__filename, 'call', 'error-message', error.stack);
  }

  process.exit(1);
}

export default function registerErrorHandler(program: Command): void {
  const handler = (error: Error) => handle(error, program.verbose);

  process.on('unhandledRejection', handler);
  process.on('uncaughtException', handler);

  program.on('command:*', function(): void {
    console.error(`Invalid command: ${program.args.join(' ')}\nSee --help for a list of available commands.`);
    process.exit(1);
  });
}
