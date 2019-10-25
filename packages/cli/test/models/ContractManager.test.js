'use strict';

require('../setup');

import sinon from 'sinon';
import { FileSystem, Contracts } from '@openzeppelin/upgrades';
import ContractManager from '../../src/models/local/ContractManager';
import ProjectFile from '../../src/models/files/ProjectFile';
import ConfigManager from '../../src/models/config/ConfigManager';

contract('ContractManager', function([_, from]) {
  describe('methods', function() {
    describe('getContractNames', function() {
      context('without directory created', function() {
        beforeEach('create test dir', function() {
          this.testDir = `${process.cwd()}/test/tmp`;
          this.projectFile = new ProjectFile(`${this.testDir}/zos.json`);
          this.contractManager = new ContractManager(this.projectFile);
          FileSystem.createDir(this.testDir);
          sinon.stub(ConfigManager, 'getBuildDir').returns(`${this.testDir}/build/contracts`);
        });

        afterEach('remove test dir', function() {
          FileSystem.removeTree(this.testDir);
          sinon.restore();
        });

        it('returns an empty array', function() {
          this.contractManager.getContractNames().should.be.an('array').that.is.empty;
        });
      });

      context('with directory created', function() {
        context('without contracts', function() {
          beforeEach('create test dir', function() {
            this.testDir = `${process.cwd()}/test/tmp`;
            this.projectFile = new ProjectFile(`${this.testDir}/zos.json`);
            this.contractManager = new ContractManager(this.projectFile);
            FileSystem.createDir(this.testDir);
            FileSystem.createDirPath(`${this.testDir}/build/contracts`);
            sinon.stub(ConfigManager, 'getBuildDir').returns(`${this.testDir}/build/contracts`);
          });

          afterEach('remove test dir', function() {
            FileSystem.removeTree(this.testDir);
            sinon.restore();
          });

          it('returns an empty array', function() {
            const contractNames = this.contractManager.getContractNames();
            expect(contractNames).to.be.empty;
          });
        });

        const testReturnsContracts = function(description, sourcePath) {
          context(description, function() {
            beforeEach(function() {
              this.testDir = `${process.cwd()}/test/mocks/mock-stdlib`;
              const builtContract = {
                sourcePath: sourcePath || `${this.testDir}/contracts/Foo.sol`,
                bytecode: '0x124',
                contractName: 'Foo',
              };
              FileSystem.writeJson(`${this.testDir}/build/contracts/Foo.json`, builtContract);
              this.projectFile = new ProjectFile(`${this.testDir}/zos.json`);
              this.contractManager = new ContractManager(this.projectFile);
              sinon.stub(ConfigManager, 'getBuildDir').returns(`${this.testDir}/build/contracts`);
              sinon.stub(Contracts, 'getLocalContractsDir').returns(`${this.testDir}/contracts`);
            });

            afterEach(function() {
              sinon.restore();
            });

            it('returns an array with items inside', function() {
              const contractNames = this.contractManager.getContractNames(this.testDir);

              contractNames.should.be.an('array');
              contractNames.should.include('Foo');
              contractNames.should.not.include('GreeterLib');
            });
          });
        }.bind(this);

        testReturnsContracts('with contracts with absolute path');
        testReturnsContracts('with contracts with relative path', './contracts/Foo.sol');
      });
    });
  });
});
