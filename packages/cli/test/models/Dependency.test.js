'use strict';

require('../setup');

import sinon from 'sinon';
import npm from 'npm-programmatic';
import Dependency from '../../src/models/dependency/Dependency';

contract('Dependency', function([_, from]) {
  describe('static methods', function() {
    describe('#satisfiesVersion', function() {
      it('verifies if requirement satisfies version', function() {
        Dependency.satisfiesVersion('1.5.9', '^1.1.0').should.be.true;
        Dependency.satisfiesVersion('2.1.0', '^1.0.0').should.be.false;
      });
    });

    describe('#fetchVersionFromNpm', function() {
      it('fetches version from npm', async function () {
        const actual = await Dependency.fetchVersionFromNpm('zos');
        actual.should.match(/^zos@\^2\.\d+\.0$/);
      });

      it('fetches version from npm for org package', async function () {
        const actual = await Dependency.fetchVersionFromNpm('@openzeppelin/cli');
        actual.should.match(/^@openzeppelin\/cli@\^\d+\.\d+\.0$/);
      });
    });

    describe('#fromNameAndVersion', function() {
      describe('with invalid nameAndVersion', function() {
        it('throws error', function() {
          expect(
            () => Dependency.fromNameWithVersion('bildts-kcom')
          ).to.throw(/Could not find dependency bildts-kcom/);
        });
      });

      it('initializes a dependency instance', function() {
        const dependency = Dependency.fromNameWithVersion('mock-stdlib@1.1.0');
        dependency.should.not.be.null;
      });
    });

    describe('#splitNameAndVersion', function () {
      it('parses package name', function () {
        Dependency.splitNameAndVersion('foo').should.deep.eq(['foo', undefined]);
      });

      it('parses package name and version', function () {
        Dependency.splitNameAndVersion('foo@1.2.3').should.deep.eq(['foo', '1.2.3']);
      });

      it('parses organization package', function () {
        Dependency.splitNameAndVersion('@org/foo').should.deep.eq(['@org/foo', undefined]);
      });

      it('parses organization package with version', function () {
        Dependency.splitNameAndVersion('@org/foo@1.2.3').should.deep.eq(['@org/foo', '1.2.3']);
      });

      it('parses organization package with version and prerelease tag', function () {
        Dependency.splitNameAndVersion('@org/foo@1.2.3-rc.1').should.deep.eq(['@org/foo', '1.2.3-rc.1']);
      });
    });

    describe('#install', function() {
      it('calls npm install', async function() {
        const npmInstallStub = sinon.stub(npm, 'install');
        const nameAndVersion = 'mock-stdlib@1.1.0';
        const npmParams = { save: true, cwd: process.cwd() };

        await Dependency.installFn(nameAndVersion);
        npmInstallStub.should.have.been.calledWithExactly(
          [nameAndVersion],
          npmParams,
        );
        sinon.restore();
      });
    });

    describe('#hasDependenciesForDeploy', function() {
      context('when there are dependencies to deploy', function() {
        it('returns true', function() {
          Dependency.hasDependenciesForDeploy(
            'test', 
            'test/mocks/packages/package-with-multiple-stdlibs.zos.json',
            'test/mocks/networks/network-with-stdlibs.zos.test.json'
          ).should.be.true;
        });
      });

      context('when all dependencies are already deployed', function() {
        it('returns false', function() {
          Dependency.hasDependenciesForDeploy(
            'test', 
            'test/mocks/packages/package-with-stdlib.zos.json',
            'test/mocks/networks/network-with-stdlibs.zos.test.json'
          ).should.be.false;
        });
      });

      context.skip('when there are dependencies to update', function() {
        it('returns true', function() {
          Dependency.hasDependenciesForDeploy(
            'test', 
            'test/mocks/packages/package-with-stdlib.zos.json',
            'test/mocks/networks/network-with-older-stdlibs.zos.test.json'
          ).should.be.true;
        });
      });
    });
  });

  describe('#constructor', function() {
    context('with invalid version', function() {
      it('throws an error', function() {
        expect(
          () => new Dependency('mock-stdlib', '1.2.0')
        ).to.throw(/does not match version/);
      });
    });

    context('with non-existent dependency name', function() {
      it('throws an error', function() {
        expect(
          () => new Dependency('bildts-kcom', '1.1.0')
        ).to.throw(/Could not find dependency bildts-kcom/);
      });
    });

    context('with non-ethereum package', function() {
      it('throws an error', function() {
        expect(
          () => new Dependency('chai')
        ).to.throw(/Could not find an \.openzeppelin\/project\.json/);
      });
    });

    context('with valid parameters', function() {
      beforeEach(function() {
        this.dependency = new Dependency('mock-stdlib', '1.1.0');
      });

      it('sets dependency name, version and requirement', function() {
        this.dependency.version.should.equal('1.1.0');
        this.dependency.name.should.equal('mock-stdlib');
        this.dependency.requirement.should.equal('1.1.0');
      });

      it('sets projectFile', function() {
        this.dependency._projectFile.should.not.be.null;
      });
    });
  });

  function testInstanceMethodsFor(libname) {
    describe(`instance methods for ${libname}`, function() {
      beforeEach(function() {
        this.dependency = new Dependency(libname, '1.1.0');
        this.txParams = {};
        this.addresses = {};
        delete this.dependency._projectFile;
      });

      describe('#deploy', function() {
        it('deploys a dependency', async function() {
          const project = await this.dependency.deploy({ from });
          const address = await project.getImplementation({
            contractName: 'Greeter',
          });
          address.should.be.nonzeroAddress;
        });
      });

      describe('#projectFile', function() {
        it('generates a package file', function() {
          const projectFile = this.dependency.projectFile;
          projectFile.should.not.be.null;
          projectFile.filePath.should.match(/mock-stdlib\/zos\.json$/);
          projectFile.version.should.eq('1.1.0');
          projectFile.contracts.should.include({ Greeter: 'GreeterImpl' });
        });
      });

      describe('#getNetworkFile', function() {
        context('for a non-existent network', function() {
          it('throws an error', function() {
            expect(
              () => this.dependency.getNetworkFile('bildts-kcom')
            ).to.throw(/Could not find a project file for network/);
          });
        });

        context('for an existent network', function() {
          it('generates network file', function() {
            const networkFile = this.dependency.getNetworkFile('test');
            networkFile.filePath.should.match(/mock-stdlib\/zos\.test\.json$/);
          });
        });
      });
    });
  }

  testInstanceMethodsFor('mock-stdlib');
  testInstanceMethodsFor('mock-stdlib-root');
});
