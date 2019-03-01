'use strict'

require('../setup')

import sinon from 'sinon'
import npm from 'npm-programmatic'
import { FileSystem as fs } from 'zos-lib'
import Dependency from '../../src/models/dependency/Dependency'

contract('Dependency', function([_, from]) {
  const assertErrorMessage = (fn, errorMessage) => {
    try {
      fn()
    } catch(error) {
      error.message.should.match(errorMessage)
    }
  }

  describe('static methods', function() {
    describe('#satisfiesVersion', function() {
      it('verifies if requirement satisfies version', function() {
        Dependency.satisfiesVersion('1.5.9', '^1.1.0').should.be.true
        Dependency.satisfiesVersion('2.1.0', '^1.0.0').should.be.false
      })
    })

    describe('#fromNameAndVersion', function() {
      describe('with invalid nameAndVersion', function() {
        it('throws error', function() {
          assertErrorMessage(() => Dependency.fromNameWithVersion('bildts-kcom'), /Could not find a zos.json file/)
        })
      })

      it('initializes a dependency instance', function() {
        const dependency = Dependency.fromNameWithVersion('mock-stdlib@1.1.0')
        dependency.should.not.be.null
      })
    })

    describe('#install', function() {
      it('calls npm install', async function() {
        const npmInstallStub = sinon.stub(npm, 'install')
        const nameAndVersion = 'mock-stdlib@1.1.0'
        const npmParams = { save: true, cwd: process.cwd() }

        await Dependency.installFn(nameAndVersion)
        npmInstallStub.should.have.been.calledWithExactly([nameAndVersion], npmParams)
        sinon.restore()
      })
    })


    describe('#hasDependenciesForDeploy', function() {
      afterEach('restore sinon', function() {
        sinon.restore()
      })

      context('when there are dependencies to deploy', function() {
        it('returns true', function () {
          const projectPackageFile = fs.parseJsonIfExists('test/mocks/packages/package-with-multiple-stdlibs.zos.json')
          const projectNetworkFile = fs.parseJsonIfExists('test/mocks/networks/network-with-stdlibs.zos.test.json')
          const stubbedParseJsonIfExists = sinon.stub(fs, 'parseJsonIfExists')
          stubbedParseJsonIfExists.withArgs('zos.json').returns(projectPackageFile)
          stubbedParseJsonIfExists.withArgs('zos.test.json').returns(projectNetworkFile)

          Dependency.hasDependenciesForDeploy('test').should.be.true
        })
      })

      context('when all dependencies are already deployed', function() {
        it('returns false', function() {
          const projectPackageFile = fs.parseJsonIfExists('test/mocks/packages/package-with-stdlib.zos.json')
          const projectNetworkFile = fs.parseJsonIfExists('test/mocks/networks/network-with-stdlibs.zos.test.json')
          const stubbedParseJsonIfExists = sinon.stub(fs, 'parseJsonIfExists')
          stubbedParseJsonIfExists.withArgs('zos.json').returns(projectPackageFile)
          stubbedParseJsonIfExists.withArgs('zos.test.json').returns(projectNetworkFile)

          Dependency.hasDependenciesForDeploy('test').should.be.false
        })
      })
    })
  })

  describe('#constructor', function() {
    context('with invalid version', function() {
      it('throws an error',function() {
        assertErrorMessage(() => new Dependency('mock-stdlib', '1.2.0'), /does not match version/)
      })
    })

    context('with non-existent dependency name', function() {
      it('throws an error',function() {
        assertErrorMessage(() => new Dependency('bildts-kcom', '1.1.0'), /Could not find a zos.json file/)
      })
    })

    context('with valid parameters', function() {
      beforeEach(function() {
        this.dependency = new Dependency('mock-stdlib', '1.1.0')
      })

      it('sets dependency name, version and requirement', function() {
        this.dependency.version.should.equal('1.1.0')
        this.dependency.name.should.equal('mock-stdlib')
        this.dependency.requirement.should.equal('1.1.0')
      })

      it('sets packageFile', function() {
        this.dependency._packageFile.should.not.be.null
      })
    })
  })

  describe('instance methods', function() {
    beforeEach(function() {
      this.dependency = new Dependency('mock-stdlib', '1.1.0')
      this.txParams = {}
      this.addresses = {}
      delete this.dependency._packageFile
    })

    describe('#deploy', function() {
      it('deploys a dependency', async function() {
        const project = await this.dependency.deploy({ from });
        const address = await project.getImplementation({ contractName: 'Greeter' });
        address.should.be.nonzeroAddress;
      })
    })

    describe('#getPackageFile', function() {
      it('generates a package file', function() {
        const packageFile = this.dependency.getPackageFile()
        packageFile.should.not.be.null
        packageFile.fileName.should.eq('node_modules/mock-stdlib/zos.json')
        packageFile.version.should.eq('1.1.0')
        packageFile.contracts.should.include({ Greeter: 'GreeterImpl' })
      })
    })

    describe('#getNetworkFile', function() {
      context('for a non-existent network', function() {
        it('throws an error', function() {
          assertErrorMessage(() => this.dependency.getNetworkFile('bildts-kcom'), /Could not find a zos file for network/)
        })
      })

      context('for an existent network', function() {
        it ('generates network file', function() {
          const networkFile = this.dependency.getNetworkFile('test')
          networkFile.fileName.should.eq('node_modules/mock-stdlib/zos.test.json')
        })
      })
    })
  })

})
