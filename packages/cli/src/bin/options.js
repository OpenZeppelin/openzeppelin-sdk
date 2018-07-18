import program from 'commander'
import { DEFAULT_TIMEOUT } from '../utils/runWithTruffle';

program.Command.prototype.withNetworkTimeoutOption = function () {
  return this
    .option('--timeout <timeout>', `timeout in seconds for each blockchain transaction (defaults to ${DEFAULT_TIMEOUT}s)`);
};

program.Command.prototype.withNetworkOptions = function () {
  return this
    .option('-n, --network <network>', 'network to be used')  
    .option('-f, --from <from>', 'specify transaction sender address')
    .withNetworkTimeoutOption()
};

program.Command.prototype.withPushOptions = function () {
  return this
    .option('--push [network]', 'push all changes to the specified network')
    .option('-f, --from <from>', 'specify the transaction sender address for --push')
    .withNetworkTimeoutOption()
};