'use strict';
require('../setup');

import remove from '../../src/scripts/remove';
import ZosPackageFile from '../../src/models/files/ZosPackageFile';
import CaptureLogs from '../helpers/captureLogs';

const should = require('chai').should();

contract('remove script', function() {
  const contractAlias = 'Impl';
  const anotherContractAlias = 'WithLibraryImpl';

  beforeEach('setup', async function() {
    this.packageFile = new ZosPackageFile(
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
    remove({ contracts: [contractAlias], packageFile: this.packageFile });
    should.not.exist(this.packageFile.contract(contractAlias));
    this.packageFile
      .contract(anotherContractAlias)
      .should.eq('WithLibraryImplV1');
  });

  it('should remove multiple contracts', function() {
    remove({
      contracts: [contractAlias, anotherContractAlias],
      packageFile: this.packageFile,
    });
    should.not.exist(this.packageFile.contract(contractAlias));
    should.not.exist(this.packageFile.contract(anotherContractAlias));
  });

  it('should log an error upon missing contract alias', function() {
    remove({
      contracts: [contractAlias, 'invalid'],
      packageFile: this.packageFile,
    });
    this.logs.errors.should.have.lengthOf(1);
    this.logs.errors[0].should.match(/not found/i);
  });
});
