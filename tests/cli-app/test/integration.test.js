'use strict'
require('chai').should();
const _ = require('lodash'); 

const { 
  getProxyAddress,
  getNetworkInfo,
  getNetwork,
  truffleExec,
  run,
  copy
} = require('./share');

const { 
  registerProjectHooks
} = require('./project');

const network = getNetwork();

function runIntegrationTest({ lightweight }) {
  registerProjectHooks(network);

  function ifNotLightweight() {
    if (!lightweight) {
      it.apply(this, arguments)
    }
  }

  it('initialize zos', function () {
    const flags = lightweight ? '--light' : '';
    run(`npx zos init cli-app 0.5.0 ${flags}`)
  })

  ifNotLightweight('adds dependencies', function () {
    run('npx zos link openzeppelin-zos@1.9.0 --no-install')
  })

  it('adds contracts', function () {
    run('npx truffle compile > /dev/null')
    run('npx zos add Foo Bar Baz WithToken --skip-compile')
  })

  it('pushes to network', function () {
    run(`npx zos push --network ${network} --from ${this.from} --deploy-libs --skip-compile`)
  })

  it('creates an instance', function () {
    run(`npx zos create Foo --network ${network}`)
    truffleExec(`run.js cli-app/Foo 0 say --network ${network}`).should.eq('Foo')
  })

  ifNotLightweight('creates an instance from a dependency', function () {
    run(`npx zos create openzeppelin-zos/MintableERC721Token --init --args "${this.from},MyToken,TKN" --network ${network} --from ${this.from}`)
    const tokenAddress = getProxyAddress(network, 'openzeppelin-zos/MintableERC721Token', 0)
    run(`npx zos create WithToken --init --args "${tokenAddress}" --network ${network} --from ${this.from}`)
    truffleExec(`run.js cli-app/WithToken 0 say --network ${network} --from ${this.from}`).should.eq('TKN')
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
    truffleExec(`run.js cli-app/Foo 0 say --network ${network} --from ${this.from}`).should.eq('FooV2')
  })

  ifNotLightweight('installs new version of a dependency', function () {
    copy('package.json.v2', 'package.json')
    run('npx lerna bootstrap --scope=cli-app-tests-workdir --no-ci > /dev/null')
    run('npx zos link openzeppelin-zos@1.9.4 --no-install')
  })

  ifNotLightweight('upgrades a dependency', function () {
    copy('WithTokenV2.sol', 'contracts/WithToken.sol')
    run(`npx truffle compile`)
    run(`npx zos push --deploy-libs --network ${network} --from ${this.from} --skip-compile`)
    run(`npx zos update openzeppelin-zos/MintableERC721Token --network ${network} --from ${this.from}`)
    run(`npx zos update WithToken --network ${network} --from ${this.from}`)
    truffleExec(`run.js cli-app/WithToken 0 isERC165 --network ${network}`).should.eq('true')
  })
};

describe(`cli-app on ${network}`, function () {
  runIntegrationTest({ lightweight: false })
})

describe(`cli-app lightweight on ${network}`, function () {
  runIntegrationTest({ lightweight: true })
})
