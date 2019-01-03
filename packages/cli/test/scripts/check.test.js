'use strict'
require('../setup')

import CaptureLogs from '../helpers/captureLogs';
import check from '../../src/scripts/check';
import ZosPackageFile from "../../src/models/files/ZosPackageFile";

const expect = require('chai').expect;

contract('check script', function() {
  beforeEach('setup', async function() {
    this.packageFile = new ZosPackageFile('test/mocks/packages/package-empty.zos.json')
  });

  beforeEach('capturing log output', function () {
    this.logs = new CaptureLogs();
  });

  afterEach(function () {
    this.logs.restore();
  });

  describe('on single contract', function () {
    it('outputs no issues found', function() {
      const contractAlias = 'ImplV1'
      this.packageFile.addContract(contractAlias)
      check({ contractAlias, packageFile: this.packageFile })
      this.logs.infos[0].should.match(/No issues/)
    });

    it('outputs a warning on contract found by alias', function() {
      const contractAlias = 'MyContract'
      this.packageFile.addContract(contractAlias, 'WithDelegateCall')
      check({ contractAlias, packageFile: this.packageFile })
      this.logs.infos.should.be.empty
      this.logs.warns[0].should.match(/delegatecall/)
    });

    it('outputs a warning on contract found by name', function() {
      this.packageFile.addContract('MyContract', 'WithDelegateCall')
      check({ contractAlias: 'WithDelegateCall', packageFile: this.packageFile })
      this.logs.infos.should.be.empty
      this.logs.warns[0].should.match(/delegatecall/)
    });

    it('outputs a warning on contract not added', function() {
      check({ contractAlias: 'WithDelegateCall', packageFile: this.packageFile })
      this.logs.infos.should.be.empty
      this.logs.warns[0].should.match(/delegatecall/)
    });

    it('fails if contract not found', function() {
      expect(() => check({ contractAlias: 'NotExists', packageFile: this.packageFile })).to.throw();
    });
  });

  describe('on all contracts', function () {
    it('outputs no issues found', function () {
      this.packageFile.addContract('ImplV1')
      check({ packageFile: this.packageFile })
      this.logs.infos[0].should.match(/No issues/)
    });

    it('outputs multiple warnings', function () {
      this.packageFile.addContract('WithDelegateCall')
      this.packageFile.addContract('WithSelfDestruct')
      this.packageFile.addContract('ImplV1')
      check({ packageFile: this.packageFile })
      this.logs.infos.should.be.empty;
      this.logs.warns[0].should.match(/delegatecall/);
      this.logs.warns[1].should.match(/selfdestruct/);
    });

    it('outputs no issues found if no contracts added', function () {
      check({ packageFile: this.packageFile })
      this.logs.infos[0].should.match(/No issues/)
    });
  });
});
