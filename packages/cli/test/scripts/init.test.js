'use strict';
require('../setup');

import sinon from 'sinon';
import { FileSystem as fs } from '@openzeppelin/upgrades';
import { cleanup } from '../helpers/cleanup';

import init from '../../src/scripts/init';
import ProjectFile from '../../src/models/files/ProjectFile';
import ConfigManager from '../../src/models/config/ConfigManager';

describe('init script', function() {
  const name = 'MyApp';
  const version = '0.3.0';
  const tmpDir = 'test/tmp';

  before('create tmp dir and stub ZosConfig#initialize', function() {
    fs.createDir(tmpDir);
    sinon.stub(ConfigManager, 'initialize').returns();
  });

  after('cleanup tmp dir', function() {
    cleanup(tmpDir);
    sinon.restore();
  });

  beforeEach('create package file', async function() {
    this.projectFile = new ProjectFile(`${tmpDir}/zos.json`);
  });

  it('should default to unpublished apps', async function() {
    await init({ name, version, projectFile: this.projectFile });
    this.projectFile.isPublished.should.eq(false);
  });

  function testInit(publish) {
    it('should have correct publish mark', async function() {
      await init({ publish, name, version, projectFile: this.projectFile });
      this.projectFile.isPublished.should.eq(publish);
    });

    it('should have the appropriate app name', async function() {
      await init({ publish, name, version, projectFile: this.projectFile });
      this.projectFile.hasName(name).should.be.true;
    });

    it('should have a default version if not specified', async function() {
      await init({ publish, name, projectFile: this.projectFile });
      this.projectFile.isCurrentVersion('0.1.0').should.be.true;
    });

    it('should have the appropriate version', async function() {
      await init({ publish, name, version, projectFile: this.projectFile });
      this.projectFile.isCurrentVersion(version).should.be.true;
    });

    it('should have an empty contracts object', async function() {
      await init({ publish, name, version, projectFile: this.projectFile });
      this.projectFile.contracts.should.be.eql({});
    });

    it('should set dependency', async function() {
      await init({
        publish,
        name,
        version,
        dependencies: ['mock-stdlib@1.1.0'],
        projectFile: this.projectFile,
      });
      this.projectFile.getDependencyVersion('mock-stdlib').should.eq('1.1.0');
    });

    it('should not overwrite existing file by default', async function() {
      fs.writeJson(this.projectFile.filePath, { name: 'previousApp' });
      await init({
        publish,
        name,
        version,
        projectFile: this.projectFile,
      }).should.be.rejectedWith(`Cannot overwrite existing file ${this.projectFile.filePath}`);

      cleanup(this.projectFile.filePath);
    });

    it('should overwrite existing file if requested', async function() {
      fs.writeJson(this.projectFile.filePath, {
        name: 'previousApp',
        version: '0',
      });
      await init({
        publish,
        name,
        version,
        force: true,
        projectFile: this.projectFile,
      });

      this.projectFile.hasName(name).should.be.true;
      this.projectFile.isCurrentVersion(version).should.be.true;

      cleanup(this.projectFile.filePath);
    });
  }

  describe('when not publishing the project', function() {
    testInit(false);
  });

  describe('when publishing the project', function() {
    testInit(true);
  });
});
