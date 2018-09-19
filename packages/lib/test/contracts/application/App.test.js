'use strict';
require('../../setup')

import Contracts from '../../../src/utils/Contracts'
import assertRevert from '../../../src/test/helpers/assertRevert'
import shouldBehaveLikeApp from '../../../src/test/behaviors/BaseApp';

const Package = Contracts.getFromLocal('Package')
const ImplementationDirectory = Contracts.getFromLocal('ImplementationDirectory')
const VersionedApp = Contracts.getFromLocal('VersionedApp')
const DummyImplementation = Contracts.getFromLocal('DummyImplementation')
const DummyImplementationV2 = Contracts.getFromLocal('DummyImplementationV2')

contract('VersionedApp', (accounts) => {
  const [_, appOwner, packageOwner, directoryOwner, anotherAccount] = accounts;

  const version_0 = 'version_0'
  const version_1 = 'version_1'

  before("initializing dummy implementations", async function () {
    this.implementation_v0 = (await DummyImplementation.new()).address
    this.implementation_v1 = (await DummyImplementationV2.new()).address
  })

  beforeEach("initializing versioned app", async function () {
    this.contractName = 'ERC721';
    this.contractNameUpdated = 'ERC721Updated';
    this.packageName = 'MyProject';

    this.directory = await ImplementationDirectory.new({ from: directoryOwner })
    await this.directory.setImplementation(this.contractName, this.implementation_v0, { from: directoryOwner })
    await this.directory.setImplementation(this.contractNameUpdated, this.implementation_v1, { from: directoryOwner })

    this.package = await Package.new({ from: packageOwner })
    await this.package.addVersion(version_0, this.directory.address, { from: packageOwner });

    this.app = await VersionedApp.new({ from: appOwner })
    await this.app.setPackage(this.packageName, this.package.address, version_0, { from: appOwner });
  })

  shouldBehaveLikeApp(accounts);

  const assertPackage = async function(packageName, expectedAddress, expectedVersion) {
    const [address, version] = await this.app.getPackage(packageName);
    version.should.eq(expectedVersion);
    address.should.eq(expectedAddress);
  }

  describe('setPackage', function () {  
    beforeEach(async function () {
      this.directoryV1 = await ImplementationDirectory.new({ from: directoryOwner })
      await this.package.addVersion(version_1, this.directoryV1.address, { from: packageOwner });
      this.anotherPackage = await Package.new({ from: packageOwner })
      await this.anotherPackage.addVersion(version_0, this.directory.address, { from: packageOwner });
      this.anotherPackageName = 'AnotherPackage';

      this.assertPackage = assertPackage;
    });

    it('registers a new package and version', async function () {
      await this.app.setPackage(this.anotherPackageName, this.anotherPackage.address, version_0, { from: appOwner });
      await this.assertPackage(this.anotherPackageName, this.anotherPackage.address, version_0);
      await this.assertPackage(this.packageName, this.package.address, version_0);
    });

    it('overwrites registered package with the same name', async function () {
      await this.app.setPackage(this.packageName, this.anotherPackage.address, version_0, { from: appOwner });
      await this.assertPackage(this.packageName, this.anotherPackage.address, version_0);
    });

    it('updates existing package version', async function () {
      await this.app.setPackage(this.packageName, this.package.address, version_1, { from: appOwner });
      await this.assertPackage(this.packageName, this.package.address, version_1);
    });

    it('fails if package does not have the required version', async function () {
      await assertRevert(this.app.setPackage(this.anotherPackageName, this.anotherPackage.address, "NOTEXISTS", { from: appOwner }));
    });

    it('fails if called from non-owner account', async function () {
      await assertRevert(this.app.setPackage(this.anotherPackageName, this.anotherPackage.address, version_0, { from: anotherAccount }));
    });
  })

  describe('unsetPackage', function () {
    beforeEach(async function () {
      this.assertPackage = assertPackage;
    });

    it('unsets a package', async function () {
      await this.app.unsetPackage(this.packageName, { from: appOwner });
      const [address, version] = await this.app.getPackage(this.packageName);
      version.should.be.empty;
      address.should.be.zeroAddress;
    })

    it('fails to unset a package from non-owner account', async function () {
      await assertRevert(this.app.unsetPackage(this.packageName, { from: anotherAccount }));
    });

    it('fails to unset a non-existing package', async function () {
      await assertRevert(this.app.unsetPackage("NOTEXISTS", { from: appOwner }));
    });
  });

  describe('getProvider', function () {
    beforeEach(async function () {
      this.anotherDirectory = await ImplementationDirectory.new({ from: directoryOwner });
      this.anotherPackage = await Package.new({ from: packageOwner })
      await this.anotherPackage.addVersion(version_1, this.anotherDirectory.address, { from: packageOwner });
      this.anotherPackageName = 'AnotherPackage';
      await this.app.setPackage(this.anotherPackageName, this.anotherPackage.address, version_1, { from: appOwner });
    });

    it('returns provider from package', async function () {
      const provider = await this.app.getProvider(this.packageName);
      provider.should.eq(this.directory.address);
    });

    it('returns provider from another package', async function () {
      const provider = await this.app.getProvider(this.anotherPackageName);
      provider.should.eq(this.anotherDirectory.address);
    });

    it('returns provider from updated package', async function () {
      await this.app.setPackage(this.packageName, this.anotherPackage.address, version_1, { from: appOwner });
      const provider = await this.app.getProvider(this.packageName);
      provider.should.eq(this.anotherDirectory.address);
    });

    it('returns provider from updated package version', async function () {
      await this.package.addVersion(version_1, this.anotherDirectory.address, { from: packageOwner });
      await this.app.setPackage(this.packageName, this.package.address, version_1, { from: appOwner });
      const provider = await this.app.getProvider(this.packageName);
      provider.should.eq(this.anotherDirectory.address);
    });

    it('returns zero when requested non-existing package name', async function () {
      const provider = await this.app.getProvider("NOTEXISTS");
      provider.should.be.zeroAddress;
    })
  });
})
