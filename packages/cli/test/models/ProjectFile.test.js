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
      file.data.manifestversion.should.eq(MANIFEST_VERSION);
    });

    it('loads existing file', function() {
      const file = new ProjectFile(
        'test/mocks/packages/package-with-contracts.zos.json',
      );
      file.data.manifestversion.should.eq(MANIFEST_VERSION);
      file.name.should.eq('Herbs');
      file.version.should.eq('1.1.0');
      file.contract('Impl').should.eq('ImplV1');
    });

    it('fails to load missing manifestversion', function() {
      expect(
        () =>
          new ProjectFile(
            'test/mocks/packages/package-missing-manifestversion.zos.json',
          ),
      ).to.throw(/Manifest version identifier not found/);
    });

    it('fails to load unsupported manifestversion', function() {
      expect(
        () =>
          new ProjectFile(
            'test/mocks/packages/package-unsupported-manifestversion.zos.json',
          ),
      ).to.throw(/Unrecognized manifest version identifier 3/);
    });
  });
});
