const _ = require('lodash'); 
const { truffleExec, run, copy } = require('./share');

function registerProjectHooks (network) {
  before('cleaning up project folder', function () {
    run('rm build/contracts/*.json ||:')
    run('rm contracts/*.sol ||:')
    run('rm zos.* ||:')
  });

  before('setting up project', function () {
    copy('package.json.v1', 'package.json')
    copy('Samples.sol', 'contracts/Samples.sol')
    copy('GreeterWrapper.sol', 'contracts/GreeterWrapper.sol')
    run('rm -f package-lock.json')
    run('npx lerna bootstrap --no-ci > /dev/null')
  });

  before('loading accounts', async function () {
    if (process.env.FROM) {
      this.from = process.env.FROM;
    } else {
      const accounts = truffleExec(`getaccounts.js --network ${network}`).split(',')
      this.from = _.trim(accounts[0])
    }
  })
  
  after('cleaning up project folder', function () {
    run('rm build/contracts/*.json ||:')
    run('rm contracts/*.sol ||:')
    run('rm zos.* ||:')
    run('rm package.* ||:')
  })
};

module.exports = {
  registerProjectHooks
}