import CaptureLogs from "../../../helpers/captureLogs";

require('../../../setup')

import { FileSystem } from 'zos-lib'
import SolidityContractsCompiler from '../../../../src/models/compiler/solidity/SolidityContractsCompiler'

describe('SolidityContractsCompiler', function () {

  const contract_Solc04 = {
    fileName: 'Example04.sol',
    filePath: '/test/Example04.sol',
    source: 'pragma solidity ^0.4.24; contract Example04 { function f() public pure returns (string memory) { return "bla"; } }'
  }

  const anotherContract_Solc04 = {
    fileName: 'AnotherExample04.sol',
    filePath: '/test/AnotherExample04.sol',
    source: 'pragma solidity ^0.4.24; contract AnotherExample04 { function f() public pure returns (uint) { return 2; } }'
  }

  const contractWithWarnings_Solc04 = {
    fileName: 'ExampleWithWarnings04.sol',
    filePath: '/test/ExampleWithWarnings04.sol',
    source: 'pragma solidity ^0.4.24; contract ExampleWithWarnings04 { function f() public returns (uint) { return 2; } }'
  }

  const contractWithErrors_Solc04 = {
    fileName: 'ExampleWithErrors04.sol',
    filePath: '/test/ExampleWithErrors04.sol',
    source: 'pragma solidity ^0.4.24; contract ExampleWithErrors04 { function f() public { return 2; } }'
  }

  const contract_Solc05 = {
    fileName: 'Example05.sol',
    filePath: '/test/Example05.sol',
    source: 'pragma solidity ^0.5.0; contract Example05 { function f() public pure returns (string memory) { return "bla"; } }'
  }

  const anotherContract_Solc05 = {
    fileName: 'AnotherExample05.sol',
    filePath: '/test/AnotherExample05.sol',
    source: 'pragma solidity ^0.5.0; contract AnotherExample05 { function f() public pure returns (uint) { return 2; } }'
  }

  const contractWithWarnings_Solc05 = {
    fileName: 'ExampleWithWarnings05.sol',
    filePath: '/test/ExampleWithWarnings05.sol',
    source: 'pragma solidity ^0.5.0; contract ExampleWithWarnings05 { function f() public { } }'
  }

  const contractWithErrors_Solc05 = {
    fileName: 'ExampleWithErrors05.sol',
    filePath: '/test/ExampleWithErrors.sol',
    source: 'pragma solidity ^0.5.0; contract ExampleWithErrors05 { function f() public { return 2; } }'
  }

  beforeEach('capturing logging', function () {
    this.logs = new CaptureLogs();
  })

  afterEach('restore logging', function () {
    this.logs.restore()
  })

  describe('0.5.x', function () {
    describe('when requested a valid pragma version', function () {
      describe('when all contracts do not have neither warnings nor errors', function () {
        const contracts = [contract_Solc05, anotherContract_Solc05]

        describe('when no options are given', function () {
          const options = {}

          it('compiles the given contracts using solc 0.5 byzantium without optimizer', async function () {
            const compiler = new SolidityContractsCompiler(contracts, options)
            const output = await compiler.call()

            output.should.have.lengthOf(2)
            output.forEach(data => {
              const contract = contracts.find(contract => contract.fileName === data.fileName)
              const { source, fileName, filePath } = contract
              const contractName = fileName.substring(0, fileName.lastIndexOf('.'))

              data.contractName.should.be.eq(contractName)
              data.source.should.be.eq(source)
              data.sourcePath.should.be.eq(filePath)
              data.sourceMap.should.not.be.null
              data.abi.should.not.be.null
              data.ast.should.not.be.null
              data.legacyAST.should.not.be.null
              data.bytecode.should.not.be.null
              data.deployedBytecode.should.not.be.null
              data.compiler.name.should.be.eq('solc')
              data.compiler.version.should.be.eq('0.5.1+commit.c8a2cb62.Emscripten.clang')
              data.compiler.optimizer.should.be.deep.equal({ enabled: false })
              data.compiler.evmVersion.should.be.eq('byzantium')
            })

            this.logs.errors.should.be.empty
            this.logs.warns.should.be.empty
          }).timeout(180000)
        })

        describe('when some options are given', function () {
          const options = { version: '0.5.0', optimizer: { enabled: true, runs: 200 }}

          it('compiles the given contracts using the requested options', async function () {
            const compiler = new SolidityContractsCompiler(contracts, options)
            const output = await compiler.call()

            output.should.have.lengthOf(2)
            output.forEach(data => {
              const contract = contracts.find(contract => contract.fileName === data.fileName)
              const { source, fileName, filePath } = contract
              const contractName = fileName.substring(0, fileName.lastIndexOf('.'))

              data.contractName.should.be.eq(contractName)
              data.source.should.be.eq(source)
              data.sourcePath.should.be.eq(filePath)
              data.sourceMap.should.not.be.null
              data.abi.should.not.be.null
              data.ast.should.not.be.null
              data.legacyAST.should.not.be.null
              data.bytecode.should.not.be.null
              data.deployedBytecode.should.not.be.null
              data.compiler.name.should.be.eq('solc')
              data.compiler.version.should.be.eq('0.5.0')
              data.compiler.optimizer.should.be.deep.equal({ enabled: true, runs: 200 })
              data.compiler.evmVersion.should.be.eq('byzantium')
            })

            this.logs.errors.should.be.empty
            this.logs.warns.should.be.empty
          }).timeout(180000)
        })
      })

      describe('when a contract has warnings', function () {
        const options = { version: '0.5.0' }
        const contracts = [contract_Solc05, anotherContract_Solc05, contractWithWarnings_Solc05]

        it('compiles the given contracts and logs those warnings', async function () {
          const compiler = new SolidityContractsCompiler(contracts, options)
          const output = await compiler.call()

          output.should.have.lengthOf(3)
          output.forEach(data => {
            const contract = contracts.find(contract => contract.fileName === data.fileName)
            const { source, fileName, filePath } = contract
            const contractName = fileName.substring(0, fileName.lastIndexOf('.'))

            data.contractName.should.be.eq(contractName)
            data.source.should.be.eq(source)
            data.sourcePath.should.be.eq(filePath)
            data.sourceMap.should.not.be.null
            data.abi.should.not.be.null
            data.ast.should.not.be.null
            data.legacyAST.should.not.be.null
            data.bytecode.should.not.be.null
            data.deployedBytecode.should.not.be.null
            data.compiler.name.should.be.eq('solc')
            data.compiler.version.should.be.eq('0.5.0')
            data.compiler.optimizer.should.be.deep.equal({ enabled: false })
            data.compiler.evmVersion.should.be.eq('byzantium')
          })

          this.logs.errors.should.be.empty
          this.logs.warns.should.have.lengthOf(1)
          this.logs.warns[0].should.match(/Function state mutability can be restricted to pure/)
        }).timeout(180000)
      })

      describe('when a contract has errors', function () {
        const options = { version: '0.5.0' }
        const contracts = [contract_Solc05, anotherContract_Solc05, contractWithErrors_Solc05]

        it('fails', async function () {
          try {
            const compiler = new SolidityContractsCompiler(contracts, options)
            await compiler.call()
            throw Error('expected compilation process to fail but succeeded')
          } catch(error) {
            error.message.should.match(/Different number of arguments in return statement than in returns declaration/)
          }
        }).timeout(180000)
      })
    })

    describe('when requesting an invalid pragma version', function () {
      const options = { version: '0.5.0' }
      const contracts = [contract_Solc05, contract_Solc04]

      it('fails', async function () {
        try {
          const compiler = new SolidityContractsCompiler(contracts, options)
          await compiler.call()
          throw Error('expected compilation process to fail but succeeded')
        } catch(error) {
          error.message.should.match(/Source file requires different compiler version/)
        }
      }).timeout(180000)
    })
  })

  describe('0.4.x', function () {
    describe('when requested a valid pragma version', function () {
      describe('when all contracts do not have neither warnings nor errors', function () {
        const contracts = [contract_Solc04, anotherContract_Solc04]

        describe('when no options are given but the version', function () {
          const options = { version: '0.4.24' }

          it('compiles the given contracts using solc requested version byzantium without optimizer', async function () {
            const compiler = new SolidityContractsCompiler(contracts, options)
            const output = await compiler.call()

            output.should.have.lengthOf(2)
            output.forEach(data => {
              const contract = contracts.find(contract => contract.fileName === data.fileName)
              const { source, fileName, filePath } = contract
              const contractName = fileName.substring(0, fileName.lastIndexOf('.'))

              data.contractName.should.be.eq(contractName)
              data.source.should.be.eq(source)
              data.sourcePath.should.be.eq(filePath)
              data.sourceMap.should.not.be.null
              data.abi.should.not.be.null
              data.ast.should.not.be.null
              data.legacyAST.should.not.be.null
              data.bytecode.should.not.be.null
              data.deployedBytecode.should.not.be.null
              data.compiler.name.should.be.eq('solc')
              data.compiler.version.should.be.eq('0.4.24')
              data.compiler.optimizer.should.be.deep.equal({ enabled: false })
              data.compiler.evmVersion.should.be.eq('byzantium')
            })

            this.logs.errors.should.be.empty
            this.logs.warns.should.be.empty
          }).timeout(180000)
        })

        describe('when some options are given', function () {
          const options = { version: '0.4.24', optimizer: { enabled: true, runs: 200 }}

          it('compiles the given contracts using the requested options', async function () {
            const compiler = new SolidityContractsCompiler(contracts, options)
            const output = await compiler.call()

            output.should.have.lengthOf(2)
            output.forEach(data => {
              const contract = contracts.find(contract => contract.fileName === data.fileName)
              const { source, fileName, filePath } = contract
              const contractName = fileName.substring(0, fileName.lastIndexOf('.'))

              data.contractName.should.be.eq(contractName)
              data.source.should.be.eq(source)
              data.sourcePath.should.be.eq(filePath)
              data.sourceMap.should.not.be.null
              data.abi.should.not.be.null
              data.ast.should.not.be.null
              data.legacyAST.should.not.be.null
              data.bytecode.should.not.be.null
              data.deployedBytecode.should.not.be.null
              data.compiler.name.should.be.eq('solc')
              data.compiler.version.should.be.eq('0.4.24')
              data.compiler.optimizer.should.be.deep.equal({ enabled: true, runs: 200 })
              data.compiler.evmVersion.should.be.eq('byzantium')
            })

            this.logs.errors.should.be.empty
            this.logs.warns.should.be.empty
          }).timeout(180000)
        })
      })

      describe('when a contract has warnings', function () {
        const options = { version: '0.4.24' }
        const contracts = [contract_Solc04, anotherContract_Solc04, contractWithWarnings_Solc04]

        it('compiles the given contracts and logs those warnings', async function () {
          const compiler = new SolidityContractsCompiler(contracts, options)
          const output = await compiler.call()

          output.should.have.lengthOf(3)
          output.forEach(data => {
            const contract = contracts.find(contract => contract.fileName === data.fileName)
            const { source, fileName, filePath } = contract
            const contractName = fileName.substring(0, fileName.lastIndexOf('.'))

            data.contractName.should.be.eq(contractName)
            data.source.should.be.eq(source)
            data.sourcePath.should.be.eq(filePath)
            data.sourceMap.should.not.be.null
            data.abi.should.not.be.null
            data.ast.should.not.be.null
            data.legacyAST.should.not.be.null
            data.bytecode.should.not.be.null
            data.deployedBytecode.should.not.be.null
            data.compiler.name.should.be.eq('solc')
            data.compiler.version.should.be.eq('0.4.24')
            data.compiler.optimizer.should.be.deep.equal({ enabled: false })
            data.compiler.evmVersion.should.be.eq('byzantium')
          })

          this.logs.errors.should.be.empty
          this.logs.warns.should.have.lengthOf(1)
          this.logs.warns[0].should.match(/Function state mutability can be restricted to pure/)
        }).timeout(180000)
      })

      describe('when a contract has errors', function () {
        const options = { version: '0.4.24' }
        const contracts = [contract_Solc04, anotherContract_Solc04, contractWithErrors_Solc04]

        it('fails', async function () {
          try {
            const compiler = new SolidityContractsCompiler(contracts, options)
            await compiler.call()
            throw Error('expected compilation process to fail but succeeded')
          } catch(error) {
            error.message.should.match(/Different number of arguments in return statement than in returns declaration/)
          }
        }).timeout(180000)
      })
    })

    describe('when requesting an invalid pragma version', function () {
      const options = { version: '0.4.24' }
      const contracts = [contract_Solc05, contract_Solc04]

      it('fails', async function () {
        try {
          const compiler = new SolidityContractsCompiler(contracts, options)
          const output = await compiler.call()
          console.log(output)
          throw Error('expected compilation process to fail but succeeded')
        } catch(error) {
          error.message.should.match(/Source file requires different compiler version/)
        }
      }).timeout(180000)
    })
  })
})
