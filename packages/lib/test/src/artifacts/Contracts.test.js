'use strict'
require('../../setup')

import Contracts from '../../../src/artifacts/Contracts'

contract('Contracts', function() {
  it('can lookup contracts from the local project', async function () {
    const DummyImplementation = Contracts.getFromLocal('DummyImplementation')
    const instance = await DummyImplementation.new()
    instance.address.should.not.be.null
  })

  it('can lookup contract from the lib project', async function () {
    const Initializable = Contracts.getFromLib('Initializable')
    const instance = await Initializable.new()
    instance.address.should.not.be.null
  })

  it('can lookup contracts from node modules', async function () {
    const Greeter = Contracts.getFromNodeModules('mock-dependency', 'Greeter')
    const instance = await Greeter.new()
    instance.address.should.not.be.null
  })

  describe('configuration', function () {
    it('has some default configuration', function () {
      Contracts.getSyncTimeout().should.be.eq(240000)
      Contracts.getLocalBuildDir().should.be.eq(`${process.cwd()}/build/contracts`)
      Contracts.getLocalContractsDir().should.be.eq(`${process.cwd()}/contracts`)
    })

    it('can be set some custom configuration', function () {
      const previousTimeout = Contracts.getSyncTimeout()
      const previousBuildDir = Contracts.getLocalBuildDir()
      const previousContractsDir = Contracts.getLocalContractsDir()

      Contracts.setSyncTimeout(10)
      Contracts.setLocalBuildDir('build/bla')
      Contracts.setLocalContractsDir('bla')

      Contracts.getSyncTimeout().should.be.eq(10)
      Contracts.getLocalBuildDir().should.be.eq('build/bla')
      Contracts.getLocalContractsDir().should.be.eq('bla')

      Contracts.setSyncTimeout(previousTimeout)
      Contracts.setLocalBuildDir(previousBuildDir)
      Contracts.setLocalContractsDir(previousContractsDir)
    })
  })
})
