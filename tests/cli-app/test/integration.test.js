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

  it('initialize zos', function () {
    const flags = lightweight ? '' : '--publish';
    run(`npx zos init cli-app 0.5.0 ${flags}`)
  })

  it('adds dependencies', function () {
    run('npx zos link mock-stdlib@1.1.0 --no-install')
  })

  it('adds contracts', function () {
    run('npx zos add Foo Bar Baz GreeterWrapper')
  })

  it('pushes to network', function () {
    run(`npx zos push --network ${network} --from ${this.from} --deploy-dependencies --skip-compile`)
  })

  it('creates an instance', function () {
    run(`npx zos create Foo --network ${network}`)
    truffleExec(`run.js cli-app/Foo 0 say --network ${network}`).should.eq('Foo')
  })

  it('creates an instance from a dependency', function () {
    run(`npx zos create mock-stdlib/Greeter --init --args "Alice" --network ${network} --from ${this.from}`)
    const tokenAddress = getProxyAddress(network, 'mock-stdlib/Greeter', 0)
    run(`npx zos create GreeterWrapper --init --args "${tokenAddress}" --network ${network} --from ${this.from}`)
    truffleExec(`run.js cli-app/GreeterWrapper 0 say --network ${network} --from ${this.from}`).should.eq('Alice')
    truffleExec(`run.js cli-app/GreeterWrapper 0 iteration --network ${network}`).should.eq('1')
  })

  it('modifies and pushes a contract', function () {
    const implementations = getNetworkInfo(network).contracts
    copy('SamplesV2.sol', 'contracts/Samples.sol')
    run(`npx zos push --network ${network} --from ${this.from}`)
    const newImplementations = getNetworkInfo(network).contracts
    newImplementations['Foo'].address.should.not.eq(implementations['Foo'].address, 'Foo implementation should have changed')
    newImplementations['GreeterWrapper'].address.should.eq(implementations['GreeterWrapper'].address, 'GreeterWrapper implementation should not have changed')
  })

  it('upgrades an instance', function () {
    run(`npx zos update Foo --network ${network} --from ${this.from}`)
    truffleExec(`run.js cli-app/Foo 0 say --network ${network} --from ${this.from}`).should.eq('FooV2')
  })

  it('installs new version of a dependency', function () {
    copy('package.json.v2', 'package.json')
    run('npx lerna bootstrap --no-ci > /dev/null')
    run('npx zos link mock-stdlib@1.2.0 --no-install')
  })

  it('upgrades a dependency', function () {
    copy('GreeterWrapperV2.sol', 'contracts/GreeterWrapper.sol')
    run(`npx zos push --deploy-dependencies --network ${network} --from ${this.from}`)
    run(`npx zos update mock-stdlib/Greeter --network ${network} --from ${this.from}`)
    truffleExec(`run.js cli-app/GreeterWrapper 0 iteration --network ${network}`).should.eq('2')
    run(`npx zos update GreeterWrapper --network ${network} --from ${this.from}`)
    truffleExec(`run.js cli-app/GreeterWrapper 0 iteration --network ${network}`).should.eq('17') // 2 (minor) * 3 (triple) + 1 (triple v2) + 10 (wrapper v2)
  })
};

describe(`cli-app on ${network}`, function () {
  runIntegrationTest({ lightweight: false })
})

describe(`cli-app lightweight on ${network}`, function () {
  runIntegrationTest({ lightweight: true })
})
