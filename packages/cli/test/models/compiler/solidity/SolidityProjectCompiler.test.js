require('../../../setup');

import { FileSystem } from '@openzeppelin/upgrades';
import { compileProject } from '../../../../src/models/compiler/solidity/SolidityProjectCompiler';
import { unlinkSync, existsSync, statSync, utimesSync, writeFileSync } from 'fs';
import path from 'path';
import { writeJSONSync, readJSONSync } from 'fs-extra';

describe('SolidityProjectCompiler', function() {
  const rootDir = path.resolve(__dirname, '../../../../');
  const baseTestBuildDir = `${rootDir}/test/tmp`;

  after('cleanup test build dir', function() {
    FileSystem.removeTree(baseTestBuildDir);
  });

  describe('in mock-stdlib project', function() {
    this.timeout(20000);

    const inputDir = `${rootDir}/test/mocks/mock-stdlib/contracts`;
    const outputDir = `${baseTestBuildDir}/mock-stdlib`;
    const greeterArtifactPath = `${outputDir}/GreeterImpl.json`;
    beforeEach('compiling', async function() {
      await compileProject({ inputDir, outputDir, version: '0.5.9', force: true });
    });

    it('compiles all contracts in the project', function() {
      FileSystem.exists(outputDir).should.be.true;
      FileSystem.readDir(outputDir).should.have.lengthOf(2);
    });

    it('generates correct artifacts', function() {
      FileSystem.readDir(outputDir).forEach(schemaFileName => {
        const contractName = schemaFileName.substring(0, schemaFileName.lastIndexOf('.'));
        const contractPath = `${inputDir}/${contractName}.sol`;
        const schemaPath = `${outputDir}/${schemaFileName}`;
        const schema = FileSystem.parseJson(schemaPath);

        schema.fileName.should.be.eq(`${contractName}.sol`);
        schema.contractName.should.be.eq(contractName);
        schema.source.should.be.eq(FileSystem.read(contractPath));
        schema.sourcePath.should.be.eq(`test/mocks/mock-stdlib/contracts/${contractName}.sol`);
        schema.sourceMap.should.not.be.null;
        schema.abi.should.not.be.null;
        schema.ast.should.not.be.null;
        schema.bytecode.should.not.be.null;
        schema.deployedBytecode.should.not.be.null;
        schema.compiler.name.should.be.eq('solc');
        schema.compiler.version.should.startWith('0.5.9+commit');
        schema.compiler.optimizer.should.be.deep.equal({ enabled: false });
        schema.compiler.evmVersion.should.be.eq('petersburg');
      });
    });

    it('replaces library names', function() {
      const schema = FileSystem.parseJson(greeterArtifactPath);
      schema.bytecode.should.match(/__GreeterLib____________________________/);
      schema.deployedBytecode.should.match(/__GreeterLib____________________________/);
    });

    it('does not recompile if there were no changes to sources', async function() {
      const origMtime = statSync(greeterArtifactPath).mtimeMs;
      await compileProject({ inputDir, outputDir, version: '0.5.9' });
      statSync(greeterArtifactPath).mtimeMs.should.eq(origMtime);
    });

    it('recompiles if sources changed', async function() {
      const { mtimeMs: origMtime, atimeMs } = statSync(greeterArtifactPath);
      utimesSync(greeterArtifactPath, atimeMs, Date.now());
      await compileProject({ inputDir, outputDir, version: '0.5.9' });
      statSync(greeterArtifactPath).mtimeMs.should.not.eq(origMtime);
    });

    it('recompiles if compiler version changed', async function() {
      const origMtime = statSync(greeterArtifactPath).mtimeMs;
      await compileProject({ inputDir, outputDir, version: '0.5.0' });
      statSync(greeterArtifactPath).mtimeMs.should.not.eq(origMtime);
      const schema = FileSystem.parseJson(greeterArtifactPath);
      schema.compiler.version.should.eq('0.5.0+commit.1d4f565a.Emscripten.clang');
    });

    it('recompiles if compiler settings changed', async function() {
      const origMtime = statSync(greeterArtifactPath).mtimeMs;
      const optimizer = { enabled: true, runs: 300 };
      await compileProject({
        inputDir,
        outputDir,
        version: '0.5.9',
        optimizer,
      });
      statSync(greeterArtifactPath).mtimeMs.should.not.eq(origMtime);
      const schema = FileSystem.parseJson(greeterArtifactPath);
      schema.compiler.optimizer.should.be.deep.equal(optimizer);
    });

    it('outputs friendly error on invalid import', async function() {
      writeFileSync(`${inputDir}/Invalid.sol`, 'pragma solidity ^0.5.0; import "./NotExists.sol";');
      await compileProject({ inputDir, outputDir }).should.be.rejectedWith(/could not find file \.\/NotExists\.sol/i);
    });

    // For more info, see: https://github.com/zeppelinos/zos/issues/1071
    it('preserves truffle deployment info', async function() {
      const networksData = {
        '100001': {
          address: '0x63b52a2f619537f553e5097b8866c0f4ebec62ee',
          links: {},
          events: {},
          updated_at: 1563287608947, // eslint-disable-line @typescript-eslint/camelcase
        },
        '100002': {
          address: '0x63b52a2f619537f553e5097b8866c0f4ebec62ef',
          links: {},
          events: {},
          updated_at: 1563287608948, // eslint-disable-line @typescript-eslint/camelcase
        },
      };

      // Add networks data to compiled artifact
      writeJSONSync(greeterArtifactPath, {
        ...readJSONSync(greeterArtifactPath),
        networks: networksData,
      });

      // Force recompile
      await compileProject({ inputDir, outputDir, force: true });

      // Artifact should have been compiled and deployment info preserved
      const schema = readJSONSync(greeterArtifactPath);
      schema.abi.should.be.not.null;
      schema.bytecode.should.be.not.null;
      schema.networks.should.be.not.null;
      schema.networks.should.deep.include(networksData);
    });

    afterEach(function() {
      const invalidFilePath = `${inputDir}/Invalid.sol`;
      if (existsSync(invalidFilePath)) {
        unlinkSync(invalidFilePath);
      }
    });
  });

  describe('in mock-stdlib-with-deps project', function() {
    this.timeout(20000);

    const inputDir = `${rootDir}/mocks/mock-stdlib-with-deps/contracts`;
    const outputDir = `${baseTestBuildDir}/mock-stdlib-with-deps`;
    const greeterArtifactPath = `${outputDir}/GreeterImpl.json`;
    const dependencyArtifactPath = `${outputDir}/GreeterImpl.json`;

    before('compiling', async function() {
      await compileProject({ inputDir, outputDir, version: '0.5.9' });
    });

    it('compiles project contracts', async function() {
      FileSystem.exists(greeterArtifactPath).should.be.true;
      FileSystem.parseJson(greeterArtifactPath).bytecode.should.not.be.null;
    });

    it('compiles dependency contracts', async function() {
      FileSystem.exists(dependencyArtifactPath).should.be.true;
      FileSystem.parseJson(dependencyArtifactPath).bytecode.should.not.be.null;
    });
  });

  describe('in mock-stdlib-with-spaces project', function() {
    this.timeout(20000);

    const inputDir = `${rootDir}/test/mocks/mock-stdlib with spaces/contracts`;
    const outputDir = `${baseTestBuildDir}/mock-stdlib with spaces`;
    const greeterArtifactPath = `${outputDir}/GreeterImpl.json`;

    before('compiling', async function() {
      await compileProject({ inputDir, outputDir, version: '0.5.9' });
    });

    it('compiles project contracts', async function() {
      FileSystem.exists(greeterArtifactPath).should.be.true;
      const schema = FileSystem.parseJson(greeterArtifactPath);
      schema.bytecode.should.not.be.null;
      schema.sourcePath.should.be.eq(`test/mocks/mock-stdlib with spaces/contracts/GreeterImpl.sol`);
    });
  });

  describe('in mock-stdlib-empty project', function() {
    this.timeout(20000);

    const inputDir = `${rootDir}/test/mocks/mock-stdlib-empty/contracts`;
    const outputDir = `${baseTestBuildDir}/mock-stdlib-empty`;

    it('compiles without errors', async function() {
      await compileProject({ inputDir, outputDir, version: '0.5.9' });
    });

    it('compiles without errors if input dir does not exist', async function() {
      const inputDir = `${rootDir}/test/mocks/mock-stdlib-empty/not-exists`;
      await compileProject({ inputDir, outputDir, version: '0.5.9' });
    });
  });

  describe('in mock-project-with-root-imports project', function() {
    this.timeout(20000);

    const projectDir = `${rootDir}/mocks/mock-project-with-root-imports`;
    const inputDir = `${rootDir}/mocks/mock-project-with-root-imports/contracts`;
    const outputDir = `${baseTestBuildDir}/mock-project-with-root-imports`;

    it('compiles without errors', async function() {
      this.cwd = process.cwd();
      process.chdir(projectDir);
      await compileProject({ inputDir, outputDir, version: '0.5.9' });
    });

    afterEach(function() {
      process.chdir(this.cwd);
    });
  });
});
