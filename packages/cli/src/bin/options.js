import program from 'commander'

program.Command.prototype.withNetworkOptions = function () {
  return this
    .option('-n, --network <network>', 'network to be used')  
    .option('-f, --from <from>', 'specify transaction sender address')
    .option('--timeout <timeout>', 'timeout in seconds for blockchain transactions')
};

program.Command.prototype.withPushOptions = function () {
  return this
    .option('--push [network]', 'push changes to the specified network after adding')
    .option('-f, --from <from>', 'specify the transaction sender address for --push')
    .option('--timeout <timeout>', 'timeout in seconds for blockchain transactions')
};