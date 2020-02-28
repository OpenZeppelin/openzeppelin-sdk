'use strict';
require('../setup');

import remove from '../../scripts/remove';
import ProjectFile from '../../models/files/ProjectFile';
import CaptureLogs from '../helpers/captureLogs';

describe('remove script', function() {
  const contractName = 'ImplV1';
  const anotherContractName = 'WithLibraryImplV1';

  beforeEach('setup', async function() {
    this.projectFile = new ProjectFile('mocks/packages/package-with-contracts.zos.json');
  });

  beforeEach('capturing log output', function() {
    this.logs = new CaptureLogs();
  });

  afterEach(function() {
    this.logs.restore();
  });

  it('should remove a contract', function() {
    remove({ contracts: [contractName], projectFile: this.projectFile });
    this.projectFile.contracts.should.not.include(contractName);
    this.projectFile.contracts.should.include('WithLibraryImplV1');
  });

  it('should remove multiple contracts', function() {
    remove({
      contracts: [contractName, anotherContractName],
      projectFile: this.projectFile,
    });
    this.projectFile.contracts.should.not.include(contractName);
    this.projectFile.contracts.should.not.include(anotherContractName);
  });

  it('should log an error upon missing contract name', function() {
    remove({
      contracts: [contractName, 'invalid'],
      projectFile: this.projectFile,
    });
    this.logs.errors.should.have.lengthOf(1);
    this.logs.errors[0].should.match(/not found/i);
  });
});
