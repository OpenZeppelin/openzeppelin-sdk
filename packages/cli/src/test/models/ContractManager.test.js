'use strict';

require('../setup');

import fs from 'fs-extra';
import { expect } from 'chai';

import sinon from 'sinon';
import { Contracts } from '@openzeppelin/upgrades';
import ContractManager from '../../models/local/ContractManager';
import ProjectFile from '../../models/files/ProjectFile';
import ConfigManager from '../../models/config/ConfigManager';

describe('ContractManager', function() {
  describe('methods', function() {
    describe('getContractNames', function() {
      context('without directory created', function() {
        beforeEach('create test dir', function() {
          this.testDir = `${process.cwd()}/tmp`;
          this.projectFile = new ProjectFile(`${this.testDir}/zos.json`);
          this.contractManager = new ContractManager(this.projectFile);
          fs.mkdirSync(this.testDir, { recursive: true });
          sinon.stub(ConfigManager, 'getBuildDir').returns(`${this.testDir}/build/contracts`);
        });

        afterEach('remove test dir', function() {
          fs.removeSync(this.testDir);
          sinon.restore();
        });

        it('returns an empty array', function() {
          this.contractManager.getContractNames().should.be.an('array').that.is.empty;
        });
      });

      context('with directory created', function() {
        context('without contracts', function() {
          beforeEach('create test dir', function() {
            this.testDir = `${process.cwd()}/tmp`;
            this.projectFile = new ProjectFile(`${this.testDir}/zos.json`);
            this.contractManager = new ContractManager(this.projectFile);
            fs.mkdirSync(this.testDir, { recursive: true });
            fs.mkdirSync(`${this.testDir}/build/contracts`, { recursive: true });
            sinon.stub(ConfigManager, 'getBuildDir').returns(`${this.testDir}/build/contracts`);
          });

          afterEach('remove test dir', function() {
            fs.removeSync(this.testDir);
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
              this.testDir = `${process.cwd()}/mocks/mock-stdlib`;
              const builtContract = {
                sourcePath: sourcePath || `${this.testDir}/contracts/Foo.sol`,
                bytecode: '0x124',
                contractName: 'Foo',
              };
              this.fooContractPath = `${this.testDir}/build/contracts/Foo.json`;
              fs.writeJsonSync(this.fooContractPath, builtContract, { spaces: 2 });
              this.projectFile = new ProjectFile(`${this.testDir}/zos.json`);
              this.contractManager = new ContractManager(this.projectFile);
              sinon.stub(ConfigManager, 'getBuildDir').returns(`${this.testDir}/build/contracts`);
              sinon.stub(Contracts, 'getLocalContractsDir').returns(`${this.testDir}/contracts`);
            });

            afterEach(function() {
              fs.unlinkSync(this.fooContractPath);
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
