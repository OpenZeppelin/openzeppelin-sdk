'use strict';
require('../../setup')

import expectEvent from 'openzeppelin-solidity/test/helpers/expectEvent';
import VersionedApp from '../../../src/app/VersionedApp';
import shouldBehaveLikeApp from './BaseApp.behavior';
import FreezableImplementationDirectory from '../../../src/directory/FreezableImplementationDirectory';
import { deploy as deployContract } from '../../../src/utils/Transactions';
import Contracts from '../../../src/utils/Contracts'
import Package from '../../../src/package/Package';
import { ZERO_ADDRESS } from '../../../src/utils/Addresses';

const ImplV1 = Contracts.getFromLocal('DummyImplementation');
const ImplV2 = Contracts.getFromLocal('DummyImplementationV2');

contract('VersionedApp', function (accounts) {
  const [_, owner] = accounts;
  const txParams = { from: owner };
  const contractName = 'Impl';
  const packageName = 'MyPackage';
  const anotherPackageName = 'AnotherPackage';
  const version = '1.0';
  const anotherVersion = '2.0';

  beforeEach('deploying', async function deploy () {
    this.app = await VersionedApp.deploy(txParams)
  })

  shouldBehaveLikeApp(VersionedApp, accounts, {
    setImplementation: async function () {
      this.package = await Package.deploy(txParams)
      this.directory = await this.package.newVersion(version)
      this.implV1 = await deployContract(ImplV1)
      await this.directory.setImplementation(contractName, this.implV1.address)
      await this.app.setPackage(packageName, this.package.address, version)
    },

    setNewImplementation: async function () {
      this.directory = await this.package.newVersion(anotherVersion)
      this.implV2 = await deployContract(ImplV2)
      await this.directory.setImplementation(contractName, this.implV2.address)
      await this.app.setPackage(packageName, this.package.address, anotherVersion)
    }
  })

  async function setPackage() {
    this.package = await Package.deploy(txParams)
    this.directory = await this.package.newVersion(version)
    this.setPackageTx = await this.app.setPackage(packageName, this.package.address, version)
  }

  describe('getPackage', function () {
    beforeEach('setting package', setPackage)

    it('returns package info', async function () {
      const packageInfo = await this.app.getPackage(packageName);
      packageInfo.package.address.should.eq(this.package.address)
      packageInfo.package.should.be.instanceof(Package)
      packageInfo.version.should.eq(version)
    })

    it('returns empty info if not exists', async function () {
      const packageInfo = await this.app.getPackage('NOTEXISTS');
      (packageInfo.package === null).should.be.true
    })
  })

  describe('hasPackage', function () {
    beforeEach('setting package', setPackage)

    it('returns true if exists', async function () {
      const hasPackage = await this.app.hasPackage(packageName)
      hasPackage.should.be.true
    })

    it('returns false if not exists', async function () {
      const hasPackage = await this.app.hasPackage('NOTEXISTS')
      hasPackage.should.be.false
    })
  })

  describe('setPackage', function () {
    it('logs package set', async function () {
      const thepackage = await Package.deploy(txParams)
      await thepackage.newVersion(version)
      await expectEvent.inTransaction(
        this.app.setPackage(packageName, thepackage.address, version),
        'PackageChanged',
        { providerName: packageName, package: thepackage.address, version: version }
      )
    })

    it('can set multiple packages', async function () {
      const package1 = await Package.deploy(txParams)
      const package2 = await Package.deploy(txParams)

      const directory1 = await package1.newVersion(version)
      const directory2 = await package2.newVersion(anotherVersion)

      await this.app.setPackage(packageName, package1.address, version);
      await this.app.setPackage(anotherPackageName, package2.address, anotherVersion);
      
      const provider1 = await this.app.getProvider(packageName);
      provider1.address.should.eq(directory1.address);

      const provider2 = await this.app.getProvider(anotherPackageName);
      provider2.address.should.eq(directory2.address);
    })

    it('can overwrite package version', async function () {
      await setPackage.apply(this)
      await this.package.newVersion(anotherVersion)
      await this.app.setPackage(packageName, this.package.address, anotherVersion)
      const packageInfo = await this.app.getPackage(packageName)
      packageInfo.version.should.eq(anotherVersion)
    })
  })

  describe('unsetPackage', function () {
    beforeEach('setting package', setPackage)

    it('unsets a provider', async function () {
      await expectEvent.inTransaction(
        this.app.unsetPackage(packageName),
        'PackageChanged',
        { providerName: packageName, package: ZERO_ADDRESS, version: "" } 
      )
      const hasProvider = await this.app.hasProvider(packageName)
      hasProvider.should.be.false
    })
  })
});
