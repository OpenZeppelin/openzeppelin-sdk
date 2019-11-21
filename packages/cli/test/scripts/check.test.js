'use strict';
require('../setup');

import CaptureLogs from '../helpers/captureLogs';
import check from '../../src/scripts/check';
import ProjectFile from '../../src/models/files/ProjectFile';

const expect = require('chai').expect;

describe('check script', function() {
  beforeEach('setup', async function() {
    this.projectFile = new ProjectFile('test/mocks/packages/package-empty.zos.json');
  });

  beforeEach('capturing log output', function() {
    this.logs = new CaptureLogs();
  });

  afterEach(function() {
    this.logs.restore();
  });

  describe('on single contract', function() {
    it('outputs no issues found', function() {
      const contractAlias = 'ImplV1';
      this.projectFile.addContract(contractAlias);
      check({ contractAlias, projectFile: this.projectFile });
      this.logs.infos[0].should.match(/No issues/);
    });

    it('outputs a warning on contract found by alias', function() {
      const contractAlias = 'MyContract';
      this.projectFile.addContract(contractAlias, 'WithDelegateCall');
      check({ contractAlias, projectFile: this.projectFile });
      this.logs.infos.should.be.empty;
      this.logs.warns[0].should.match(/delegatecall/);
    });

    it('outputs a warning on contract found by name', function() {
      this.projectFile.addContract('MyContract', 'WithDelegateCall');
      check({
        contractAlias: 'WithDelegateCall',
        projectFile: this.projectFile,
      });
      this.logs.infos.should.be.empty;
      this.logs.warns[0].should.match(/delegatecall/);
    });

    it('outputs a warning on contract not added', function() {
      check({
        contractAlias: 'WithDelegateCall',
        projectFile: this.projectFile,
      });
      this.logs.infos.should.be.empty;
      this.logs.warns[0].should.match(/delegatecall/);
    });

    it('fails if contract not found', function() {
      expect(() => check({ contractAlias: 'NotExists', projectFile: this.projectFile })).to.throw();
    });
  });

  describe('on all contracts', function() {
    it('outputs no issues found', function() {
      this.projectFile.addContract('ImplV1');
      check({ projectFile: this.projectFile });
      this.logs.infos[0].should.match(/No issues/);
    });

    it('outputs multiple warnings', function() {
      this.projectFile.addContract('WithDelegateCall');
      this.projectFile.addContract('WithSelfDestruct');
      this.projectFile.addContract('ImplV1');
      check({ projectFile: this.projectFile });
      this.logs.infos.should.be.empty;
      this.logs.warns[0].should.match(/delegatecall/);
      this.logs.warns[1].should.match(/selfdestruct/);
    });

    it('outputs no issues found if no contracts added', function() {
      check({ projectFile: this.projectFile });
      this.logs.infos[0].should.match(/No issues/);
    });
  });
});
