'use strict';
require('../../setup');

import tmp from 'tmp';
import FileSystem from '../../../src/utils/FileSystem';

contract('FileSystem', () => {
  describe('remove file', function() {
    it('can remove a file', async function() {
      FileSystem.write('tmp', 'dummy');
      FileSystem.exists('tmp').should.be.true;

      FileSystem.remove('tmp');
      FileSystem.exists('tmp').should.be.false;
    });
  });

  describe('remove tree', function() {
    it('can remove an empty directory', async function() {
      const testDir = tmp.dirSync();
      FileSystem.exists(testDir.name).should.be.true;
      FileSystem.removeTree(testDir.name);
      FileSystem.exists(testDir.name).should.be.false;
    });

    it('can remove a non-empty directory', async function() {
      const testDir = tmp.dirSync();
      const testFilePath = `${testDir.name}/testfile`;
      FileSystem.write(testFilePath, 'dummy');
      FileSystem.exists(testFilePath).should.be.true;
      FileSystem.removeTree(testDir.name);
      FileSystem.exists(testDir.name).should.be.false;
    });
  });

  describe('create dir path', function() {
    it('can create a simple dir', async function() {
      const simpleDir = `${process.cwd()}/test/tmp`;
      FileSystem.exists(simpleDir).should.be.false;

      FileSystem.createDirPath(simpleDir);
      FileSystem.exists(simpleDir).should.be.true;
      FileSystem.removeTree(`${process.cwd()}/test/tmp/`);
    });

    it('can create a nested dir', async function() {
      const nestedDir = `${process.cwd()}/test/tmp/nested`;
      FileSystem.exists(nestedDir).should.be.false;

      FileSystem.createDirPath(nestedDir);
      FileSystem.exists(nestedDir).should.be.true;
      FileSystem.removeTree(`${process.cwd()}/test/tmp/`);
    });
  });

  describe('copy', function() {
    it('can copy a file when the destination does not exist', function() {
      const testDir = tmp.dirSync();
      const sourceFilePath = `${testDir.name}/test`;
      const destinationFilePath = `${testDir.name}/testCopy`;
      FileSystem.write(sourceFilePath, 'Hello, World!');

      FileSystem.copy(sourceFilePath, destinationFilePath);

      const source = FileSystem.read(sourceFilePath).toString();
      const destination = FileSystem.read(destinationFilePath).toString();
      source.should.equal(destination);

      FileSystem.removeTree(testDir.name);
    });

    it('can copy a file when the destination already exists', function() {
      const testDir = tmp.dirSync();
      const sourceFilePath = `${testDir.name}/test`;
      const destinationFilePath = `${testDir.name}/testCopy`;
      FileSystem.write(sourceFilePath, 'Hello, World!');
      FileSystem.write(destinationFilePath, 'Foobar');

      FileSystem.copy(sourceFilePath, destinationFilePath);

      const source = FileSystem.read(sourceFilePath).toString();
      const destination = FileSystem.read(destinationFilePath).toString();
      source.should.equal(destination);

      FileSystem.removeTree(testDir.name);
    });
  });
});
