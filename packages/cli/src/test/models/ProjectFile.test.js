'use strict';
require('../setup');

import { expect } from 'chai';
import path from 'path';
import ProjectFile from '../../models/files/ProjectFile';
import { MANIFEST_VERSION } from '../../models/files/ManifestVersion';

describe('ProjectFile', function() {
  describe('class methods', function() {
    describe('#getLinkedDependencies', function() {
      it('gets an array of dependencies', function() {
        const dependencies = ProjectFile.getLinkedDependencies('mocks/packages/package-with-stdlib.zos.json');
        dependencies.should.not.be.empty;
        dependencies.should.have.lengthOf(1);
      });
    });
  });

  describe('constructor', function() {
    it('creates empty file', function() {
      const file = new ProjectFile('mocks/packages/new.zos.json');
      file.data.manifestVersion.should.eq(MANIFEST_VERSION);
    });

    it('loads existing file', function() {
      const file = new ProjectFile('mocks/packages/package-with-contracts.zos.json');
      file.data.manifestVersion.should.eq(MANIFEST_VERSION);
      file.name.should.eq('Herbs');
      file.version.should.eq('1.1.0');
      file.contracts.should.include('ImplV1');
    });

    it('fails to load unsupported manifestVersion', function() {
      expect(() => new ProjectFile('mocks/packages/package-unsupported-manifest-version.zos.json')).to.throw(
        /Unrecognized manifest version identifier 3/,
      );
    });
  });

  describe('instance methods', function() {
    describe('#setCompilerOptions', function() {
      it('ensures relative paths to project file', function() {
        const file = new ProjectFile('mocks/packages/new.zos.json');
        file.setCompilerOptions({
          inputDir: path.resolve('mocks/myContracts'), // path.resolve ensures absolute paths
          outputDir: path.resolve('mocks/myBuild/contracts'),
        });

        file.compilerOptions.inputDir.should.eq('../myContracts');
        file.compilerOptions.outputDir.should.eq('../myBuild/contracts');
      });
    });
  });

  it('supports deprecated manifest version', function() {
    const file = new ProjectFile('mocks/packages/package-deprecated-manifest-version.zos.json');
    file.data.zosversion.should.eq('2.2');
  });
});
