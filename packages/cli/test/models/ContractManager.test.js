'use strict';

require('../setup');

import sinon from 'sinon';
import { FileSystem } from 'zos-lib';
import ContractManager from '../../src/models/local/ContractManager';
import ZosPackageFile from '../../src/models/files/ZosPackageFile';
import ConfigManager from '../../src/models/config/ConfigManager';

contract('ContractManager', function([_, from]) {
  describe("methods", function() {
    describe('getContractNames', function() {
      context('without directory created', function() {
        beforeEach('create test dir', function() {
          this.testDir = `${process.cwd()}/test/tmp`;
          this.packageFile = new ZosPackageFile(`${this.testDir}/zos.json`);
          this.contractManager = new ContractManager(this.packageFile);
          FileSystem.createDir(this.testDir);
          sinon.stub(ConfigManager, 'getBuildDir').returns(`${this.testDir}/build/contracts`);
        })

        afterEach('remove test dir', function() {
          FileSystem.removeTree(this.testDir);
          sinon.restore();
        })

        it('returns an empty array', function() {
          this.contractManager.getContractNames().should.be.an('array').that.is.empty;
        })
      })

      context('with directory created', function() {
        context('without contracts', function() {
          beforeEach('create test dir', function() {
            this.testDir = `${process.cwd()}/test/tmp`;
            this.packageFile = new ZosPackageFile(`${this.testDir}/zos.json`);
            this.contractManager = new ContractManager(this.packageFile);
            FileSystem.createDir(this.testDir);
            FileSystem.createDirPath(`${this.testDir}/build/contracts`);
            sinon.stub(ConfigManager, 'getBuildDir').returns(`${this.testDir}/build/contracts`);
          })

          afterEach('remove test dir', function() {
            FileSystem.removeTree(this.testDir);
            sinon.restore();
          })

          it('returns an empty array', function() {
            const contractNames = this.contractManager.getContractNames();
            expect(contractNames).to.be.empty;
          })
        })

        context('with contracts', function() {
          beforeEach(function() {
            this.testDir = `${process.cwd()}/test/mocks/mock-stdlib-2`;
            this.packageFile = new ZosPackageFile(`${this.testDir}/zos.json`);
            this.contractManager = new ContractManager(this.packageFile);
            sinon.stub(ConfigManager, 'getBuildDir').returns(`${this.testDir}/build/contracts`);
          });

          afterEach(function() {
            sinon.restore();
          });

          it('returns an array with items inside', function() {
            const contractNames = this.contractManager.getContractNames();

            contractNames.should.be.an('array');
            contractNames.should.not.be.empty;
            contractNames.should.have.lengthOf(1);
          });
        });
      });
    });
  });
});
