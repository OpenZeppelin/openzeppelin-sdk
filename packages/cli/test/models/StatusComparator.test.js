'use strict'
require('../setup')

import { Contracts, App } from 'zos-lib'

import push from '../../src/scripts/push'
import linkStdlib from '../../src/scripts/link'
import { bytecodeDigest } from '../../src/utils/contracts'
import StatusChecker from '../../src/models/status/StatusChecker'
import ZosPackageFile from '../../src/models/files/ZosPackageFile'
import StatusComparator from '../../src/models/status/StatusComparator'
import PackageAtVersion from '../../src/models/lib/PackageAtVersion';

const ImplV1 = Contracts.getFromLocal('ImplV1')
const AnotherImplV1 = Contracts.getFromLocal('AnotherImplV1')

contract('StatusComparator', function([_, owner, anotherAddress]) {
  const network = 'test'
  const txParams = { from: owner }

  describe('app', function () {
    beforeEach('initializing network file and status checker', async function () {
      init.call(this, 'test/mocks/packages/package-empty.zos.json');
    })
  
    beforeEach('deploying an app', async function () {
      await push({ network, txParams, networkFile: this.networkFile })
      this.app = await App.fetch(this.networkFile.appAddress, txParams)
    })

    testVersion();
    testImplementations();
    testPackage();
    testProvider();
    testProxies();
    testStdlib();
  });

  describe('lib', function () {
    beforeEach('initializing network file and status checker', async function () {
      init.call(this, 'test/mocks/packages/package-empty-lib.zos.json');
    })
  
    beforeEach('deploying a lib', async function () {
      await push({ network, txParams, networkFile: this.networkFile })
      this.app = await PackageAtVersion.fetch(this.networkFile.packageAddress, "1.1.0", txParams)
    })

    testImplementations();
    testProvider();
  });

  function init(fileName) {
    this.packageFile = new ZosPackageFile(fileName)
    this.networkFile = this.packageFile.networkFile(network)
    this.comparator = new StatusComparator()
    this.checker = new StatusChecker(this.comparator, this.networkFile, txParams)
  }

  function testVersion () {
    describe('version', function () {
      describe('when the network file shows a different version than the one set in the App contract', function () {
        const newVersion = '2.0.0'

        beforeEach(async function () {
          await this.app.newVersion(newVersion)
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
  };

  function testPackage () {
    describe('package', function () {
      describe('when the network file shows a different package address than the one set in the App contract', function () {
        beforeEach(async function () {
          this.networkFile.package = { address: '0x10' }
        })

        it('reports that diff', async function () {
          await this.checker.checkPackage()

          this.comparator.reports.should.have.lengthOf(1)
          this.comparator.reports[0].expected.should.be.equal(this.networkFile.packageAddress)
          this.comparator.reports[0].observed.should.be.equal(this.app.package.address)
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
  };

  function testProvider () {
    describe('provider', function () {
      describe('when the network file shows a different provider address than the one set in the App contract', function () {
        beforeEach(async function () {
          await this.app.newVersion('2.0.0')
          this.networkFile.version = '2.0.0'
        })

        it('reports that diff', async function () {
          await this.checker.checkProvider()

          this.comparator.reports.should.have.lengthOf(1)
          this.comparator.reports[0].expected.should.be.equal(this.networkFile.providerAddress)
          this.comparator.reports[0].observed.should.be.equal(this.app.currentDirectory().address)
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
  };

  function testStdlib () {
    describe('stdlib', function () {
      describe('when the network file does not specify any stdlib', function () {
        describe('when the App contract has a stdlib set', function () {
          beforeEach(async function () {
            await this.app.setStdlib(anotherAddress)
          })

          it('reports that diff', async function () {
            await this.checker.checkStdlib()

            this.comparator.reports.should.have.lengthOf(1)
            this.comparator.reports[0].expected.should.be.equal('none')
            this.comparator.reports[0].observed.should.be.equal(anotherAddress)
            this.comparator.reports[0].description.should.be.equal('Stdlib address does not match')
          })
        })
        
        describe('when the App contract does not have a stdlib set', function () {
          it('does not report any diff', async function () {
            await this.checker.checkStdlib()

            this.comparator.reports.should.be.empty
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

          it('does not report any diff', async function () {
            await this.checker.checkStdlib()

            this.comparator.reports.should.be.empty
          })
        })

        describe('when the App contract has another stdlib set', function () {
          beforeEach('set stdlib in App contract', async function () {
            await this.app.setStdlib(anotherAddress)
          })

          it('reports that diff', async function () {
            await this.checker.checkStdlib()

            this.comparator.reports.should.have.lengthOf(1)
            this.comparator.reports[0].expected.should.be.equal(stdlibAddress)
            this.comparator.reports[0].observed.should.be.equal(anotherAddress)
            this.comparator.reports[0].description.should.be.equal('Stdlib address does not match')
          })
        })

        describe('when the App contract has no stdlib set', function () {
          beforeEach('unset App stdlib', async function () {
            await this.app.setStdlib(0x0)
          })

          it('reports that diff', async function () {
            await this.checker.checkStdlib()

            this.comparator.reports.should.have.lengthOf(1)
            this.comparator.reports[0].expected.should.be.equal(stdlibAddress)
            this.comparator.reports[0].observed.should.be.equal('none')
            this.comparator.reports[0].description.should.be.equal('Stdlib address does not match')
          })
        })
      })
    })
  };

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
            this.impl = await this.app.setImplementation(ImplV1, 'Impl')
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
            this.impl = await this.app.setImplementation(ImplV1, 'Impl')
            this.anotherImpl = await this.app.setImplementation(AnotherImplV1, 'AnotherImpl')
          })

          it('reports one diff per contract', async function () {
            await this.checker.checkImplementations()

            this.comparator.reports.should.have.lengthOf(2)
            this.comparator.reports[0].expected.should.be.equal('none')
            this.comparator.reports[0].observed.should.be.equal('one')
            this.comparator.reports[0].description.should.be.equal(`Missing registered contract Impl at ${this.impl.address}`)
            this.comparator.reports[1].expected.should.be.equal('none')
            this.comparator.reports[1].observed.should.be.equal('one')
            this.comparator.reports[1].description.should.be.equal(`Missing registered contract AnotherImpl at ${this.anotherImpl.address}`)
          })
        })

        describe('when the directory of the current version has many contracts and some of them where unregistered', function () {
          beforeEach('registering two new implementations in AppDirectory', async function () {
            await this.app.setImplementation(ImplV1, 'Impl')
            await this.app.unsetImplementation('Impl', txParams)
            this.anotherImpl = await this.app.setImplementation(AnotherImplV1, 'AnotherImpl')
          })

          it('reports one diff per contract', async function () {
            await this.checker.checkImplementations()

            this.comparator.reports.should.have.lengthOf(1)
            this.comparator.reports[0].expected.should.be.equal('none')
            this.comparator.reports[0].observed.should.be.equal('one')
            this.comparator.reports[0].description.should.be.equal(`Missing registered contract AnotherImpl at ${this.anotherImpl.address}`)
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
          it('reports that diff', async function () {
            await this.checker.checkImplementations()

            this.comparator.reports.should.have.lengthOf(2)
            this.comparator.reports[0].expected.should.be.equal('one')
            this.comparator.reports[0].observed.should.be.equal('none')
            this.comparator.reports[0].description.should.be.equal(`A contract Impl at ${this.impl.address} is not registered`)
            this.comparator.reports[1].expected.should.be.equal('one')
            this.comparator.reports[1].observed.should.be.equal('none')
            this.comparator.reports[1].description.should.be.equal(`A contract AnotherImpl at ${this.anotherImpl.address} is not registered`)
          })
        })

        describe('when the directory of the current version has one of those contract', function () {
          describe('when the directory has the same address and same bytecode for that contract', function () {
            beforeEach('registering new implementation in AppDirectory', async function () {
              await this.app.currentDirectory().setImplementation('Impl', this.impl.address, txParams)
            })

            it('reports only the missing contract', async function () {
              await this.checker.checkImplementations()

              this.comparator.reports.should.have.lengthOf(1)
              this.comparator.reports[0].expected.should.be.equal('one')
              this.comparator.reports[0].observed.should.be.equal('none')
              this.comparator.reports[0].description.should.be.equal(`A contract AnotherImpl at ${this.anotherImpl.address} is not registered`)
            })
          })

          describe('when the directory has another address for that contract', function () {
            beforeEach('registering new implementation in AppDirectory', async function () {
              await this.app.currentDirectory().setImplementation('Impl', this.anotherImpl.address, txParams)
            })

            it('reports those diffs', async function () {
              await this.checker.checkImplementations()

              this.comparator.reports.should.have.lengthOf(3)
              this.comparator.reports[0].expected.should.be.equal(this.impl.address)
              this.comparator.reports[0].observed.should.be.equal(this.anotherImpl.address)
              this.comparator.reports[0].description.should.be.equal('Address for contract Impl does not match')
              this.comparator.reports[1].expected.should.be.equal(bytecodeDigest(ImplV1.deployedBytecode))
              this.comparator.reports[1].observed.should.be.equal(bytecodeDigest(AnotherImplV1.deployedBytecode))
              this.comparator.reports[1].description.should.be.equal(`Bytecode at ${this.anotherImpl.address} for contract Impl does not match`)
              this.comparator.reports[2].expected.should.be.equal('one')
              this.comparator.reports[2].observed.should.be.equal('none')
              this.comparator.reports[2].description.should.be.equal(`A contract AnotherImpl at ${this.anotherImpl.address} is not registered`)
            })
          })

          describe('when the bytecode for that contract is different', function () {
            beforeEach('registering new implementation in AppDirectory', async function () {
              const contracts = this.networkFile.contracts
              contracts.Impl.bodyBytecodeHash = '0x0'
              this.networkFile.contracts = contracts
              await this.app.currentDirectory().setImplementation('Impl', this.impl.address, txParams)
            })

            it('reports both diffs', async function () {
              await this.checker.checkImplementations()

              this.comparator.reports.should.have.lengthOf(2)
              this.comparator.reports[0].expected.should.be.equal('0x0')
              this.comparator.reports[0].observed.should.be.equal(bytecodeDigest(ImplV1.deployedBytecode))
              this.comparator.reports[0].description.should.be.equal(`Bytecode at ${this.impl.address} for contract Impl does not match`)
              this.comparator.reports[1].expected.should.be.equal('one')
              this.comparator.reports[1].observed.should.be.equal('none')
              this.comparator.reports[1].description.should.be.equal(`A contract AnotherImpl at ${this.anotherImpl.address} is not registered`)
            })
          })
        })

        describe('when the directory of the current version has both contracts', function () {
          beforeEach('registering new implementation in AppDirectory', async function () {
            await this.app.currentDirectory().setImplementation('Impl', this.impl.address, txParams)
            await this.app.currentDirectory().setImplementation('AnotherImpl', this.anotherImpl.address, txParams)
          })

          it('does not report any diff ', async function () {
            await this.checker.checkImplementations()

            this.comparator.reports.should.be.empty
          })
        })

        describe('when the directory of the current version has many contracts and some of them where unregistered', function () {
          beforeEach('registering two new implementations in AppDirectory', async function () {
            await this.app.currentDirectory().setImplementation('Impl', this.impl.address, txParams)
            await this.app.unsetImplementation('Impl', txParams)
            await this.app.currentDirectory().setImplementation('AnotherImpl', this.anotherImpl.address, txParams)
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
  };

  function testProxies () {
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
          it('does not report any diff', async function () {
            await this.checker.checkProxies()

            this.comparator.reports.should.be.empty
          })
        })

        describe('when the app has one proxy registered', function () {
          beforeEach('registering new implementation in AppDirectory', async function () {
            this.proxy = await this.app.createProxy(ImplV1, 'Impl', 'initialize', [42])
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
            this.implProxy = await this.app.createProxy(ImplV1, 'Impl', 'initialize', [42])
            this.anotherImplProxy = await this.app.createProxy(AnotherImplV1, 'AnotherImpl', 'initialize', [1])
          })

          it('reports that diff', async function () {
            await this.checker.checkProxies()

            this.comparator.reports.should.have.lengthOf(2)
            this.comparator.reports[0].expected.should.be.equal('none')
            this.comparator.reports[0].observed.should.be.equal('one')
            this.comparator.reports[0].description.should.be.equal(`Missing registered proxy of Impl at ${this.implProxy.address} pointing to ${this.impl.address}`)
            this.comparator.reports[1].expected.should.be.equal('none')
            this.comparator.reports[1].observed.should.be.equal('one')
            this.comparator.reports[1].description.should.be.equal(`Missing registered proxy of AnotherImpl at ${this.anotherImplProxy.address} pointing to ${this.anotherImpl.address}`)
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
                this.networkFile.setProxies('Impl', [
                  { implementation: this.impl.address, address: '0x1', version: '1.0' },
                  { implementation: this.anotherImpl.address, address: this.proxy.address, version: '1.0' },
                ])
              })

              it('reports that diff', async function () {
                await this.checker.checkProxies()

                this.comparator.reports.should.have.lengthOf(2)
                this.comparator.reports[0].expected.should.be.equal(this.anotherImpl.address)
                this.comparator.reports[0].observed.should.be.equal(this.impl.address)
                this.comparator.reports[0].description.should.be.equal(`Pointed implementation of Impl proxy at ${this.proxy.address} does not match`)
                this.comparator.reports[1].expected.should.be.equal('one')
                this.comparator.reports[1].observed.should.be.equal('none')
                this.comparator.reports[1].description.should.be.equal(`A proxy of Impl at 0x1 pointing to ${this.impl.address} is not registered`)
              })
            })

            describe('when it matches the implementation address but not the alias', function () {
              beforeEach('changing network file', async function () {
                this.networkFile.setProxies('Impl', [{ implementation: this.impl.address, address: '0x1', version: '1.0' }])
                this.networkFile.setProxies('AnotherImpl', [{ implementation: this.impl.address, address: this.proxy.address, version: '1.0' }])
              })

              it('reports that diff', async function () {
                await this.checker.checkProxies()

                this.comparator.reports.should.have.lengthOf(2)
                this.comparator.reports[0].expected.should.be.equal('AnotherImpl')
                this.comparator.reports[0].observed.should.be.equal('Impl')
                this.comparator.reports[0].description.should.be.equal(`Alias of proxy at ${this.proxy.address} pointing to ${this.impl.address} does not match`)
                this.comparator.reports[1].expected.should.be.equal('one')
                this.comparator.reports[1].observed.should.be.equal('none')
                this.comparator.reports[1].description.should.be.equal(`A proxy of Impl at 0x1 pointing to ${this.impl.address} is not registered`)
              })
            })

            describe('when it does not match the alias and the implementation address', function () {
              beforeEach('changing network file', async function () {
                this.networkFile.setProxies('Impl', [{ implementation: this.impl.address, address: '0x1', version: '1.0' }])
                this.networkFile.setProxies('AnotherImpl', [{ implementation: this.anotherImpl.address, address: this.proxy.address, version: '1.0' }])
              })

              it('reports that diff', async function () {
                await this.checker.checkProxies()

                this.comparator.reports.should.have.lengthOf(3)
                this.comparator.reports[0].expected.should.be.equal('AnotherImpl')
                this.comparator.reports[0].observed.should.be.equal('Impl')
                this.comparator.reports[0].description.should.be.equal(`Alias of proxy at ${this.proxy.address} pointing to ${this.impl.address} does not match`)
                this.comparator.reports[1].expected.should.be.equal(this.anotherImpl.address)
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
  };
})
