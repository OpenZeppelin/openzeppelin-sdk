global.artifacts = artifacts
global.web3 = web3
global.truffleDefaults = artifacts.require('ContractDirectory').class_defaults // TODO: Make less horrible

const program = require('commander')

module.exports = function(cb) {

  program
    .option('--network [network]', 'Truffle network')
    .option('--from [from]', 'Sender')
    .parse(process.argv)

  const script = `./scripts/${program.args[2]}.js`
  const args = program.args.slice(3)
  require(script)(...args, {
    network: program.network,
    from: program.from || web3.eth.accounts[0]
  }).then(cb).catch(cb)
}