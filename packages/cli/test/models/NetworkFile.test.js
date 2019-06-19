'use strict';
require('../setup');

const expect = require('chai').expect;

import NetworkFile from '../../src/models/files/NetworkFile';
import ProjectFile from '../../src/models/files/ProjectFile';
import { MANIFEST_VERSION } from '../../src/models/files/ManifestVersion';

contract('NetworkFile', function() {
  beforeEach('loads parent package file', function() {
    this.appPackageFile = new ProjectFile(
      'test/mocks/packages/package-empty.zos.json',
    );
  });

  describe('class methods', function() {
    describe('#getDependencies', function() {
      context('on network file with dependencies', function() {
        it('returns an object with dependencies', function() {
          const dependencies = NetworkFile.getDependencies(
            'test/mocks/networks/network-with-stdlibs.zos.test.json',
          );
          dependencies.should.not.be.empty;
          dependencies.should.have.all.keys('mock-stdlib', 'mock-stdlib-2');
        });
      });

      context('on network file without dependencies', function() {
        it('returns an empty object', function() {
          const dependencies = NetworkFile.getDependencies(
            'test/mocks/networks/network-app-with-contract.zos.test.json',
          );
          expect(dependencies).to.be.undefined;
        });
      });
    });
  });

  describe('constructor', function() {
    it('creates empty file', function() {
      const file = new NetworkFile(
        this.appPackageFile,
        'test',
        'test/mocks/networks/new.test.json',
      );
      file.data.manifestVersion.should.eq(MANIFEST_VERSION);
    });

    it('loads existing file', function() {
      const file = new NetworkFile(
        this.appPackageFile,
        'test',
        'test/mocks/networks/network-app-with-contract.zos.test.json',
      );
<<<<<<< ae0d974ad8d68dfaa1ec24a058d6487fd756b700
<<<<<<< 70b1a54816d33fd4d81dbaa70f91dc6b30b4c87a:packages/cli/test/models/NetworkFile.test.js
      file.data.manifestVersion.should.eq(MANIFEST_VERSION);
=======
      file.data.manifestversion.should.eq(MANIFEST_VERSION);
>>>>>>> Rename ZosPackageFile, ZosNetworkFile, ZosVersion, and zosversion:packages/cli/test/models/NetworkFile.test.js
=======
      file.data.manifestVersion.should.eq(MANIFEST_VERSION);
>>>>>>> Support manifestVersion
      file.packageAddress.should.eq(
        '0x0000000000000000000000000000000000000080',
      );
      file.providerAddress.should.eq(
        '0x0000000000000000000000000000000000000010',
      );
      file.contract('Greeter').address.should.eq('0x1020');
    });

<<<<<<< ae0d974ad8d68dfaa1ec24a058d6487fd756b700
<<<<<<< 70b1a54816d33fd4d81dbaa70f91dc6b30b4c87a:packages/cli/test/models/NetworkFile.test.js
    it('fails to load missing manifestVersion', function() {
=======
    it('fails to load missing manifestversion', function() {
>>>>>>> Rename ZosPackageFile, ZosNetworkFile, ZosVersion, and zosversion:packages/cli/test/models/NetworkFile.test.js
=======
    it('fails to load missing manifestVersion', function() {
>>>>>>> Support manifestVersion
      expect(
        () =>
          new NetworkFile(
            this.appPackageFile,
            'test',
<<<<<<< ae0d974ad8d68dfaa1ec24a058d6487fd756b700
<<<<<<< 70b1a54816d33fd4d81dbaa70f91dc6b30b4c87a:packages/cli/test/models/NetworkFile.test.js
            'test/mocks/networks/network-missing-manifest-version.zos.test.json',
=======
            'test/mocks/networks/network-missing-manifestversion.zos.test.json',
>>>>>>> Rename ZosPackageFile, ZosNetworkFile, ZosVersion, and zosversion:packages/cli/test/models/NetworkFile.test.js
=======
            'test/mocks/networks/network-missing-manifest-version.zos.test.json',
>>>>>>> Support manifestVersion
          ),
      ).to.throw(/Manifest version identifier not found/);
    });

<<<<<<< ae0d974ad8d68dfaa1ec24a058d6487fd756b700
<<<<<<< 70b1a54816d33fd4d81dbaa70f91dc6b30b4c87a:packages/cli/test/models/NetworkFile.test.js
    it('fails to load unsupported manifestVersion', function() {
=======
    it('fails to load unsupported manifestversion', function() {
>>>>>>> Rename ZosPackageFile, ZosNetworkFile, ZosVersion, and zosversion:packages/cli/test/models/NetworkFile.test.js
=======
    it('fails to load unsupported manifestVersion', function() {
>>>>>>> Support manifestVersion
      expect(
        () =>
          new NetworkFile(
            this.appPackageFile,
            'test',
<<<<<<< ae0d974ad8d68dfaa1ec24a058d6487fd756b700
<<<<<<< 70b1a54816d33fd4d81dbaa70f91dc6b30b4c87a:packages/cli/test/models/NetworkFile.test.js
            'test/mocks/networks/network-unsupported-manifest-version.zos.test.json',
=======
            'test/mocks/networks/network-unsupported-manifestversion.zos.test.json',
>>>>>>> Rename ZosPackageFile, ZosNetworkFile, ZosVersion, and zosversion:packages/cli/test/models/NetworkFile.test.js
=======
            'test/mocks/networks/network-unsupported-manifest-version.zos.test.json',
>>>>>>> Support manifestVersion
          ),
      ).to.throw(/Unrecognized manifest version identifier 3/);
    });
  });
});
