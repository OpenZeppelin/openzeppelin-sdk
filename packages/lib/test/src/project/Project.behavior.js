'use strict'
require('../../setup')

import Contracts from '../../../src/utils/Contracts';

const DummyImplementation = Contracts.getFromLocal('DummyImplementation')

export default function shouldBehaveLikeProject(deploy, fetch, { onNewVersion } = {}) {
  const version = '0.2.0'
  const newVersion = '0.3.0'
  const contractName = 'Dummy'

  const shouldInitializePackage = function () {
    it('creates a package', async function () {
      const thepackage = await this.project.getProjectPackage()
      thepackage.address.should.be.nonzeroAddress
    })

    it('creates a directory', async function () {
      const directory = await this.project.getCurrentDirectory()
      directory.address.should.be.nonzeroAddress
    })

    it('registers directory in the package', async function () {
      const thepackage = await this.project.getProjectPackage()
      const packageDirectory = await thepackage.getDirectory(version)
      const projectDirectory = await this.project.getCurrentDirectory()
      packageDirectory.address.should.eq(projectDirectory.address)
    })
  }

  beforeEach('deploying project', deploy)

  describe('deploy', function () {
    shouldInitializePackage()
  })

  describe('fetch', function () {
    beforeEach('fetching project', fetch)
    shouldInitializePackage()
  })

  describe('newVersion', function () {
    beforeEach('creating new version', async function () {
      await this.project.newVersion(newVersion)
    })

    it('sets a new version', async function () {
      this.project.version.should.eq(newVersion)
    })

    it('registers a new directory', async function () {
      const thepackage = await this.project.getProjectPackage()
      const packageDirectory = await thepackage.getDirectory(newVersion)
      const projectDirectory = await this.project.getCurrentDirectory()
      packageDirectory.address.should.eq(projectDirectory.address)
    })

    if (onNewVersion) onNewVersion()
  })

  describe('setImplementation', function () {
    it('registers a new implementation', async function() {
      const newImplementation = await this.project.setImplementation(DummyImplementation, contractName)
      const thepackage = await this.project.getProjectPackage()
      const implementation = await thepackage.getImplementation(version, contractName)
      implementation.should.eq(newImplementation.address)
    })

    it('registers a new implementation on a new version', async function() {
      await this.project.newVersion(newVersion)
      const newImplementation = await this.project.setImplementation(DummyImplementation, contractName)
      const thepackage = await this.project.getProjectPackage()
      const implementation = await thepackage.getImplementation(newVersion, contractName)
      implementation.should.eq(newImplementation.address)
    })
  })

  describe('unsetImplementation', function () {
    it('unsets an implementation', async function () {
      await this.project.setImplementation(DummyImplementation, contractName)
      await this.project.unsetImplementation(contractName)

      const thepackage = await this.project.getCurrentDirectory()
      const implementation = await thepackage.getImplementation(version, contractName)
      implementation.should.be.zeroAddress
    })
  })
};