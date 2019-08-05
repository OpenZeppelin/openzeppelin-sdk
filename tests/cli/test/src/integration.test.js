'use strict'
require('chai').should();
const _ = require('lodash'); 

const { 
  getProxyAddress,
  getNetworkInfo,
  getNetwork,
  truffleExec,
  run,
  copy,
  setMockStdlibVersion
} = require('../../../util/share')(__dirname);

const { 
  registerProjectHooks
} = require('./project');

const network = getNetwork();

function runIntegrationTest({ lightweight }) {
  registerProjectHooks(network);

  it('initialize openzeppelin', function () {
    const flags = lightweight ? '' : '--publish';
    run(`npx openzeppelin init cli-app 0.5.0 ${flags} --no-interactive`)
  })

  it('adds dependencies', function () {
    run('npx openzeppelin link mock-stdlib@1.1.0 --no-install --no-interactive')
  })

  it('adds contracts', function () {
    run('npx openzeppelin add Foo Bar Baz GreeterWrapper --no-interactive')
  })

  it('pushes to network', function () {
    run(`npx openzeppelin push --network ${network} --from ${this.from} --deploy-dependencies --skip-compile --no-interactive`)
  })

  it('creates an instance', function () {
    run(`npx openzeppelin create Foo --network ${network} --no-interactive`)
    truffleExec(`run.js cli-app/Foo 0 say --network ${network}`).should.eq('Foo')
  })

  it('creates an instance from a dependency', function () {
    run(`npx openzeppelin create mock-stdlib/Greeter --init --args "Alice" --network ${network} --from ${this.from} --no-interactive`)
    const tokenAddress = getProxyAddress(network, 'mock-stdlib/Greeter', 0)
    run(`npx openzeppelin create GreeterWrapper --init --args "${tokenAddress}" --network ${network} --from ${this.from} --no-interactive`)
    truffleExec(`run.js cli-app/GreeterWrapper 0 say --network ${network} --from ${this.from}`).should.eq('Alice')
    truffleExec(`run.js cli-app/GreeterWrapper 0 iteration --network ${network}`).should.eq('1')
  })

  it('modifies and pushes a contract', function () {
    const implementations = getNetworkInfo(network).contracts
    copy('SamplesV2.sol', 'contracts/Samples.sol')
    run(`npx openzeppelin push --network ${network} --from ${this.from} --no-interactive`)
    const newImplementations = getNetworkInfo(network).contracts
    newImplementations['Foo'].address.should.not.eq(implementations['Foo'].address, 'Foo implementation should have changed')
    newImplementations['GreeterWrapper'].address.should.eq(implementations['GreeterWrapper'].address, 'GreeterWrapper implementation should not have changed')
  })

  it('upgrades an instance', function () {
    run(`npx openzeppelin update Foo --network ${network} --from ${this.from} --no-interactive`)
    truffleExec(`run.js cli-app/Foo 0 say --network ${network} --from ${this.from}`).should.eq('FooV2')
  })

  it('installs new version of a dependency', function () {
    setMockStdlibVersion('1.2.0')
    run('npx openzeppelin link mock-stdlib@1.2.0 --no-install --no-interactive')
  })

  it('upgrades a dependency', function () {
    copy('GreeterWrapperV2.sol', 'contracts/GreeterWrapper.sol')
    run(`npx openzeppelin push --deploy-dependencies --network ${network} --from ${this.from} --no-interactive`)
    run(`npx openzeppelin update mock-stdlib/Greeter --network ${network} --from ${this.from} --no-interactive`)
    truffleExec(`run.js cli-app/GreeterWrapper 0 iteration --network ${network}`).should.eq('2')
    run(`npx openzeppelin update GreeterWrapper --network ${network} --from ${this.from} --no-interactive`)
    truffleExec(`run.js cli-app/GreeterWrapper 0 iteration --network ${network}`).should.eq('17') // 2 (minor) * 3 (triple) + 1 (triple v2) + 10 (wrapper v2)
  })
};

describe(`cli integration on ${network}`, function () {
  runIntegrationTest({ lightweight: false })
})

describe(`cli integration lightweight on ${network}`, function () {
  runIntegrationTest({ lightweight: true })
})
