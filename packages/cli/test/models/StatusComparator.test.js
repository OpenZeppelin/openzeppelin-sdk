'use strict'
require('../setup')

import { Contracts, getStorageLayout, bytecodeDigest } from 'zos-lib'

import push from '../../src/scripts/push'
import link from '../../src/scripts/link'
import StatusChecker from '../../src/models/status/StatusChecker'
import ZosPackageFile from '../../src/models/files/ZosPackageFile'
import StatusComparator from '../../src/models/status/StatusComparator'

const ImplV1 = Contracts.getFromLocal('ImplV1')
const ChildImplV1 = Contracts.getFromLocal('ChildImplV1')

contract('StatusComparator', function([_, owner, anotherAddress]) {
  const network = 'test'
  const txParams = { from: owner }

  describe('app', function () {
    beforeEach('initializing network file and status checker', async function () {
      init.call(this, 'test/mocks/packages/package-empty.zos.json')
    })

    beforeEach('deploying an app', async function () {
      await push({ network, txParams, networkFile: this.networkFile })
      this.project = await this.checker.setProject()
      this.directory = await this.project.getCurrentDirectory()
    })

    testVersion()
    testImplementations()
    testPackage()
    testProvider()
    testProxies()
    testDependencies()
  })

  function init(fileName) {
    this.packageFile = new ZosPackageFile(fileName)
    this.networkFile = this.packageFile.networkFile(network)
    this.comparator = new StatusComparator()
    this.checker = new StatusChecker(this.comparator, this.networkFile, txParams)
  }


  function testVersion() {
    describe('version', function () {
      describe('when the network file shows a different version than the one set in the App contract', function () {
        const newVersion = '2.0.0'
        beforeEach(async function () {
          await this.project.newVersion(newVersion)
        })

        it('reports that diff', async function () {
          await this.checker.checkVersion()

          this.comparator.reports.should.have.lengthOf(1)
          this.comparator.reports[0].expected.should.be.equal('1.1.0')
          this.comparator.reports[0].observed.should.be.equal('2.0.0')
          this.comparator.reports[0].description.should.be.equal('App version does not match')
        })
      })

      describe('when the network file version matches with the one in the App contract', function () {
        it('does not report any diff', async function () {
          await this.checker.checkVersion()
          this.comparator.reports.should.be.empty
        })
      })
    })
  }

  function testPackage() {
    describe('package', function () {
      describe('when the network file shows a different package address than the one set in the App contract', function () {
        beforeEach(async function () {
          this.networkFile.package = { address: '0x10' }
        })

        it('reports that diff', async function () {
          await this.checker.checkPackage()

          this.comparator.reports.should.have.lengthOf(1)
          this.comparator.reports[0].expected.should.be.equal(this.networkFile.packageAddress)
          this.comparator.reports[0].observed.should.be.equal(this.project.package.address)
          this.comparator.reports[0].description.should.be.equal('Package address does not match')
        })
      })

      describe('when the network file package matches with the one in the App contract', function () {
        it('does not report any diff', async function () {
          await this.checker.checkPackage()

          this.comparator.reports.should.be.empty
        })
      })
    })
  }

  function testProvider () {
    describe('provider', function () {
      describe('when the network file shows a different provider address than the one set in the App contract', function () {
        beforeEach(async function () {
          await this.project.newVersion('2.0.0')
          this.directory = await this.project.getCurrentDirectory()
          this.networkFile.version = '2.0.0'
        })

        it('reports that diff', async function () {
          await this.checker.checkProvider()

          this.comparator.reports.should.have.lengthOf(1)
          this.comparator.reports[0].expected.should.be.equal(this.networkFile.providerAddress)
          this.comparator.reports[0].observed.should.be.equal(this.directory.address)
          this.comparator.reports[0].description.should.be.equal('Provider address does not match')
        })
      })

      describe('when the network file provider matches with the one in the App contract', function () {
        it('does not report any diff', async function () {
          await this.checker.checkProvider()

          this.comparator.reports.should.be.empty
        })
      })
    })
  }

  function testDependencies() {
    describe('dependencies', function() {
      beforeEach('set dependency params', async function() {
        this.dep1 = { name: 'mock-stdlib-undeployed', version: '1.1.0' }
        this.dep2 = { name: 'mock-stdlib-undeployed-2', version: '1.2.0' }
      })

      describe('when the app project does not have dependencies', function() {
        describe('when the network file does not have any dependency', function() {
          it('does not report diffs', async function() {
            await this.checker.checkDependencies()

            this.comparator.reports.should.be.empty
          })
        })

        describe('when the network file has dependencies', function() {
          it('reports that diff', async function() {
            this.networkFile.setDependency('an-awesome-dependency', { version: '1.0.0', package: '0x01' })
            await this.checker.checkDependencies()

            this.comparator.reports.should.have.lengthOf(1)
            this.comparator.reports[0].expected.should.be.equal('one')
            this.comparator.reports[0].observed.should.be.equal('none')
            this.comparator.reports[0].description.should.be.equal(`Dependency with name an-awesome-dependency at address 0x01 is not registered`)
          })
        })
      })

      describe('when the app project has dependencies', function () {
        beforeEach('set project with multiple dependencies', async function () {
          const dependencies = [`${this.dep1.name}@${this.dep1.version}`, `${this.dep2.name}@${this.dep2.version}`]
          await link({ dependencies, packageFile: this.packageFile });
          await push({ network, txParams, deployDependencies: true, networkFile: this.networkFile });
          this.dep1 = { ...this.dep1, address: this.networkFile.getDependency(this.dep1.name).package }
          this.dep2 = { ...this.dep2, address: this.networkFile.getDependency(this.dep2.name).package }
        })

        describe('when the network file has all matching dependencies', function() {
          it('does not report diffs', async function() {
            await this.checker.checkDependencies()

            this.comparator.reports.should.be.empty
          })
        })

        describe('when the network file does not have any matching dependency', function () {
          it('reports that diff', async function () {
            this.networkFile.unsetDependency(this.dep1.name)
            this.networkFile.unsetDependency(this.dep2.name)
            await this.checker.checkDependencies()

            this.comparator.reports.should.have.lengthOf(2)
            this.comparator.reports[0].expected.should.be.equal('none')
            this.comparator.reports[0].observed.should.be.equal('one')
            this.comparator.reports[0].description.should.be.equal(`Missing registered dependency ${this.dep1.name} at ${this.dep1.address}`)
            this.comparator.reports[1].expected.should.be.equal('none')
            this.comparator.reports[1].observed.should.be.equal('one')
            this.comparator.reports[1].description.should.be.equal(`Missing registered dependency ${this.dep2.name} at ${this.dep2.address}`)
          })
        })

        describe('when the network file has only one matching dependency', function() {
          it('reports that diff', async function() {
            this.networkFile.unsetDependency(this.dep1.name)
            await this.checker.checkDependencies()

            this.comparator.reports.should.have.lengthOf(1)
            this.comparator.reports[0].expected.should.be.equal('none')
            this.comparator.reports[0].observed.should.be.equal('one')
            this.comparator.reports[0].description.should.be.equal(`Missing registered dependency ${this.dep1.name} at ${this.dep1.address}`)
          })
        })

        describe('when the network file has a dependency with wrong dependency address', function() {
          it('reports that diff', async function() {
            const address = this.dep1.address
            this.networkFile.updateDependency(this.dep1.name, (dependency) => ({ ...dependency, package: '0x01' }))
            await this.checker.checkDependencies()

            this.comparator.reports.should.have.lengthOf(1)
            this.comparator.reports[0].expected.should.be.equal('0x01')
            this.comparator.reports[0].observed.should.be.equal(address)
            this.comparator.reports[0].description.should.be.equal(`Package address of ${this.dep1.name} does not match`)
          })
        })

        describe('when the network file has a dependency with wrong version', function() {
          it('reports that diff', async function() {
            const version = this.dep1.version
            this.networkFile.updateDependency(this.dep1.name, (dependency) => ({ ...dependency, version: '2.0.0' }))
            await this.checker.checkDependencies()

            this.comparator.reports.should.have.lengthOf(1)
            this.comparator.reports[0].expected.should.be.equal('2.0.0')
            this.comparator.reports[0].observed.should.be.semverEqual(version)
            this.comparator.reports[0].description.should.be.equal(`Package version of ${this.dep1.name} does not match`)
          })
        })

        describe('when the network file has other dependency that is not deployed', function() {
          it('reports that diff', async function() {
            this.networkFile.setDependency('non-registered-dependency', { package: '0x01', version: '1.0.0' })
            await this.checker.checkDependencies()

            this.comparator.reports.should.have.lengthOf(1)
            this.comparator.reports[0].expected.should.be.equal('one')
            this.comparator.reports[0].observed.should.be.equal('none')
            this.comparator.reports[0].description.should.be.equal(`Dependency with name non-registered-dependency at address 0x01 is not registered`)
          })
        })
      })
    })
  }

  function testImplementations () {
    describe('implementations', function () {
      describe('when the network file does not have any contract', function () {
        describe('when the directory of the current version does not have any contract', function () {
          it('does not report any diff', async function () {
            await this.checker.checkImplementations()

            this.comparator.reports.should.be.empty
          })
        })

        describe('when the directory of the current version has one contract', function () {
          beforeEach('registering new implementation in AppDirectory', async function () {
            this.impl = await this.project.setImplementation(ImplV1, 'Impl')
          })

          it('reports that diff', async function () {
            await this.checker.checkImplementations()

            this.comparator.reports.should.have.lengthOf(1)
            this.comparator.reports[0].expected.should.be.equal('none')
            this.comparator.reports[0].observed.should.be.equal('one')
            this.comparator.reports[0].description.should.be.equal(`Missing registered contract Impl at ${this.impl.address}`)
          })
        })

        describe('when the directory of the current version has many contracts', function () {
          beforeEach('registering two new implementations in AppDirectory', async function () {
            this.impl = await this.project.setImplementation(ImplV1, 'Impl')
            this.childImpl = await this.project.setImplementation(ChildImplV1, 'ChildImpl')
          })

          it('reports one diff per contract', async function () {
            await this.checker.checkImplementations()

            this.comparator.reports.should.have.lengthOf(2)
            this.comparator.reports[0].expected.should.be.equal('none')
            this.comparator.reports[0].observed.should.be.equal('one')
            this.comparator.reports[0].description.should.be.equal(`Missing registered contract Impl at ${this.impl.address}`)
            this.comparator.reports[1].expected.should.be.equal('none')
            this.comparator.reports[1].observed.should.be.equal('one')
            this.comparator.reports[1].description.should.be.equal(`Missing registered contract ChildImpl at ${this.childImpl.address}`)
          })
        })

        describe('when the directory of the current version has many contracts and some of them where unregistered', function () {
          beforeEach('registering two new implementations in AppDirectory', async function () {
            await this.project.setImplementation(ImplV1, 'Impl')
            await this.project.unsetImplementation('Impl')
            this.childImpl = await this.project.setImplementation(ChildImplV1, 'ChildImpl')
          })

          it('reports one diff per contract', async function () {
            await this.checker.checkImplementations()

            this.comparator.reports.should.have.lengthOf(1)
            this.comparator.reports[0].expected.should.be.equal('none')
            this.comparator.reports[0].observed.should.be.equal('one')
            this.comparator.reports[0].description.should.be.equal(`Missing registered contract ChildImpl at ${this.childImpl.address}`)
          })
        })
      })

      describe('when the network file has some contracts', function () {
        beforeEach('adding some contracts', async function () {
          this.impl = await ImplV1.new()
          this.childImpl = await ChildImplV1.new()

          this.networkFile.addContract('Impl', this.impl, getStorageLayout(ImplV1))
          this.networkFile.addContract('ChildImpl', this.childImpl, getStorageLayout(ChildImplV1))
        })

        describe('when the directory of the current version does not have any contract', function () {
          it('reports that diff', async function () {
            await this.checker.checkImplementations()

            this.comparator.reports.should.have.lengthOf(2)
            this.comparator.reports[0].expected.should.be.equal('one')
            this.comparator.reports[0].observed.should.be.equal('none')
            this.comparator.reports[0].description.should.be.equal(`A contract Impl at ${this.impl.address} is not registered`)
            this.comparator.reports[1].expected.should.be.equal('one')
            this.comparator.reports[1].observed.should.be.equal('none')
            this.comparator.reports[1].description.should.be.equal(`A contract ChildImpl at ${this.childImpl.address} is not registered`)
          })
        })

        describe('when the directory of the current version has one of those contract', function () {
          describe('when the directory has the same address and same bytecode for that contract', function () {
            beforeEach('registering new implementation in AppDirectory', async function () {
              await this.directory.setImplementation('Impl', this.impl.address)
            })

            it('reports only the missing contract', async function () {
              await this.checker.checkImplementations()

              this.comparator.reports.should.have.lengthOf(1)
              this.comparator.reports[0].expected.should.be.equal('one')
              this.comparator.reports[0].observed.should.be.equal('none')
              this.comparator.reports[0].description.should.be.equal(`A contract ChildImpl at ${this.childImpl.address} is not registered`)
            })
          })

          describe('when the directory has another address for that contract', function () {
            beforeEach('registering new implementation in AppDirectory', async function () {
              await this.directory.setImplementation('Impl', this.childImpl.address)
            })

            it('reports those diffs', async function () {
              await this.checker.checkImplementations()

              this.comparator.reports.should.have.lengthOf(3)
              this.comparator.reports[0].expected.should.be.equal(this.impl.address)
              this.comparator.reports[0].observed.should.be.equal(this.childImpl.address)
              this.comparator.reports[0].description.should.be.equal('Address for contract Impl does not match')
              this.comparator.reports[1].expected.should.be.equal(bytecodeDigest(ImplV1.deployedBytecode))
              this.comparator.reports[1].observed.should.be.equal(bytecodeDigest(ChildImplV1.deployedBytecode))
              this.comparator.reports[1].description.should.be.equal(`Bytecode at ${this.childImpl.address} for contract Impl does not match`)
              this.comparator.reports[2].expected.should.be.equal('one')
              this.comparator.reports[2].observed.should.be.equal('none')
              this.comparator.reports[2].description.should.be.equal(`A contract ChildImpl at ${this.childImpl.address} is not registered`)
            })
          })

          describe('when the bytecode for that contract is different', function () {
            beforeEach('registering new implementation in AppDirectory', async function () {
              const contracts = this.networkFile.contracts
              contracts.Impl.bodyBytecodeHash = '0x0'
              this.networkFile.contracts = contracts
              await this.directory.setImplementation('Impl', this.impl.address)
            })

            it('reports both diffs', async function () {
              await this.checker.checkImplementations()

              this.comparator.reports.should.have.lengthOf(2)
              this.comparator.reports[0].expected.should.be.equal('0x0')
              this.comparator.reports[0].observed.should.be.equal(bytecodeDigest(ImplV1.deployedBytecode))
              this.comparator.reports[0].description.should.be.equal(`Bytecode at ${this.impl.address} for contract Impl does not match`)
              this.comparator.reports[1].expected.should.be.equal('one')
              this.comparator.reports[1].observed.should.be.equal('none')
              this.comparator.reports[1].description.should.be.equal(`A contract ChildImpl at ${this.childImpl.address} is not registered`)
            })
          })
        })

        describe('when the directory of the current version has both contracts', function () {
          beforeEach('registering new implementation in AppDirectory', async function () {
            await this.directory.setImplementation('Impl', this.impl.address)
            await this.directory.setImplementation('ChildImpl', this.childImpl.address)
          })

          it('does not report any diff ', async function () {
            await this.checker.checkImplementations()

            this.comparator.reports.should.be.empty
          })
        })

        describe('when the directory of the current version has many contracts and some of them where unregistered', function () {
          beforeEach('registering two new implementations in AppDirectory', async function () {
            await this.directory.setImplementation('Impl', this.impl.address)
            await this.directory.unsetImplementation('Impl')
            await this.directory.setImplementation('ChildImpl', this.childImpl.address)
          })

          it('reports one diff per contract', async function () {
            await this.checker.checkImplementations()

            this.comparator.reports.should.have.lengthOf(1)
            this.comparator.reports[0].expected.should.be.equal('one')
            this.comparator.reports[0].observed.should.be.equal('none')
            this.comparator.reports[0].description.should.be.equal(`A contract Impl at ${this.impl.address} is not registered`)
          })
        })
      })
    })
  }

  function testProxies () {
    describe('proxies', function () {
      beforeEach('adding some contracts', async function () {
        this.impl = await ImplV1.new()
        this.childImpl = await ChildImplV1.new()

        this.networkFile.addContract('Impl', this.impl, getStorageLayout(ImplV1))
        this.networkFile.addContract('ChildImpl', this.childImpl, getStorageLayout(ChildImplV1))

        await this.directory.setImplementation('Impl', this.impl.address)
        await this.directory.unsetImplementation('Impl', txParams)
        await this.directory.setImplementation('ChildImpl', this.childImpl.address)
        await this.directory.setImplementation('Impl', this.impl.address)
      })

      describe('when the network file does not have any proxies', function () {
        describe('when the app does not have any proxy registered', function () {
          it('does not report any diff', async function () {
            await this.checker.checkProxies()

            this.comparator.reports.should.be.empty
          })
        })

        describe('when the app has one proxy registered', function () {
          beforeEach('registering new implementation in AppDirectory', async function () {
            this.proxy = await this.project.createProxy(ImplV1, { contractName: 'Impl', initMethod: 'initialize', initArgs: [42] })
          })

          it('reports that diff', async function () {
            await this.checker.checkProxies()

            this.comparator.reports.should.have.lengthOf(1)
            this.comparator.reports[0].expected.should.be.equal('none')
            this.comparator.reports[0].observed.should.be.equal('one')
            this.comparator.reports[0].description.should.be.equal(`Missing registered proxy of Impl at ${this.proxy.address} pointing to ${this.impl.address}`)
          })
        })

        describe('when the app has many proxies registered', function () {
          beforeEach('registering new implementation in AppDirectory', async function () {
            this.implProxy = await this.project.createProxy(ImplV1, { contractName: 'Impl', initMethod: 'initialize', initArgs: [42] })
            this.childImplProxy = await this.project.createProxy(ChildImplV1, { contractName: 'ChildImpl', initMethod: 'initialize', initArgs: [1] })
          })

          it('reports that diff', async function () {
            await this.checker.checkProxies()

            this.comparator.reports.should.have.lengthOf(2)
            this.comparator.reports[0].expected.should.be.equal('none')
            this.comparator.reports[0].observed.should.be.equal('one')
            this.comparator.reports[0].description.should.be.equal(`Missing registered proxy of Impl at ${this.implProxy.address} pointing to ${this.impl.address}`)
            this.comparator.reports[1].expected.should.be.equal('none')
            this.comparator.reports[1].observed.should.be.equal('one')
            this.comparator.reports[1].description.should.be.equal(`Missing registered proxy of ChildImpl at ${this.childImplProxy.address} pointing to ${this.childImpl.address}`)
          })
        })
      })

      describe('when the network file has two proxies', function () {
        beforeEach('adding a proxy', async function () {
          const implementations = [
            { implementation: this.impl.address, address: '0x1', version: '1.0.0' },
            { implementation: this.impl.address, address: '0x2', version: '1.0.0' }
          ]
          this.networkFile.setProxies(this.packageFile.name, 'Impl', implementations)
        })

        describe('when the app does not have any proxy registered', function () {
          it('reports those diffs', async function () {
            await this.checker.checkProxies()

            this.comparator.reports.should.be.have.lengthOf(2)
            this.comparator.reports[0].expected.should.be.equal('one')
            this.comparator.reports[0].observed.should.be.equal('none')
            this.comparator.reports[0].description.should.be.equal(`A proxy of Impl at 0x1 pointing to ${this.impl.address} is not registered`)
            this.comparator.reports[1].expected.should.be.equal('one')
            this.comparator.reports[1].observed.should.be.equal('none')
            this.comparator.reports[1].description.should.be.equal(`A proxy of Impl at 0x2 pointing to ${this.impl.address} is not registered`)
          })
        })

        describe('when the app has one proxy registered', function () {
          beforeEach('creating a proxy', async function () {
            this.proxy = await this.project.createProxy(ImplV1, { contractName: 'Impl', initMethod: 'initialize', initArgs: [42] })
          })

          describe('when it matches one proxy address', function () {
            describe('when it matches the alias and the implementation address', function () {
              beforeEach('changing network file', async function () {
                const implementations = [
                  { implementation: this.impl.address, address: '0x1', version: '1.0.0' },
                  { implementation: this.impl.address, address: this.proxy.address, version: '1.0.0' },
                ]
                this.networkFile.setProxies(this.packageFile.name, 'Impl', implementations)
              })

              it('reports that diff', async function () {
                await this.checker.checkProxies()

                this.comparator.reports.should.have.lengthOf(1)
                this.comparator.reports[0].expected.should.be.equal('one')
                this.comparator.reports[0].observed.should.be.equal('none')
                this.comparator.reports[0].description.should.be.equal(`A proxy of Impl at 0x1 pointing to ${this.impl.address} is not registered`)
              })
            })

            describe('when it matches the alias but not the implementation address', function () {
              beforeEach('changing network file', async function () {
                const implementations = [
                  { implementation: this.impl.address, address: '0x1', version: '1.0.0' },
                  { implementation: this.childImpl.address, address: this.proxy.address, version: '1.0.0' },
                ]
                this.networkFile.setProxies(this.packageFile.name, 'Impl', implementations)
              })

              it('reports that diff', async function () {
                await this.checker.checkProxies()

                this.comparator.reports.should.have.lengthOf(2)
                this.comparator.reports[0].expected.should.be.equal(this.childImpl.address)
                this.comparator.reports[0].observed.should.be.equal(this.impl.address)
                this.comparator.reports[0].description.should.be.equal(`Pointed implementation of Impl proxy at ${this.proxy.address} does not match`)
                this.comparator.reports[1].expected.should.be.equal('one')
                this.comparator.reports[1].observed.should.be.equal('none')
                this.comparator.reports[1].description.should.be.equal(`A proxy of Impl at 0x1 pointing to ${this.impl.address} is not registered`)
              })
            })

            describe('when it matches the implementation address but not the alias', function () {
              beforeEach('changing network file', async function () {
                const { name: packageName } = this.packageFile
                this.networkFile.setProxies(packageName, 'Impl', [{ implementation: this.impl.address, address: '0x1', version: '1.0.0' }])
                this.networkFile.setProxies(packageName, 'ChildImpl', [{ implementation: this.impl.address, address: this.proxy.address, version: '1.0.0' }])
              })

              it('reports that diff', async function () {
                await this.checker.checkProxies()

                this.comparator.reports.should.have.lengthOf(2)
                this.comparator.reports[0].expected.should.be.equal('ChildImpl')
                this.comparator.reports[0].observed.should.be.equal('Impl')
                this.comparator.reports[0].description.should.be.equal(`Alias of proxy at ${this.proxy.address} pointing to ${this.impl.address} does not match`)
                this.comparator.reports[1].expected.should.be.equal('one')
                this.comparator.reports[1].observed.should.be.equal('none')
                this.comparator.reports[1].description.should.be.equal(`A proxy of Impl at 0x1 pointing to ${this.impl.address} is not registered`)
              })
            })

            describe('when it does not match the alias and the implementation address', function () {
              beforeEach('changing network file', async function () {
                const { name: packageName } = this.packageFile
                this.networkFile.setProxies(packageName, 'Impl', [{ implementation: this.impl.address, address: '0x1', version: '1.0.0' }])
                this.networkFile.setProxies(packageName, 'ChildImpl', [{ implementation: this.childImpl.address, address: this.proxy.address, version: '1.0.0' }])
              })

              it('reports that diff', async function () {
                await this.checker.checkProxies()

                this.comparator.reports.should.have.lengthOf(3)
                this.comparator.reports[0].expected.should.be.equal('ChildImpl')
                this.comparator.reports[0].observed.should.be.equal('Impl')
                this.comparator.reports[0].description.should.be.equal(`Alias of proxy at ${this.proxy.address} pointing to ${this.impl.address} does not match`)
                this.comparator.reports[1].expected.should.be.equal(this.childImpl.address)
                this.comparator.reports[1].observed.should.be.equal(this.impl.address)
                this.comparator.reports[1].description.should.be.equal(`Pointed implementation of Impl proxy at ${this.proxy.address} does not match`)
                this.comparator.reports[2].expected.should.be.equal('one')
                this.comparator.reports[2].observed.should.be.equal('none')
                this.comparator.reports[2].description.should.be.equal(`A proxy of Impl at 0x1 pointing to ${this.impl.address} is not registered`)
              })
            })
          })

          describe('when it does not match any proxy address', function () {
            it('reports those diffs', async function () {
              await this.checker.checkProxies()

              this.comparator.reports.should.have.lengthOf(3)
              this.comparator.reports[0].expected.should.be.equal('none')
              this.comparator.reports[0].observed.should.be.equal('one')
              this.comparator.reports[0].description.should.be.equal(`Missing registered proxy of Impl at ${this.proxy.address} pointing to ${this.impl.address}`)
              this.comparator.reports[1].expected.should.be.equal('one')
              this.comparator.reports[1].observed.should.be.equal('none')
              this.comparator.reports[1].description.should.be.equal(`A proxy of Impl at 0x1 pointing to ${this.impl.address} is not registered`)
              this.comparator.reports[2].expected.should.be.equal('one')
              this.comparator.reports[2].observed.should.be.equal('none')
              this.comparator.reports[2].description.should.be.equal(`A proxy of Impl at 0x2 pointing to ${this.impl.address} is not registered`)
            })
          })
        })
      })
    })
  }
})
