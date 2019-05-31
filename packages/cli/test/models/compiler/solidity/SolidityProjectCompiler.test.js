require('../../../setup')

import { FileSystem } from 'zos-lib'
import { compileProject } from '../../../../src/models/compiler/solidity/SolidityProjectCompiler'
import { statSync, utimesSync } from 'fs';
import path from 'path';

describe('SolidityProjectCompiler', function () {
  const rootDir = path.resolve(__dirname, '../../../../');
  const baseTestBuildDir = `${rootDir}/test/tmp`;
  
  after('cleanup test build dir', function () {
    FileSystem.removeTree(baseTestBuildDir)
  });

  describe('in mock-stdlib project', function () {
    this.timeout(20000);

    const inputDir = `${rootDir}/test/mocks/mock-stdlib/contracts`;
    const outputDir = `${baseTestBuildDir}/mock-stdlib`;
    const greeterArtifactPath = `${outputDir}/GreeterImpl.json`;
    
    before('compiling', async function () {
      await compileProject({ inputDir, outputDir, version: '0.5.9' });
    });

    it('compiles all contracts in the project', function () {
      FileSystem.exists(outputDir).should.be.true;
      FileSystem.readDir(outputDir).should.have.lengthOf(2);
    });

    it('generates correct artifacts', function () {
      FileSystem.readDir(outputDir).forEach(schemaFileName => {
        const contractName = schemaFileName.substring(0, schemaFileName.lastIndexOf('.'))
        const contractPath = `${inputDir}/${contractName}.sol`
        const schemaPath = `${outputDir}/${schemaFileName}`
        const schema = FileSystem.parseJson(schemaPath)
  
        schema.fileName.should.be.eq(`${contractName}.sol`)
        schema.contractName.should.be.eq(contractName)
        schema.source.should.be.eq(FileSystem.read(contractPath))
        schema.sourcePath.should.be.eq(contractPath)
        schema.sourceMap.should.not.be.null
        schema.abi.should.not.be.null
        schema.ast.should.not.be.null
        schema.bytecode.should.not.be.null
        schema.deployedBytecode.should.not.be.null
        schema.compiler.name.should.be.eq('solc')
        schema.compiler.version.should.be.eq('0.5.9+commit.e560f70d.Emscripten.clang')
        schema.compiler.optimizer.should.be.deep.equal({ enabled: false })
        schema.compiler.evmVersion.should.be.eq('constantinople')
      });
    });

    it('replaces library names', function () {
      const schema = FileSystem.parseJson(greeterArtifactPath);
      schema.bytecode.should.match(/__GreeterLib____________________________/);
      schema.deployedBytecode.should.match(/__GreeterLib____________________________/);
    });

    it('does not recompile if there were no changes to sources', async function () {
      const origMtime = statSync(greeterArtifactPath).mtimeMs;
      await compileProject({ inputDir, outputDir, version: '0.5.9' });
      statSync(greeterArtifactPath).mtimeMs.should.eq(origMtime);
    });

    it('recompiles if sources changed', async function () {
      const { mtimeMs: origMtime, atimeMs } = statSync(greeterArtifactPath);
      utimesSync(greeterArtifactPath, atimeMs, Date.now());
      await compileProject({ inputDir, outputDir, version: '0.5.9' });
      statSync(greeterArtifactPath).mtimeMs.should.not.eq(origMtime);
    });

    it('recompiles if compiler version changed', async function () {
      const origMtime = statSync(greeterArtifactPath).mtimeMs;
      await compileProject({ inputDir, outputDir, version: '0.5.0' });
      statSync(greeterArtifactPath).mtimeMs.should.not.eq(origMtime);
      const schema = FileSystem.parseJson(greeterArtifactPath);
      schema.compiler.version.should.eq('0.5.0+commit.1d4f565a.Emscripten.clang');
    });

    it('recompiles if compiler settings changed', async function () {
      const origMtime = statSync(greeterArtifactPath).mtimeMs;
      const optimizer = { enabled: true, runs: 300 };
      await compileProject({ inputDir, outputDir, version: '0.5.9', optimizer });
      statSync(greeterArtifactPath).mtimeMs.should.not.eq(origMtime);
      const schema = FileSystem.parseJson(greeterArtifactPath);
      schema.compiler.optimizer.should.be.deep.equal(optimizer)
    });
  });

  describe('in mock-stdlib-with-deps project', function () {
    this.timeout(20000);

    const inputDir = `${rootDir}/mocks/mock-stdlib-with-deps/contracts`;
    const outputDir = `${baseTestBuildDir}/mock-stdlib-with-deps`;
    const greeterArtifactPath = `${outputDir}/GreeterImpl.json`;
    const dependencyArtifactPath = `${outputDir}/GreeterImpl.json`;
    
    before('compiling', async function () {
      await compileProject({ inputDir, outputDir, version: '0.5.9' });
    });

    it('compiles project contracts', async function () {
      FileSystem.exists(greeterArtifactPath).should.be.true;
      FileSystem.parseJson(greeterArtifactPath).bytecode.should.not.be.null;
    });

    it('compiles dependency contracts', async function () {
      FileSystem.exists(dependencyArtifactPath).should.be.true;
      FileSystem.parseJson(dependencyArtifactPath).bytecode.should.not.be.null;
    })
  });
})