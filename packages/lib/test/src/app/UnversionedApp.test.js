'use strict';
require('../../setup')

import UnversionedApp from '../../../src/app/UnversionedApp';
import shouldBehaveLikeApp from './BaseApp.behavior';
import FreezableImplementationDirectory from '../../../src/directory/FreezableImplementationDirectory';
import { deploy as deployContract } from '../../../src/utils/Transactions';
import Contracts from '../../../src/utils/Contracts'

const ImplV1 = Contracts.getFromLocal('DummyImplementation');
const ImplV2 = Contracts.getFromLocal('DummyImplementationV2');

contract('UnversionedApp', function (accounts) {
  const [_, owner] = accounts;
  const txParams = { from: owner };
  const contractName = 'Impl';
  const packageName = 'MyPackage';
  const anotherPackageName = 'AnotherPackage';

  beforeEach('deploying', async function deploy () {
    this.app = await UnversionedApp.deploy(txParams)
  })

  shouldBehaveLikeApp(UnversionedApp, accounts, {
    setImplementation: async function () {
      this.directory = await FreezableImplementationDirectory.deployLocal([], txParams)
      this.implV1 = await deployContract(ImplV1)
      await this.directory.setImplementation(contractName, this.implV1.address)
      await this.app.setProvider(packageName, this.directory.address)
    },

    setNewImplementation: async function () {
      this.directory = await FreezableImplementationDirectory.deployLocal([], txParams)
      this.implV2 = await deployContract(ImplV2)
      await this.directory.setImplementation(contractName, this.implV2.address)
      await this.app.setProvider(packageName, this.directory.address)
    }
  })

  describe('setProvider', function () {
    it('can set multiple providers', async function () {
      const directory1 = await FreezableImplementationDirectory.deployLocal([], txParams);
      const directory2 = await FreezableImplementationDirectory.deployLocal([], txParams);
      
      await this.app.setProvider(packageName, directory1.address);
      await this.app.setProvider(anotherPackageName, directory2.address);
      
      const provider1 = await this.app.getProvider(packageName);
      provider1.address.should.eq(directory1.address);

      const provider2 = await this.app.getProvider(anotherPackageName);
      provider2.address.should.eq(directory2.address);
    })
  })

  describe('unsetProvider', function () {
    beforeEach('setting provider', async function () {
      this.directory = await FreezableImplementationDirectory.deployLocal([], txParams)
      await this.app.setProvider(packageName, this.directory.address)
    })

    it('unsets a provider', async function () {
      await this.app.unsetProvider(packageName)
      const hasProvider = await this.app.hasProvider(packageName)
      hasProvider.should.be.false
    })
  })
});
