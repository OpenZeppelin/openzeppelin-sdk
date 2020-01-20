import program, { Command } from 'commander';
import { DEFAULT_TX_TIMEOUT, DEFAULT_TX_BLOCK_TIMEOUT } from '../models/network/defaults';

program.Command.prototype.withNetworkTimeoutOption = function(): Command {
  return this.option(
    '--timeout <timeout>',
    `timeout in seconds for each transaction when using an http connection (defaults to ${DEFAULT_TX_TIMEOUT} seconds)`,
  ).option(
    '--blockTimeout <timeout>',
    `timeout in blocks for each transaction when using a websocket connection (defaults to ${DEFAULT_TX_BLOCK_TIMEOUT} blocks)`,
  );
};

program.Command.prototype.withNetworkOptions = function(): Command {
  return this.option('-n, --network <network>', 'network to be used')
    .option('-f, --from <from>', 'specify transaction sender address')
    .withNetworkTimeoutOption();
};

program.Command.prototype.withPushOptions = function(): Command {
  return this.option('--push [network]', 'push all changes to the specified network')
    .option('-f, --from <from>', 'specify the transaction sender address for --push')
    .withSkipCompileOption()
    .withNetworkTimeoutOption();
};

program.Command.prototype.withNonInteractiveOption = function(): Command {
  return this.option('--no-interactive', 'force to run the command in non-interactive mode');
};

program.Command.prototype.withSkipCompileOption = function(): Command {
  return this.option('--skip-compile', 'skips contract compilation');
};
