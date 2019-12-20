'use strict';
require('../../setup');

import fs from 'fs';
import tmp from 'tmp';
import FileSystem from '../../../src/utils/FileSystem';

describe('FileSystem', () => {
  describe('remove file', function() {
    it('can remove a file', async function() {
      FileSystem.write('tmp', 'dummy');
      fs.existsSync('tmp').should.be.true;

      FileSystem.remove('tmp');
      fs.existsSync('tmp').should.be.false;
    });
  });

  describe('remove tree', function() {
    it('can remove an empty directory', async function() {
      const testDir = tmp.dirSync();
      fs.existsSync(testDir.name).should.be.true;
      FileSystem.removeTree(testDir.name);
      fs.existsSync(testDir.name).should.be.false;
    });

    it('can remove a non-empty directory', async function() {
      const testDir = tmp.dirSync();
      const testFilePath = `${testDir.name}/testfile`;
      FileSystem.write(testFilePath, 'dummy');
      fs.existsSync(testFilePath).should.be.true;
      FileSystem.removeTree(testDir.name);
      fs.existsSync(testDir.name).should.be.false;
    });
  });

  describe('create dir path', function() {
    it('can create a simple dir', async function() {
      const simpleDir = `${process.cwd()}/test/tmp`;
      fs.existsSync(simpleDir).should.be.false;

      fs.mkdirSync(simpleDir, { recursive: true });
      fs.existsSync(simpleDir).should.be.true;
      FileSystem.removeTree(`${process.cwd()}/test/tmp/`);
    });

    it('can create a nested dir', async function() {
      const nestedDir = `${process.cwd()}/test/tmp/nested`;
      fs.existsSync(nestedDir).should.be.false;

      fs.mkdirSync(nestedDir, { recursive: true });
      fs.existsSync(nestedDir).should.be.true;
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

      const source = fs.readFileSync(sourceFilePath, 'utf8').toString();
      const destination = fs.readFileSync(destinationFilePath, 'utf8').toString();
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

      const source = fs.readFileSync(sourceFilePath, 'utf8').toString();
      const destination = fs.readFileSync(destinationFilePath, 'utf8').toString();
      source.should.equal(destination);

      FileSystem.removeTree(testDir.name);
    });
  });
});
