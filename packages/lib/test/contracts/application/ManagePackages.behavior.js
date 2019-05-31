'use strict';

import Contracts from '../../../src/artifacts/Contracts';
import assertRevert from '../../../src/test/helpers/assertRevert';
import { toSemanticVersion } from '../../../src/utils/Semver';

const Package = Contracts.getFromLocal('Package');
const ImplementationDirectory = Contracts.getFromLocal(
  'ImplementationDirectory',
);

export default function shouldManagePackages(accounts) {
  const [_, appOwner, packageOwner, directoryOwner, anotherAccount] = accounts;

  const version0 = toSemanticVersion('1.0.0');
  const version1 = toSemanticVersion('1.1.0');
  const contentURI = '0x10';

  const assertPackage = async function(
    packageName,
    expectedAddress,
    expectedVersion,
  ) {
    let { ['0']: address, ['1']: version } = await this.app.methods
      .getPackage(packageName)
      .call();
    version.should.be.semverEqual(expectedVersion);
    address.should.eq(expectedAddress);
  };

  describe('setPackage', function() {
    beforeEach(async function() {
      this.directoryV1 = await ImplementationDirectory.new({
        from: directoryOwner,
      });
      await this.package.methods
        .addVersion(version1, this.directoryV1.address, contentURI)
        .send({ from: packageOwner });
      this.anotherPackage = await Package.new({ from: packageOwner });
      await this.anotherPackage.methods
        .addVersion(version0, this.directory.address, contentURI)
        .send({ from: packageOwner });
      this.anotherPackageName = 'AnotherPackage';

      this.assertPackage = assertPackage;
    });

    it('registers a new package and version', async function() {
      await this.app.methods
        .setPackage(
          this.anotherPackageName,
          this.anotherPackage.address,
          version0,
        )
        .send({ from: appOwner });
      await this.assertPackage(
        this.anotherPackageName,
        this.anotherPackage.address,
        version0,
      );
      await this.assertPackage(
        this.packageName,
        this.package.address,
        version0,
      );
    });

    it('overwrites registered package with the same name', async function() {
      await this.app.methods
        .setPackage(this.packageName, this.anotherPackage.address, version0)
        .send({ from: appOwner });
      await this.assertPackage(
        this.packageName,
        this.anotherPackage.address,
        version0,
      );
    });

    it('updates existing package version', async function() {
      await this.app.methods
        .setPackage(this.packageName, this.package.address, version1)
        .send({ from: appOwner });
      await this.assertPackage(
        this.packageName,
        this.package.address,
        version1,
      );
    });

    it('fails if package does not have the required version', async function() {
      await assertRevert(
        this.app.methods
          .setPackage(this.anotherPackageName, this.anotherPackage.address, [
            9,
            9,
            9,
          ])
          .send({ from: appOwner }),
      );
    });

    it('fails if called from non-owner account', async function() {
      await assertRevert(
        this.app.methods
          .setPackage(
            this.anotherPackageName,
            this.anotherPackage.address,
            version0,
          )
          .send({ from: anotherAccount }),
      );
    });
  });

  describe('unsetPackage', function() {
    beforeEach(async function() {
      this.assertPackage = assertPackage;
    });

    it('unsets a package', async function() {
      await this.app.methods
        .unsetPackage(this.packageName)
        .send({ from: appOwner });
      let {
        ['0']: address,
        ['1']: version,
      } = await this.app.methods.getPackage(this.packageName).call();
      version.should.be.semverEqual([0, 0, 0]);
      address.should.be.zeroAddress;
    });

    it('fails to unset a package from non-owner account', async function() {
      await assertRevert(
        this.app.methods
          .unsetPackage(this.packageName)
          .send({ from: anotherAccount }),
      );
    });

    it('fails to unset a non-existing package', async function() {
      await assertRevert(
        this.app.methods.unsetPackage('NOTEXISTS').send({ from: appOwner }),
      );
    });
  });

  describe('getProvider', function() {
    beforeEach(async function() {
      this.anotherDirectory = await ImplementationDirectory.new({
        from: directoryOwner,
      });
      this.anotherPackage = await Package.new({ from: packageOwner });
      await this.anotherPackage.methods
        .addVersion(version1, this.anotherDirectory.address, contentURI)
        .send({ from: packageOwner });
      this.anotherPackageName = 'AnotherPackage';
      await this.app.methods
        .setPackage(
          this.anotherPackageName,
          this.anotherPackage.address,
          version1,
        )
        .send({ from: appOwner });
    });

    it('returns provider from package', async function() {
      const provider = await this.app.methods
        .getProvider(this.packageName)
        .call();
      provider.should.eq(this.directory.address);
    });

    it('returns provider from another package', async function() {
      const provider = await this.app.methods
        .getProvider(this.anotherPackageName)
        .call();
      provider.should.eq(this.anotherDirectory.address);
    });

    it('returns provider from updated package', async function() {
      await this.app.methods
        .setPackage(this.packageName, this.anotherPackage.address, version1)
        .send({ from: appOwner });
      const provider = await this.app.methods
        .getProvider(this.packageName)
        .call();
      provider.should.eq(this.anotherDirectory.address);
    });

    it('returns provider from updated package version', async function() {
      await this.package.methods
        .addVersion(version1, this.anotherDirectory.address, contentURI)
        .send({ from: packageOwner });
      await this.app.methods
        .setPackage(this.packageName, this.package.address, version1)
        .send({ from: appOwner });
      const provider = await this.app.methods
        .getProvider(this.packageName)
        .call();
      provider.should.eq(this.anotherDirectory.address);
    });

    it('returns zero when requested non-existing package name', async function() {
      const provider = await this.app.methods.getProvider('NOTEXISTS').call();
      provider.should.be.zeroAddress;
    });
  });
}
