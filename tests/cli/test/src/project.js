const _ = require('lodash'); 
const { truffleExec, setMockStdlibVersion, run, copy } = require('./share');

function cleanup() {
  run('rm build/contracts/*.json ||:')
  run('rm contracts/*.sol ||:')
  run('rm zos.* ||:')
  setMockStdlibVersion('1.1.0')
}

function registerProjectHooks (network) {
  before('cleaning up project folder', cleanup);

  before('setting up project', function () {
    copy('Samples.sol', 'contracts/Samples.sol')
    copy('GreeterWrapper.sol', 'contracts/GreeterWrapper.sol')
  });

  before('loading accounts', async function () {
    if (process.env.FROM) {
      this.from = process.env.FROM;
    } else {
      const accounts = truffleExec(`getaccounts.js --network ${network}`).split(',')
      this.from = _.trim(accounts[0])
    }
  })
  
  after('cleaning up project folder', cleanup);
};

module.exports = {
  registerProjectHooks
}