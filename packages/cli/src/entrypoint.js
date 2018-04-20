// Set global variables to be used in scripts and models
global.web3 = web3
global.artifacts = artifacts

const program = require('commander')

module.exports = function(cb) {
  program
    .option('-f, --from <from>', 'Sender')
    .option('-n, --network <network>', 'Truffle network')
    .option('-s, --stdlib <stdlib>', 'Standard library to use')
    .option('-i, --init [function]', 'Initialize method')
    .option('-p, --params <arg1,arg2,...>', 'Initialize parameters')
    .option('--no-install', 'Skip installing stdlib npm dependencies')
    .parse(process.argv)

  let method = program.init
  if(typeof method === 'boolean') method = 'initialize'

  let params = program.params
  if(typeof params === 'string') params = params.split(",")
  else if(typeof params === 'boolean' || method) params = []

  const script = `./scripts/${program.args[2]}.js`
  const args = program.args.slice(3)
  require(script)(...args, {
    network: program.network,
    initMethod: method,
    initArgs: params,
    from: program.from || web3.eth.accounts[0],
    stdlib: program.stdlib,
    installDeps: program.install
  }).then(cb).catch(cb)
}
