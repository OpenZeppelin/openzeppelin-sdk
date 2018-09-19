'use strict';
require('../../setup')

import Contracts from '../../../src/utils/Contracts'
import shouldBehaveLikeApp from '../../../src/test/behaviors/BaseApp';
import assertRevert from '../../../src/test/helpers/assertRevert';

const ImplementationDirectory = Contracts.getFromLocal('ImplementationDirectory')
const DummyImplementation = Contracts.getFromLocal('DummyImplementation')
const DummyImplementationV2 = Contracts.getFromLocal('DummyImplementationV2')
const UnversionedApp = Contracts.getFromLocal('UnversionedApp')

contract('UnversionedApp', (accounts) => {
  const [_, appOwner, directoryOwner, anotherAccount] = accounts;

  before("initializing dummy implementations", async function () {
    this.implementation_v0 = (await DummyImplementation.new()).address
    this.implementation_v1 = (await DummyImplementationV2.new()).address
  })

  beforeEach("initializing unversioned app", async function () {
    this.contractName = 'ERC721';
    this.contractNameUpdated = 'ERC721Updated';
    this.packageName = 'MyProject';

    this.directory = await ImplementationDirectory.new({ from: directoryOwner })
    await this.directory.setImplementation(this.contractName, this.implementation_v0, { from: directoryOwner })
    await this.directory.setImplementation(this.contractNameUpdated, this.implementation_v1, { from: directoryOwner })

    this.app = await UnversionedApp.new({ from: appOwner })
    await this.app.setProvider(this.packageName, this.directory.address, { from: appOwner });
  })

  shouldBehaveLikeApp(accounts);

  describe('setProvider', function () {
    const anotherPackageName = 'AnotherProject';

    beforeEach('initializing another directory', async function () {
      this.anotherDirectory = await ImplementationDirectory.new({ from: directoryOwner });
    });

    it('sets a provider with a different name', async function () {
      await this.app.setProvider(anotherPackageName, this.anotherDirectory.address, { from: appOwner });
      const provider = await this.app.getProvider(anotherPackageName);
      provider.should.eq(this.anotherDirectory.address);
    })

    it('overwrites existing provider', async function () {
      await this.app.setProvider(this.packageName, this.anotherDirectory.address, { from: appOwner });
      const provider = await this.app.getProvider(this.packageName);
      provider.should.eq(this.anotherDirectory.address);
    })

    it('fails to set provider from another account', async function () {
      await assertRevert(this.app.setProvider(anotherPackageName, this.anotherDirectory.address, { from: anotherAccount }));
    })

    it('fails to set a provider to zero', async function () {
      await assertRevert(this.app.setProvider(anotherPackageName, "0x0000000000000000000000000000000000000000", { from: appOwner }));
    })
  })

  describe('unsetProvider', function () {
    it('unsets provider', async function () {
      await this.app.unsetProvider(this.packageName, { from: appOwner });
      const provider = await this.app.getProvider(this.packageName);
      provider.should.be.zeroAddress;
    })

    it('fails to unset non-existing provider', async function () {
      await assertRevert(this.app.unsetProvider("NOTEXISTS", { from: appOwner }));
    })

    it('fails to unset provider from another account', async function () {
      await assertRevert(this.app.unsetProvider(this.packageName, { from: anotherAccount }));
    })
  })
})
