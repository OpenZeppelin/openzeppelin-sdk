// Set global variables to be used in scripts and models
global.web3 = web3
global.artifacts = artifacts

const program = require('commander')

module.exports = function(cb) {
  program
    .option('-f', '--from <from>', 'Sender')
    .option('-n', '--network <network>', 'Truffle network')
    .option('-s', '--stdlib <stdlib>', 'Standard library to use')
    .option('-i', '--init <initArgs>', 'Initialize arguments')
    .parse(process.argv)

  const script = `./scripts/${program.args[2]}.js`
  const args = program.args.slice(3)
  require(script)(...args, {
    network: program.network,
    initArgs: program.initArgs,
    from: program.from || web3.eth.accounts[0],
    stdlib: program.stdlib
  }).then(cb).catch(cb)
}
