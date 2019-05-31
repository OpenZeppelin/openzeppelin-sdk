import ErrorHandler from '../models/errors/ErrorHandler';
import { Command } from 'commander';

export default function registerErrorHandler(program: Command): void {
  const cb = (error: Error): void => new ErrorHandler(error, program).call();
  process.on('unhandledRejection', cb);
  process.on('uncaughtException', cb);

  program.on('command:*', function(): void {
    console.error(
      `Invalid command: ${program.args.join(
        ' ',
      )}\nSee --help for a list of available commands.`,
    );
    process.exit(1);
  });
}
