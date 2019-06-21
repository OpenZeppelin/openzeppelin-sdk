'use strict';
require('../setup');

const expect = require('chai').expect;

import NetworkFile from '../../src/models/files/NetworkFile';
import ProjectFile from '../../src/models/files/ProjectFile';
import { MANIFEST_VERSION } from '../../src/models/files/ManifestVersion';

contract('NetworkFile', function() {
  beforeEach('loads parent package file', function() {
    this.appProjectFile = new ProjectFile(
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
        this.appProjectFile,
        'test',
        'test/mocks/networks/new.test.json',
      );
      file.data.manifestVersion.should.eq(MANIFEST_VERSION);
    });

    it('loads existing file', function() {
      const file = new NetworkFile(
        this.appProjectFile,
        'test',
        'test/mocks/networks/network-app-with-contract.zos.test.json',
      );
      file.data.manifestVersion.should.eq(MANIFEST_VERSION);
      file.packageAddress.should.eq(
        '0x0000000000000000000000000000000000000080',
      );
      file.providerAddress.should.eq(
        '0x0000000000000000000000000000000000000010',
      );
      file.contract('Greeter').address.should.eq('0x1020');
    });

    it('fails to load missing manifestVersion', function() {
      expect(
        () =>
          new NetworkFile(
            this.appProjectFile,
            'test',
            'test/mocks/networks/network-missing-manifest-version.zos.test.json',
          ),
      ).to.throw(/Manifest version identifier not found/);
    });

    it('fails to load unsupported manifestVersion', function() {
      expect(
        () =>
          new NetworkFile(
            this.appProjectFile,
            'test',
            'test/mocks/networks/network-unsupported-manifest-version.zos.test.json',
          ),
      ).to.throw(/Unrecognized manifest version identifier 3/);
    });
  });
});
