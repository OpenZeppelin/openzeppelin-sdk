require('../../setup')

import sinon from 'sinon';

import Truffle from '../../../src/models/config/TruffleConfig';
import * as Compiler from '../../../src/models/compiler/Compiler';
import ProjectFile from '../../../src/models/files/ProjectFile';

describe('Compiler', function () {
  beforeEach('setup', function () {
    Compiler.resetState();
    
    this.solcCompile = sinon.stub(Compiler, 'compileWithSolc').callsFake(({ version }) =>
      Promise.resolve({ compilerVersion: { version: version || '0.5.6' } })
    );
    this.truffleCompile = sinon.stub(Compiler, 'compileWithTruffle');
    this.isTruffleConfig = sinon.stub(Truffle, 'isTruffleProject').returns(false);
    this.projectFile = new ProjectFile('test/mocks/packages/package-empty-lite.zos.json')
    this.compile = (opts, force) => Compiler.compile(opts, this.projectFile, force);
  });

  afterEach('restoring stubs', function () {
    sinon.restore();
  });

  it('compiles with zos if explicitly set', async function () {
    await this.compile({ manager: 'openzeppelin' });
    this.solcCompile.should.have.been.calledOnce;
  });

  it('compiles with truffle if explicitly set', async function () {
    await this.compile({ manager: 'truffle' });
    this.truffleCompile.should.have.been.calledOnce;
  });

  it('throws if invalid manager set', async function () {
    await this.compile({ manager: 'foo' }).should.be.rejectedWith(/Unknown compiler manager/);
  });

  it('compiles with zos if set in local config', async function () {
    this.projectFile.data.compiler = { manager: 'openzeppelin' };
    await this.compile();
    this.solcCompile.should.have.been.calledOnce;
  });

  it('compiles with truffle if set in local config', async function () {
    this.projectFile.data.compiler = { manager: 'truffle' };
    await this.compile();
    this.truffleCompile.should.have.been.calledOnce;
  });

  it('compiles with zos by default', async function () {
    await this.compile();
    this.solcCompile.should.have.been.calledOnce;
  });

  it('compiles with truffle if truffle config found', async function () {
    this.isTruffleConfig.returns(true);
    await this.compile();
    this.truffleCompile.should.have.been.calledOnce;
  });

  it('uses local config compiler settings', async function () {
    this.projectFile.data.compiler = { solcVersion: '0.5.3' };
    await this.compile();
    this.solcCompile.should.have.been.calledWithMatch({ version: '0.5.3' });
  });

  it('prefers explicitly set compiler settings over local config', async function () {
    this.projectFile.data.compiler = { solcVersion: '0.5.3' };
    await this.compile({ version: '0.5.4' });
    this.solcCompile.should.have.been.calledWithMatch({ version: '0.5.4' });
  });

  it('updates local config with compiler settings after running', async function () {
    this.projectFile.data.compiler = { solcVersion: '0.5.3' };
    await this.compile({ version: '0.5.4' });
    this.projectFile.compilerOptions.version.should.eq('0.5.4');
  });

  it('updates local config with default compiler version after running', async function () {
    await this.compile();
    this.projectFile.compilerOptions.version.should.eq('0.5.6');
  });

  it('does not compile twice', async function () {
    await this.compile();
    await this.compile();
    this.solcCompile.should.have.been.calledOnce;
  });

  it('compiles twice if forced', async function () {
    await this.compile();
    await this.compile({}, true);
    this.solcCompile.should.have.been.calledTwice;
  });
});
