'use strict'
require('../setup');

import sinon from 'sinon';
import fs from 'fs-extra';
import child from '../../src/utils/child';
import patch, { cache } from '../../src/utils/patch';
import unpack from '../../src/scripts/unpack';

const simpleGit = patch('simple-git/promise');

const repo = 'zeppelinos/zepkit';
const url = 'https://github.com/zeppelinos/zepkit.git';

describe('unpack script', function() {
  let gitMock;

  beforeEach('stub git calls', async function() {

    const git = simpleGit();
    gitMock = sinon.mock(git);
    gitMock.expects('init').once();
    gitMock.expects('addRemote').once().withExactArgs('origin', url);
    gitMock.expects('pull').once();

    sinon.stub(cache, 'simple-git/promise').returns(git);

    sinon.stub(child, 'exec').returns(Promise.resolve());
    sinon.stub(fs, 'readdir').returns(Promise.resolve(['.zos.lock']));
    sinon.stub(fs, 'remove').returns(Promise.resolve());
    sinon.stub(fs, 'pathExists').returns(Promise.resolve(true));
    sinon.stub(cache, 'ora').returns({
      start: sinon.fake.returns({ succeed: sinon.fake() })
    });

  });

  afterEach(function() {
    sinon.restore();
    gitMock.restore();
  });

  it('should unpack kit to current directory by name', async function () {
    await unpack({ repoOrName: 'ZepKit' });
    gitMock.verify();
  });

  it('should unpack kit to current directory by repo', async function () {
    await unpack({ repoOrName: repo });
    gitMock.verify();
  });

  it('should fail with random name', async function () {
    await unpack({ repoOrName: 'lskdjflkdsj' })
      .should.be.rejectedWith(/Kit with such name doesn't exist/);
  });

  it('should fail with random repo', async function () {
    await unpack({ repoOrName: 'lskdjflkdsj/sdlkfjlksjfkl' })
      .should.be.rejectedWith(/Failed to verify/);
  });

  it('should fail with random repo', async function () {
    await unpack({ repoOrName: 'lskdjflkdsj/sdlkfjlksjfkl' })
      .should.be.rejectedWith(/Failed to verify/);
  });

  it('should fail if there are files inside the directory', async function () {
    fs.readdir.restore();
    sinon.stub(fs, 'readdir').returns(Promise.resolve(['.zos.lock', 'random']));
    await unpack({ repoOrName: repo })
      .should.be.rejectedWith(/The directory must be empty/);
  });

});
