global.artifacts = artifacts;
global.web3 = web3;

const program = require('commander')

module.exports = function(cb) {

  program
    .option('--network [network]', 'Truffle network')
    .option('--from [from]', 'Sender')
    .parse(process.argv)

  const script = `./scripts/${program.args[2]}.js`
  const args = program.args.slice(3)
  require(script)(...args, { from: program.from }).then(cb).catch(cb);
};
