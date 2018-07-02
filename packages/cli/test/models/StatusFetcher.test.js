'use strict'
require('../setup')

import { Contracts, App } from 'zos-lib'

import push from '../../src/scripts/push'
import linkStdlib from '../../src/scripts/link'
import StatusChecker from '../../src/models/status/StatusChecker'
import StatusFetcher from '../../src/models/status/StatusFetcher'
import ZosPackageFile from '../../src/models/files/ZosPackageFile'
import {bodyCode, bytecodeDigest, constructorCode} from '../../src/utils/contracts'

const ImplV1 = Contracts.getFromLocal('ImplV1')
const AnotherImplV1 = Contracts.getFromLocal('AnotherImplV1')

contract('StatusFetcher', function([_, owner, anotherAddress]) {
  const network = 'test'
  const txParams = { from: owner }

  beforeEach('initializing network file and status checker', async function () {
    this.packageFile = new ZosPackageFile('test/mocks/packages/package-empty.zos.json')
    this.networkFile = this.packageFile.networkFile(network)
    this.fetcher = new StatusFetcher(this.networkFile)
    this.checker = new StatusChecker(this.fetcher, this.networkFile, txParams)
  })

  beforeEach('deploying an app', async function () {
    await push({ network, txParams, networkFile: this.networkFile })
    this.app = await App.fetch(this.networkFile.appAddress, txParams)
  })

  describe('version', function () {
    describe('when the network file shows a different version than the one set in the App contract', function () {
      const newVersion = '2.0.0'

      beforeEach(async function () {
        await this.app.newVersion(newVersion)
      })

      it('updates the version', async function () {
        await this.checker.checkVersion()

        this.networkFile.version.should.be.equal('2.0.0')
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

  describe('package', function () {
    describe('when the network file shows a different package address than the one set in the App contract', function () {
      beforeEach(async function () {
        this.networkFile.package = { address: '0x1' }
      })

      it('updates the package address', async function () {
        await this.checker.checkPackage()

        this.networkFile.packageAddress.should.have.be.equal(this.app.package.address)
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

  describe('provider', function () {
    describe('when the network file shows a different provider address than the one set in the App contract', function () {
      beforeEach(async function () {
        await this.app.newVersion('2.0.0')
      })

      it('updates the provider address', async function () {
        await this.checker.checkProvider()

        this.networkFile.providerAddress.should.have.be.equal(this.app.currentDirectory().address)
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

  describe('stdlib', function () {
    describe('when the network file does not specify any stdlib', function () {
      describe('when the App contract has a stdlib set', function () {
        beforeEach(async function () {
          await this.app.setStdlib(anotherAddress)
        })

        it('updates the address of the stdlib', async function () {
          await this.checker.checkStdlib()

          this.networkFile.stdlibAddress.should.be.equal(anotherAddress)
        })
      })
      
      describe('when the App contract does not have a stdlib set', function () {
        it('does not update the address of the stdlib', async function () {
          await this.checker.checkStdlib()

          this.networkFile.stdlib.should.be.empty
        })
      })
    })

    describe('when the network file has a stdlib', function () {
      const stdlibAddress = '0x0000000000000000000000000000000000000010'

      beforeEach('set stdlib in network file', async function () {
        await linkStdlib({stdlibNameVersion: 'mock-stdlib@1.1.0', packageFile: this.packageFile})
        await push({ network, txParams, networkFile: this.networkFile })
      })

      describe('when the App contract has the same stdlib set', function () {
        beforeEach('set stdlib in App contract', async function () {
          await this.app.setStdlib(stdlibAddress)
        })

        it('does not update the address of the stdlib', async function () {
          const previousAddress = this.networkFile.stdlibAddress

          await this.checker.checkStdlib()

          this.networkFile.stdlibAddress.should.be.equal(previousAddress)
        })
      })

      describe('when the App contract has another stdlib set', function () {
        beforeEach('set stdlib in App contract', async function () {
          await this.app.setStdlib(anotherAddress)
        })

        it('updates the address of the stdlib', async function () {
          await this.checker.checkStdlib()

          this.networkFile.stdlibAddress.should.be.equal(anotherAddress)
        })
      })

      describe('when the App contract has no stdlib set', function () {
        beforeEach('unset App stdlib', async function () {
          await this.app.setStdlib(0x0)
        })

        it('deletes the stdlib', async function () {
          await this.checker.checkStdlib()

          this.networkFile.stdlib.should.be.empty
        })
      })
    })
  })

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
            this.impl = await this.app.setImplementation(ImplV1, 'ImplV1')
          })

          it('adds that contract', async function () {
            await this.checker.checkImplementations()

            this.networkFile.contractAliases.should.have.lengthOf(1)
            this.networkFile.contract('ImplV1').address.should.be.equal(this.impl.address)
            this.networkFile.contract('ImplV1').bytecodeHash.should.be.equal(bytecodeDigest(ImplV1.bytecode))
            this.networkFile.contract('ImplV1').constructorCode.should.be.equal(constructorCode(this.impl))
            this.networkFile.contract('ImplV1').bodyBytecodeHash.should.be.equal(bytecodeDigest(bodyCode(this.impl)))
          })
        })

        describe('when the contract alias and contract name are different', function () {
          beforeEach('registering new implementation in AppDirectory', async function () {
            this.impl = await this.app.setImplementation(ImplV1, 'Impl')
          })

          it('adds that contract', async function () {
            await this.checker.checkImplementations()

            this.networkFile.contractAliases.should.have.lengthOf(1)
            this.networkFile.contract('Impl').address.should.be.equal(this.impl.address)
            this.networkFile.contract('Impl').bytecodeHash.should.be.equal('unknown')
            this.networkFile.contract('Impl').constructorCode.should.be.equal('unknown')
            this.networkFile.contract('Impl').bodyBytecodeHash.should.be.equal(bytecodeDigest(bodyCode(this.impl)))
          })
        })
      })

      describe('when the directory of the current version has many contracts', function () {
        beforeEach('registering two new implementations in AppDirectory', async function () {
          this.impl = await this.app.setImplementation(ImplV1, 'ImplV1')
          this.anotherImpl = await this.app.setImplementation(AnotherImplV1, 'AnotherImplV1')
        })

        it('adds those contracts', async function () {
          await this.checker.checkImplementations()

          this.networkFile.contractAliases.should.have.lengthOf(2)
          this.networkFile.contract('ImplV1').address.should.be.equal(this.impl.address)
          this.networkFile.contract('ImplV1').bytecodeHash.should.be.equal(bytecodeDigest(ImplV1.bytecode))
          this.networkFile.contract('ImplV1').constructorCode.should.be.equal(constructorCode(this.impl))
          this.networkFile.contract('ImplV1').bodyBytecodeHash.should.be.equal(bytecodeDigest(bodyCode(this.impl)))
          this.networkFile.contract('AnotherImplV1').address.should.be.equal(this.anotherImpl.address)
          this.networkFile.contract('AnotherImplV1').bytecodeHash.should.be.equal(bytecodeDigest(AnotherImplV1.bytecode))
          this.networkFile.contract('AnotherImplV1').constructorCode.should.be.equal(constructorCode(this.anotherImpl))
          this.networkFile.contract('AnotherImplV1').bodyBytecodeHash.should.be.equal(bytecodeDigest(bodyCode(this.anotherImpl)))
        })
      })

      describe('when the directory of the current version has many contracts and some of them where unregistered', function () {
        beforeEach('registering two new implementations in AppDirectory', async function () {
          await this.app.setImplementation(ImplV1, 'Impl')
          await this.app.unsetImplementation('Impl', txParams)
          this.anotherImpl = await this.app.setImplementation(AnotherImplV1, 'AnotherImplV1')
        })

        it('reports one diff per contract', async function () {
          await this.checker.checkImplementations()

          this.networkFile.contractAliases.should.have.lengthOf(1)
          this.networkFile.contract('AnotherImplV1').address.should.be.equal(this.anotherImpl.address)
          this.networkFile.contract('AnotherImplV1').bytecodeHash.should.be.equal(bytecodeDigest(AnotherImplV1.bytecode))
          this.networkFile.contract('AnotherImplV1').constructorCode.should.be.equal(constructorCode(this.anotherImpl))
          this.networkFile.contract('AnotherImplV1').bodyBytecodeHash.should.be.equal(bytecodeDigest(bodyCode(this.anotherImpl)))
        })
      })
    })

    describe('when the network file has some contracts', function () {
      beforeEach('adding some contracts', async function () {
        this.impl = await ImplV1.new()
        this.anotherImpl = await AnotherImplV1.new()

        this.networkFile.addContract('Impl', this.impl)
        this.networkFile.addContract('AnotherImpl', this.anotherImpl)
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
            await this.app.currentDirectory().setImplementation('Impl', this.impl.address, txParams)
          })

          it('removes the unregistered contract without changing the registered one', async function () {
            const previousContract = this.networkFile.contract('Impl')

            await this.checker.checkImplementations()

            this.networkFile.contractAliases.should.have.lengthOf(1)
            this.networkFile.contract('Impl').address.should.be.equal(previousContract.address)
            this.networkFile.contract('Impl').bytecodeHash.should.be.equal(previousContract.bytecodeHash)
            this.networkFile.contract('Impl').constructorCode.should.be.equal(previousContract.constructorCode)
            this.networkFile.contract('Impl').bodyBytecodeHash.should.be.equal(previousContract.bodyBytecodeHash)
          })
        })

        describe('when the directory has another address for that contract', function () {
          beforeEach('registering new implementation in AppDirectory', async function () {
            await this.app.currentDirectory().setImplementation('Impl', this.anotherImpl.address, txParams)
          })

          it('removes the unregistered contract and updates the address of the registered one', async function () {
            const previousContract = this.networkFile.contract('Impl')

            await this.checker.checkImplementations()

            this.networkFile.contractAliases.should.have.lengthOf(1)
            this.networkFile.contract('Impl').address.should.be.equal(this.anotherImpl.address)
            this.networkFile.contract('Impl').bytecodeHash.should.be.equal(previousContract.bytecodeHash)
            this.networkFile.contract('Impl').constructorCode.should.be.equal(previousContract.constructorCode)
            this.networkFile.contract('Impl').bodyBytecodeHash.should.be.equal(previousContract.bodyBytecodeHash)
          })
        })

        describe('when the bytecode for that contract is different', function () {
          beforeEach('registering new implementation in AppDirectory', async function () {
            this.networkFile.setContractBodyBytecodeHash('Impl', '0x0')
            await this.app.currentDirectory().setImplementation('Impl', this.impl.address, txParams)
          })

          it('removes the unregistered contract and updates the bytecode of the registered one', async function () {
            const previousContract = this.networkFile.contract('Impl')

            await this.checker.checkImplementations()

            this.networkFile.contractAliases.should.have.lengthOf(1)
            this.networkFile.contract('Impl').address.should.be.equal(previousContract.address)
            this.networkFile.contract('Impl').bytecodeHash.should.be.equal(bytecodeDigest(ImplV1.bytecode))
            this.networkFile.contract('Impl').constructorCode.should.be.equal(previousContract.constructorCode)
            this.networkFile.contract('Impl').bodyBytecodeHash.should.be.equal(bytecodeDigest(bodyCode(this.impl)))
          })
        })
      })

      describe('when the directory of the current version has both contracts', function () {
        beforeEach('registering new implementation in AppDirectory', async function () {
          await this.app.currentDirectory().setImplementation('Impl', this.impl.address, txParams)
          await this.app.currentDirectory().setImplementation('AnotherImpl', this.anotherImpl.address, txParams)
        })

        it('does not update the contracts list', async function () {
          const previousImplContract = this.networkFile.contract('Impl')
          const previousAnotherImplContract = this.networkFile.contract('AnotherImpl')

          await this.checker.checkImplementations()

          this.networkFile.contractAliases.should.have.lengthOf(2)
          this.networkFile.contract('Impl').address.should.be.equal(previousImplContract.address)
          this.networkFile.contract('Impl').bytecodeHash.should.be.equal(previousImplContract.bytecodeHash)
          this.networkFile.contract('Impl').constructorCode.should.be.equal(previousImplContract.constructorCode)
          this.networkFile.contract('AnotherImpl').address.should.be.equal(previousAnotherImplContract.address)
          this.networkFile.contract('AnotherImpl').bytecodeHash.should.be.equal(previousAnotherImplContract.bytecodeHash)
          this.networkFile.contract('AnotherImpl').constructorCode.should.be.equal(previousAnotherImplContract.constructorCode)
        })
      })

      describe('when the directory of the current version has many contracts and some of them where unregistered', function () {
        beforeEach('registering two new implementations in AppDirectory', async function () {
          await this.app.currentDirectory().setImplementation('Impl', this.impl.address, txParams)
          await this.app.unsetImplementation('Impl', txParams)
          await this.app.currentDirectory().setImplementation('AnotherImpl', this.anotherImpl.address, txParams)
        })

        it('adds the missing contract', async function () {
          const previousContract = this.networkFile.contract('AnotherImpl')

          await this.checker.checkImplementations()

          this.networkFile.contractAliases.should.have.lengthOf(1)
          this.networkFile.contract('AnotherImpl').address.should.be.equal(previousContract.address)
          this.networkFile.contract('AnotherImpl').bytecodeHash.should.be.equal(previousContract.bytecodeHash)
          this.networkFile.contract('AnotherImpl').constructorCode.should.be.equal(previousContract.constructorCode)
        })
      })
    })
  })

  describe('proxies', function () {
    beforeEach('adding some contracts', async function () {
      this.impl = await ImplV1.new()
      this.anotherImpl = await AnotherImplV1.new()

      this.networkFile.addContract('Impl', this.impl)
      this.networkFile.addContract('AnotherImpl', this.anotherImpl)

      await this.app.currentDirectory().setImplementation('Impl', this.impl.address, txParams)
      await this.app.currentDirectory().unsetImplementation('Impl', txParams)
      await this.app.currentDirectory().setImplementation('AnotherImpl', this.anotherImpl.address, txParams)
      await this.app.currentDirectory().setImplementation('Impl', this.impl.address, txParams)
    })

    describe('when the network file does not have any proxies', function () {
      describe('when the app does not have any proxy registered', function () {
        it('does not modoify the proxies list', async function () {
          await this.checker.checkProxies()

          this.networkFile.proxyAliases.should.be.empty
        })
      })

      describe('when the app has one proxy registered', function () {
        beforeEach('registering new implementation in AppDirectory', async function () {
          this.proxy = await this.app.createProxy(ImplV1, 'Impl', 'initialize', [42])
        })

        it('adds that proxy', async function () {
          await this.checker.checkProxies()

          this.networkFile.proxyAliases.should.have.lengthOf(1)
          this.networkFile.proxy('Impl', 0).address.should.be.equal(this.proxy.address)
          this.networkFile.proxy('Impl', 0).version.should.be.equal('unknown')
          this.networkFile.proxy('Impl', 0).implementation.should.be.equal(this.impl.address)
        })
      })

      describe('when the app has many proxies registered', function () {
        beforeEach('registering new implementation in AppDirectory', async function () {
          this.implProxy = await this.app.createProxy(ImplV1, 'Impl', 'initialize', [42])
          this.anotherImplProxy = await this.app.createProxy(AnotherImplV1, 'AnotherImpl', 'initialize', [1])
        })

        it('adds those proxies', async function () {
          await this.checker.checkProxies()

          this.networkFile.proxyAliases.should.have.lengthOf(2)
          this.networkFile.proxy('Impl', 0).address.should.be.equal(this.implProxy.address)
          this.networkFile.proxy('Impl', 0).version.should.be.equal('unknown')
          this.networkFile.proxy('Impl', 0).implementation.should.be.equal(this.impl.address)
          this.networkFile.proxy('AnotherImpl', 0).address.should.be.equal(this.anotherImplProxy.address)
          this.networkFile.proxy('AnotherImpl', 0).version.should.be.equal('unknown')
          this.networkFile.proxy('AnotherImpl', 0).implementation.should.be.equal(this.anotherImpl.address)
        })
      })
    })

    describe('when the network file has two proxies', function () {
      beforeEach('adding a proxy', async function () {
        this.networkFile.setProxies('Impl', [
          { implementation: this.impl.address, address: '0x1', version: '1.0' },
          { implementation: this.impl.address, address: '0x2', version: '1.0' }
        ])
      })

      describe('when the app does not have any proxy registered', function () {
        it('removes those proxies', async function () {
          await this.checker.checkProxies()

          this.networkFile.proxyAliases.should.be.empty
        })
      })

      describe('when the app has one proxy registered', function () {
        beforeEach('creating a proxy', async function () {
          this.proxy = await this.app.createProxy(ImplV1, 'Impl', 'initialize', [42])
        })

        describe('when it matches one proxy address', function () {
          describe('when it matches the alias and the implementation address', function () {
            beforeEach('changing network file', async function () {
              this.networkFile.setProxies('Impl', [
                { implementation: this.impl.address, address: '0x1', version: '1.0' },
                { implementation: this.impl.address, address: this.proxy.address, version: '1.0' },
              ])
            })

            it('removes the unregistered proxy', async function () {
              await this.checker.checkProxies()

              this.networkFile.proxyAliases.should.have.lengthOf(1)
              this.networkFile.proxy('Impl', 0).address.should.be.equal(this.proxy.address)
              this.networkFile.proxy('Impl', 0).version.should.be.equal('1.0')
              this.networkFile.proxy('Impl', 0).implementation.should.be.equal(this.impl.address)
            })
          })

          describe('when it matches the alias but not the implementation address', function () {
            beforeEach('changing network file', async function () {
              this.networkFile.setProxies('Impl', [
                { implementation: this.impl.address, address: '0x1', version: '1.0' },
                { implementation: this.anotherImpl.address, address: this.proxy.address, version: '1.0' },
              ])
            })

            it('removes the unregistered proxy and updates the implementation of the registered one', async function () {
              await this.checker.checkProxies()

              this.networkFile.proxyAliases.should.have.lengthOf(1)
              this.networkFile.proxy('Impl', 0).address.should.be.equal(this.proxy.address)
              this.networkFile.proxy('Impl', 0).version.should.be.equal('1.0')
              this.networkFile.proxy('Impl', 0).implementation.should.be.equal(this.impl.address)
            })
          })

          describe('when it matches the implementation address but not the alias', function () {
            beforeEach('changing network file', async function () {
              this.networkFile.setProxies('Impl', [{ implementation: this.impl.address, address: '0x1', version: '1.0' }])
              this.networkFile.setProxies('AnotherImpl', [{ implementation: this.impl.address, address: this.proxy.address, version: '1.0' }])
            })

            it('removes the unregistered proxy and updates the alias of the registered one', async function () {
              await this.checker.checkProxies()

              this.networkFile.proxyAliases.should.have.lengthOf(1)
              this.networkFile.proxy('Impl', 0).address.should.be.equal(this.proxy.address)
              this.networkFile.proxy('Impl', 0).version.should.be.equal('1.0')
              this.networkFile.proxy('Impl', 0).implementation.should.be.equal(this.impl.address)
            })
          })

          describe('when it does not match the alias and the implementation address', function () {
            beforeEach('changing network file', async function () {
              this.networkFile.setProxies('Impl', [{ implementation: this.impl.address, address: '0x1', version: '1.0' }])
              this.networkFile.setProxies('AnotherImpl', [{ implementation: this.anotherImpl.address, address: this.proxy.address, version: '1.0' }])
            })

            it('removes the unregistered proxy and updates the alias and implementation of the registered one', async function () {
              await this.checker.checkProxies()

              this.networkFile.proxyAliases.should.have.lengthOf(1)
              this.networkFile.proxy('Impl', 0).address.should.be.equal(this.proxy.address)
              this.networkFile.proxy('Impl', 0).version.should.be.equal('1.0')
              this.networkFile.proxy('Impl', 0).implementation.should.be.equal(this.impl.address)
            })
          })
        })

        describe('when it does not match any proxy address', function () {

          it('removes the unregistered proxies and adds the registered onen', async function () {
            await this.checker.checkProxies()

            this.networkFile.proxyAliases.should.have.lengthOf(1)
            this.networkFile.proxy('Impl', 0).address.should.be.equal(this.proxy.address)
            this.networkFile.proxy('Impl', 0).version.should.be.equal('unknown')
            this.networkFile.proxy('Impl', 0).implementation.should.be.equal(this.impl.address)
          })
        })
      })
    })
  })
})
