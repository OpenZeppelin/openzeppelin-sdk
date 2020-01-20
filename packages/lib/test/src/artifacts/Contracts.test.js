'use strict';
require('../../setup');

import Contracts from '../../../src/artifacts/Contracts';

describe('Contracts', function() {
  it('can lookup contracts from the local project', async function() {
    const DummyImplementation = Contracts.getFromLocal('DummyImplementation');
    const instance = await DummyImplementation.new();
    instance.address.should.not.be.null;
  });

  it('can lookup contract from the lib project', async function() {
    const Initializable = Contracts.getFromLib('Initializable');
    const instance = await Initializable.new();
    instance.address.should.not.be.null;
  });

  it('can lookup contracts from node modules', async function() {
    const Greeter = Contracts.getFromNodeModules('mock-dependency', 'Greeter');
    const instance = await Greeter.new();
    instance.address.should.not.be.null;
  });

  it('can lookup contracts from hoisted node modules', async function() {
    const GreeterLib = Contracts.getFromNodeModules('mock-stdlib-root', 'GreeterLib');
    const instance = await GreeterLib.new();
    instance.address.should.not.be.null;
  });

  describe('configuration', function() {
    it('has some default configuration', function() {
      Contracts.getLocalBuildDir().should.be.eq(`${process.cwd()}/build/contracts`);
      Contracts.getLocalContractsDir().should.be.eq(`${process.cwd()}/contracts`);
    });

    describe('setting custom config', function() {
      beforeEach(function() {
        this.previousBuildDir = Contracts.getLocalBuildDir();
        this.previousContractsDir = Contracts.getLocalContractsDir();
      });

      afterEach(function() {
        Contracts.setLocalBuildDir(this.previousBuildDir);
        Contracts.setLocalContractsDir(this.previousContractsDir);
      });

      it('with relative paths', function() {
        Contracts.setLocalBuildDir('build/bla');
        Contracts.setLocalContractsDir('bla');

        Contracts.getLocalBuildDir().should.be.eq(`${process.cwd()}/build/bla`);
        Contracts.getLocalContractsDir().should.be.eq(`${process.cwd()}/bla`);
      });

      it('with absolute paths', function() {
        Contracts.setLocalBuildDir('/foo/bar/build/bla');
        Contracts.setLocalContractsDir('/foo/bar/bla');

        Contracts.getLocalBuildDir().should.be.eq(`/foo/bar/build/bla`);
        Contracts.getLocalContractsDir().should.be.eq(`/foo/bar/bla`);
      });
    });
  });
});
