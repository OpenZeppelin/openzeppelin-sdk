require('../../../setup')

import { FileSystem } from 'zos-lib'
import SolidityProjectCompiler from '../../../../src/models/compiler/solidity/SolidityProjectCompiler'

describe('SolidityProjectCompiler', function () {
  const inputDir = `${process.cwd()}/test/mocks/mock-stdlib/contracts`
  const testBuildDir = `${process.cwd()}/test/tmp`
  const compiler = new SolidityProjectCompiler(inputDir, testBuildDir, { version: '0.4.24' })

  afterEach(() => FileSystem.removeTree(testBuildDir))

  it('compiles all the contracts of the given project', async function () {
    await compiler.call()

    FileSystem.exists(testBuildDir).should.be.true
    FileSystem.readDir(testBuildDir).forEach(schemaFileName => {
      const contractName = schemaFileName.substring(0, schemaFileName.lastIndexOf('.'))
      const contractPath = `${inputDir}/${contractName}.sol`
      const schemaPath = `${testBuildDir}/${schemaFileName}`
      const schema = FileSystem.parseJson(schemaPath)

      schema.fileName.should.be.eq(`${contractName}.sol`)
      schema.contractName.should.be.eq(contractName)
      schema.source.should.be.eq(FileSystem.read(contractPath))
      schema.sourcePath.should.be.eq(contractPath)
      schema.sourceMap.should.not.be.null
      schema.abi.should.not.be.null
      schema.ast.should.not.be.null
      schema.legacyAST.should.not.be.null
      schema.bytecode.should.not.be.null
      schema.deployedBytecode.should.not.be.null
      schema.compiler.name.should.be.eq('solc')
      schema.compiler.version.should.be.eq('0.4.24')
      schema.compiler.optimizer.should.be.deep.equal({ enabled: false })
      schema.compiler.evmVersion.should.be.eq('byzantium')
    })
  }).timeout(180000)
})
