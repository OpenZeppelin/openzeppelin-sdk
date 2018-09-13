'use strict'
const network = process.env.NETWORK;
if (!network) throw new Error("NETWORK environment variable is required")

require('chai').should();
const _ = require('lodash'); 

const { 
  getProxyAddress,
  getNetworkInfo,
  truffleExec,
  run,
  copy
} = require('./share');

describe(`cli-app on ${network}`, function () {

  before('cleaning up project folder', function () {
    run('rm build/contracts/*.json ||:')
    run('rm contracts/*.sol ||:')
    run('rm zos.* ||:')
  });

  before('setting up project', function () {
    copy('package.json.v1', 'package.json')
    copy('Samples.sol', 'contracts/Samples.sol')
    copy('WithToken.sol', 'contracts/WithToken.sol')
    run('npx lerna bootstrap --scope=cli-app-tests-workdir --no-ci > /dev/null')
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

  it('initialize zos', function () {
    run('npx zos init cli-app 0.5.0')
  })

  it('adds dependencies', function () {
    run('npx zos link openzeppelin-zos@1.9.0 --no-install')
  })

  it('adds contracts', function () {
    run('npx truffle compile > /dev/null')
    run('npx zos add Foo Bar Baz WithToken --skip-compile')
  })

  it('pushes to network', function () {
    run(`npx zos push --network ${network} --from ${this.from} --deploy-stdlib --skip-compile`)
  })

  it('creates an instance', function () {
    run(`npx zos create Foo --network ${network}`)
    truffleExec(`run.js Foo 0 say --network ${network}`).should.eq('Foo')
  })

  it('creates an instance from a dependency', function () {
    run(`npx zos create MintableERC721Token --init --args "${this.from},MyToken,TKN" --network ${network} --from ${this.from}`)
    const tokenAddress = getProxyAddress(network, 'MintableERC721Token', 0)
    run(`npx zos create WithToken --init --args "${tokenAddress}" --network ${network} --from ${this.from}`)
    truffleExec(`run.js WithToken 0 say --network ${network} --from ${this.from}`).should.eq('TKN')
  })

  it('modifies and pushes a contract', function () {
    const implementations = getNetworkInfo(network).contracts
    copy('SamplesV2.sol', 'contracts/Samples.sol')
    run('npx truffle compile')
    run(`npx zos push --network ${network} --from ${this.from} --skip-compile`)
    const newImplementations = getNetworkInfo(network).contracts
    newImplementations['Foo'].address.should.not.eq(implementations['Foo'].address, 'Foo implementation should have changed')
    newImplementations['WithToken'].address.should.eq(implementations['WithToken'].address, 'WithToken implementation should not have changed')
  })

  it('upgrades an instance', function () {
    run(`npx zos update Foo --network ${network} --from ${this.from}`)
    truffleExec(`run.js Foo 0 say --network ${network} --from ${this.from}`).should.eq('FooV2')
  })

  it('installs new version of a dependency', function () {
    copy('package.json.v2', 'package.json')
    run('npx lerna bootstrap --scope=cli-app-tests-workdir --no-ci > /dev/null')
    run('npx zos link openzeppelin-zos@1.9.4 --no-install')
  })

  it('upgrades a dependency', function () {
    copy('WithTokenV2.sol', 'contracts/WithToken.sol')
    run(`npx truffle compile`)
    run(`npx zos push --deploy-stdlib --network ${network} --from ${this.from} --skip-compile`)
    run(`npx zos update MintableERC721Token --network ${network} --from ${this.from}`)
    run(`npx zos update WithToken --network ${network} --from ${this.from}`)
    truffleExec(`run.js WithToken 0 isERC165 --network ${network}`).should.eq('true')
  })
});