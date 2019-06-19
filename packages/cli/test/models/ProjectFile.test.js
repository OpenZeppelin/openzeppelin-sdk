'use strict';
require('../setup');

import ProjectFile from '../../src/models/files/ProjectFile';
import { MANIFEST_VERSION } from '../../src/models/files/ManifestVersion';

contract('ProjectFile', function() {
  describe('class methods', function() {
    describe('#getLinkedDependencies', function() {
      it('gets an array of dependencies', function() {
        const dependencies = ProjectFile.getLinkedDependencies(
          'test/mocks/packages/package-with-stdlib.zos.json',
        );
        dependencies.should.not.be.empty;
        dependencies.should.have.lengthOf(1);
      });
    });
  });

  describe('constructor', function() {
    it('creates empty file', function() {
      const file = new ProjectFile('test/mocks/packages/new.zos.json');
<<<<<<< ae0d974ad8d68dfaa1ec24a058d6487fd756b700
<<<<<<< 70b1a54816d33fd4d81dbaa70f91dc6b30b4c87a
      file.data.manifestVersion.should.eq(MANIFEST_VERSION);
=======
      file.data.manifestversion.should.eq(MANIFEST_VERSION);
>>>>>>> Rename ZosPackageFile, ZosNetworkFile, ZosVersion, and zosversion
=======
      file.data.manifestVersion.should.eq(MANIFEST_VERSION);
>>>>>>> Support manifestVersion
    });

    it('loads existing file', function() {
      const file = new ProjectFile(
        'test/mocks/packages/package-with-contracts.zos.json',
      );
<<<<<<< ae0d974ad8d68dfaa1ec24a058d6487fd756b700
<<<<<<< 70b1a54816d33fd4d81dbaa70f91dc6b30b4c87a
      file.data.manifestVersion.should.eq(MANIFEST_VERSION);
=======
      file.data.manifestversion.should.eq(MANIFEST_VERSION);
>>>>>>> Rename ZosPackageFile, ZosNetworkFile, ZosVersion, and zosversion
=======
      file.data.manifestVersion.should.eq(MANIFEST_VERSION);
>>>>>>> Support manifestVersion
      file.name.should.eq('Herbs');
      file.version.should.eq('1.1.0');
      file.contract('Impl').should.eq('ImplV1');
    });

<<<<<<< ae0d974ad8d68dfaa1ec24a058d6487fd756b700
<<<<<<< 70b1a54816d33fd4d81dbaa70f91dc6b30b4c87a
    it('fails to load missing manifestVersion', function() {
      expect(
        () =>
          new ProjectFile(
            'test/mocks/packages/package-missing-manifest-version.zos.json',
=======
    it('fails to load missing manifestversion', function() {
      expect(
        () =>
          new ProjectFile(
            'test/mocks/packages/package-missing-manifestversion.zos.json',
>>>>>>> Rename ZosPackageFile, ZosNetworkFile, ZosVersion, and zosversion
=======
    it('fails to load missing manifestVersion', function() {
      expect(
        () =>
          new ProjectFile(
            'test/mocks/packages/package-missing-manifest-version.zos.json',
>>>>>>> Support manifestVersion
          ),
      ).to.throw(/Manifest version identifier not found/);
    });

<<<<<<< ae0d974ad8d68dfaa1ec24a058d6487fd756b700
<<<<<<< 70b1a54816d33fd4d81dbaa70f91dc6b30b4c87a
    it('fails to load unsupported manifestVersion', function() {
      expect(
        () =>
          new ProjectFile(
            'test/mocks/packages/package-unsupported-manifest-version.zos.json',
=======
    it('fails to load unsupported manifestversion', function() {
      expect(
        () =>
          new ProjectFile(
            'test/mocks/packages/package-unsupported-manifestversion.zos.json',
>>>>>>> Rename ZosPackageFile, ZosNetworkFile, ZosVersion, and zosversion
=======
    it('fails to load unsupported manifestVersion', function() {
      expect(
        () =>
          new ProjectFile(
            'test/mocks/packages/package-unsupported-manifest-version.zos.json',
>>>>>>> Support manifestVersion
          ),
      ).to.throw(/Unrecognized manifest version identifier 3/);
    });
  });
});
