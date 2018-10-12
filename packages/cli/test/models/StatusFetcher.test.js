'use strict'
require('../setup')

import { Contracts, bodyCode, bytecodeDigest, constructorCode, getStorageLayout  } from 'zos-lib'

import push from '../../src/scripts/push'
import link from '../../src/scripts/link'
import StatusChecker from '../../src/models/status/StatusChecker'
import StatusFetcher from '../../src/models/status/StatusFetcher'
import ZosPackageFile from '../../src/models/files/ZosPackageFile'

const ImplV1 = Contracts.getFromLocal('ImplV1')
const ChildImplV1 = Contracts.getFromLocal('ChildImplV1')

contract('StatusFetcher', async function([_, owner, anotherAddress]) {
  const network = 'test'
  const txParams = { from: owner }


  describe('app', function () {
    beforeEach('initializing network file and status checker', async function () {
      init.call(this, 'test/mocks/packages/package-empty.zos.json');
    })
  
    beforeEach('deploying an app', async function () {
      await push({ network, txParams, networkFile: this.networkFile })
      this.project = await this.checker.setProject()
      this.directory = await this.project.getCurrentDirectory()
    })

    testVersion();
    testImplementations();
    testPackage();
    testProvider();
    testProxies();
    testDependencies();
  });

  describe('lib', function () {
    beforeEach('initializing network file and status checker', async function () {
      init.call(this, 'test/mocks/packages/package-empty-lib.zos.json');
    })
  
    beforeEach('deploying a lib', async function () {
      await push({ network, txParams, networkFile: this.networkFile })
      this.project = await this.checker.setProject()
      this.directory = await this.project.getCurrentDirectory()
    })
  
    testImplementations();
    testProvider();
  });

  function init(fileName) {
    this.packageFile = new ZosPackageFile(fileName)
    this.networkFile = this.packageFile.networkFile(network)
    this.fetcher = new StatusFetcher(this.networkFile)
    this.checker = new StatusChecker(this.fetcher, this.networkFile, txParams)
  }

  function testVersion () {
    describe('version', function () {
      describe('when the network file shows a different version than the one set in the App contract', function () {
        const newVersion = '2.0.0'

        beforeEach(async function () {
          await this.project.newVersion(newVersion)
        })

        it('updates the version', async function () {
          await this.checker.checkVersion()

          this.networkFile.version.should.be.equal(newVersion)
        })
      })

      describe('when the network file version matches with the one in the App contract', function () {
        it('should not change the version', async function () {
          const previousVersion = this.networkFile.version

          await this.checker.checkVersion()

          this.networkFile.version.should.be.equal(previousVersion)
        })
      })
    })
  };

  function testPackage () {
    describe('package', function () {
      describe('when the network file shows a different package address than the one set in the App contract', function () {
        beforeEach(async function () {
          this.networkFile.package = { address: '0x1' }
        })

        it('updates the package address', async function () {
          await this.checker.checkPackage()

          this.networkFile.packageAddress.should.have.be.equal(this.project.package.address)
        })
      })

      describe('when the network file package matches with the one in the App contract', function () {
        it('does not update the package address', async function () {
          const previousPackage = this.networkFile.packageAddress

          await this.checker.checkPackage()

          this.networkFile.packageAddress.should.be.equal(previousPackage)
        })
      })
    })
  };

  function testProvider () {
    describe('provider', function () {
      describe('when the network file shows a different provider address than the one set in the App contract', function () {
        beforeEach(async function () {
          await this.project.newVersion('2.0.0')
          this.networkFile.version = '2.0.0'
          this.directory = await this.project.getCurrentDirectory()
        })

        it('updates the provider address', async function () {
          await this.checker.checkProvider()

          this.networkFile.providerAddress.should.have.be.equal(this.directory.address)
        })
      })

      describe('when the network file provider matches with the one in the App contract', function () {
        it('does not update the provider address', async function () {
          const previousProvider = this.networkFile.providerAddress

          await this.checker.checkProvider()

          this.networkFile.providerAddress.should.be.equal(previousProvider)
        })
      })
    })
  };

  function testDependencies() {
    describe('dependencies', function() {
      beforeEach('set dependency params', async function() {
        this.dep1 = { name: 'mock-stdlib-undeployed', version: '1.1.0' }
        this.dep2 = { name: 'mock-stdlib-undeployed-2', version: '1.2.0' }
      })

      describe('when the app project does not have dependencies', function() {
        describe('when the network file has dependencies', function() {
          it('removes the local dependency', async function() {
            this.networkFile.setDependency('an-awesome-dependency', { version: '1.0.0', package: '0x01' })
            await this.checker.checkDependencies()

            this.networkFile.hasDependency('an-awesome-dependency').should.be.false
          })
        })
      })

      describe('when the app project has dependencies', function () {
        beforeEach('set project with multiple dependencies', async function () {
          const libs = [`${this.dep1.name}@${this.dep1.version}`, `${this.dep2.name}@${this.dep2.version}`]
          await link({ libs, packageFile: this.packageFile });
          await push({ network, txParams, deployLibs: true, networkFile: this.networkFile });
          this.dep1 = { ...this.dep1, address: this.networkFile.getDependency(this.dep1.name).package }
          this.dep2 = { ...this.dep2, address: this.networkFile.getDependency(this.dep2.name).package }
        })

        describe('when the network file does not have matching dependencies', function () {
          it('adds dependencies to network file', async function () {
            this.networkFile.unsetDependency(this.dep1.name)
            this.networkFile.unsetDependency(this.dep2.name)

            this.networkFile.dependencies.should.be.empty
            await this.checker.checkDependencies()
            this.networkFile.dependencies.should.not.be.empty
            this.networkFile.dependencies.should.have.property(this.dep1.name)
            this.networkFile.dependencies.should.have.property(this.dep2.name)
            this.networkFile.getDependency(this.dep1.name).version.should.eq(this.dep1.version)
            this.networkFile.getDependency(this.dep2.name).version.should.eq(this.dep2.version)
            this.networkFile.getDependency(this.dep1.name).package.should.eq(this.dep1.address)
            this.networkFile.getDependency(this.dep2.name).package.should.eq(this.dep2.address)

          })
        })

        describe('when the network file has only one matching dependency', function() {
          it('adds the unregistered dependency', async function() {
            this.networkFile.unsetDependency(this.dep1.name)

            Object.keys(this.networkFile.dependencies).should.have.lengthOf(1)
            await this.checker.checkDependencies()

            Object.keys(this.networkFile.dependencies).should.have.lengthOf(2)
            this.networkFile.dependencies.should.have.property(this.dep2.name)
            this.networkFile.getDependency(this.dep2.name).version.should.eq(this.dep2.version)
            this.networkFile.getDependency(this.dep2.name).package.should.eq(this.dep2.address)

          })
        })

        describe('when the network file has a dependency with wrong dependency address', function() {
          it('fixes the dependency address', async function() {
            const address = this.dep1.address
            this.networkFile.updateDependency(this.dep1.name, (dependency) => ({ ...dependency, package: '0x01' }))


            this.networkFile.getDependency(this.dep1.name).package.should.eq('0x01')
            await this.checker.checkDependencies()
            this.networkFile.getDependency(this.dep1.name).package.should.eq(address)
          })
        })

        describe('when the network file has a dependency with wrong dependency version', function() {
          it('fixes the dependency version', async function() {
            const version = this.dep1.version
            this.networkFile.updateDependency(this.dep1.name, (dependency) => ({ ...dependency, version: '2.0.0' }))

            this.networkFile.getDependency(this.dep1.name).version.should.eq('2.0.0')
            await this.checker.checkDependencies()
            this.networkFile.getDependency(this.dep1.name).version.should.eq(version)
          })
        })

        describe('when the network file has other dependency that is not deployed', function() {
          it('removes that dependency', async function() {
            const dependencyName = 'non-registered-dependency'
            this.networkFile.setDependency(dependencyName, { package: '0x01', version: '1.0.0' })

            this.networkFile.getDependency(dependencyName).should.not.be.empty
            await this.checker.checkDependencies()
            this.networkFile.getDependency(dependencyName).should.be.empty
          })
        })
      })
    })
  }

  function testImplementations () {
    describe('implementations', function () {
      describe('when the network file does not have any contract', function () {
        describe('when the directory of the current version does not have any contract', function () {
          it('does not update the contracts list', async function () {
            await this.checker.checkImplementations()

            this.networkFile.contracts.should.be.empty
          })
        })

        describe('when the directory of the current version has one contract', function () {
          describe('when the contract alias and contract name are the same', function () {
            beforeEach('registering new implementation in AppDirectory', async function () {
              this.impl = await this.project.setImplementation(ImplV1, 'ImplV1')
            })

            it('adds that contract', async function () {
              await this.checker.checkImplementations()

              this.networkFile.contractAliases.should.have.lengthOf(1)
              this.networkFile.contract('ImplV1').address.should.be.equal(this.impl.address)
              this.networkFile.contract('ImplV1').deployedBytecodeHash.should.be.equal(bytecodeDigest(ImplV1.bytecode))
              this.networkFile.contract('ImplV1').constructorCode.should.be.equal(constructorCode(this.impl))
              this.networkFile.contract('ImplV1').bodyBytecodeHash.should.be.equal(bytecodeDigest(bodyCode(this.impl)))
            })
          })

          describe('when the contract alias and contract name are different', function () {
            beforeEach('registering new implementation in AppDirectory', async function () {
              this.impl = await this.project.setImplementation(ImplV1, 'Impl')
            })

            it('adds that contract', async function () {
              await this.checker.checkImplementations()

              this.networkFile.contractAliases.should.have.lengthOf(1)
              this.networkFile.contract('Impl').address.should.be.equal(this.impl.address)
              this.networkFile.contract('Impl').deployedBytecodeHash.should.be.equal('unknown')
              this.networkFile.contract('Impl').constructorCode.should.be.equal('unknown')
              this.networkFile.contract('Impl').bodyBytecodeHash.should.be.equal(bytecodeDigest(bodyCode(this.impl)))
            })
          })
        })

        describe('when the directory of the current version has many contracts', function () {
          beforeEach('registering two new implementations in AppDirectory', async function () {
            this.impl = await this.project.setImplementation(ImplV1, 'ImplV1')
            this.childImpl = await this.project.setImplementation(ChildImplV1, 'ChildImplV1')
          })

          it('adds those contracts', async function () {
            await this.checker.checkImplementations()

            this.networkFile.contractAliases.should.have.lengthOf(2)
            this.networkFile.contract('ImplV1').address.should.be.equal(this.impl.address)
            this.networkFile.contract('ImplV1').deployedBytecodeHash.should.be.equal(bytecodeDigest(ImplV1.bytecode))
            this.networkFile.contract('ImplV1').constructorCode.should.be.equal(constructorCode(this.impl))
            this.networkFile.contract('ImplV1').bodyBytecodeHash.should.be.equal(bytecodeDigest(bodyCode(this.impl)))
            this.networkFile.contract('ChildImplV1').address.should.be.equal(this.childImpl.address)
            this.networkFile.contract('ChildImplV1').deployedBytecodeHash.should.be.equal(bytecodeDigest(ChildImplV1.bytecode))
            this.networkFile.contract('ChildImplV1').constructorCode.should.be.equal(constructorCode(this.childImpl))
            this.networkFile.contract('ChildImplV1').bodyBytecodeHash.should.be.equal(bytecodeDigest(bodyCode(this.childImpl)))
          })
        })

        describe('when the directory of the current version has many contracts and some of them where unregistered', function () {
          beforeEach('registering two new implementations in AppDirectory', async function () {
            await this.project.setImplementation(ImplV1, 'Impl')
            await this.project.unsetImplementation('Impl', txParams)
            this.childImpl = await this.project.setImplementation(ChildImplV1, 'ChildImplV1')
          })

          it('reports one diff per contract', async function () {
            await this.checker.checkImplementations()

            this.networkFile.contractAliases.should.have.lengthOf(1)
            this.networkFile.contract('ChildImplV1').address.should.be.equal(this.childImpl.address)
            this.networkFile.contract('ChildImplV1').deployedBytecodeHash.should.be.equal(bytecodeDigest(ChildImplV1.bytecode))
            this.networkFile.contract('ChildImplV1').constructorCode.should.be.equal(constructorCode(this.childImpl))
            this.networkFile.contract('ChildImplV1').bodyBytecodeHash.should.be.equal(bytecodeDigest(bodyCode(this.childImpl)))
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
          it('removes those contracts', async function () {
            await this.checker.checkImplementations()

            this.networkFile.contracts.should.be.empty
          })
        })

        describe('when the directory of the current version has one of those contract', function () {
          describe('when the directory has the same address and same bytecode for that contract', function () {
            beforeEach('registering new implementation in AppDirectory', async function () {
              await this.directory.setImplementation('Impl', this.impl.address, txParams)
            })

            it('removes the unregistered contract without changing the registered one', async function () {
              const previousContract = this.networkFile.contract('Impl')

              await this.checker.checkImplementations()

              this.networkFile.contractAliases.should.have.lengthOf(1)
              this.networkFile.contract('Impl').address.should.be.equal(previousContract.address)
              this.networkFile.contract('Impl').deployedBytecodeHash.should.be.equal(previousContract.deployedBytecodeHash)
              this.networkFile.contract('Impl').constructorCode.should.be.equal(previousContract.constructorCode)
              this.networkFile.contract('Impl').bodyBytecodeHash.should.be.equal(previousContract.bodyBytecodeHash)
            })
          })

          describe('when the directory has another address for that contract', function () {
            beforeEach('registering new implementation in AppDirectory', async function () {
              await this.directory.setImplementation('Impl', this.childImpl.address, txParams)
            })

            it.skip('removes the unregistered contract and updates the address of the registered one', async function () {
              const previousContract = this.networkFile.contract('Impl')

              await this.checker.checkImplementations()

              this.networkFile.contractAliases.should.have.lengthOf(1)
              this.networkFile.contract('Impl').address.should.be.equal(this.childImpl.address)
              this.networkFile.contract('Impl').deployedBytecodeHash.should.be.equal(previousContract.deployedBytecodeHash)
              this.networkFile.contract('Impl').constructorCode.should.be.equal(previousContract.constructorCode)
              this.networkFile.contract('Impl').bodyBytecodeHash.should.be.equal(previousContract.bodyBytecodeHash)
            })
          })

          describe('when the bytecode for that contract is different', function () {
            beforeEach('registering new implementation in AppDirectory', async function () {
              this.networkFile.updateImplementation('Impl', (implementation) => ({ ...implementation, bodyBytecodeHash: '0x0' }))
              await this.directory.setImplementation('Impl', this.impl.address, txParams)
            })

            it('removes the unregistered contract and updates the bytecode of the registered one', async function () {
              const previousContract = this.networkFile.contract('Impl')

              await this.checker.checkImplementations()

              this.networkFile.contractAliases.should.have.lengthOf(1)
              //this.networkFile.contract('Impl').address.should.be.equal(previousContract.address)
              this.networkFile.contract('Impl').deployedBytecodeHash.should.be.equal(bytecodeDigest(ImplV1.bytecode))
              this.networkFile.contract('Impl').constructorCode.should.be.equal(previousContract.constructorCode)
              this.networkFile.contract('Impl').bodyBytecodeHash.should.be.equal(bytecodeDigest(bodyCode(this.impl)))
            })
          })
        })

        describe('when the directory of the current version has both contracts', function () {
          beforeEach('registering new implementation in AppDirectory', async function () {
            await this.directory.setImplementation('Impl', this.impl.address, txParams)
            await this.directory.setImplementation('ChildImpl', this.childImpl.address, txParams)
          })

          it('does not update the contracts list', async function () {
            const previousImplContract = this.networkFile.contract('Impl')
            const previousChildImplContract = this.networkFile.contract('ChildImpl')

            await this.checker.checkImplementations()

            this.networkFile.contractAliases.should.have.lengthOf(2)
            this.networkFile.contract('Impl').address.should.be.equal(previousImplContract.address)
            this.networkFile.contract('Impl').deployedBytecodeHash.should.be.equal(previousImplContract.deployedBytecodeHash)
            this.networkFile.contract('Impl').constructorCode.should.be.equal(previousImplContract.constructorCode)
            this.networkFile.contract('ChildImpl').address.should.be.equal(previousChildImplContract.address)
            this.networkFile.contract('ChildImpl').deployedBytecodeHash.should.be.equal(previousChildImplContract.deployedBytecodeHash)
            this.networkFile.contract('ChildImpl').constructorCode.should.be.equal(previousChildImplContract.constructorCode)
          })
        })

        describe('when the directory of the current version has many contracts and some of them where unregistered', function () {
          beforeEach('registering two new implementations in AppDirectory', async function () {
            await this.directory.setImplementation('Impl', this.impl.address, txParams)
            await this.project.unsetImplementation('Impl', txParams)
            await this.directory.setImplementation('ChildImpl', this.childImpl.address, txParams)
          })

          it('adds the missing contract', async function () {
            const previousContract = this.networkFile.contract('ChildImpl')

            await this.checker.checkImplementations()

            this.networkFile.contractAliases.should.have.lengthOf(1)
            this.networkFile.contract('ChildImpl').address.should.be.equal(previousContract.address)
            this.networkFile.contract('ChildImpl').deployedBytecodeHash.should.be.equal(previousContract.deployedBytecodeHash)
            this.networkFile.contract('ChildImpl').constructorCode.should.be.equal(previousContract.constructorCode)
          })
        })
      })
    })
  };

  function testProxies () {
    describe('proxies', function () {
      beforeEach('adding some contracts', async function () {
        this.impl = await ImplV1.new()
        this.childImpl = await ChildImplV1.new()

        this.networkFile.addContract('Impl', this.impl, getStorageLayout(ImplV1))
        this.networkFile.addContract('ChildImpl', this.childImpl, getStorageLayout(ChildImplV1))

        await this.directory.setImplementation('Impl', this.impl.address)
        await this.directory.unsetImplementation('Impl')
        await this.directory.setImplementation('ChildImpl', this.childImpl.address)
        await this.directory.setImplementation('Impl', this.impl.address)
      })

      describe('when the network file does not have any proxies', function () {
        describe('when the app does not have any proxy registered', function () {
          it('does not modoify the proxies list', async function () {
            await this.checker.checkProxies()

            this.networkFile.getProxies().should.be.empty
          })
        })

        describe('when the app has one proxy registered', function () {
          beforeEach('registering new implementation in AppDirectory', async function () {
            this.proxy = await this.project.createProxy(ImplV1, { contractName: 'Impl', initMethod: 'initialize', initArgs: [42] })
          })

          it('adds that proxy', async function () {
            await this.checker.checkProxies()
            const proxyInfo = this.networkFile.getProxies({ package: this.packageFile.name, contract: 'Impl' })[0]

            this.networkFile.getProxies().should.have.lengthOf(1)
            proxyInfo.address.should.be.equal(this.proxy.address)
            proxyInfo.version.should.be.equal('unknown')
            proxyInfo.implementation.should.be.equal(this.impl.address)
          })
        })

        describe('when the app has many proxies registered', function () {
          beforeEach('registering new implementation in AppDirectory', async function () {
            this.implProxy = await this.project.createProxy(ImplV1, { contractName: 'Impl', initMethod: 'initialize', initArgs: [42] })
            this.childImplProxy = await this.project.createProxy(ChildImplV1, { contractName: 'ChildImpl', initMethod: 'initialize', initArgs: [1] })
          })

          it('adds those proxies', async function () {
            await this.checker.checkProxies()
            const implProxyInfo = this.networkFile.getProxies({ package: this.packageFile.name, contract: 'Impl' })[0]
            const childImplProxyInfo = this.networkFile.getProxies({ package: this.packageFile.name, contract: 'ChildImpl' })[0]

            this.networkFile.getProxies().should.have.lengthOf(2)
            implProxyInfo.address.should.be.equal(this.implProxy.address)
            implProxyInfo.version.should.be.equal('unknown')
            implProxyInfo.implementation.should.be.equal(this.impl.address)
            childImplProxyInfo.address.should.be.equal(this.childImplProxy.address)
            childImplProxyInfo.version.should.be.equal('unknown')
            childImplProxyInfo.implementation.should.be.equal(this.childImpl.address)
          })
        })
      })

      describe('when the network file has two proxies', function () {
        beforeEach('adding a proxy', async function () {
          const implementations = [
            { implementation: this.impl.address, address: '0x1', version: '1.0.0' },
            { implementation: this.impl.address, address: '0x2', version: '1.0.0' }
          ];
          this.networkFile.setProxies(this.packageFile.name,'Impl', implementations)
        })

        describe('when the app does not have any proxy registered', function () {
          it('removes those proxies', async function () {
            await this.checker.checkProxies()

            this.networkFile.getProxies().should.be.empty
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

              it('removes the unregistered proxy', async function () {
                await this.checker.checkProxies()
                const proxyInfo = this.networkFile.getProxies({ package: this.packageFile.name, contract: 'Impl' })[0]

                this.networkFile.getProxies().should.have.lengthOf(1)
                proxyInfo.address.should.be.equal(this.proxy.address)
                proxyInfo.version.should.be.equal('1.0.0')
                proxyInfo.implementation.should.be.equal(this.impl.address)
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

              it('removes the unregistered proxy and updates the implementation of the registered one', async function () {
                await this.checker.checkProxies()
                const proxyInfo = this.networkFile.getProxies({ package: this.packageFile.name, contract: 'Impl' })[0]

                this.networkFile.getProxies().should.have.lengthOf(1)
                proxyInfo.address.should.be.equal(this.proxy.address)
                proxyInfo.version.should.be.equal('1.0.0')
                proxyInfo.implementation.should.be.equal(this.impl.address)
              })
            })

            describe('when it matches the implementation address but not the alias', function () {
              beforeEach('changing network file', async function () {
                this.networkFile.setProxies(this.packageFile.name, 'Impl', [{ implementation: this.impl.address, address: '0x1', version: '1.0.0' }])
                this.networkFile.setProxies(this.packageFile.name, 'ChildImpl', [{ implementation: this.impl.address, address: this.proxy.address, version: '1.0.0' }])
              })

              it('removes the unregistered proxy and updates the alias of the registered one', async function () {
                await this.checker.checkProxies()
                const proxyInfo = this.networkFile.getProxies({ package: this.packageFile.name, contract: 'Impl' })[0]

                this.networkFile.getProxies().should.have.lengthOf(1)
                proxyInfo.address.should.be.equal(this.proxy.address)
                proxyInfo.version.should.be.equal('1.0.0')
                proxyInfo.implementation.should.be.equal(this.impl.address)
              })
            })

            describe('when it does not match the alias and the implementation address', function () {
              beforeEach('changing network file', async function () {
                this.networkFile.setProxies(this.packageFile.name, 'Impl', [{ implementation: this.impl.address, address: '0x1', version: '1.0.0' }])
                this.networkFile.setProxies(this.packageFile.name, 'ChildImpl', [{ implementation: this.childImpl.address, address: this.proxy.address, version: '1.0.0' }])
              })

              it('removes the unregistered proxy and updates the alias and implementation of the registered one', async function () {
                await this.checker.checkProxies()
                const proxyInfo = this.networkFile.getProxies({ package: this.packageFile.name, contract: 'Impl' })[0]

                this.networkFile.getProxies().should.have.lengthOf(1)
                proxyInfo.address.should.be.equal(this.proxy.address)
                proxyInfo.version.should.be.equal('1.0.0')
                proxyInfo.implementation.should.be.equal(this.impl.address)
              })
            })
          })

          describe('when it does not match any proxy address', function () {

            it('removes the unregistered proxies and adds the registered onen', async function () {
              await this.checker.checkProxies()
              const proxyInfo = this.networkFile.getProxies({ package: this.packageFile.name, contract: 'Impl' })[0]

              this.networkFile.getProxies().should.have.lengthOf(1)
              proxyInfo.address.should.be.equal(this.proxy.address)
              proxyInfo.version.should.be.equal('unknown')
              proxyInfo.implementation.should.be.equal(this.impl.address)
            })
          })
        })
      })
    })
  };
})
