'use strict'

require('../setup')

import sinon from 'sinon'
import npm from 'npm-programmatic'
import { LibProject } from 'zos-lib'
import Dependency from '../../src/models/dependency/Dependency'

contract('Dependency', function() {
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
  })

  describe('#constructor', function() {
    context('with invalid version', function() {
      it('throws an error',function() {
        assertErrorMessage(() => new Dependency('mock-stdlib', '1.2.0'), /does not match dependency package version/)
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
      it('deploys a dependency', function() {
        const libDeployStub = sinon
          .stub(LibProject, 'fetchOrDeploy')
          .returns({ setImplementation: () => {} })
        this.dependency.deploy(this.txParams)

        libDeployStub.should.have.been.calledWithExactly('1.1.0', this.txParams, this.addresses)
        sinon.restore()
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

    describe('#install', function() {
      it('calls npm install', async function() {
        const npmInstallStub = sinon.stub(npm, 'install')
        const nameAndVersion = 'mock-stdlib@1.1.0'
        const npmParams = { save: true, cwd: process.cwd() }

        await this.dependency.installFn()
        npmInstallStub.should.have.been.calledWithExactly([nameAndVersion], npmParams)
        sinon.restore()
      })
    })
  })

})
