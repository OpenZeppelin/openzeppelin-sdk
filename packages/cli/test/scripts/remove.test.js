'use strict';
require('../setup');

import remove from '../../src/scripts/remove';
import ProjectFile from '../../src/models/files/ProjectFile';
import CaptureLogs from '../helpers/captureLogs';

const should = require('chai').should();

contract('remove script', function() {
  const contractAlias = 'Impl';
  const anotherContractAlias = 'WithLibraryImpl';

  beforeEach('setup', async function() {
    this.projectFile = new ProjectFile(
      'test/mocks/packages/package-with-contracts.zos.json',
    );
  });

  beforeEach('capturing log output', function() {
    this.logs = new CaptureLogs();
  });

  afterEach(function() {
    this.logs.restore();
  });

  it('should remove a contract', function() {
    remove({ contracts: [contractAlias], projectFile: this.projectFile });
    should.not.exist(this.projectFile.contract(contractAlias));
    this.projectFile
      .contract(anotherContractAlias)
      .should.eq('WithLibraryImplV1');
  });

  it('should remove multiple contracts', function() {
    remove({
      contracts: [contractAlias, anotherContractAlias],
      projectFile: this.projectFile,
    });
    should.not.exist(this.projectFile.contract(contractAlias));
    should.not.exist(this.projectFile.contract(anotherContractAlias));
  });

  it('should log an error upon missing contract alias', function() {
    remove({
      contracts: [contractAlias, 'invalid'],
      projectFile: this.projectFile,
    });
    this.logs.errors.should.have.lengthOf(1);
    this.logs.errors[0].should.match(/not found/i);
  });
});
