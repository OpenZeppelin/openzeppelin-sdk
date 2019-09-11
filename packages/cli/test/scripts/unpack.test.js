'use strict';
require('../setup');

import sinon from 'sinon';
import fs from 'fs-extra';
import axios from 'axios';

import { OPEN_ZEPPELIN_FOLDER } from '../../src/models/files/constants';
import child from '../../src/utils/child';
import patch, { cache } from '../../src/utils/patch';
import unpack from '../../src/scripts/unpack';
import { MANIFEST_VERSION } from '../../src/models/files/KitFile';

const simpleGit = patch('simple-git/promise');

const repo = 'openzeppelin/starter-kit';
const url = 'https://github.com/openzeppelin/starter-kit.git';

const properConfig = {
  manifestVersion: MANIFEST_VERSION,
  message: 'Please, continue at https://github.com/openzeppelin/starter-kit',
  files: [],
  hooks: {},
};

describe('unpack script', function() {
  let gitMock;

  beforeEach('stub git calls', async function() {
    const git = simpleGit();
    this.git = git;
    gitMock = sinon.mock(git);
    gitMock.expects('init').once();
    gitMock
      .expects('addRemote')
      .once()
      .withExactArgs('origin', url);
    gitMock.expects('fetch');
    
    sinon.stub(cache, 'simple-git/promise').returns(git);

    sinon.stub(child, 'exec').returns(Promise.resolve());
    sinon.stub(fs, 'readdir').returns(Promise.resolve([OPEN_ZEPPELIN_FOLDER]));
    sinon.stub(fs, 'remove').returns(Promise.resolve());
    sinon.stub(fs, 'pathExists').returns(Promise.resolve(true));

    const axiosStub = sinon.stub(axios, 'get');
    axiosStub
      .withArgs(url.replace('.git', '/stable/kit.json').replace('github.com', 'raw.githubusercontent.com'))
      .returns(
        Promise.resolve({
          data: properConfig,
        }),
      );
  });

  afterEach(function() {
    sinon.restore();
    gitMock.restore();
  });

  context('on default branch', function () {

    beforeEach(function () {
      sinon.stub(this.git, 'pull');
    });

    it('should unpack kit to current directory by name', async function() {
      await unpack({ repoOrName: 'starter' });
      gitMock.verify();
    });

    it('should unpack kit to current directory by repo', async function() {
      await unpack({ repoOrName: repo });
      gitMock.verify();
    });

    it('should fail with random name', async function() {
      await unpack({ repoOrName: 'lskdjflkdsj' }).should.be.rejectedWith(/Kit named lskdjflkdsj doesn\'t exist/);
    });

    it('should fail with random repo', async function() {
      await unpack({
        repoOrName: 'lskdjflkdsj/sdlkfjlksjfkl',
      }).should.be.rejectedWith(/Failed to verify/);
    });

    it('should fail if no kit name or repo specified', async function() {
      await unpack({ repoOrName: undefined }).should.be.rejectedWith(/A kit name or GitHub repo must be provided/);
    });

    it('should fail if there are files inside the directory', async function() {
      fs.readdir.restore();
      sinon.stub(fs, 'readdir').returns(Promise.resolve([OPEN_ZEPPELIN_FOLDER, 'random']));
      await unpack({ repoOrName: repo }).should.be.rejectedWith(
        `Unable to unpack ${url} in the current directory, as it must be empty.`,
      );
    });

    it('should fail with wrong kit version', async function() {
      axios.get.restore();
      sinon.stub(axios, 'get').returns(
        Promise.resolve({
          data: {
            ...properConfig,
            manifestVersion: '9000',
          },
        }),
      );
      await unpack({ repoOrName: repo }).should.be.rejectedWith(/Unrecognized kit version identifier/);
    });

    it('should fail with wrong json kit', async function() {
      axios.get.restore();
      sinon.stub(axios, 'get').returns(
        Promise.resolve({
          data: {
            hacker: '1337',
          },
        }),
      );
      await unpack({ repoOrName: repo }).should.be.rejectedWith(/kit.json is not valid/);
    });

    it('should checkout only the files specified in a config', async function() {
      gitMock
        .expects('checkout')
        .once()
        .withExactArgs(['origin/stable', '--', 'hello', 'second']);
      axios.get.restore();
      sinon.stub(axios, 'get').returns(
        Promise.resolve({
          data: {
            ...properConfig,
            files: ['hello', 'second'],
          },
        }),
      );
      await unpack({ repoOrName: 'starter' });
      gitMock.verify();
    });
  });

  context('on custom branch', function () {

    it('should checkout a specified branch', async function () {
      gitMock
        .expects('pull')
        .once()
        .withExactArgs('origin', 'feature/foobar');
      
      axios.get.restore();    
      sinon.stub(axios, 'get')
        .withArgs(url.replace('.git', '/feature/foobar/kit.json').replace('github.com', 'raw.githubusercontent.com'))
        .returns(
          Promise.resolve({
            data: properConfig,
          }),
        );

      await unpack({ repoOrName: 'openzeppelin/starter-kit#feature/foobar' });
      gitMock.verify();
    });

    it('should checkout only files specified in a config from a specified branch', async function () {
      gitMock
        .expects('checkout')
        .once()
        .withExactArgs(['origin/feature/foobar', '--', 'hello', 'second']);
      
      axios.get.restore();    
      sinon.stub(axios, 'get')
        .withArgs(url.replace('.git', '/feature/foobar/kit.json').replace('github.com', 'raw.githubusercontent.com'))
        .returns(
          Promise.resolve({
            data: {
              ...properConfig,
              files: ['hello', 'second'],
            }
          }),
        );

      await unpack({ repoOrName: 'openzeppelin/starter-kit#feature/foobar' });
      gitMock.verify();
    });
  });
});
