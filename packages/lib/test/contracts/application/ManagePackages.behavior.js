'use strict';

import Contracts from '../../../src/artifacts/Contracts'
import assertRevert from '../../../src/test/helpers/assertRevert'
import { toSemanticVersion } from '../../../src/utils/Semver';

const Package = Contracts.getFromLocal('Package')
const ImplementationDirectory = Contracts.getFromLocal('ImplementationDirectory')

export default function shouldManagePackages(accounts) {
  const [_, appOwner, packageOwner, directoryOwner, anotherAccount] = accounts;

  const version_0 = toSemanticVersion('1.0.0')
  const version_1 = toSemanticVersion('1.1.0')
  const contentURI = "0x10"

  const assertPackage = async function(packageName, expectedAddress, expectedVersion) {
    const [address, version] = await this.app.getPackage(packageName);
    version.should.be.semverEqual(expectedVersion);
    address.should.eq(expectedAddress);
  }

  describe('setPackage', function () {  
    beforeEach(async function () {
      this.directoryV1 = await ImplementationDirectory.new({ from: directoryOwner })
      await this.package.addVersion(version_1, this.directoryV1.address, contentURI, { from: packageOwner });
      this.anotherPackage = await Package.new({ from: packageOwner })
      await this.anotherPackage.addVersion(version_0, this.directory.address, contentURI, { from: packageOwner });
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
      await assertRevert(this.app.setPackage(this.anotherPackageName, this.anotherPackage.address, [9,9,9], { from: appOwner }));
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
      version.should.be.semverEqual([0,0,0]);
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
      await this.anotherPackage.addVersion(version_1, this.anotherDirectory.address, contentURI, { from: packageOwner });
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
      await this.package.addVersion(version_1, this.anotherDirectory.address, contentURI, { from: packageOwner });
      await this.app.setPackage(this.packageName, this.package.address, version_1, { from: appOwner });
      const provider = await this.app.getProvider(this.packageName);
      provider.should.eq(this.anotherDirectory.address);
    });

    it('returns zero when requested non-existing package name', async function () {
      const provider = await this.app.getProvider("NOTEXISTS");
      provider.should.be.zeroAddress;
    })
  });
}